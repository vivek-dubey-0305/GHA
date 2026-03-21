import { Settings2 } from 'lucide-react';
import { Field, SectionCard, ToggleField } from '../ProfileCommon';

export function PreferencesSection({ draft, updateField }) {
  return (
    <SectionCard title="Preferences" subtitle="Notifications and localization" icon={Settings2}>
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ToggleField
            label="Email Notifications"
            checked={Boolean(draft.preferences.emailNotifications)}
            onChange={(value) => updateField('preferences.emailNotifications', value)}
          />
          <ToggleField
            label="Class Reminders"
            checked={Boolean(draft.preferences.classReminders)}
            onChange={(value) => updateField('preferences.classReminders', value)}
          />
          <ToggleField
            label="Student Updates"
            checked={Boolean(draft.preferences.studentUpdates)}
            onChange={(value) => updateField('preferences.studentUpdates', value)}
          />
          <ToggleField
            label="Promotional Emails"
            checked={Boolean(draft.preferences.promotionalEmails)}
            onChange={(value) => updateField('preferences.promotionalEmails', value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Language"
            value={draft.preferences.language}
            onChange={(value) => updateField('preferences.language', value)}
          />
          <Field
            label="Timezone"
            value={draft.preferences.timezone}
            onChange={(value) => updateField('preferences.timezone', value)}
            placeholder="UTC"
          />
        </div>
      </div>
    </SectionCard>
  );
}
