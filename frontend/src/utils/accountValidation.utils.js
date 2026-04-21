export const MAX_PROFILE_IMAGE_MB = 5;

const bytesToMb = (bytes) => bytes / (1024 * 1024);

export const validateProfileImageFile = (file) => {
  if (!file) {
    return { valid: false, message: "No file selected." };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: "Only JPG, PNG, or WEBP images are allowed." };
  }

  if (bytesToMb(file.size) > MAX_PROFILE_IMAGE_MB) {
    return { valid: false, message: `Image must be ${MAX_PROFILE_IMAGE_MB}MB or smaller.` };
  }

  return { valid: true, message: "" };
};

export const validatePasswordPayload = ({ currentPassword, newPassword, confirmPassword }) => {
  if (!currentPassword || !newPassword || !confirmPassword) {
    return "All password fields are required.";
  }

  if (newPassword.length < 8) {
    return "New password must be at least 8 characters.";
  }

  if (newPassword !== confirmPassword) {
    return "New password and confirmation do not match.";
  }

  if (currentPassword === newPassword) {
    return "New password must be different from the current password.";
  }

  return "";
};
