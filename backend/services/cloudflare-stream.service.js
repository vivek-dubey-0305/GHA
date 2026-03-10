/**
 * Cloudflare Stream Service — Live Streaming + Signed Token Generation
 * ════════════════════════════════════════════════════════════════════
 * 
 * Handles:
 *   - Live Input CRUD (one per instructor)
 *   - Self-signed JWT token generation using jose (RS256 + JWK)
 *   - Signed playback URL generation
 *   - Recording management
 *   - Live input status polling
 */

import { SignJWT, importJWK } from "jose";
import logger from "../configs/logger.config.js";

// ═══════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID; // Same Cloudflare account
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const STREAM_SUBDOMAIN = process.env.CLOUDFLARE_STREAM_SUBDOMAIN; // e.g. customer-xxx.cloudflarestream.com
const SIGNING_KEY_ID = process.env.CLOUDFLARE_STREAM_KEY_ID;
const SIGNING_JWK_B64 = process.env.CLOUDFLARE_STREAM_JWK;

const CF_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}`;

const cfHeaders = {
    "Authorization": `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
};

// ═══════════════════════════════════════════
// LIVE INPUT CRUD
// ═══════════════════════════════════════════

/**
 * Create a Cloudflare Stream Live Input
 * One per instructor — reused for all their sessions
 */
