import { Clock3 } from 'lucide-react';
import { Field, SectionCard, TextAreaField, ToggleField } from '../ProfileCommon';

export function AvailabilitySection({ draft, updateField }) {
  return (
    <SectionCard title="Availability" subtitle="Mentorship and live-session availability" icon={Clock3}>
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ToggleField
            label="Available for Mentorship"
            checked={Boolean(draft.availability.isAvailableForMentorship)}
            onChange={(value) => updateField('availability.isAvailableForMentorship', value)}
          />
          <ToggleField
            label="Available for Live Sessions"
            checked={Boolean(draft.availability.isAvailableForLive)}
            onChange={(value) => updateField('availability.isAvailableForLive', value)}
          />
        </div>

        <Field
          label="Weekly Available Hours"
          type="number"
          value={draft.availability.weeklyAvailableHours}
          onChange={(value) => updateField('availability.weeklyAvailableHours', value)}
        />

        <TextAreaField
          label="Booking Message"
          value={draft.availability.bookingMessage}
          onChange={(value) => updateField('availability.bookingMessage', value)}
          rows={3}
          maxLength={300}
          placeholder="Share how students should prepare before booking"
        />
      </div>
    </SectionCard>
  );
}
