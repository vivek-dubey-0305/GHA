import React, { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { Button, Label } from './index.js';

const inputCls = 'w-full px-3 py-2.5 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500 transition-colors';

/**
 * DynamicList - Reusable component for managing dynamic lists of items
 * Used for learning outcomes, prerequisites, target audience, etc.
 */
export function DynamicList({ items, onChange, placeholder, label }) {
  const addItem = () => onChange([...items, '']);
  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));
  const updateItem = (idx, val) => {
    const copy = [...items];
    copy[idx] = val;
    onChange(copy);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-gray-300 text-sm font-medium">{label}</Label>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              value={item}
              onChange={(e) => updateItem(idx, e.target.value)}
              className={inputCls}
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="text-red-400 hover:text-red-300 p-2"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-600 text-xs italic">No items added yet</p>}
      </div>
    </div>
  );
}
