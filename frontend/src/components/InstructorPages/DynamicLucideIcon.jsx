import * as LucideIcons from "lucide-react";

const normalizeToPascalCase = (value) =>
  String(value || "")
    .trim()
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const resolveIconComponent = (iconName) => {
  if (!iconName || typeof iconName !== "string") {
    return LucideIcons.Sparkles;
  }

  const trimmed = iconName.trim();
  const pascal = normalizeToPascalCase(trimmed);

  const direct = LucideIcons[trimmed];
  if (direct) return direct;

  const pascalMatch = LucideIcons[pascal];
  if (pascalMatch) return pascalMatch;

  return LucideIcons.Sparkles;
};

export default function DynamicLucideIcon({
  name,
  size = 22,
  strokeWidth = 2,
  className = "",
}) {
  const IconComponent = resolveIconComponent(name);
  return <IconComponent size={size} strokeWidth={strokeWidth} className={className} />;
}
