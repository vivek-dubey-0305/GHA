#!/usr/bin/env node

/**
 * Complete Course Creation Test Script
 * 
 * This script creates a complete course with:
 * - Course thumbnail and trailer video
 * - Multiple modules and lessons
 * - Videos with proper metadata
 * - Certificate with image
 * - Uses test videos and images from test_and_seed folder
 * 
 * Usage: node upload-complete-course.js [instructorId]
 * Example: node upload-complete-course.js 6990708d5468fd128775ab7b
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const API_ENDPOINT = `${API_BASE_URL}/api/v1/admin/courses/full`;
const AUTH_ENDPOINT = `${API_BASE_URL}/api/v1/admin/auth`;

// Admin credentials for testing
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'vivek.dubey0305@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Vivek@123456';

// Test files paths
const TEST_FILES = {
  videos: {
    video1: path.join(__dirname, 'videos', 'video_1.mp4'),
    video2: path.join(__dirname, 'videos', 'video_2.mp4'),
    kaliTrailer: path.join(__dirname, 'videos', 'kali-linux.mp4'),
  },
  images: {
    image1: path.join(__dirname, 'images', 'image_1.jpg'),
    image3: path.join(__dirname, 'images', 'image_3.jpg'),
    image4: path.join(__dirname, 'images', 'image_4.jpg'),
    image5: path.join(__dirname, 'images', 'image_5.jpg'),
  },
};

// Instructor ID (from command line or environment)
const INSTRUCTOR_ID = process.argv[2] || process.env.INSTRUCTOR_ID || '6990708d5468fd128775ab7b';

// Global variable to store access token
let ACCESS_TOKEN = null;

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║          Complete Course Creation Test Script                  ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log(`\n📝 Configuration:`);
console.log(`   API URL: ${API_BASE_URL}`);
console.log(`   Instructor ID: ${INSTRUCTOR_ID}`);
console.log(`   Endpoint: ${API_ENDPOINT}`);
console.log(`   Admin Email: ${ADMIN_EMAIL}`);

// Verify test files exist
function verifyTestFiles() {
  console.log('\n✓ Verifying test files...\n');
  const missing = [];

  Object.entries(TEST_FILES).forEach(([category, files]) => {
    Object.entries(files).forEach(([name, filepath]) => {
      if (fs.existsSync(filepath)) {
        console.log(`   ✓ ${category}/${name}: ${filepath}`);
      } else {
        console.log(`   ✗ ${category}/${name}: NOT FOUND - ${filepath}`);
        missing.push(`${category}/${name}`);
      }
    });
  });

  if (missing.length > 0) {
    console.error(`\n❌ Error: Missing test files: ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log('\n✓ All test files verified!\n');
}

// Admin login function
async function loginAdmin() {
  console.log('\n🔐 Logging in as admin...\n');

  try {
    const response = await fetch(`${AUTH_ENDPOINT}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Login failed: ${data.message || 'Unknown error'}`);
      return null;
    }

    console.log('✓ Login request sent successfully');
    
    // In development mode, OTP should be included in response
    if (data.otp) {
      console.log(`✓ OTP received from response: ${data.otp}`);
      return { ...data, otp: data.otp };
    }
    
    console.log('✓ Please check your email for OTP');
    return data;
  } catch (error) {
    console.error(`❌ Login error: ${error.message}`);
    return null;
  }
}

// Verify OTP function
async function verifyOTP(otp) {
  console.log('\n🔐 Verifying OTP...\n');

  try {
    const response = await fetch(`${AUTH_ENDPOINT}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        otp: otp,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ OTP verification failed: ${data.message || 'Unknown error'}`);
      return null;
    }

    // Extract token from cookies or response
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      const accessTokenMatch = cookies.match(/accessToken=([^;]+)/);
      if (accessTokenMatch) {
        ACCESS_TOKEN = accessTokenMatch[1];
        console.log('✓ Access token obtained from cookies');
        return data;
      }
    }

    // Fallback: check if token is in response
    if (data.accessToken) {
      ACCESS_TOKEN = data.accessToken;
      console.log('✓ Access token obtained from response');
      return data;
    }

    console.error('❌ No access token found in response');
    return null;
  } catch (error) {
    console.error(`❌ OTP verification error: ${error.message}`);
    return null;
  }
}

// Build course data structure
function buildCourseData() {
  return {
    title: 'Advanced Cybersecurity & Ethical Hacking Masterclass',
    description: `Complete guide to cybersecurity, ethical hacking, and penetration testing. 
    This comprehensive course covers essential security concepts, hacking techniques, and real-world applications. 
    Perfect for aspiring security professionals and enthusiasts.
    Learn from industry experts and get hands-on experience with practical labs and assignments.`,
    shortDescription: 'Master cybersecurity and ethical hacking from scratch',
    instructor: INSTRUCTOR_ID,
    category: 'programming',
    level: 'intermediate',
    language: 'English',
    price: 99.99,
    currency: 'USD',
    discountPrice: 79.99,
    discountValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isFree: false,
    status: 'published',
    maxStudents: 500,
    certificateEnabled: true,
    allowPreview: true,
    learningOutcomes: [
      'Understand core cybersecurity principles and concepts',
      'Master ethical hacking techniques and tools',
      'Perform penetration testing on real systems',
      'Implement security best practices',
      'Obtain industry-recognized certifications',
      'Build secure applications and systems',
    ],
    prerequisites: [
      'Basic understanding of computer networks',
      'Familiarity with Linux command line',
      'Networking fundamentals knowledge',
      'Python programming basics',
    ],
    targetAudience: [
      'Aspiring ethical hackers',
      'InfoSec professionals',
      'System administrators',
      'Web developers focused on security',
      'Anyone interested in cybersecurity',
      'University students pursuing IT/CS degrees',
    ],
    tags: ['cybersecurity', 'hacking', 'penetration-testing', 'ethical-hacking', 'infosec', 'networking'],
    seoTitle: 'Advanced Cybersecurity & Ethical Hacking Course',
    seoDescription: 'Complete cybersecurity course covering ethical hacking, penetration testing, and security practices',
    modules: [
      {
        title: 'Module 1: Cybersecurity Fundamentals',
        description: 'Introduction to cybersecurity concepts, threats, and defense mechanisms',
        objectives: [
          'Understand cybersecurity landscape and threats',
          'Learn defense mechanisms and best practices',
          'Explore different types of attacks',
          'Implement basic security measures',
        ],
        order: 1,
        lessons: [
          {
            title: 'Lesson 1: Introduction to Cybersecurity',
            description: 'Overview of cybersecurity, common threats, and industry standards',
            type: 'video',
            isFree: true, // Preview lesson
            order: 1,
            videoPackage: {
              packageName: 'Security Fundamentals',
              description: 'Getting started with cybersecurity basics',
              category: 'lecture',
              videos: [
                {
                  title: 'What is Cybersecurity?',
                  description: 'Understanding cybersecurity and its importance in modern world',
                  duration: 0, // Will be auto-detected
                },
              ],
            },
          },
          {
            title: 'Lesson 2: Types of Threats and Attacks',
            description: 'Learn about different types of cyber threats and attack vectors',
            type: 'video',
            isFree: false,
            order: 2,
            videoPackage: {
              packageName: 'Threat Analysis',
              description: 'Understanding various cyber threats',
              category: 'tutorial',
              videos: [
                {
                  title: 'Common Cyber Threats',
                  description: 'Exploring malware, phishing, DDoS, and other threats',
                  duration: 0,
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Module 2: Ethical Hacking Techniques',
        description: 'Learn practical ethical hacking techniques and tools',
        objectives: [
          'Master penetration testing methodologies',
          'Learn popular hacking tools and frameworks',
          'Perform security assessments',
          'Write ethical hacking reports',
        ],
        order: 2,
        lessons: [
          {
            title: 'Lesson 3: Introduction to Ethical Hacking',
            description: 'Understanding ethical hacking, legal implications, and certifications',
            type: 'video',
            isFree: false,
            order: 1,
            videoPackage: {
              packageName: 'Ethical Hacking Basics',
              description: 'Getting started with ethical hacking',
              category: 'lecture',
              videos: [
                {
                  title: 'Ethical Hacking Fundamentals',
                  description: 'What is ethical hacking and how to become an ethical hacker',
                  duration: 0,
                },
              ],
            },
          },
          {
            title: 'Lesson 4: Hacking Tools and Frameworks',
            description: 'Learn essential tools like Kali Linux, Metasploit, and Wireshark',
            type: 'video',
            isFree: false,
            order: 2,
            videoPackage: {
              packageName: 'Hacking Tools',
              description: 'Essential tools for ethical hackers',
              category: 'tutorial',
              videos: [
                {
                  title: 'Kali Linux and Essential Tools',
                  description: 'Setup and use professional hacking tools',
                  duration: 0,
                },
              ],
            },
          },
        ],
      },
    ],
    certificate: {
      title: 'Cybersecurity & Ethical Hacking Professional Certificate',
      description: 'Officially recognized certificate for completing the Advanced Cybersecurity & Ethical Hacking Masterclass',
      expiryDate: '2030-12-31',
      skills: [
        'Cybersecurity Fundamentals',
        'Penetration Testing',
        'Ethical Hacking',
        'Network Security',
        'Application Security',
      ],
    },
  };
}

// Create FormData with course data and files
async function createFormData(courseData) {
  const form = new FormData();
  
  // Append course data as JSON
  form.append('data', JSON.stringify(courseData));

  // Course thumbnail
  const thumbnailStream = fs.createReadStream(TEST_FILES.images.image4);
  form.append('thumbnail', thumbnailStream, 'course-thumbnail.jpg');
  console.log('✓ Added course thumbnail');

  // Course trailer video
  const trailerStream = fs.createReadStream(TEST_FILES.videos.kaliTrailer);
  form.append('trailerVideo', trailerStream, 'course-trailer.mp4');
  console.log('✓ Added course trailer video');

  // Module 0 thumbnail
  const mod0ThumbStream = fs.createReadStream(TEST_FILES.images.image1);
  form.append('module_0_thumbnail', mod0ThumbStream, 'module-1-thumb.jpg');
  console.log('✓ Added module 1 thumbnail');

  // Module 1 thumbnail
  const mod1ThumbStream = fs.createReadStream(TEST_FILES.images.image3);
  form.append('module_1_thumbnail', mod1ThumbStream, 'module-2-thumb.jpg');
  console.log('✓ Added module 2 thumbnail');

  // Module 0 Lesson 0 thumbnail
  const les00ThumbStream = fs.createReadStream(TEST_FILES.images.image5);
  form.append('module_0_lesson_0_thumbnail', les00ThumbStream, 'lesson-1-thumb.jpg');
  console.log('✓ Added lesson 1 thumbnail');

  // Module 0 Lesson 0 Video 0 (from video_1.mp4)
  const les00Vid0Stream = fs.createReadStream(TEST_FILES.videos.video1);
  form.append('module_0_lesson_0_video_0', les00Vid0Stream, 'lesson-1-video.mp4');
  console.log('✓ Added module 1, lesson 1 video');

  // Module 0 Lesson 1 thumbnail
  const les01ThumbStream = fs.createReadStream(TEST_FILES.images.image4);
  form.append('module_0_lesson_1_thumbnail', les01ThumbStream, 'lesson-2-thumb.jpg');
  console.log('✓ Added lesson 2 thumbnail');

  // Module 0 Lesson 1 Video 0 (from video_2.mp4)
  const les01Vid0Stream = fs.createReadStream(TEST_FILES.videos.video2);
  form.append('module_0_lesson_1_video_0', les01Vid0Stream, 'lesson-2-video.mp4');
  console.log('✓ Added module 1, lesson 2 video');

  // Module 1 Lesson 0 thumbnail
  const les10ThumbStream = fs.createReadStream(TEST_FILES.images.image3);
  form.append('module_1_lesson_0_thumbnail', les10ThumbStream, 'lesson-3-thumb.jpg');
  console.log('✓ Added lesson 3 thumbnail');

  // Module 1 Lesson 0 Video 0 (from video_1.mp4)
  const les10Vid0Stream = fs.createReadStream(TEST_FILES.videos.video1);
  form.append('module_1_lesson_0_video_0', les10Vid0Stream, 'lesson-3-video.mp4');
  console.log('✓ Added module 2, lesson 1 video');

  // Module 1 Lesson 1 thumbnail
  const les11ThumbStream = fs.createReadStream(TEST_FILES.images.image5);
  form.append('module_1_lesson_1_thumbnail', les11ThumbStream, 'lesson-4-thumb.jpg');
  console.log('✓ Added lesson 4 thumbnail');

  // Module 1 Lesson 1 Video 0 (from video_2.mp4)
  const les11Vid0Stream = fs.createReadStream(TEST_FILES.videos.video2);
  form.append('module_1_lesson_1_video_0', les11Vid0Stream, 'lesson-4-video.mp4');
  console.log('✓ Added module 2, lesson 2 video');

  // Certificate image
  const certImageStream = fs.createReadStream(TEST_FILES.images.image1);
  form.append('certificateImage', certImageStream, 'certificate.jpg');
  console.log('✓ Added certificate image');

  return form;
}

// Upload course to backend
async function uploadCourse(form) {
  console.log('\n📤 Uploading course to backend...\n');

  try {
    const headers = {
      ...form.getHeaders(),
    };

    if (ACCESS_TOKEN) {
      headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`;
    }

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      body: form,
      headers: headers,
      timeout: 600000, // 10 minutes
    });

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('❌ Non-JSON response received:');
      console.error(text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      throw new Error(`Server returned ${response.status} ${response.statusText} with non-JSON response`);
    }

    if (!response.ok) {
      console.error(`❌ Upload failed with status ${response.status}\n`);
      console.error('Response:', JSON.stringify(data, null, 2));
      return null;
    }

    return data;
  } catch (error) {
    console.error(`\n❌ Upload error: ${error.message}\n`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    throw error;
  }
}

// Display results
function displayResults(response) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║              ✓ Course Created Successfully!                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (response?.data?.course) {
    const course = response.data.course;
    console.log(`📚 Course Details:`);
    console.log(`   Title: ${course.title}`);
    console.log(`   ID: ${course._id}`);
    console.log(`   Status: ${course.status}`);
    console.log(`   Instructor: ${course.instructor}`);
    console.log(`   Modules: ${course.modules?.length || 0}`);
    console.log(`   Total Duration: ${course.totalDuration} minutes`);
    console.log(`   Price: ${course.currency} ${course.price}`);
    console.log(`   Certificate Enabled: ${course.certificateEnabled ? 'Yes' : 'No'}`);
    console.log(`   Thumbnail: ${course.thumbnail?.secure_url ? 'Uploaded to R2' : 'Not uploaded'}`);
    console.log(`   Trailer Video: ${course.trailerVideo ? 'Uploaded to Bunny' : 'Not uploaded'}`);
  }

  if (response?.data?.modules) {
    console.log(`\n📦 Modules Created:`);
    response.data.modules.forEach((mod, idx) => {
      console.log(`   Module ${idx + 1}: ${mod.title}`);
      console.log(`      Thumbnail: ${mod.thumbnail?.secure_url ? 'Uploaded to R2' : 'Not uploaded'}`);
      if (mod.lessons) {
        mod.lessons.forEach((les, lidx) => {
          console.log(`      └─ Lesson ${lidx + 1}: ${les.title}`);
          console.log(`         Thumbnail: ${les.thumbnail?.secure_url ? 'Uploaded to R2' : 'Not uploaded'}`);
          if (les.videoPackageId && les.videoPackageId.videos) {
            les.videoPackageId.videos.forEach((vid, vidx) => {
              console.log(`         Video ${vidx + 1}: ${vid.title} - ${vid.bunnyVideoId ? 'Uploaded to Bunny' : 'Not uploaded'}`);
            });
          }
        });
      }
    });
  }

  if (response?.data?.certificate) {
    console.log(`\n📜 Certificate Created:`);
    console.log(`   Title: ${response.data.certificate.title}`);
    console.log(`   Image: ${response.data.certificate.certificateUrl ? 'Uploaded to R2' : 'Not uploaded'}`);
  }

  if (response?.error?.errors?.length > 0) {
    console.log(`\n⚠️  Warnings:`);
    response.error.errors.forEach(err => {
      console.log(`   • ${err}`);
    });
  }

  console.log('\n✓ Course creation test completed!\n');
}

// Main execution
async function main() {
  try {
    verifyTestFiles();

    // Login as admin
    const loginResult = await loginAdmin();
    if (!loginResult) {
      console.error('❌ Failed to login. Exiting.');
      process.exit(1);
    }

    let otp = loginResult.otp;
    
    if (!otp) {
      // Fallback: prompt for OTP if not in response
      const readline = (await import('readline')).default;
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      otp = await new Promise((resolve) => {
        rl.question('Enter the 6-digit OTP from your email: ', (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });
    }

    // Verify OTP
    const verifyResult = await verifyOTP(otp);
    if (!verifyResult) {
      console.error('❌ Failed to verify OTP. Exiting.');
      process.exit(1);
    }

    console.log('✓ Authentication successful!\n');

    console.log('📋 Building course structure...\n');
    const courseData = buildCourseData();
    console.log(`   ✓ Course title: "${courseData.title}"`);
    console.log(`   ✓ Modules: ${courseData.modules.length}`);
    let totalLessons = 0;
    courseData.modules.forEach(m => {
      totalLessons += m.lessons?.length || 0;
    });
    console.log(`   ✓ Total lessons: ${totalLessons}`);

    console.log('\n📦 Preparing FormData with files...\n');
    const form = await createFormData(courseData);

    const response = await uploadCourse(form);
    
    if (response) {
      displayResults(response);
      process.exit(0);
    } else {
      console.error('❌ Failed to create course');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run script
main();
