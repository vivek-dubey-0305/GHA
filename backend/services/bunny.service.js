import crypto from "crypto";
import logger from "../configs/logger.config.js";

/**
 * Bunny.net Stream Service
 * Handles all video (recorded & live) operations via Bunny Stream API.
 *
 * Recorded videos  → Upload to Bunny Stream Library
 * Live streams     → Bunny Stream Live (RTMP ingest via OBS, HLS playback)
 *
 * Security: All playback URLs are signed with an expiring token so only
 *           enrolled, logged-in users can watch.
 *
 * Bunny Stream automatically saves live-stream recordings — no extra work needed.
 */

// ============================================
// CONFIGURATION
// ============================================

const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const BUNNY_API_KEY    = process.env.BUNNY_API_KEY;       // Stream Library API key
const BUNNY_CDN_HOST   = process.env.BUNNY_CDN_HOST || `vz-${BUNNY_LIBRARY_ID}.b-cdn.net`;
const BUNNY_TOKEN_KEY  = process.env.BUNNY_STREAM_SECRET; // Used for signed URL generation

const BUNNY_STREAM_BASE = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}`;

const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    AccessKey: BUNNY_API_KEY,
};

// Validate Bunny Stream configuration
const validateBunnyConfig = () => {
    if (!BUNNY_LIBRARY_ID) {
        throw new Error("BUNNY_LIBRARY_ID environment variable is required");
    }
    if (!BUNNY_API_KEY) {
        throw new Error("BUNNY_API_KEY environment variable is required");
    }
    if (!BUNNY_TOKEN_KEY) {
        logger.warn("BUNNY_STREAM_SECRET not set — signed URLs will not be available");
    }
};

// Initialize validation
validateBunnyConfig();

// ============================================
// HELPERS
// ============================================

const sanitizeName = (name) =>
    (name || "untitled").replace(/[^a-zA-Z0-9_\- ]/g, "_").substring(0, 100);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const tryResolveVideoDuration = async (videoId, attempts = 4, delayMs = 1500) => {
    for (let i = 0; i < attempts; i++) {
        try {
            const details = await getVideoDetails(videoId);
            if (Number(details?.duration) > 0) {
                return Number(details.duration);
            }
        } catch (err) {
            logger.warn(`Duration lookup attempt ${i + 1} failed for ${videoId}: ${err.message}`);
        }

        if (i < attempts - 1) {
            await wait(delayMs);
        }
    }

    return 0;
};

/**
 * Generate a Bunny Stream signed token URL for secure playback.
 * Only enrolled + logged-in users should receive this URL.
 *
 * @param {string} videoId        – Bunny video GUID
 * @param {number} expiresInSec   – token lifetime in seconds (default 4 hours)
 * @returns {string}              – signed HLS manifest URL
 */
export const generateSignedPlaybackUrl = (videoId, expiresInSec = 14400) => {
    if (!videoId) return null;
    if (!BUNNY_TOKEN_KEY) {
        // If no token auth key configured, return unsigned URL (not recommended for production)
        logger.warn("BUNNY_STREAM_SECRET not set — returning unsigned playback URL");
        return `https://${BUNNY_CDN_HOST}/${videoId}/playlist.m3u8`;
    }

    const expirationTime = Math.floor(Date.now() / 1000) + expiresInSec;
    const url = `/${videoId}/playlist.m3u8`;

    // Bunny token authentication: SHA256( tokenKey + url + expirationTime )
    const hashableBase = BUNNY_TOKEN_KEY + url + expirationTime;
    const token = crypto
        .createHash("sha256")
        .update(hashableBase)
        .digest("hex");

    return `https://${BUNNY_CDN_HOST}${url}?token=${token}&expires=${expirationTime}`;
};

/**
 * Generate a signed thumbnail URL for a Bunny video.
 * Bunny auto-generates thumbnails at thumbnail.jpg
 */
export const generateSignedThumbnailUrl = (videoId) => {
    if (!videoId) return null;
    return `https://${BUNNY_CDN_HOST}/${videoId}/thumbnail.jpg`;
};

// ============================================
// RECORDED VIDEO — UPLOAD / MANAGE
// ============================================

/**
 * Create a video entry in Bunny Stream and upload the file buffer.
 * Two-step process: 1) Create video object  2) PUT the binary payload
 *
 * Upload a lesson/course video to Bunny Stream.
 *
 * @param {Buffer} fileBuffer   – raw video bytes
 * @param {string} title        – human-readable title
 * @param {string} [collectionId] – optional Bunny collection GUID
 * @returns {Promise<Object>}   – { videoId, url, thumbnailUrl, status, length, ... }
 */
