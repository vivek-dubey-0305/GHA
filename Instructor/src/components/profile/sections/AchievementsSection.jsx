import { Trophy } from 'lucide-react';
import {
  AddRowButton,
  ArrayRowActions,
  Field,
  SectionCard,
  SelectField,
  TextAreaField
} from '../ProfileCommon';
import { LucideIconDropdown } from '../LucideIconDropdown';

const achievementCategoryOptions = [
  { label: 'Award', value: 'award' },
  { label: 'Speaking', value: 'speaking' },
  { label: 'Publication', value: 'publication' },
  { label: 'Milestone', value: 'milestone' },
  { label: 'Certification', value: 'certification' },
  { label: 'Media', value: 'media' },
  { label: 'Other', value: 'other' }
];

export function AchievementsSection({ draft, addArrayItem, removeArrayItem, updateArrayItem }) {
  return (
    <SectionCard title="Achievements" subtitle="Awards, publications, speaking and milestones" icon={Trophy}>
      <div className="space-y-3">
        {(draft.achievements || []).map((item, index) => {
          return (
            <div key={index} className="rounded-lg border border-gray-800 bg-[#0a0a0a] p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-500">Achievement {index + 1}</p>
                <ArrayRowActions onRemove={() => removeArrayItem('achievements', index)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="Title"
                  value={item.title}
                  onChange={(value) => updateArrayItem('achievements', index, 'title', value)}
                />
                <Field
                  label="Year"
                  type="number"
                  value={item.year}
                  onChange={(value) => updateArrayItem('achievements', index, 'year', value)}
                />
                <SelectField
                  label="Category"
                  value={item.category}
                  onChange={(value) => updateArrayItem('achievements', index, 'category', value)}
                  options={achievementCategoryOptions}
                />
                <Field
                  label="URL"
                  value={item.url}
                  onChange={(value) => updateArrayItem('achievements', index, 'url', value)}
                  placeholder="https://..."
                />
                <LucideIconDropdown
                  label="Lucide Icon Name"
                  value={item.icon || ''}
                  onChange={(value) => updateArrayItem('achievements', index, 'icon', value)}
                  fallback="Trophy"
                />
              </div>
              <TextAreaField
                label="Description"
                value={item.description}
                onChange={(value) => updateArrayItem('achievements', index, 'description', value)}
                rows={2}
                maxLength={200}
              />
            </div>
          );
        })}

        <AddRowButton
          label="Add Achievement"
          onClick={() =>
            addArrayItem('achievements', {
              icon: 'Trophy',
              title: '',
              description: '',
              year: new Date().getFullYear(),
              category: 'award',
              url: ''
            })
          }
        />
      </div>
    </SectionCard>
  );
}
