export const isRichContentDoc = (value) => {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    value.type === 'doc' &&
    Array.isArray(value.content)
  );
};

const visitNodes = (node, visitor) => {
  if (!node || typeof node !== 'object') return;
  visitor(node);
  if (Array.isArray(node.content)) {
    node.content.forEach((child) => visitNodes(child, visitor));
  }
};

export const extractPlainTextFromRichContent = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (!isRichContentDoc(value)) return '';

  const chunks = [];
  visitNodes(value, (node) => {
    if (node.type === 'text' && typeof node.text === 'string') {
      chunks.push(node.text);
    }
    if (['paragraph', 'heading', 'blockquote', 'listItem'].includes(node.type)) {
      chunks.push('\n');
    }
  });

  return chunks.join(' ').replace(/\s+/g, ' ').trim();
};
