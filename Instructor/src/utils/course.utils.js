import { nanoid } from 'nanoid';

export const formatDuration = (seconds) => {
  if (!seconds) return '00:00:00';
  const s = parseInt(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export const calculateModuleDuration = (lessons) => {
  return lessons.reduce((sum, l) => {
    if (l.type === 'video') {
      return sum + (parseInt(l.video?.duration) || 0);
    }
    if (l.type === 'live') return sum + ((parseInt(l.liveClass?.duration) || 0) * 60);
    return sum;
  }, 0);
};

export const uid = () => nanoid();

export const createEmptyLesson = () => ({
  _uid: uid(),
  title: '',
  description: '',
  type: 'video',
  isFree: false,
  content: { articleContent: '' },
  video: {
    title: '',
    description: '',
    duration: 0,
    videoFile: null,
    thumbnailFile: null,
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

export const toDateTimeLocal = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 16);
};

export const validateCourse = (course) => {
  const errors = [];
  if (!course.title?.trim()) errors.push('Course title is required');
  if (!course.description?.trim()) errors.push('Course description is required');
  if (!course.isFree && !course.price) errors.push('Price is required for paid courses');
  if (!course.category) errors.push('Category is required');
  return { isValid: errors.length === 0, errors };
};

export const calculateCourseDuration = (modules) => {
  const totalSeconds = modules.reduce((sum, m) => sum + calculateModuleDuration(m.lessons), 0);
  return Math.ceil(totalSeconds / 60);
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const isValidVideoFile = (file) => {
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
  return validTypes.some(type => file.type === type);
};

export const isValidImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.some(type => file.type === type);
};

export const getThumbnailUrl = (item) => {
  if (!item) return null;
  if (typeof item === 'string') return item;
  if (item.secure_url) return item.secure_url;
  if (item.url) return item.url;
  return null;
};
