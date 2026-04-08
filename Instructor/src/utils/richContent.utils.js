export const createParagraphDoc = (text = "") => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: text ? [{ type: "text", text: String(text) }] : [],
    },
  ],
});

export const isRichContentDoc = (value) => {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.type === "doc" &&
    Array.isArray(value.content)
  );
};

const visitNodes = (node, visitor) => {
  if (!node || typeof node !== "object") return;
  visitor(node);
  if (Array.isArray(node.content)) {
    node.content.forEach((child) => visitNodes(child, visitor));
  }
};

export const extractPlainTextFromRichContent = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (!isRichContentDoc(value)) return "";

  const chunks = [];
  visitNodes(value, (node) => {
    if (node.type === "text" && typeof node.text === "string") {
      chunks.push(node.text);
    }
    if (["paragraph", "heading", "blockquote", "listItem"].includes(node.type)) {
      chunks.push("\n");
    }
  });

  return chunks.join(" ").replace(/\s+/g, " ").trim();
};

export const normalizeRichContentInput = (candidate, fallbackText = "") => {
  if (isRichContentDoc(candidate)) return candidate;
  if (typeof candidate === "string") return createParagraphDoc(candidate);
  return createParagraphDoc(fallbackText);
};

export const countWords = (value) => {
  const plain = extractPlainTextFromRichContent(value);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
};
