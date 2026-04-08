import dotenv from "dotenv";
import connectDB from "../configs/connection.config.js";
import { Course } from "../models/course.model.js";
import { Module } from "../models/module.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Instructor } from "../models/instructor.model.js";

dotenv.config();

const parseArgs = (argv) => {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
};

const toPositiveInt = (value, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
};

const makePlaceholderImage = (scope, key) => ({
  public_id: `seed/${scope}-${key}`,
  secure_url: `https://picsum.photos/seed/${scope}-${key}/800/450`,
});

const buildMatchingPairs = (moduleNo) => [
  { term: `2 + 2 (M${moduleNo})`, correctOption: "4", options: ["4", "6", "8", "10"] },
  { term: `3 + 5 (M${moduleNo})`, correctOption: "8", options: ["8", "7", "9", "11"] },
  { term: `6 + 1 (M${moduleNo})`, correctOption: "7", options: ["7", "5", "6", "12"] },
  { term: `5 + 7 (M${moduleNo})`, correctOption: "12", options: ["12", "9", "11", "13"] },
];

const buildObjectiveAssignments = ({ courseType, moduleNo, instructorId, courseId, lessonIds }) => {
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const common = {
    course: courseId,
    instructor: instructorId,
    createdBy: instructorId,
    isPublished: true,
    publishedAt: new Date(),
    dueDate,
    allowLateSubmission: true,
    lateSubmissionPenalty: 10,
    maxScore: 100,
    thumbnail: makePlaceholderImage("assignment", `${courseType}-m${moduleNo}`),
  };

  const mcq = {
    ...common,
    title: `${courseType.toUpperCase()} M${moduleNo} MCQ Assignment`,
    description: `Objective MCQ assignment for module ${moduleNo}.`,
    instructions: "Select the correct answer(s) and submit.",
    type: "text",
    assessmentType: "mcq",
    gradingType: "auto",
    lesson: lessonIds.mcq,
    questions: [
      {
        questionId: `mcq-${moduleNo}-1`,
        type: "mcq",
        question: "Which data type stores whole numbers?",
        options: ["string", "number", "boolean", "null"],
        correctAnswers: ["number"],
        marks: 34,
      },
      {
        questionId: `mcq-${moduleNo}-2`,
        type: "mcq",
        question: "Select all valid JS loop keywords.",
        options: ["for", "while", "loop", "do"],
        correctAnswers: ["for", "while", "do"],
        marks: 33,
      },
      {
        questionId: `mcq-${moduleNo}-3`,
        type: "mcq",
        question: "Which method converts JSON string to object?",
        options: ["JSON.parse", "JSON.stringify", "JSON.toObject", "JSON.decode"],
        correctAnswers: ["JSON.parse"],
        marks: 33,
      },
    ],
  };

  const tf = {
    ...common,
    title: `${courseType.toUpperCase()} M${moduleNo} True False Assignment`,
    description: `Objective true/false assignment for module ${moduleNo}.`,
    instructions: "Choose True or False for each statement.",
    type: "text",
    assessmentType: "true_false",
    gradingType: "auto",
    lesson: lessonIds.trueFalse,
    questions: [
      {
        questionId: `tf-${moduleNo}-1`,
        type: "true_false",
        question: "JavaScript is single-threaded by default.",
        correctAnswer: "True",
        marks: 50,
      },
      {
        questionId: `tf-${moduleNo}-2`,
        type: "true_false",
        question: "HTTP 500 means client-side validation success.",
        correctAnswer: "False",
        marks: 50,
      },
    ],
  };

  const matching = {
    ...common,
    title: `${courseType.toUpperCase()} M${moduleNo} Matching Assignment`,
    description: `Objective matching assignment for module ${moduleNo}.`,
    instructions: "Match each left item to the correct right option.",
    type: "text",
    assessmentType: "matching",
    gradingType: "auto",
    lesson: lessonIds.matching,
    questions: [
      {
        questionId: `matching-${moduleNo}-1`,
        type: "matching",
        question: "Match each expression with the correct result.",
        pairs: buildMatchingPairs(moduleNo),
        marks: 100,
      },
    ],
  };

  const list = [mcq, tf, matching];

  if (courseType === "live") {
    list.push({
      ...common,
      title: `LIVE M${moduleNo} Subjective Assignment`,
      description: `Subjective assignment for module ${moduleNo}.`,
      instructions: "Write your explanation and attach references/files if needed.",
      type: "mixed",
      assessmentType: "subjective",
      gradingType: "manual",
      lesson: lessonIds.subjective,
    });

    list.push({
      ...common,
      title: `LIVE M${moduleNo} Coding Assignment`,
      description: `Coding assignment for module ${moduleNo}.`,
      instructions: "Implement the function and explain approach.",
      type: "mixed",
      assessmentType: "coding",
      gradingType: "manual",
      lesson: lessonIds.coding,
    });
  }

  return list;
};

