import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { Label } from './index.js';

/**
 * FileUploadCard - Reusable component for file uploads with preview
 * Supports both image and video files
 */
export function FileUploadCard({ label, accept, file, preview, onFileChange, onRemove, icon: Icon }) {
  const inputRef = useRef(null);

  return (
    <div className="border border-dashed border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-colors">
      <Label className="text-gray-300 text-sm font-medium mb-2 block">{label}</Label>
      {preview ? (
        <div className="relative group">
          {accept?.includes('video') ? (
            <video src={preview} className="w-full h-36 object-cover rounded-lg" controls />
          ) : (
            <img src={preview} alt="Preview" className="w-full h-36 object-cover rounded-lg" />
          )}
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-36 flex flex-col items-center justify-center gap-2 bg-[#0f0f0f] rounded-lg border border-gray-800 hover:border-gray-600 transition-colors"
        >
          <Icon className="w-8 h-8 text-gray-500" />
          <span className="text-gray-500 text-sm">Click to upload</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onFileChange(e.target.files?.[0])}
        className="hidden"
      />
    </div>
  );
}
