import { Video, FileText, BookOpen, Radio, File } from 'lucide-react';

export const LESSON_TYPES = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'article', label: 'Article', icon: FileText },
  { value: 'assignment', label: 'Assignment', icon: BookOpen },
  { value: 'live', label: 'Live Session', icon: Radio },
  { value: 'material', label: 'Material', icon: File },
];