export async function createLiveInput(label, options = {}) {
    logger.info(`[createLiveInput] Creating live input: "${label}"`);

    const body = {
        meta: { name: label },
        recording: {
            mode: "automatic",           // Auto-record every session
            requireSignedURLs: true,     // Signed tokens for playback
            allowedOrigins: options.allowedOrigins || [],
        },
    };

    if (options.requireSignedURLs !== undefined) {
        body.recording.requireSignedURLs = options.requireSignedURLs;
    }

    const response = await fetch(`${CF_API_BASE}/stream/live_inputs`, {
        method: "POST",
        headers: cfHeaders,
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.success) {
        const errMsg = data.errors?.map(e => e.message).join(", ") || "Unknown error";
        logger.error(`[createLiveInput] ❌ CF API error: ${errMsg}`);
        throw new Error(`Cloudflare createLiveInput failed: ${errMsg}`);
    }

    const input = data.result;
    logger.info(`[createLiveInput] ✅ Created live input uid=${input.uid}, rtmps=${input.rtmps?.url ? 'SET' : 'NONE'}`);

    return {
        liveInputId: input.uid,     // Unique ID for API calls
        liveInputUID: input.uid,    // Same — CF uses uid
        rtmpUrl: input.rtmps?.url || `rtmps://live.cloudflare.com:443/live/`,
        rtmpKey: input.rtmps?.streamKey || input.rtmpsPlaybackUrl || "",
        srtUrl: input.srt?.url || "",
        webRTCUrl: input.webRTC?.url || "",
        playbackUrl: input.playback?.hls || `https://${STREAM_SUBDOMAIN}/${input.uid}/manifest/video.m3u8`,
        thumbnailUrl: `https://${STREAM_SUBDOMAIN}/${input.uid}/thumbnails/thumbnail.jpg`,
        status: input.status,
        created: input.created,
    };
}

/**
 * Get live input details
 */
export async function getLiveInputDetails(liveInputId) {
    const response = await fetch(`${CF_API_BASE}/stream/live_inputs/${liveInputId}`, {
        headers: cfHeaders,
    });

    const data = await response.json();
    if (!data.success) {
        throw new Error(`Failed to get live input: ${data.errors?.map(e => e.message).join(", ")}`);
    }

    return data.result;
}

/**
 * Get live input status (connected/idle)
 */
export async function getLiveInputStatus(liveInputId) {
    const details = await getLiveInputDetails(liveInputId);
    const state = details.status?.current?.state || "disconnected";
    return {
        uid: details.uid,
        status: state,
        statusDetail: details.status,
        meta: details.meta,
        created: details.created,
        modified: details.modified,
    };
}

/**
 * Check if OBS / encoder is actively connected to the live input.
 * Cloudflare returns status as an object: { current: { state: "connected", reason, ... }, history: [] }
 * Returns { connected: boolean, status: string }
 */
export async function isLiveInputConnected(liveInputId) {
    const details = await getLiveInputDetails(liveInputId);
    // CF status is an object: { current: { state: "connected" | "reconnecting" | ... } } or null
    const state = details.status?.current?.state;
    const connected = state === "connected" || state === "reconnecting";
    return { connected, status: state || "disconnected" };
}

/**
 * Update live input settings
 */
export async function updateLiveInput(liveInputId, updates) {
    const response = await fetch(`${CF_API_BASE}/stream/live_inputs/${liveInputId}`, {
        method: "PUT",
        headers: cfHeaders,
        body: JSON.stringify(updates),
    });

    const data = await response.json();
    if (!data.success) {
        throw new Error(`Failed to update live input: ${data.errors?.map(e => e.message).join(", ")}`);
    }

    return data.result;
}

/**
 * Delete a live input (when instructor is removed)
 */
export async function deleteLiveInput(liveInputId) {
    const response = await fetch(`${CF_API_BASE}/stream/live_inputs/${liveInputId}`, {
        method: "DELETE",
        headers: cfHeaders,
    });

    if (!response.ok && response.status !== 404) {
        const data = await response.json().catch(() => ({}));
        throw new Error(`Failed to delete live input: ${data.errors?.map(e => e.message).join(", ") || response.statusText}`);
    }

    return true;
}

// ═══════════════════════════════════════════
// RECORDINGS (Videos created from live inputs)
// ═══════════════════════════════════════════

/**
 * List recordings (videos) for a specific live input
 */
export async function getLiveInputRecordings(liveInputId) {
    const response = await fetch(
        `${CF_API_BASE}/stream/live_inputs/${liveInputId}/videos`,
        { headers: cfHeaders }
    );

    const data = await response.json();
    if (!data.success) {
        throw new Error(`Failed to get recordings: ${data.errors?.map(e => e.message).join(", ")}`);
    }

    return data.result || [];
}

/**
 * Get specific video details (for recorded sessions)
 */
export async function getVideoDetails(videoId) {
    const response = await fetch(
        `${CF_API_BASE}/stream/${videoId}`,
        { headers: cfHeaders }
    );

    const data = await response.json();
    if (!data.success) {
        throw new Error(`Failed to get video details: ${data.errors?.map(e => e.message).join(", ")}`);
    }

    return data.result;
}

/**
 * Delete a specific recording
 */
export async function deleteRecording(videoId) {
    const response = await fetch(
        `${CF_API_BASE}/stream/${videoId}`,
        { method: "DELETE", headers: cfHeaders }
    );

    if (!response.ok && response.status !== 404) {
        const data = await response.json().catch(() => ({}));
        throw new Error(`Failed to delete recording: ${data.errors?.map(e => e.message).join(", ") || response.statusText}`);
    }
    return true;
}

// ═══════════════════════════════════════════
// SIGNED TOKEN GENERATION (jose — RS256 + JWK)
// ═══════════════════════════════════════════

/**
 * Generate a signed JWT token for a video/live-input UID using jose library.
 * Uses RS256 signing with the JWK from Cloudflare /stream/keys endpoint.
 * 
 * CRITICAL: Cloudflare requires `kid`, `exp`, and `nbf` in the JWT PAYLOAD
 * (not just the header). Without these, signed URLs return 401.
 * 
 * @param {string} uid - Video UID or LiveInput UID
 * @param {object} options
 * @param {number} options.expiresInSec - Token lifetime in seconds (default 3600 = 1hr)
 * @param {boolean} options.downloadable - Allow MP4 downloads
 * @param {Array} options.accessRules - IP/geo restrictions
 */
export async function generateSignedToken(uid, options = {}) {
    logger.info(`[generateSignedToken] uid=${uid}, expiresInSec=${options.expiresInSec || 3600}`);

    if (!SIGNING_KEY_ID || !SIGNING_JWK_B64) {
        const msg = "Cloudflare Stream signing keys not configured (CLOUDFLARE_STREAM_KEY_ID + CLOUDFLARE_STREAM_JWK)";
        logger.error(`[generateSignedToken] ${msg}`);
        throw new Error(msg);
    }

    const expiresInSec = options.expiresInSec || 3600;
    const now = Math.floor(Date.now() / 1000);

    // Decode the base64-encoded JWK
    const jwkJson = JSON.parse(Buffer.from(SIGNING_JWK_B64, "base64").toString("utf-8"));
    logger.info(`[generateSignedToken] JWK decoded, kid=${jwkJson.kid}, alg=${jwkJson.alg}`);

    // Import private key using jose
    const privateKey = await importJWK(jwkJson, "RS256");

    // Build payload — kid, exp, nbf MUST be in the payload for CF to accept
    const payload = {
        sub: uid,
        kid: SIGNING_KEY_ID,
        exp: now + expiresInSec,
        nbf: now - 60, // Allow 60s clock skew
    };

    if (options.downloadable) {
        payload.downloadable = true;
    }

    if (options.accessRules) {
        payload.accessRules = options.accessRules;
    }

    logger.info(`[generateSignedToken] JWT payload: sub=${payload.sub}, kid=${payload.kid}, exp=${payload.exp}, nbf=${payload.nbf}`);

    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "RS256", kid: SIGNING_KEY_ID })
        .sign(privateKey);

    logger.info(`[generateSignedToken] ✅ Token generated, length=${token.length}`);
    return token;
}

