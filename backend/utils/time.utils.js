/**
 * Time Utility Functions
 * Provides helper functions for time conversions and manipulations
 */

/**
 * Converts time strings to milliseconds
 * @param {string} timeString - Time string in format like "15m", "2h", "30d", "45s"
 * @returns {number} Time in milliseconds
 */
export const convertToMilliseconds = (timeString) => {
    const regex = /^(\d+)([smhd])$/;
    const match = timeString.match(regex);
    if (!match) return 0;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000; // seconds
        case 'm': return value * 60 * 1000; // minutes
        case 'h': return value * 60 * 60 * 1000; // hours
        case 'd': return value * 24 * 60 * 60 * 1000; // days
        default: return 0;
    }
};

/**
 * Converts milliseconds to human readable time string
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Human readable time string
 */
export const convertToTimeString = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
};