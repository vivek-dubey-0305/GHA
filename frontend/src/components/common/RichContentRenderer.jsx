import { Fragment } from 'react';
import { extractPlainTextFromRichContent, isRichContentDoc } from '../../utils/richContent.utils';

const applyMarks = (textNode) => {
  let rendered = textNode?.text || '';
  const marks = Array.isArray(textNode?.marks) ? textNode.marks : [];

  marks.forEach((mark) => {
    if (mark.type === 'bold') rendered = <strong>{rendered}</strong>;
    if (mark.type === 'italic') rendered = <em>{rendered}</em>;
    if (mark.type === 'underline') rendered = <u>{rendered}</u>;
    if (mark.type === 'strike') rendered = <s>{rendered}</s>;
    if (mark.type === 'code') rendered = <code className="rounded bg-gray-800 px-1 py-0.5 text-xs">{rendered}</code>;
    if (mark.type === 'link' && mark.attrs?.href) {
      rendered = (
        <a href={mark.attrs.href} target="_blank" rel="noreferrer" className="text-yellow-300 underline underline-offset-2">
          {rendered}
        </a>
      );
    }
  });

  return rendered;
};

const renderNode = (node, key) => {
  if (!node || typeof node !== 'object') return null;

  if (node.type === 'text') {
    return <Fragment key={key}>{applyMarks(node)}</Fragment>;
  }

  if (node.type === 'hardBreak') {
    return <br key={key} />;
  }

  const children = Array.isArray(node.content)
    ? node.content.map((child, idx) => renderNode(child, `${key}-${idx}`))
    : null;

  const align = node?.attrs?.textAlign;
  const alignStyle = align ? { textAlign: align } : undefined;

  switch (node.type) {
    case 'paragraph':
      return <p key={key} className="mb-3 last:mb-0" style={alignStyle}>{children}</p>;
    case 'heading': {
      const level = Number(node.attrs?.level || 2);
      if (level <= 2) return <h2 key={key} className="mb-3 text-lg font-semibold" style={alignStyle}>{children}</h2>;
      if (level === 3) return <h3 key={key} className="mb-2 text-base font-semibold" style={alignStyle}>{children}</h3>;
      return <h4 key={key} className="mb-2 text-sm font-semibold" style={alignStyle}>{children}</h4>;
    }
    case 'bulletList':
      return <ul key={key} className="mb-3 list-disc space-y-1 pl-5">{children}</ul>;
    case 'orderedList':
      return <ol key={key} className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>;
    case 'listItem':
      return <li key={key}>{children}</li>;
    case 'blockquote':
      return <blockquote key={key} className="mb-3 border-l-2 border-gray-600 pl-3 italic text-gray-200">{children}</blockquote>;
    case 'codeBlock':
      return (
        <pre key={key} className="mb-3 overflow-x-auto rounded-md border border-gray-700 bg-[#101827] p-3 text-xs text-gray-100">
          <code>{children}</code>
        </pre>
      );
    case 'horizontalRule':
      return <hr key={key} className="my-3 border-gray-700" />;
    case 'image': {
      const src = node?.attrs?.src;
      const alt = node?.attrs?.alt || 'Article image';
      if (!src) return null;
      return (
        <div key={key} className="my-3">
          <img src={src} alt={alt} className="max-w-full rounded-md border border-gray-700" loading="lazy" />
        </div>
      );
    }
    case 'table':
      return (
        <div key={key} className="my-3 overflow-x-auto rounded-md border border-gray-700">
          <table className="w-full border-collapse text-sm">{children}</table>
        </div>
      );
    case 'tableRow':
      return <tr key={key} className="border-b border-gray-700">{children}</tr>;
    case 'tableHeader':
      return <th key={key} className="border-r border-gray-700 bg-[#0f1b30] px-3 py-2 text-left font-semibold text-gray-100 last:border-r-0">{children}</th>;
    case 'tableCell':
      return <td key={key} className="border-r border-gray-700 px-3 py-2 text-gray-200 last:border-r-0">{children}</td>;
    default:
      return <Fragment key={key}>{children}</Fragment>;
  }
};

export default function RichContentRenderer({ content, className = '' }) {
  if (!content) return null;

  if (typeof content === 'string') {
    return <p className={`whitespace-pre-wrap leading-7 ${className}`}>{content}</p>;
  }

  if (!isRichContentDoc(content)) {
    const fallback = extractPlainTextFromRichContent(content);
    if (!fallback) return null;
    return <p className={`whitespace-pre-wrap leading-7 ${className}`}>{fallback}</p>;
  }

  return <div className={`leading-7 ${className}`}>{content.content.map((node, idx) => renderNode(node, `node-${idx}`))}</div>;
}