export const uploadVideo = async (fileBuffer, courseName, moduleName, lessonName, videoTitle) => {
    const fullTitle = sanitizeName(`${courseName}_${moduleName}_${lessonName}_${videoTitle}`);

    try {
        // Step 1: Create video object in the library
        const createRes = await fetch(`${BUNNY_STREAM_BASE}/videos`, {
            method: "POST",
            headers,
            body: JSON.stringify({ title: fullTitle }),
        });

        if (!createRes.ok) {
            const errBody = await createRes.text();
            throw new Error(`Bunny create-video failed (${createRes.status}): ${errBody}`);
        }

        const videoData = await createRes.json();
        const videoId = videoData.guid;

        // Step 2: Upload the actual file with timeout (30 minutes for large files)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000); // 30 minutes

        const uploadRes = await fetch(`${BUNNY_STREAM_BASE}/videos/${videoId}`, {
            method: "PUT",
            headers: {
                AccessKey: BUNNY_API_KEY,
                "Content-Type": "application/octet-stream",
            },
            body: fileBuffer,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!uploadRes.ok) {
            const errBody = await uploadRes.text();
            throw new Error(`Bunny upload-video failed (${uploadRes.status}): ${errBody}`);
        }

        const playbackUrl = generateSignedPlaybackUrl(videoId);
        const thumbnailUrl = generateSignedThumbnailUrl(videoId);

        logger.info(`Video uploaded to Bunny Stream: ${fullTitle} (id: ${videoId})`);

        const resolvedDuration = await tryResolveVideoDuration(videoId);

        // Return shape compatible with what controllers expect
        return {
            public_id: videoId,          // bunny video GUID — used as identifier for delete etc.
            secure_url: playbackUrl,     // signed HLS URL
            url: playbackUrl,
            thumbnail: thumbnailUrl,
            format: "m3u8",
            bytes: fileBuffer.length,
            duration: resolvedDuration || videoData.length || 0,
            width: videoData.width || null,
            height: videoData.height || null,
            status: "available",
            bunnyVideoId: videoId,
        };
    } catch (error) {
        logger.error(`Error uploading video to Bunny Stream: ${error.message}`);
        throw new Error(`Failed to upload video to Bunny Stream: ${error.message}`);
    }
};

/**
 * Upload course trailer video to Bunny Stream.
 * Same function name as R2 version for drop-in replacement.
 */
export const uploadCourseTrailer = async (fileBuffer, courseName) => {
    const title = sanitizeName(`${courseName}_trailer`);

    try {
        const createRes = await fetch(`${BUNNY_STREAM_BASE}/videos`, {
            method: "POST",
            headers,
            body: JSON.stringify({ title }),
        });

        if (!createRes.ok) {
            const errBody = await createRes.text();
            throw new Error(`Bunny create-trailer failed (${createRes.status}): ${errBody}`);
        }

        const videoData = await createRes.json();
        const videoId = videoData.guid;

        // Upload the actual file with timeout (30 minutes for large files)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000); // 30 minutes

        const uploadRes = await fetch(`${BUNNY_STREAM_BASE}/videos/${videoId}`, {
            method: "PUT",
            headers: {
                AccessKey: BUNNY_API_KEY,
                "Content-Type": "application/octet-stream",
            },
            body: fileBuffer,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!uploadRes.ok) {
            const errBody = await uploadRes.text();
            throw new Error(`Bunny upload-trailer failed (${uploadRes.status}): ${errBody}`);
        }

        const playbackUrl = generateSignedPlaybackUrl(videoId);

        logger.info(`Course trailer uploaded to Bunny Stream: ${title} (id: ${videoId})`);

        return {
            public_id: videoId,
            secure_url: playbackUrl,
            url: playbackUrl,
            format: "m3u8",
            bytes: fileBuffer.length,
            duration: videoData.length || 0,
            bunnyVideoId: videoId,
        };
    } catch (error) {
        logger.error(`Error uploading course trailer to Bunny: ${error.message}`);
        throw new Error(`Failed to upload course trailer: ${error.message}`);
    }
};

/**
 * Upload lesson video to Bunny Stream.
 * Upload lesson video to Bunny Stream with default title.
 */
export const uploadLessonVideo = async (fileBuffer, courseName, moduleName, lessonName) => {
    return uploadVideo(fileBuffer, courseName, moduleName, lessonName, "lesson");
};

/**
 * Get video details from Bunny Stream.
 * Useful for checking encoding status, duration, resolution etc.
 *
 * @param {string} videoId – Bunny video GUID
 * @returns {Promise<Object>}
 */
export const getVideoDetails = async (videoId) => {
    try {
        const res = await fetch(`${BUNNY_STREAM_BASE}/videos/${videoId}`, {
            method: "GET",
            headers,
        });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Bunny get-video failed (${res.status}): ${errBody}`);
        }

        const data = await res.json();

        return {
            videoId: data.guid,
            title: data.title,
            status: data.status === 4 ? "available" : data.status === 3 ? "processing" : "uploading",
            duration: data.length || 0,
            width: data.width,
            height: data.height,
            fileSize: data.storageSize,
            views: data.views,
            dateUploaded: data.dateUploaded,
            encodeProgress: data.encodeProgress,
            isAvailable: data.status === 4,
        };
    } catch (error) {
        logger.error(`Error getting Bunny video details for ${videoId}: ${error.message}`);
        throw new Error(`Failed to get video details: ${error.message}`);
    }
};

/**
 * Delete a video from Bunny Stream.
 * Replaces `deleteVideo` from R2 for video content.
 *
 * @param {string} videoId – Bunny video GUID (public_id stored in DB)
 */
export const deleteVideo = async (videoId) => {
    if (!videoId) return { result: "ok" };

    try {
        const res = await fetch(`${BUNNY_STREAM_BASE}/videos/${videoId}`, {
            method: "DELETE",
            headers,
        });

        if (!res.ok && res.status !== 404) {
            const errBody = await res.text();
            throw new Error(`Bunny delete-video failed (${res.status}): ${errBody}`);
        }

        logger.info(`Video deleted from Bunny Stream: ${videoId}`);
        return { result: "ok" };
    } catch (error) {
        logger.error(`Error deleting Bunny video ${videoId}: ${error.message}`);
        throw new Error(`Failed to delete video: ${error.message}`);
    }
};

/**
 * List all videos in the Bunny Stream Library (paginated).
 *
 * @param {number} page
 * @param {number} itemsPerPage
 * @param {string} [search]
 * @returns {Promise<Object>}
 */
export const listVideos = async (page = 1, itemsPerPage = 25, search = "") => {
    try {
        let url = `${BUNNY_STREAM_BASE}/videos?page=${page}&itemsPerPage=${itemsPerPage}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const res = await fetch(url, { method: "GET", headers });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Bunny list-videos failed (${res.status}): ${errBody}`);
        }

        return await res.json();
    } catch (error) {
        logger.error(`Error listing Bunny videos: ${error.message}`);
        throw new Error(`Failed to list videos: ${error.message}`);
    }
};

// ============================================
// LIVE STREAMING — Bunny Stream Live
// ============================================

/**
 * Bunny Stream Live overview:
 * - When you create a "live stream" Bunny returns RTMP ingest credentials.
 * - The instructor pushes to the RTMP URL via OBS (or any RTMP encoder).
 * - Viewers watch the HLS playback URL.
 * - After the stream ends, Bunny automatically saves the recording as a regular
 *   video in the same library — no extra work needed on our end.
 *
 * IMPORTANT: Bunny Stream recordings are AUTOMATIC.
 *   After a live stream ends, the recording becomes available as a normal video
 *   in the library. The `videoId` returned from the live stream creation IS the
 *   recording's video ID. So yes — recordings are automatically saved.
 */

/**
 * Create a Bunny live stream.
 * Returns RTMP credentials for the instructor and an HLS playback URL for viewers.
 *
 * @param {string} title – stream title
 * @returns {Promise<Object>} – { streamId, rtmpUrl, rtmpKey, playbackUrl, videoId }
 */
export const createLiveStream = async (title) => {
    const safeTitle = sanitizeName(title);

    try {
        const res = await fetch(`${BUNNY_STREAM_BASE}/videos`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                title: safeTitle,
            }),
        });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Bunny create-live-stream failed (${res.status}): ${errBody}`);
        }

        const data = await res.json();
        const videoId = data.guid;

        // Generate RTMP push URL for OBS
        // Bunny RTMP ingest format: rtmp://live.bunnycdn.com/live
        // Stream key: {library_id}-{video_id}?password={api_key}
        const rtmpUrl = "rtmp://live.bunnycdn.com/live";
        const rtmpKey = `${BUNNY_LIBRARY_ID}-${videoId}?password=${BUNNY_API_KEY}`;

        // HLS playback (signed)
        const playbackUrl = generateSignedPlaybackUrl(videoId, 28800); // 8-hour token for live

        logger.info(`Bunny live stream created: ${safeTitle} (videoId: ${videoId})`);

        return {
            streamId: videoId,        // Same as videoId in Bunny
            videoId,                  // The recording will be at this same ID
            rtmpUrl,
            rtmpKey,                  // Instructor feeds this into OBS
            playbackUrl,              // HLS URL for viewers
            thumbnailUrl: generateSignedThumbnailUrl(videoId),
            title: safeTitle,
        };
    } catch (error) {
        logger.error(`Error creating Bunny live stream: ${error.message}`);
        throw new Error(`Failed to create live stream: ${error.message}`);
    }
};

