/**
 * Live Class Constants
 * Defines quality standards, resolution requirements, and streaming parameters
 */

// Minimum and recommended video quality settings
export const MINIMUM_VIDEO_QUALITY = {
  resolution: '720p',
  height: 720,
  width: 1280,
  fps: 30,
  minBitrate: 2500, // kbps
  recommendedBitrate: 4000, // kbps
  maxBitrate: 8000, // kbps
};

// Quality presets for different use cases
export const QUALITY_PRESETS = {
  STANDARD: {
    resolution: '720p',
    height: 720,
    width: 1280,
    fps: 30,
    bitrate: 2500, // kbps
    label: '720p - Standard (Recommended)',
  },
  HIGH: {
    resolution: '1080p',
    height: 1080,
    width: 1920,
    fps: 30,
    bitrate: 4000, // kbps
    label: '1080p - High Quality',
  },
  ULTRA: {
    resolution: '4K',
    height: 2160,
    width: 3840,
    fps: 30,
    bitrate: 8000, // kbps
    label: '4K - Ultra (requires strong connection)',
  },
};

// Cloudflare Stream metadata for quality enforcement
export const CLOUDFLARE_QUALITY_META = {
  minResolution: '720p',
  minFPS: 30,
  enforceMinQuality: true,
  description: 'Minimum 720p@30fps required for all live streams',
};

// OBS Recommended Settings
export const OBS_RECOMMENDED_SETTINGS = [
  { label: 'Resolution', value: '1280x720', note: 'Minimum' },
  { label: 'FPS', value: '30', note: 'Standard (60 optional for high motion)' },
  { label: 'Bitrate', value: '2500-4000 kbps', note: 'Depends on connection' },
  { label: 'Encoder', value: 'H.264', note: 'Hardware recommended if available' },
  { label: 'Keyframe Interval', value: '2s', note: 'For smooth streaming' },
];

// Session lifecycle constants shared across API/socket payloads.
export const LIVE_SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Fixed emoji set for live chat reactions.
export const LIVE_REACTION_WHITELIST = ['👏', '👍', '🔥', '❤️', '🎉', '🙌'];

export default {
  MINIMUM_VIDEO_QUALITY,
  QUALITY_PRESETS,
  CLOUDFLARE_QUALITY_META,
  OBS_RECOMMENDED_SETTINGS,
  LIVE_SESSION_STATUS,
  LIVE_REACTION_WHITELIST,
};
