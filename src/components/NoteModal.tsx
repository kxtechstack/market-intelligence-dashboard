import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Bookmark,
  Loader2
} from "lucide-react";

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialContent?: string;
  onSave: (contentHtml: string) => void | Promise<void>;
}

export default function NoteModal({
  isOpen,
  onClose,
  title,
  initialContent = "",
  onSave,
}: NoteModalProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = initialContent || "";
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialContent]);

  if (!isOpen) return null;

  const handleFormat = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleSave = async () => {
    const html = editorRef.current ? editorRef.current.innerHTML : "";
    setSaving(true);
    try {
      await onSave(html);
      onClose();
    } catch (err) {
      console.error("Error saving note:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-[8px] shadow-2xl border border-zinc-200 w-full max-w-[620px] overflow-hidden flex flex-col font-sans relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Save & Bookmark tag, Title, and Close button */}
        <div className="flex items-start justify-between gap-4 p-5 pb-3">
          <div className="flex flex-col gap-1 min-w-0 pr-2">
            <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase font-sans">
              Save & Bookmark
            </span>
            <h2 className="text-[17px] sm:text-[18px] font-semibold text-zinc-950 leading-snug tracking-tight font-sans">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 -mr-1 -mt-1 flex items-center justify-center rounded-[4px] text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: WYSIWYG Editor */}
        <div className="px-5 pb-5 flex flex-col gap-4">
          <div className="border border-zinc-200 rounded-[6px] overflow-hidden bg-white shadow-2xs focus-within:border-zinc-400 transition-colors">
            {/* Toolbar: Bold, Italic, Underline, Strikethrough, Bullet List, Numbered List */}
            <div className="flex items-center flex-wrap gap-0.5 px-3 py-2 border-b border-zinc-200 bg-white select-none">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("bold");
                }}
                className="w-7 h-7 flex items-center justify-center rounded-[3px] text-zinc-800 hover:bg-zinc-100 hover:text-black transition-colors cursor-pointer"
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("italic");
                }}
                className="w-7 h-7 flex items-center justify-center rounded-[3px] text-zinc-800 hover:bg-zinc-100 hover:text-black transition-colors cursor-pointer"
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("underline");
                }}
                className="w-7 h-7 flex items-center justify-center rounded-[3px] text-zinc-800 hover:bg-zinc-100 hover:text-black transition-colors cursor-pointer"
                title="Underline"
              >
                <Underline className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("strikeThrough");
                }}
                className="w-7 h-7 flex items-center justify-center rounded-[3px] text-zinc-800 hover:bg-zinc-100 hover:text-black transition-colors cursor-pointer"
                title="Strikethrough"
              >
                <Strikethrough className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <div className="w-[1px] h-4 bg-zinc-200 mx-1.5" />

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("insertUnorderedList");
                }}
                className="w-7 h-7 flex items-center justify-center rounded-[3px] text-zinc-800 hover:bg-zinc-100 hover:text-black transition-colors cursor-pointer"
                title="Bullet List"
              >
                <List className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("insertOrderedList");
                }}
                className="w-7 h-7 flex items-center justify-center rounded-[3px] text-zinc-800 hover:bg-zinc-100 hover:text-black transition-colors cursor-pointer"
                title="Numbered List"
              >
                <ListOrdered className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Editable Content Area with bullet/numbering styles */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Start typing your notes here..."
              className="note-wysiwyg-content min-h-[180px] max-h-[340px] overflow-y-auto p-4 text-[13.5px] text-zinc-800 leading-relaxed font-sans focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-400 empty:before:pointer-events-none selection:bg-blue-100"
            />
          </div>

          {/* Footer with transparent Save button featuring a save/bookmark icon */}
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 bg-transparent hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border border-zinc-300 hover:border-zinc-400 text-[12px] font-semibold tracking-wide rounded-[4px] transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