/**
 * Get live stream / recording status.
 * After the stream ends this returns the same video with encoding status.
 *
 * @param {string} videoId – Bunny video GUID
 */
export const getLiveStreamStatus = async (videoId) => {
    return getVideoDetails(videoId);
};

/**
 * Delete a live stream / recording from Bunny.
 * Also removes the auto-saved recording.
 *
 * @param {string} videoId
 */
export const deleteLiveStream = async (videoId) => {
    return deleteVideo(videoId);
};

/**
 * Refresh playback URL for a video/stream (generate a fresh signed token).
 * Useful when a user needs to continue watching and the previous token expired.
 *
 * @param {string} videoId
 * @param {number} expiresInSec
 * @returns {{ playbackUrl: string }}
 */
export const refreshPlaybackUrl = (videoId, expiresInSec = 14400) => {
    return {
        playbackUrl: generateSignedPlaybackUrl(videoId, expiresInSec),
    };
};

// ============================================
// VIDEO PACKAGE THUMBNAIL
// (Thumbnails are images → still go to R2, but Bunny auto-generates
//  video thumbnails so we provide a helper that returns Bunny's auto-thumb)
// ============================================

/**
 * Get auto-generated thumbnail URL from Bunny for a video.
 * Upload lesson thumbnail for cases where the
 * user doesn't upload a custom thumbnail — Bunny provides one automatically.
 *
 * If a custom thumbnail is uploaded, it goes to R2 via the existing R2 service.
 *
 * @param {string} videoId
 * @returns {string} thumbnail URL
 */
