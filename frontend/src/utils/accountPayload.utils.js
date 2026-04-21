export const toProfileUpdatePayload = (form) => ({
  firstName: form.firstName?.trim(),
  lastName: form.lastName?.trim(),
  phone: form.phone?.trim() || null,
  dateOfBirth: form.dateOfBirth || null,
  gender: form.gender || undefined,
  address: {
    city: form.city?.trim() || "",
    state: form.state?.trim() || "",
    country: form.country?.trim() || "",
  },
});

export const toPreferencesPayload = (preferences = {}) => ({
  emailNotifications: Boolean(preferences.emailNotifications),
  smsNotifications: Boolean(preferences.smsNotifications),
  courseUpdates: Boolean(preferences.courseUpdates),
  promotionalEmails: Boolean(preferences.promotionalEmails),
  language: preferences.language || "en",
});
