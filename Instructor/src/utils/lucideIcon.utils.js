import * as LucideIcons from 'lucide-react';

const FALLBACK_ICON = 'Circle';
const EXCLUDED_EXPORTS = new Set(['default', 'icons', 'createLucideIcon', 'Icon', 'LucideIcon']);

const toPascalCase = (value = '') => {
  return value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
};

const candidateNames = (name = '') => {
  const clean = String(name || '').trim();
  if (!clean) return [];

  const pascal = toPascalCase(clean);
  return Array.from(new Set([clean, pascal]));
};

export const getLucideIconByName = (name, fallback = FALLBACK_ICON) => {
  const candidates = [...candidateNames(name), ...candidateNames(fallback), FALLBACK_ICON];

  for (const candidate of candidates) {
    if (candidate && LucideIcons[candidate]) {
      return LucideIcons[candidate];
    }
  }

  return LucideIcons[FALLBACK_ICON];
};

export const LUCIDE_ICON_NAMES = Object.keys(LucideIcons)
  .filter((iconName) => {
    if (EXCLUDED_EXPORTS.has(iconName)) return false;
    if (!/^[A-Z]/.test(iconName)) return false;
    return true;
  })
  .sort((a, b) => a.localeCompare(b));

export const LUCIDE_ICON_NAME_SUGGESTIONS = [
  'Award',
  'BadgeCheck',
  'BookOpen',
  'Brain',
  'Briefcase',
  'Code',
  'Globe',
  'GraduationCap',
  'Lightbulb',
  'Medal',
  'Rocket',
  'ShieldCheck',
  'Star',
  'Target',
  'Trophy',
  'Wrench'
];
