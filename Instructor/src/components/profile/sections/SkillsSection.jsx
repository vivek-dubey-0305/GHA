import { Wrench } from 'lucide-react';
import { AddRowButton, ArrayRowActions, Field, SectionCard, SelectField } from '../ProfileCommon';

const skillCategoryOptions = [
  { label: 'Language', value: 'language' },
  { label: 'Framework', value: 'framework' },
  { label: 'Tool', value: 'tool' },
  { label: 'Cloud', value: 'cloud' },
  { label: 'Database', value: 'database' },
  { label: 'Other', value: 'other' }
];

export function SkillsSection({ draft, addArrayItem, removeArrayItem, updateArrayItem }) {
  return (
    <SectionCard title="Skills" subtitle="Technology and tool proficiency" icon={Wrench}>
      <div className="space-y-3">
        {(draft.skills || []).map((item, index) => (
          <div key={index} className="rounded-lg border border-gray-800 bg-[#0a0a0a] p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-gray-500">Skill {index + 1}</p>
              <ArrayRowActions onRemove={() => removeArrayItem('skills', index)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Field
                label="Name"
                value={item.name}
                onChange={(value) => updateArrayItem('skills', index, 'name', value)}
                placeholder="Node.js"
              />
              <Field
                label="Proficiency (1-100)"
                type="number"
                value={item.proficiency}
                onChange={(value) => updateArrayItem('skills', index, 'proficiency', value)}
              />
              <SelectField
                label="Category"
                value={item.category}
                onChange={(value) => updateArrayItem('skills', index, 'category', value)}
                options={skillCategoryOptions}
              />
              <Field
                label="Display Order"
                type="number"
                value={item.displayOrder}
                onChange={(value) => updateArrayItem('skills', index, 'displayOrder', value)}
              />
            </div>
          </div>
        ))}

        <AddRowButton
          label="Add Skill"
          onClick={() =>
            addArrayItem('skills', {
              name: '',
              proficiency: 50,
              category: 'other',
              displayOrder: draft.skills.length
            })
          }
        />
      </div>
    </SectionCard>
  );
}
