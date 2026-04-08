import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading2,
  Image as ImageIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Plus,
  Quote,
  Table2,
  Underline as UnderlineIcon,
  Italic,
  Unlink,
} from 'lucide-react';
import { TextSelection } from '@tiptap/pm/state';
import { normalizeRichContentInput } from '../../utils/richContent.utils';

const editorCls = 'min-h-[180px] rounded-b-lg border border-gray-800 border-t-0 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus-within:border-gray-600';
const toolbarBtnCls = 'inline-flex items-center justify-center rounded-md border border-gray-700 bg-[#141414] p-2 text-gray-300 hover:bg-[#1f1f1f] hover:text-white disabled:opacity-40';
const toolbarBtnActiveCls = `${toolbarBtnCls} border-blue-500/60 text-blue-300 bg-blue-500/10`;
const inputCls = 'w-full rounded-md border border-gray-700 bg-[#0c0c0c] px-2 py-1.5 text-xs text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-blue-500';

const normalizeUrl = (raw = '') => {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const insertParagraphAfterCurrentTable = (view) => {
  if (!view?.state?.selection) return false;

  const { state } = view;
  const { selection, schema } = state;
  const paragraphType = schema.nodes.paragraph;
  if (!paragraphType) return false;

  const { $from } = selection;
  let tableDepth = -1;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === 'table') {
      tableDepth = depth;
      break;
    }
  }

  if (tableDepth === -1) return false;

  const tablePos = $from.before(tableDepth);
  const tableNode = $from.node(tableDepth);
  const insertPos = tablePos + tableNode.nodeSize;

  let tr = state.tr.insert(insertPos, paragraphType.create());
  const nextSelectionPos = Math.min(insertPos + 1, tr.doc.content.size);
  tr = tr.setSelection(TextSelection.create(tr.doc, nextSelectionPos));
  view.dispatch(tr.scrollIntoView());
  view.focus();
  return true;
};

const readImageAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

function ToolbarButton({ title, onClick, active = false, disabled = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? toolbarBtnActiveCls : toolbarBtnCls}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write here...',
  minHeight = '180px',
}) {
  const [linkInput, setLinkInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Image.configure({
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: normalizeRichContentInput(value),
    editorProps: {
      attributes: {
        class: 'tiptap-editor outline-none leading-7',
      },
      handlePaste: (view, event) => {
        const items = Array.from(event?.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type?.startsWith('image/'));
        if (!imageItem) return false;

        const file = imageItem.getAsFile();
        if (!file) return false;

        readImageAsDataUrl(file)
          .then((src) => {
            if (typeof src !== 'string') return;
            const imageNode = view.state.schema.nodes.image?.create({ src });
            if (!imageNode) return;
            view.dispatch(view.state.tr.replaceSelectionWith(imageNode).scrollIntoView());
          })
          .catch(() => {});

        return true;
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          const exited = insertParagraphAfterCurrentTable(view);
          if (exited) return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChange?.(nextEditor.getJSON());
    },
  });

  const editorUiState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      isBold: currentEditor.isActive('bold'),
      isItalic: currentEditor.isActive('italic'),
      isUnderline: currentEditor.isActive('underline'),
      isH2: currentEditor.isActive('heading', { level: 2 }),
      isBullet: currentEditor.isActive('bulletList'),
      isOrdered: currentEditor.isActive('orderedList'),
      isQuote: currentEditor.isActive('blockquote'),
      isCodeBlock: currentEditor.isActive('codeBlock'),
      isLink: currentEditor.isActive('link'),
      isAlignLeft: currentEditor.isActive({ textAlign: 'left' }),
      isAlignCenter: currentEditor.isActive({ textAlign: 'center' }),
      isAlignRight: currentEditor.isActive({ textAlign: 'right' }),
      isAlignJustify: currentEditor.isActive({ textAlign: 'justify' }),
      inTable: currentEditor.isActive('table'),
    }),
  }) ?? {};

  const applyLink = () => {
    if (!editor) return;
    const href = normalizeUrl(linkInput);
    if (!href) return;

    const chain = editor.chain().focus();
    if (editor.state.selection.empty) {
      const start = editor.state.selection.from;
      const end = start + href.length;
      chain.insertContent(href).setTextSelection({ from: start, to: end }).setLink({ href }).run();
    } else {
      chain.extendMarkRange('link').setLink({ href }).run();
    }
    setLinkInput('');
  };

  const applyImage = () => {
    if (!editor) return;
    const src = normalizeUrl(imageInput);
    if (!src) return;
    editor.chain().focus().setImage({ src }).run();
    setImageInput('');
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUploadChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !editor) return;
    if (!file.type?.startsWith('image/')) return;

    try {
      const src = await readImageAsDataUrl(file);
      if (typeof src === 'string') {
        editor.chain().focus().setImage({ src }).run();
      }
    } catch {
      // Ignore file read failures.
    }
  };

  const exitTableAndContinue = () => {
    if (!editor) return;
    const exited = insertParagraphAfterCurrentTable(editor.view);
    if (!exited) {
      editor.chain().focus().createParagraphNear().run();
    }
  };

  useEffect(() => {
    if (!editor) return;
    const next = normalizeRichContentInput(value);
    const current = editor.getJSON();
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return <div className="rounded-lg border border-gray-800 bg-[#0a0a0a] px-3 py-2 text-sm text-gray-500">Loading editor...</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-t-lg border border-gray-800 bg-[#101010] px-2 py-2">
        <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editorUiState.isBold}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editorUiState.isItalic}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editorUiState.isUnderline}>
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="H2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editorUiState.isH2}>
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editorUiState.isBullet}>
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Ordered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editorUiState.isOrdered}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Note / Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editorUiState.isQuote}>
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Code Block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editorUiState.isCodeBlock}>
          <Code2 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton title="Align Left" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editorUiState.isAlignLeft}>
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Align Center" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editorUiState.isAlignCenter}>
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Align Right" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editorUiState.isAlignRight}>
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Align Justify" onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editorUiState.isAlignJustify}>
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton title="Insert Link" onClick={applyLink} active={editorUiState.isLink}>
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Remove Link" onClick={() => editor.chain().focus().unsetLink().run()}>
          <Unlink className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton title="Insert Image URL" onClick={applyImage}>
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Upload Image" onClick={handleImageUploadClick}>
          <Plus className="h-3.5 w-3.5" />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUploadChange}
        />

        <ToolbarButton title="Insert Table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <Table2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Add Row" onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editorUiState.inTable}>
          <Plus className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Delete Row" onClick={() => editor.chain().focus().deleteRow().run()} disabled={!editorUiState.inTable}>
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Add Column" onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editorUiState.inTable}>
          <Plus className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Delete Column" onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!editorUiState.inTable}>
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Exit Table" onClick={exitTableAndContinue} disabled={!editorUiState.inTable}>
          <Unlink className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Delete Table" onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editorUiState.inTable}>
          <Table2 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <div className="grid gap-2 border-x border-gray-800 bg-[#0f0f0f] px-2 py-2">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input
            value={linkInput}
            onChange={(event) => setLinkInput(event.target.value)}
            placeholder="Paste link and click link icon"
            className={inputCls}
          />
          <input
            value={imageInput}
            onChange={(event) => setImageInput(event.target.value)}
            placeholder="Paste image URL and click image icon"
            className={inputCls}
          />
        </div>
      </div>

      <div className={editorCls} style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
