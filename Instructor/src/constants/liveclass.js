/**
 * Live Class Quality Constants
 * Defines quality standards and recommendations for instructors
 */

export const MINIMUM_QUALITY = {
  resolution: '720p',
  height: 720,
  width: 1280,
  fps: 30,
  minBitrate: 2500, // kbps
  recommendedBitrate: 4000, // kbps
};

export const OBS_RECOMMENDED_SETTINGS = [
  {
    label: 'Video Bitrate',
    value: '2500-4000 kbps',
    note: 'Higher bitrate = better quality but needs stronger connection',
  },
  {
    label: 'Resolution',
    value: '1280 x 720 (minimum)',
    note: '1920x1080 recommended if connection supports it',
  },
  {
    label: 'Frame Rate (FPS)',
    value: '30 fps',
    note: '60 fps for professional streams (requires higher bitrate)',
  },
  {
    label: 'Encoder',
    value: 'H.264 or H.265',
    note: 'Hardware-accelerated if available for better performance',
  },
  {
    label: 'Keyframe Interval',
    value: '2-3 seconds',
    note: 'Ensures smooth playback and low latency',
  },
  {
    label: 'Preset/Quality',
    value: 'Medium to Fast',
    note: 'Balance between quality and encoder performance',
  },
];

export const QUALITY_WARNINGS = {
  LOW: 'Quality below 720p may impact student learning experience',
  GOOD: 'Quality optimized for live learning',
  HIGH: 'Professional-grade streaming quality',
};

export default {
  MINIMUM_QUALITY,
  OBS_RECOMMENDED_SETTINGS,
  QUALITY_WARNINGS,
};
