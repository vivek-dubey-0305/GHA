export const isImageOrVideoFile = (file) => {
  if (!file?.type) return false;
  return file.type.startsWith("image/") || file.type.startsWith("video/");
};

export const getVideoDurationSeconds = (file) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number(video.duration || 0));
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read video metadata"));
    };

    video.src = url;
  });
};

export const validateDoubtAttachments = async (files = []) => {
  const validFiles = [];
  const errors = [];

  for (const file of files) {
    if (!isImageOrVideoFile(file)) {
      errors.push(`${file.name}: only image/video files are allowed`);
      continue;
    }

    if (file.type.startsWith("video/")) {
      try {
        const duration = await getVideoDurationSeconds(file);
        if (duration > 120) {
          errors.push(`${file.name}: video duration must be 2 minutes or less`);
          continue;
        }
      } catch {
        errors.push(`${file.name}: unable to validate video duration`);
        continue;
      }
    }

    validFiles.push(file);
  }

  return { validFiles, errors };
};
