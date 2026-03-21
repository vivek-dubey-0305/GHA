import { Briefcase } from 'lucide-react';
import { AddRowButton, ArrayRowActions, Field, SectionCard, SelectField, TextAreaField } from '../ProfileCommon';

const companyTypeOptions = [
  { label: 'Corporate', value: 'corporate' },
  { label: 'FAANG', value: 'faang' },
  { label: 'Startup', value: 'startup' },
  { label: 'Research', value: 'research' },
  { label: 'Freelance', value: 'freelance' },
  { label: 'Academic', value: 'academic' }
];

export function ExperienceSection({ draft, updateField, addArrayItem, removeArrayItem, updateArrayItem }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Background Type" subtitle="Used in listing page filters" icon={Briefcase}>
        <SelectField
          label="Primary Background"
          value={draft.backgroundType || ''}
          onChange={(value) => updateField('backgroundType', value || null)}
          options={[{ label: 'Not set', value: '' }, ...companyTypeOptions]}
        />
      </SectionCard>

      <SectionCard title="Work Experience" subtitle="Career timeline entries" icon={Briefcase}>
        <div className="space-y-3">
          {(draft.workExperience || []).map((item, index) => (
            <div key={index} className="rounded-lg border border-gray-800 bg-[#0a0a0a] p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-500">Experience {index + 1}</p>
                <ArrayRowActions onRemove={() => removeArrayItem('workExperience', index)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Field
                  label="Company"
                  value={item.company}
                  onChange={(value) => updateArrayItem('workExperience', index, 'company', value)}
                />
                <Field
                  label="Role"
                  value={item.role}
                  onChange={(value) => updateArrayItem('workExperience', index, 'role', value)}
                />
                <SelectField
                  label="Company Type"
                  value={item.companyType || 'corporate'}
                  onChange={(value) => updateArrayItem('workExperience', index, 'companyType', value)}
                  options={companyTypeOptions}
                />
                <Field
                  label="Location"
                  value={item.location}
                  onChange={(value) => updateArrayItem('workExperience', index, 'location', value)}
                />
                <Field
                  label="Start Month"
                  type="number"
                  value={item.startMonth}
                  onChange={(value) => updateArrayItem('workExperience', index, 'startMonth', value)}
                />
                <Field
                  label="Start Year"
                  type="number"
                  value={item.startYear}
                  onChange={(value) => updateArrayItem('workExperience', index, 'startYear', value)}
                />
                <Field
                  label="End Month"
                  type="number"
                  value={item.endMonth}
                  onChange={(value) => updateArrayItem('workExperience', index, 'endMonth', value)}
                />
                <Field
                  label="End Year"
                  type="number"
                  value={item.endYear}
                  onChange={(value) => updateArrayItem('workExperience', index, 'endYear', value)}
                />
              </div>
              <TextAreaField
                label="Description"
                value={item.description}
                onChange={(value) => updateArrayItem('workExperience', index, 'description', value)}
                rows={3}
                maxLength={600}
              />
              <Field
                label="Tech Stack (comma separated)"
                value={(item.techStack || []).join(', ')}
                onChange={(value) =>
                  updateArrayItem(
                    'workExperience',
                    index,
                    'techStack',
                    value
                      .split(',')
                      .map((part) => part.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="Node.js, AWS, Docker"
              />
            </div>
          ))}

          <AddRowButton
            label="Add Work Experience"
            onClick={() =>
              addArrayItem('workExperience', {
                company: '',
                role: '',
                companyType: 'corporate',
                startMonth: 1,
                startYear: new Date().getFullYear(),
                endMonth: null,
                endYear: null,
                isCurrent: false,
                description: '',
                techStack: [],
                location: ''
              })
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}