/**
 * Generate signed playback URLs (HLS + DASH + iframe + thumbnail)
 * 
 * @param {string} uid - Video/LiveInput UID
 * @param {object} options - Same as generateSignedToken options
 * @returns {object} { token, hls, dash, iframe, thumbnail }
 */
export async function getSignedPlaybackUrls(uid, options = {}) {
    logger.info(`[getSignedPlaybackUrls] Generating signed URLs for uid=${uid}`);
    const token = await generateSignedToken(uid, options);

    const urls = {
        token,
        hls: `https://${STREAM_SUBDOMAIN}/${token}/manifest/video.m3u8`,
        dash: `https://${STREAM_SUBDOMAIN}/${token}/manifest/video.mpd`,
        iframe: `https://${STREAM_SUBDOMAIN}/${token}/iframe`,
        thumbnail: `https://${STREAM_SUBDOMAIN}/${token}/thumbnails/thumbnail.jpg`,
    };
    logger.info(`[getSignedPlaybackUrls] ✅ HLS URL: ${urls.hls.substring(0, 90)}...`);
    return urls;
}

// ═══════════════════════════════════════════
// UTILITY: Validate streaming config
// ═══════════════════════════════════════════

export function validateStreamConfig() {
    const missing = [];
    if (!ACCOUNT_ID) missing.push("R2_ACCOUNT_ID");
    if (!API_TOKEN) missing.push("CLOUDFLARE_API_TOKEN");
    if (!STREAM_SUBDOMAIN) missing.push("CLOUDFLARE_STREAM_SUBDOMAIN");
    if (!SIGNING_KEY_ID) missing.push("CLOUDFLARE_STREAM_KEY_ID");
    if (!SIGNING_JWK_B64) missing.push("CLOUDFLARE_STREAM_JWK");

    if (missing.length > 0) {
        logger.warn(`⚠️  Missing Cloudflare Stream env vars: ${missing.join(", ")}`);
        return false;
    }
    return true;
}

export default {
    createLiveInput,
    getLiveInputDetails,
    getLiveInputStatus,
    isLiveInputConnected,
    updateLiveInput,
    deleteLiveInput,
    getLiveInputRecordings,
    getVideoDetails,
    deleteRecording,
    generateSignedToken,
    getSignedPlaybackUrls,
    validateStreamConfig,
};