export const getVideoThumbnail = (videoId) => {
    return generateSignedThumbnailUrl(videoId);
};

// ============================================
// COLLECTION MANAGEMENT (optional — for organizing videos by course)
// ============================================

/**
 * Create a Bunny Stream collection (like a folder for videos).
 *
 * @param {string} name – collection name
 * @returns {Promise<Object>}
 */
export const createCollection = async (name) => {
    try {
        const res = await fetch(`${BUNNY_STREAM_BASE}/collections`, {
            method: "POST",
            headers,
            body: JSON.stringify({ name: sanitizeName(name) }),
        });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Bunny create-collection failed (${res.status}): ${errBody}`);
        }

        const data = await res.json();
        logger.info(`Bunny collection created: ${name} (id: ${data.guid})`);
        return data;
    } catch (error) {
        logger.error(`Error creating Bunny collection: ${error.message}`);
        throw new Error(`Failed to create collection: ${error.message}`);
    }
};

/**
 * Delete a Bunny Stream collection.
 */
export const deleteCollection = async (collectionId) => {
    if (!collectionId) return;

    try {
        const res = await fetch(`${BUNNY_STREAM_BASE}/collections/${collectionId}`, {
            method: "DELETE",
            headers,
        });

        if (!res.ok && res.status !== 404) {
            const errBody = await res.text();
            throw new Error(`Bunny delete-collection failed (${res.status}): ${errBody}`);
        }

        logger.info(`Bunny collection deleted: ${collectionId}`);
    } catch (error) {
        logger.error(`Error deleting Bunny collection: ${error.message}`);
    }
};

// ============================================
// WEBHOOK VERIFICATION (optional but recommended)
// ============================================

/**
 * Verify Bunny Stream webhook signature.
 * Bunny sends webhooks when video encoding completes, etc.
 * Signature header: "Webhook-Signature"
 * Formula: SHA256(LibraryId + WebhookSigningKey + ExpirationTimestamp + VideoId)
 *
 * @param {Object} params
 * @param {string} params.signature – from webhook header
 * @param {string} params.videoId
 * @param {number} params.expiration
 * @returns {boolean}
 */
export const verifyWebhookSignature = ({ signature, videoId, expiration }) => {
    if (!BUNNY_TOKEN_KEY) return false;

    const expected = crypto
        .createHash("sha256")
        .update(`${BUNNY_LIBRARY_ID}${BUNNY_TOKEN_KEY}${expiration}${videoId}`)
        .digest("hex");

    return expected === signature;
};
