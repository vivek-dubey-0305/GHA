import React from 'react';
import { Switch } from './index.js';

/**
 * SettingToggle - Reusable component for toggle settings
 */
export function SettingToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between bg-[#111] border border-gray-800 rounded-lg p-4">
      <div>
        <span className="text-gray-200 text-sm font-medium">{label}</span>
        {description && <p className="text-gray-500 text-xs mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