const ensureInstructor = async ({ index, instructorId, instructorEmail }) => {
  if (instructorId) {
    const existingById = await Instructor.findById(instructorId).select("_id email");
    if (!existingById) {
      throw new Error(`Instructor not found for --instructorId=${instructorId}`);
    }
    return { instructor: existingById, created: false };
  }

  const email = instructorEmail || `seed.instructor${index}@testmail.com`;
  const existing = await Instructor.findOne({ email }).select("_id email");
  if (existing) return { instructor: existing, created: false };

  const suffix = String(index);
  const phoneTail = suffix.padStart(7, "0").slice(-7);
  const instructor = await Instructor.create({
    firstName: "Seed",
    lastName: `Instructor${suffix}`,
    email,
    phone: `+91999${phoneTail}`,
    password: "Instructor@1234",
    dateOfBirth: new Date("1990-01-01"),
    gender: "Male",
    bio: "Seeder-generated instructor for end-to-end course creation tests.",
    address: {
      street: "Seeder Street",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
      country: "India",
    },
    specialization: ["web_development"],
    yearsOfExperience: 8,
    profilePicture: makePlaceholderImage("instructor", suffix),
    isEmailVerified: true,
    isPhoneVerified: true,
    isDocumentsVerified: true,
    isKYCVerified: true,
    isActive: true,
  });

  return { instructor, created: true };
};

const cleanupByIds = async ({ assignmentIds, lessonIds, moduleIds, courseId, createdInstructorId }) => {
  if (assignmentIds.length) await Assignment.deleteMany({ _id: { $in: assignmentIds } });
  if (lessonIds.length) await Lesson.deleteMany({ _id: { $in: lessonIds } });
  if (moduleIds.length) await Module.deleteMany({ _id: { $in: moduleIds } });
  if (courseId) await Course.deleteOne({ _id: courseId });
  if (createdInstructorId) await Instructor.deleteOne({ _id: createdInstructorId });
};

