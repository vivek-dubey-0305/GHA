/**
 * Icon Renderer Utility
 * Provides a centralized way to render lucide-react icons with customizable properties
 * Usage: renderIcon("Video", { size: 18, color: "#f5c518", strokeWidth: 2, className: "custom-class" })
 */

import { createElement } from "react";
import {
  Video,
  FileText,
  CheckSquare,
  Zap,
  Download,
  Lock,
  Play,
  Code,
  Presentation,
  Music,
  Image,
  Link as LinkIcon,
  AlertCircle,
} from "lucide-react";

/**
 * Icon Type Mapping
 * Maps lesson/material types to their respective icons
 */
export const ICON_TYPES = {
  // Lesson Types
  VIDEO: "video",
  ARTICLE: "article",
  ASSIGNMENT: "assignment",
  LIVE: "live",
  MATERIAL: "material",

  // Material Sub-types
  DOCUMENT: "document",
  PDF: "pdf",
  PRESENTATION: "presentation",
  SPREADSHEET: "spreadsheet",
  IMAGE: "image",
  AUDIO: "audio",
  CODE: "code",
  LINK: "link",
  QUIZ: "quiz",
  OTHER: "other",

  // Common Actions
  LOCK: "lock",
  PLAY: "play",
  DOWNLOAD: "download",
  FREE: "free",
};

/**
 * Icon Component Map
 * Maps icon names to their lucide-react components
 */
const ICON_COMPONENTS = {
  video: Video,
  article: FileText,
  assignment: CheckSquare,
  live: Zap,
  material: Download,
  document: FileText,
  pdf: FileText,
  presentation: Presentation,
  spreadsheet: FileText,
  image: Image,
  audio: Music,
  code: Code,
  link: LinkIcon,
  quiz: CheckSquare,
  other: AlertCircle,
  lock: Lock,
  play: Play,
  download: Download,
  free: Play,
};


/**
 * Default Icon Classes and Colors
 */
export const ICON_COLORS = {
  [ICON_TYPES.VIDEO]: "#f5c518",      // Yellow
  [ICON_TYPES.ARTICLE]: "#64748b",    // Slate
  [ICON_TYPES.ASSIGNMENT]: "#3b82f6", // Blue
  [ICON_TYPES.LIVE]: "#ef4444",       // Red (for blinking)
  [ICON_TYPES.MATERIAL]: "#8b5cf6",   // Purple
  [ICON_TYPES.PDF]: "#dc2626",        // Dark Red
  [ICON_TYPES.DOCUMENT]: "#0ea5e9",   // Light Blue
  [ICON_TYPES.CODE]: "#06b6d4",       // Cyan
  lock: "#64748b",                     // Slate
  play: "#f5c518",                     // Yellow
  download: "#8b5cf6",                 // Purple
};

export const DEFAULT_ICON_SIZE = 18;
export const DEFAULT_ICON_STROKE_WIDTH = 2;

/**
 * Render Icon Function
 * @param {string} iconName - Name of the icon to render (from ICON_TYPES)
 * @param {object} options - Icon customization options
 * @param {number} options.size - Icon size (default: 18)
 * @param {string} options.color - Icon color (default: based on icon type)
 * @param {number} options.strokeWidth - Stroke width (default: 2)
 * @param {string} options.className - Additional CSS classes
 * @param {boolean} options.animate - Add animation class (for live blinking)
 * @returns {JSX.Element}
 */
export function renderIcon(iconName, options = {}) {
  const {
    size = DEFAULT_ICON_SIZE,
    color = ICON_COLORS[iconName] || "#64748b",
    strokeWidth = DEFAULT_ICON_STROKE_WIDTH,
    className = "",
    animate = false,
  } = options;

  const IconComponent = ICON_COMPONENTS[iconName.toLowerCase()];

  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found in ICON_COMPONENTS`);
    return null;
  }

  const animateClass = animate ? "icon-live-blink" : "";
  const finalClassName = `icon-renderer ${animateClass} ${className}`.trim();

  return createElement(IconComponent, {
    size,
    color,
    strokeWidth,
    className: finalClassName,
    style: { display: "inline-block", verticalAlign: "middle" },
  });
}

/**
 * Get Icon by Lesson Type
 * @param {string} lessonType - Type of lesson (video, article, assignment, live, material)
 * @param {object} options - Icon customization options
 * @returns {JSX.Element}
 */
export function getIconByLessonType(lessonType, options = {}) {
  const iconMap = {
    video: ICON_TYPES.VIDEO,
    article: ICON_TYPES.ARTICLE,
    assignment: ICON_TYPES.ASSIGNMENT,
    live: ICON_TYPES.LIVE,
    material: ICON_TYPES.MATERIAL,
  };

  const iconName = iconMap[lessonType?.toLowerCase()] || ICON_TYPES.MATERIAL;
  const defaultOptions = lessonType?.toLowerCase() === "live" ? { animate: true } : {};

  return renderIcon(iconName, { ...defaultOptions, ...options });
}

/**
 * Get Icon by Material Type
 * @param {string} materialType - Type of material (pdf, document, presentation, etc.)
 * @param {object} options - Icon customization options
 * @returns {JSX.Element}
 */
export function getIconByMaterialType(materialType, options = {}) {
  const iconMap = {
    document: ICON_TYPES.DOCUMENT,
    pdf: ICON_TYPES.PDF,
    presentation: ICON_TYPES.PRESENTATION,
    spreadsheet: ICON_TYPES.SPREADSHEET,
    image: ICON_TYPES.IMAGE,
    video: ICON_TYPES.VIDEO,
    audio: ICON_TYPES.AUDIO,
    code: ICON_TYPES.CODE,
    link: ICON_TYPES.LINK,
    quiz: ICON_TYPES.QUIZ,
    other: ICON_TYPES.OTHER,
  };

  const iconName = iconMap[materialType?.toLowerCase()] || ICON_TYPES.OTHER;
  return renderIcon(iconName, options);
}

/**
 * Predefined Icon Renderers for Common Use Cases
 */
export const IconPresets = {
  // Lesson Icons
  videoLesson: (options = {}) =>
    renderIcon(ICON_TYPES.VIDEO, {
      size: 16,
      ...options,
    }),
  articleLesson: (options = {}) =>
    renderIcon(ICON_TYPES.ARTICLE, {
      size: 16,
      ...options,
    }),
  assignmentLesson: (options = {}) =>
    renderIcon(ICON_TYPES.ASSIGNMENT, {
      size: 16,
      ...options,
    }),
  liveLesson: (options = {}) =>
    renderIcon(ICON_TYPES.LIVE, {
      size: 16,
      animate: true,
      ...options,
    }),

  // Lock & Free
  lockIcon: (options = {}) =>
    renderIcon("lock", {
      size: 16,
      ...options,
    }),
  freeIcon: (options = {}) =>
    renderIcon("play", {
      size: 14,
      color: "#22c55e",
      ...options,
    }),

  // Download
  downloadIcon: (options = {}) =>
    renderIcon("download", {
      size: 16,
      ...options,
    }),

  // Play
  playIcon: (options = {}) =>
    renderIcon("play", {
      size: 20,
      ...options,
    }),
};
