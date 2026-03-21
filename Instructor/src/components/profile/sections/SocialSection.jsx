import { Globe, Link2 } from 'lucide-react';
import { Field, SectionCard } from '../ProfileCommon';

export function SocialSection({ draft, updateField }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Social Links" subtitle="Public profile and portfolio URLs" icon={Link2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="LinkedIn"
            value={draft.socialLinks.linkedin}
            onChange={(value) => updateField('socialLinks.linkedin', value)}
            placeholder="https://linkedin.com/in/..."
          />
          <Field
            label="GitHub"
            value={draft.socialLinks.github}
            onChange={(value) => updateField('socialLinks.github', value)}
            placeholder="https://github.com/..."
          />
          <Field
            label="Twitter/X"
            value={draft.socialLinks.twitter}
            onChange={(value) => updateField('socialLinks.twitter', value)}
            placeholder="https://x.com/..."
          />
          <Field
            label="Website"
            value={draft.socialLinks.website}
            onChange={(value) => updateField('socialLinks.website', value)}
            placeholder="https://your-site.com"
          />
          <Field
            label="YouTube"
            value={draft.socialLinks.youtube}
            onChange={(value) => updateField('socialLinks.youtube', value)}
            placeholder="https://youtube.com/@..."
          />
        </div>
      </SectionCard>

      <SectionCard title="Teaching Languages" subtitle="Displayed on your profile" icon={Globe}>
        <Field
          label="Languages (comma separated)"
          value={draft.teachingLanguagesInput}
          onChange={(value) => updateField('teachingLanguagesInput', value)}
          placeholder="English, Hindi"
        />
      </SectionCard>
    </div>
  );
}