const seedCompleteInstructorCourse = async ({
  modules,
  courseType,
  index,
  instructorId,
  instructorEmail,
}) => {
  const createdIds = {
    assignmentIds: [],
    lessonIds: [],
    moduleIds: [],
    courseId: null,
    createdInstructorId: null,
  };

  const { instructor, created } = await ensureInstructor({ index, instructorId, instructorEmail });
  if (created) createdIds.createdInstructorId = instructor._id;

  const title = `${courseType.toUpperCase()} Complete Seed Course ${index}`;
  const existingCourse = await Course.findOne({ title }).select("_id");
  if (existingCourse) {
    throw new Error(`Course title already exists: ${title}. Use a different --index value.`);
  }

  try {
    const moduleCount = Math.max(1, modules);
    const course = await Course.create({
      title,
      description: `Seeder generated ${courseType} course with complete assignment coverage for test index ${index}.`,
      shortDescription: `Seeder ${courseType} course ${index}`,
      instructor: instructor._id,
      createdBy: instructor._id,
      updatedBy: instructor._id,
      category: "web_development",
      subCategory: "react",
      level: "beginner",
      language: "English",
      type: courseType,
      price: courseType === "live" ? 1499 : 999,
      currency: "INR",
      learningOutcomes: [
        "Understand the complete assignment workflow",
        "Practice objective and manual submission types",
        "Review auto and manual grading experiences",
      ],
      prerequisites: ["Basic JavaScript knowledge"],
      targetAudience: ["Beginners", "Job seekers"],
      tags: ["seed", courseType, `seed-${index}`],
      thumbnail: makePlaceholderImage("course", `${courseType}-${index}`),
      trailerVideo: "https://example.com/placeholder-trailer.mp4",
      status: "published",
      isPublished: true,
      publishedAt: new Date(),
      allowPreview: true,
      certificateEnabled: true,
      isFree: false,
    });
    createdIds.courseId = course._id;

    const moduleDocs = [];

    for (let m = 1; m <= moduleCount; m += 1) {
      const moduleDoc = await Module.create({
        title: `Module ${m} - ${courseType.toUpperCase()} Foundations`,
        description: `Module ${m} generated by seeder with complete assignment matrix.`,
        course: course._id,
        order: m,
        objectives: [
          "Read an article lesson",
          "Submit objective assignments",
          courseType === "live" ? "Submit coding and subjective assignments" : "Complete recorded assessments",
        ],
        isPublished: true,
        publishedAt: new Date(),
        createdBy: instructor._id,
        updatedBy: instructor._id,
        thumbnail: makePlaceholderImage("module", `${courseType}-${index}-${m}`),
      });
      createdIds.moduleIds.push(moduleDoc._id);

      const lessonDocs = [];
      let order = 1;

      const articleLesson = await Lesson.create({
        title: `Module ${m} Article Lesson`,
        description: "Read this article before attempting assignments.",
        course: course._id,
        module: moduleDoc._id,
        order: order,
        type: "article",
        content: {
          articleContent: `This is a seeded article for module ${m}. It is intentionally long enough for validation and provides reading context before assignments.`,
        },
        isFree: true,
        isPublished: true,
        publishedAt: new Date(),
        createdBy: instructor._id,
        updatedBy: instructor._id,
      });
      lessonDocs.push(articleLesson._id);
      createdIds.lessonIds.push(articleLesson._id);
      order += 1;

      const assignmentLessonIds = {
        mcq: null,
        trueFalse: null,
        matching: null,
        subjective: null,
        coding: null,
      };

      const objectiveTypes = ["mcq", "true_false", "matching"];
      for (const objectiveType of objectiveTypes) {
        const lessonDoc = await Lesson.create({
          title: `Module ${m} ${objectiveType} Assignment Lesson`,
          description: `Seeded ${objectiveType} assignment lesson for module ${m}.`,
          course: course._id,
          module: moduleDoc._id,
          order,
          type: "assignment",
          isPublished: true,
          publishedAt: new Date(),
          createdBy: instructor._id,
          updatedBy: instructor._id,
        });
        lessonDocs.push(lessonDoc._id);
        createdIds.lessonIds.push(lessonDoc._id);

        if (objectiveType === "mcq") assignmentLessonIds.mcq = lessonDoc._id;
        if (objectiveType === "true_false") assignmentLessonIds.trueFalse = lessonDoc._id;
        if (objectiveType === "matching") assignmentLessonIds.matching = lessonDoc._id;
        order += 1;
      }

      if (courseType === "live") {
        const subjectiveLesson = await Lesson.create({
          title: `Module ${m} Subjective Assignment Lesson`,
          description: `Seeded subjective assignment lesson for module ${m}.`,
          course: course._id,
          module: moduleDoc._id,
          order,
          type: "assignment",
          isPublished: true,
          publishedAt: new Date(),
          createdBy: instructor._id,
          updatedBy: instructor._id,
        });
        lessonDocs.push(subjectiveLesson._id);
        createdIds.lessonIds.push(subjectiveLesson._id);
        assignmentLessonIds.subjective = subjectiveLesson._id;
        order += 1;

        const codingLesson = await Lesson.create({
          title: `Module ${m} Coding Assignment Lesson`,
          description: `Seeded coding assignment lesson for module ${m}.`,
          course: course._id,
          module: moduleDoc._id,
          order,
          type: "assignment",
          isPublished: true,
          publishedAt: new Date(),
          createdBy: instructor._id,
          updatedBy: instructor._id,
        });
        lessonDocs.push(codingLesson._id);
        createdIds.lessonIds.push(codingLesson._id);
        assignmentLessonIds.coding = codingLesson._id;
        order += 1;
      }

      const assignmentPayloads = buildObjectiveAssignments({
        courseType,
        moduleNo: m,
        instructorId: instructor._id,
        courseId: course._id,
        lessonIds: assignmentLessonIds,
      });

      for (const payload of assignmentPayloads) {
        const assignment = await Assignment.create(payload);
        createdIds.assignmentIds.push(assignment._id);
        await Lesson.findByIdAndUpdate(assignment.lesson, {
          assignmentId: assignment._id,
          updatedBy: instructor._id,
        });
      }

      moduleDoc.lessons = lessonDocs;
      moduleDoc.totalLessons = lessonDocs.length;
      moduleDoc.totalDuration = Math.max(lessonDocs.length * 15, 60);
      await moduleDoc.save();

      moduleDocs.push(moduleDoc._id);
    }

    course.modules = moduleDocs;
    course.totalModules = moduleDocs.length;
    course.totalLessons = await Lesson.countDocuments({ course: course._id });
    course.totalDuration = Math.max(course.totalLessons * 15, 60);
    await course.save();

    return {
      instructorId: instructor._id.toString(),
      instructorEmail: instructor.email,
      courseId: course._id.toString(),
      courseTitle: course.title,
      modules: course.totalModules,
      lessons: course.totalLessons,
      assignments: createdIds.assignmentIds.length,
    };
  } catch (error) {
    await cleanupByIds(createdIds);
    throw error;
  }
};

