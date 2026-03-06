import { calculateCourseDuration } from '../../utils/course.utils.js';

/**
 * Builds FormData for course submission
 * Handles all file uploads and nested data serialization
 */
export const buildFormData = (
  course,
  modules,
  thumbnailFile,
  trailerFile,
  certificate,
  status
) => {
  const fd = new FormData();

  const data = {
    ...course,
    status,
    price: Number(course.price) || 0,
    discountPrice: course.discountPrice ? Number(course.discountPrice) : undefined,
    discountValidUntil: course.discountValidUntil || undefined,
    maxStudents: course.maxStudents ? Number(course.maxStudents) : undefined,
    totalDuration: calculateCourseDuration(modules),
    modules: modules.map((m, mi) => {
      if (m.thumbnailFile) fd.append(`module_${mi}_thumbnail`, m.thumbnailFile);

      return {
        title: m.title,
        description: m.description,
        objectives: m.objectives.filter(Boolean),
        order: mi + 1,
        lessons: m.lessons.map((l, li) => {
          if (l.thumbnailFile) fd.append(`module_${mi}_lesson_${li}_thumbnail`, l.thumbnailFile);

          const lessonPayload = {
            title: l.title,
            description: l.description,
            type: l.type,
            isFree: l.isFree,
            order: li + 1,
          };

          // Type-specific data
          if (l.type === 'video' && l.videoPackage) {
            lessonPayload.videoPackage = {
              packageName: l.videoPackage.packageName || l.title,
              description: l.videoPackage.description || '',
              category: l.videoPackage.category || 'tutorial',
              videos: (l.videoPackage.videos || []).map((v, vi) => {
                if (v.videoFile) fd.append(`module_${mi}_lesson_${li}_video_${vi}`, v.videoFile);
                if (v.thumbnailFile) fd.append(`module_${mi}_lesson_${li}_video_${vi}_thumb`, v.thumbnailFile);
                return {
                  title: v.title || `Video ${vi + 1}`,
                  description: v.description || '',
                  duration: parseInt(v.duration) || 0,
                };
              }),
            };
          }

          if (l.type === 'article') {
            lessonPayload.content = { articleContent: l.content?.articleContent || '' };
          }

          if (l.type === 'assignment' && l.assignment) {
            if (l.assignment.thumbnailFile)
              fd.append(`module_${mi}_lesson_${li}_assignment_thumb`, l.assignment.thumbnailFile);
            lessonPayload.assignment = {
              title: l.assignment.title || l.title,
              description: l.assignment.description || l.assignment.instructions || 'No description',
              instructions: l.assignment.instructions || '',
              maxScore: parseInt(l.assignment.maxScore) || 100,
              passingScore: parseInt(l.assignment.passingScore) || 40,
              dueDate: l.assignment.dueDate || undefined,
              type: l.assignment.type || 'text',
              allowLateSubmission: l.assignment.allowLateSubmission || false,
              lateSubmissionPenalty: parseInt(l.assignment.lateSubmissionPenalty) || 0,
            };
          }

          if (l.type === 'live' && l.liveClass) {
            lessonPayload.liveClass = {
              title: l.liveClass.title || l.title,
              description: l.liveClass.description || '',
              scheduledAt: l.liveClass.scheduledAt || undefined,
              duration: parseInt(l.liveClass.duration) || 60,
              timezone: l.liveClass.timezone || 'UTC',
              zoomMeetingId: l.liveClass.zoomMeetingId || '',
              zoomJoinUrl: l.liveClass.zoomJoinUrl || '',
              zoomPassword: l.liveClass.zoomPassword || undefined,
              maxParticipants: parseInt(l.liveClass.maxParticipants) || 100,
              notes: l.liveClass.notes || undefined,
            };
          }

          if (l.type === 'material' && l.material) {
            if (l.material.materialFile)
              fd.append(`module_${mi}_lesson_${li}_material_file`, l.material.materialFile);
            lessonPayload.material = {
              title: l.material.title || l.title,
              description: l.material.description || '',
              type: l.material.type || 'pdf',
              fileName: l.material.fileName || '',
            };
          }

          return lessonPayload;
        }),
      };
    }),
  };

  // Certificate data
  if (course.certificateEnabled && certificate.title) {
    data.certificate = {
      title: certificate.title,
      description: certificate.description,
      expiryDate: certificate.expiryDate || undefined,
      skills: certificate.skills || [],
    };
    if (certificate.certificateImage) fd.append('certificateImage', certificate.certificateImage);
  }

  // Clean up undefined arrays
  if (data.learningOutcomes.length === 0) delete data.learningOutcomes;
  if (data.prerequisites.length === 0) delete data.prerequisites;
  if (data.targetAudience.length === 0) delete data.targetAudience;
  if (data.tags.length === 0) delete data.tags;
  if (!data.seoTitle) delete data.seoTitle;
  if (!data.seoDescription) delete data.seoDescription;

  fd.append('data', JSON.stringify(data));
  if (thumbnailFile) fd.append('thumbnail', thumbnailFile);
  if (trailerFile) fd.append('trailerVideo', trailerFile);

  return fd;
};
