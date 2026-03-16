// /**
//  * Mock Data Index - Complete Data Structure Export
//  * Organize all mock data for easy import across the frontend
//  */

// import {
//   mockInstructors
// } from "./instructor.js";

// import {
//   mockCourses,
//   mockModules,
//   mockLessons,
//   mockVideoPackages,
//   mockAssignments,
//   mockMaterials
// } from "./course.js";

// // ========================
// // COMBINED EXPORTS
// // ========================

// export const mockData = {
//   instructors: mockInstructors,
//   courses: mockCourses,
//   modules: mockModules,
//   lessons: mockLessons,
//   videoPackages: mockVideoPackages,
//   assignments: mockAssignments,
//   materials: mockMaterials
// };

// // ========================
// // Individual Exports
// // ========================

// export {
//   mockInstructors,
//   mockCourses,
//   mockModules,
//   mockLessons,
//   mockVideoPackages,
//   mockAssignments,
//   mockMaterials
// };

// // ========================
// // HELPER FUNCTIONS
// // ========================

// /**
//  * Get a course with all its nested data populated
//  * @param {string} courseId - The course ID
//  * @returns {object} - Course with modules, lessons, assignments
//  */
// export const getFullCourseData = (courseId) => {
//   const course = mockCourses.find(c => c._id === courseId);
//   if (!course) return null;

//   // Populate modules
//   const courseModules = mockModules.filter(m =>
//     course.modules.includes(m._id)
//   );

//   // Populate lessons for each module
//   const modulesWithLessons = courseModules.map(module => ({
//     ...module,
//     lessonDetails: mockLessons.filter(l =>
//       module.lessons.includes(l._id)
//     ).map(lesson => {
//       const lessonDetail = { ...lesson };

//       // Populate lesson content based on type
//       if (lesson.type === "video" && lesson.videoPackageId) {
//         lessonDetail.videoPackage = mockVideoPackages.find(
//           vp => vp._id === lesson.videoPackageId
//         );
//       }

//       if (lesson.type === "assignment" && lesson.assignmentId) {
//         lessonDetail.assignment = mockAssignments.find(
//           a => a._id === lesson.assignmentId
//         );
//       }

//       if (lesson.type === "material" && lesson.materialId) {
//         lessonDetail.material = mockMaterials.find(
//           m => m._id === lesson.materialId
//         );
//       }

//       return lessonDetail;
//     })
//   }));

//   // Populate instructor
//   const instructor = mockInstructors.find(i => i._id === course.instructor);

//   return {
//     ...course,
//     instructor,
//     modules: modulesWithLessons
//   };
// };

// /**
//  * Get an instructor with all their courses
//  * @param {string} instructorId - The instructor ID
//  * @returns {object} - Instructor with full course data
//  */
// export const getFullInstructorData = (instructorId) => {
//   const instructor = mockInstructors.find(i => i._id === instructorId);
//   if (!instructor) return null;

//   const instructorCourses = mockCourses.filter(c =>
//     instructor.courses.includes(c._id)
//   );

//   return {
//     ...instructor,
//     courseDetails: instructorCourses
//   };
// };

// /**
//  * Get all courses for a specific instructor
//  * @param {string} instructorId - The instructor ID
//  * @returns {array} - Array of courses
//  */
// export const getInstructorCourses = (instructorId) => {
//   return mockCourses.filter(c => c.instructor === instructorId);
// };

// /**
//  * Get a module with all its lessons populated
//  * @param {string} moduleId - The module ID
//  * @returns {object} - Module with lesson details
//  */
// export const getFullModuleData = (moduleId) => {
//   const module = mockModules.find(m => m._id === moduleId);
//   if (!module) return null;

//   const moduleLessons = mockLessons.filter(l =>
//     module.lessons.includes(l._id)
//   ).map(lesson => {
//     const lessonDetail = { ...lesson };

//     if (lesson.type === "video" && lesson.videoPackageId) {
//       lessonDetail.videoPackage = mockVideoPackages.find(
//         vp => vp._id === lesson.videoPackageId
//       );
//     }

//     if (lesson.type === "assignment" && lesson.assignmentId) {
//       lessonDetail.assignment = mockAssignments.find(
//         a => a._id === lesson.assignmentId
//       );
//     }

//     if (lesson.type === "material" && lesson.materialId) {
//       lessonDetail.material = mockMaterials.find(
//         m => m._id === lesson.materialId
//       );
//     }

//     return lessonDetail;
//   });

//   return {
//     ...module,
//     lessonDetails: moduleLessons
//   };
// };

// /**
//  * Get total course statistics
//  * @returns {object} - Statistics aggregated from all courses
//  */
// export const getCourseStatistics = () => {
//   return {
//     totalCourses: mockCourses.length,
//     totalInstructors: mockInstructors.length,
//     totalModules: mockModules.length,
//     totalLessons: mockLessons.length,
//     totalEnrollments: mockCourses.reduce((sum, course) => sum + course.enrolledCount, 0),
//     averageCourseRating: (mockCourses.reduce((sum, c) => sum + c.rating, 0) / mockCourses.length).toFixed(1),
//     totalCourseDuration: mockCourses.reduce((sum, c) => sum + c.totalDuration, 0) // in minutes
//   };
// };

// /**
//  * Search courses by keyword
//  * @param {string} keyword - Search term
//  * @returns {array} - Matching courses
//  */
// export const searchCourses = (keyword) => {
//   const lowerKeyword = keyword.toLowerCase();
//   return mockCourses.filter(course =>
//     course.title.toLowerCase().includes(lowerKeyword) ||
//     course.description.toLowerCase().includes(lowerKeyword) ||
//     course.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
//   );
// };

