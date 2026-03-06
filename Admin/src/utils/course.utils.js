import { nanoid } from 'nanoid';

/**
 * Formats duration in seconds to HH:MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '00:00:00';
  const s = parseInt(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

/**
 * Calculates total duration of all lessons in a module
 * @param {Array} lessons - Array of lesson objects
 * @returns {number} Total duration in seconds
 */
export const calculateModuleDuration = (lessons) => {
  return lessons.reduce((sum, l) => {
    if (l.type === 'video') {
      return sum + (l.videoPackage?.videos || []).reduce((vs, v) => vs + (parseInt(v.duration) || 0), 0);
    }
    if (l.type === 'live') return sum + ((parseInt(l.liveClass?.duration) || 0) * 60);
    return sum;
  }, 0);
};

/**
 * Generates a unique ID using nanoid
 * @returns {string} Unique ID
 */
export const uid = () => nanoid();

/**
 * Creates an empty lesson object with default values
 * @returns {object} Empty lesson object
 */
export const createEmptyLesson = () => ({
  _uid: uid(),
  title: '',
  description: '',
  type: 'video',
  isFree: false,
  content: { articleContent: '' },
  videoPackage: {
    packageName: '',
    description: '',
    category: 'tutorial',
    videos: [{ _uid: uid(), title: '', description: '', duration: 0, videoFile: null, thumbnailFile: null }],
  },
  assignment: {
    title: '',
    description: '',
    instructions: '',
    type: 'text',
    maxScore: 100,
    passingScore: 40,
    dueDate: '',
    allowLateSubmission: false,
    lateSubmissionPenalty: 0,
    thumbnailFile: null,
    thumbnailPreview: null,
  },
  liveClass: {
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
    timezone: 'UTC',
    zoomMeetingId: '',
    zoomJoinUrl: '',
    zoomPassword: '',
    maxParticipants: 100,
    notes: '',
  },
  material: {
    title: '',
    description: '',
    type: 'pdf',
    materialFile: null,
    fileName: '',
  },
  thumbnailFile: null,
  thumbnailPreview: null,
});

/**
 * Creates an empty module object with default values
 * @returns {object} Empty module object
 */
export const createEmptyModule = () => ({
  _uid: uid(),
  title: '',
  description: '',
  objectives: [],
  collapsed: false,
  thumbnailFile: null,
  thumbnailPreview: null,
  lessons: [createEmptyLesson()],
});

/**
 * Converts date to ISO format for datetime-local input
 * @param {Date|string} date - Date to convert
 * @returns {string} ISO formatted date string
 */
export const toDateTimeLocal = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 16);
};

/**
 * Validates course prerequisites
 * @param {object} course - Course object
 * @returns {object} Validation result with isValid flag and errors array
 */
export const validateCourse = (course) => {
  const errors = [];

  if (!course.title?.trim()) errors.push('Course title is required');
  if (!course.description?.trim()) errors.push('Course description is required');
  if (!course.instructor) errors.push('Please select an instructor');
  if (!course.isFree && !course.price) errors.push('Price is required for paid courses');
  if (!course.category) errors.push('Category is required');
  if (!course.level) errors.push('Level is required');

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Calculates course duration in minutes
 * @param {Array} modules - Array of module objects
 * @returns {number} Total course duration in minutes
 */
export const calculateCourseDuration = (modules) => {
  const totalSeconds = modules.reduce((sum, m) => sum + calculateModuleDuration(m.lessons), 0);
  return Math.ceil(totalSeconds / 60);
};

/**
 * Formats file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Checks if a file is a valid video format
 * @param {File} file - File to check
 * @returns {boolean} True if valid video
 */
export const isValidVideoFile = (file) => {
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
  return validTypes.some(type => file.type === type);
};

/**
 * Checks if a file is a valid image format
 * @param {File} file - File to check
 * @returns {boolean} True if valid image
 */
export const isValidImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.some(type => file.type === type);
};
