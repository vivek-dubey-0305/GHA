export const SUBMISSION_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'file', label: 'File Upload' },
  { value: 'url', label: 'URL' },
  { value: 'mixed', label: 'Mixed' },
];

export const ASSESSMENT_TYPES = [
  { value: 'mcq', label: 'MCQ' },
  { value: 'true_false', label: 'True / False' },
  { value: 'matching', label: 'Matching' },
  { value: 'coding', label: 'Coding' },
  { value: 'subjective', label: 'Subjective' },
];

export const COURSE_ASSESSMENT_TYPE_MAP = {
  recorded: ['mcq', 'true_false', 'matching'],
  live: ['mcq', 'true_false', 'matching', 'coding', 'subjective'],
};