const printUsage = () => {
  console.log("\nUsage:");
  console.log("  node seeds/instructor-complete-course.seed.js --index <number> [--type recorded|live] [--modules N] [--instructorId <id>] [--instructorEmail <email>]");
  console.log("\nExamples:");
  console.log("  node seeds/instructor-complete-course.seed.js --index 11 --type recorded --modules 2");
  console.log("  node seeds/instructor-complete-course.seed.js --index 12 --type live --modules 1 --instructorEmail demo.instructor@gha.local");
};

(async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.index) {
    printUsage();
    process.exit(1);
  }

  const courseType = String(args.type || "recorded").toLowerCase();
  if (!["recorded", "live"].includes(courseType)) {
    console.error("❌ Invalid --type. Use recorded or live.");
    process.exit(1);
  }

  const modules = toPositiveInt(args.modules, 1);
  const index = toPositiveInt(args.index, NaN);
  if (!Number.isFinite(index)) {
    console.error("❌ --index must be a positive integer.");
    process.exit(1);
  }

  try {
    await connectDB();
    const result = await seedCompleteInstructorCourse({
      modules,
      courseType,
      index,
      instructorId: args.instructorId,
      instructorEmail: args.instructorEmail,
    });

    console.log("\n✅ Complete instructor course seeding finished successfully");
    console.log(`Instructor: ${result.instructorEmail} (${result.instructorId})`);
    console.log(`Course: ${result.courseTitle} (${result.courseId})`);
    console.log(`Modules: ${result.modules}, Lessons: ${result.lessons}, Assignments: ${result.assignments}`);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeder failed:", error.message);
    process.exit(1);
  }
})();