// /**
//  * Get courses by category
//  * @param {string} category - Course category
//  * @returns {array} - Courses in that category
//  */
// export const getCoursesByCategory = (category) => {
//   return mockCourses.filter(c => c.category === category);
// };

// /**
//  * Get courses by level
//  * @param {string} level - Course level (beginner, intermediate, advanced)
//  * @returns {array} - Courses at that level
//  */
// export const getCoursesByLevel = (level) => {
//   return mockCourses.filter(c => c.level === level);
// };

// /**
//  * Get top-rated courses
//  * @param {number} limit - Number of courses to return
//  * @returns {array} - Courses sorted by rating
//  */
// export const getTopRatedCourses = (limit = 5) => {
//   return [...mockCourses]
//     .sort((a, b) => b.rating - a.rating)
//     .slice(0, limit);
// };

// /**
//  * Get trending courses by enrollment
//  * @param {number} limit - Number of courses to return
//  * @returns {array} - Courses sorted by enrollment
//  */
// export const getTrendingCourses = (limit = 5) => {
//   return [...mockCourses]
//     .sort((a, b) => b.enrolledCount - a.enrolledCount)
//     .slice(0, limit);
// };

// /**
//  * Get top instructors by rating
//  * @param {number} limit - Number of instructors to return
//  * @returns {array} - Instructors sorted by rating
//  */
// export const getTopInstructors = (limit = 5) => {
//   return [...mockInstructors]
//     .sort((a, b) => b.rating.averageRating - a.rating.averageRating)
//     .slice(0, limit);
// };

// export default mockData;


/**
 * Mock Data Index — Combined exports for the entire frontend
 *
 * Preserves all original exports from the previous index.js and
 * adds the new CourseListing / CourseDetail helpers from course.js.
 */

import { mockInstructors } from "./instructor.js";

import {
  mockCourses,
  mockModules,
  mockCourseInstructors,
  filterCourses,
  sortCourses,
  getCourseById,
  getModulesByCourse,
  getRelatedCourses,
  getInstructorById,
} from "./course.js";

// ── Re-export the lesson/video/assignment/material arrays
// These still live in course.js; extract them if your components need them.
// (mockLessons, mockVideoPackages, mockAssignments, mockMaterials were in the
//  original file — keep them available via named export below.)
export {
  mockInstructors,

  // Course data
  mockCourses,
  mockModules,
  mockCourseInstructors,

  // Filter / sort helpers  (CourseListing)
  filterCourses,
  sortCourses,

  // Lookup helpers  (CourseDetail)
  getCourseById,
  getModulesByCourse,
  getRelatedCourses,
  getInstructorById,
};

// ── Combined mockData object (backward-compatible) ──
export const mockData = {
  instructors: mockInstructors,
  courses: mockCourses,
  modules: mockModules,
};

// ════════════════════════════════════════
// LEGACY HELPER FUNCTIONS
// (kept from original index.js — still work with the updated mockCourses)
// ════════════════════════════════════════

/**
 * Get a course with all its nested data populated
 */
export const getFullCourseData = (courseId) => {
  const course = mockCourses.find((c) => c._id === courseId);
  if (!course) return null;

  const courseModules = mockModules.filter((m) =>
    (course.modules || []).includes(m._id)
  );

  const modulesWithLessons = courseModules.map((module) => ({
    ...module,
    lessonDetails: module.lessonDetails || [],
  }));

  const instructor =
    mockCourseInstructors[course.instructor] ||
    mockInstructors?.find((i) => i._id === course.instructor);

  return { ...course, instructor, modules: modulesWithLessons };
};

/**
 * Get all courses for a specific instructor
 */
export const getInstructorCourses = (instructorId) =>
  mockCourses.filter((c) => c.instructor === instructorId);

/**
 * Get total course statistics
 */
export const getCourseStatistics = () => ({
  totalCourses: mockCourses.length,
  totalInstructors: Object.keys(mockCourseInstructors).length,
  totalModules: mockModules.length,
  totalEnrollments: mockCourses.reduce(
    (sum, c) => sum + (c.enrolledCount || 0),
    0
  ),
  averageCourseRating: (
    mockCourses.reduce((sum, c) => sum + c.rating, 0) / mockCourses.length
  ).toFixed(1),
  totalCourseDuration: mockCourses.reduce(
    (sum, c) => sum + (c.totalDuration || 0),
    0
  ),
});

/**
 * Search courses by keyword
 */
export const searchCourses = (keyword) => {
  const lk = keyword.toLowerCase();
  return mockCourses.filter(
    (c) =>
      c.title.toLowerCase().includes(lk) ||
      (c.description || "").toLowerCase().includes(lk) ||
      (c.tags || []).some((t) => t.toLowerCase().includes(lk))
  );
};

/**
 * Get courses by category
 */
export const getCoursesByCategory = (category) =>
  mockCourses.filter((c) => c.category === category);

/**
 * Get courses by level
 */
export const getCoursesByLevel = (level) =>
  mockCourses.filter((c) => c.level === level);

/**
 * Get top-rated courses
 */
export const getTopRatedCourses = (limit = 5) =>
  [...mockCourses].sort((a, b) => b.rating - a.rating).slice(0, limit);

/**
 * Get trending courses by enrollment
 */
export const getTrendingCourses = (limit = 5) =>
  [...mockCourses]
    .sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0))
    .slice(0, limit);

/**
 * Get top instructors by rating
 */
export const getTopInstructors = (limit = 5) =>
  Object.values(mockCourseInstructors)
    .sort(
      (a, b) =>
        (b.rating?.averageRating || 0) - (a.rating?.averageRating || 0)
    )
    .slice(0, limit);

export default mockData;