import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, Label } from './index.js';

const inputCls = 'w-full px-3 py-2.5 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500 transition-colors';

/**
 * TagsInput - Reusable component for managing tags
 */
export function TagsInput({ tags, onChange }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const tag = input.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
      setInput('');
    }
  };

  const removeTag = (idx) => onChange(tags.filter((_, i) => i !== idx));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div>
      <Label className="text-gray-300 text-sm font-medium">Tags</Label>
      <div className="flex flex-wrap gap-2 mt-2 mb-2">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="flex items-center gap-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="hover:text-red-300"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className={inputCls}
          placeholder="Type a tag and press Enter"
        />
        <Button
          type="button"
          onClick={addTag}
          className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 shrink-0"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
