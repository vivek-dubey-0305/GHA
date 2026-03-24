import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, ArrowLeft, Clock, Users, Star, ChevronDown, ChevronRight,
  Video, FileText, Radio, File, Award, AlertTriangle, RefreshCw,
  Play, Layers, ClipboardList, Calendar, Globe, Tag, DollarSign,
  Eye, EyeOff, Edit,
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import {
  getFullCourse,
  selectCurrentCourse,
  selectCurrentCourseLoading,
  selectCurrentCourseError,
  resetCurrentCourse,
} from '../../redux/slices/course.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';
import { formatDuration, getThumbnailUrl } from '../../utils/course.utils';
import { useState } from 'react';

const LESSON_ICONS = { video: Video, article: FileText, assignment: ClipboardList, live: Radio, material: File };

function Breadcrumb({ courseTitle }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
      <Link to="/instructor/courses" className="hover:text-white transition-colors">My Courses</Link>
      <ChevronRight className="w-3.5 h-3.5" />
      <span className="text-white truncate max-w-xs">{courseTitle || 'Course'}</span>
    </nav>
  );
}

function StatBadge({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
      <Icon className="w-4 h-4 text-gray-400" />
      <div>
        <p className="text-white text-sm font-semibold">{value}</p>
        <p className="text-gray-500 text-xs">{label}</p>
      </div>
    </div>
  );
}

function ModuleSection({ module, index }) {
  const [expanded, setExpanded] = useState(true);
  const lessons = module.lessons || [];

  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">{module.title || 'Untitled Module'}</h3>
          <p className="text-gray-500 text-xs mt-0.5">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</p>
        </div>
        {module.thumbnail?.secure_url && (
          <img src={module.thumbnail.secure_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
        )}
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? '' : '-rotate-90'}`} />
      </button>

      {expanded && lessons.length > 0 && (
        <div className="border-t border-gray-800">
          {lessons.map((lesson, li) => (
            <LessonRow key={lesson._id || li} lesson={lesson} index={li} />
          ))}
        </div>
      )}
    </div>
  );
}

function LessonRow({ lesson, index }) {
  const [showDetails, setShowDetails] = useState(false);
  const Icon = LESSON_ICONS[lesson.type] || FileText;
  const details = getLessonDetails(lesson);

  return (
    <div className="border-b border-gray-800/50 last:border-b-0">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded bg-white/5 flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-200 text-sm truncate">{lesson.title || 'Untitled Lesson'}</p>
          <p className="text-gray-600 text-xs capitalize">{lesson.type}</p>
        </div>
        {lesson.isFree && (
          <span className="px-2 py-0.5 text-xs rounded bg-green-500/10 text-green-400">Free</span>
        )}
        {lesson.thumbnail?.secure_url && (
          <img src={lesson.thumbnail.secure_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-600 transition-transform ${showDetails ? '' : '-rotate-90'}`} />
      </button>

      {showDetails && details && (
        <div className="px-4 pb-3 ml-9">
          {details}
        </div>
      )}
    </div>
  );
}

function getLessonDetails(lesson) {
  if (lesson.type === 'video' && lesson.videoId) {
    const video = lesson.videoId;
    return (
      <div className="space-y-2">
        <p className="text-gray-400 text-xs">Video lesson</p>
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
          <Play className="w-3 h-3 text-gray-500" />
          <span className="text-gray-300 text-xs flex-1 truncate">{video.title || 'Video'}</span>
          {video.duration > 0 && <span className="text-gray-600 text-xs">{formatDuration(video.duration)}</span>}
          {video.thumbnail && <img src={video.thumbnail} alt="" className="w-6 h-6 rounded object-cover" />}
        </div>
      </div>
    );
  }

  if (lesson.type === 'article' && lesson.content?.articleContent) {
    return <p className="text-gray-400 text-xs line-clamp-3">{lesson.content.articleContent}</p>;
  }

  if (lesson.type === 'assignment' && lesson.assignmentId) {
    const a = lesson.assignmentId;
    return (
      <div className="space-y-1 text-xs">
        <p className="text-gray-300">{a.title}</p>
        <div className="flex gap-3 text-gray-500">
          <span>Type: {a.type}</span>
          <span>Max Score: {a.maxScore}</span>
          <span>Pass: {a.passingScore}%</span>
        </div>
        {a.dueDate && <p className="text-gray-600">Due: {new Date(a.dueDate).toLocaleDateString()}</p>}
        {a.thumbnail?.secure_url && <img src={a.thumbnail.secure_url} alt="" className="w-16 h-16 rounded object-cover mt-1" />}
      </div>
    );
  }

  if (lesson.type === 'live' && lesson.liveClassId) {
    const lc = lesson.liveClassId;
    return (
      <div className="space-y-1 text-xs">
        <p className="text-gray-300">{lc.title}</p>
        <div className="flex gap-3 text-gray-500">
          <span>Duration: {lc.duration}min</span>
          <span>Max: {lc.maxParticipants}</span>
          <span>Status: {lc.status}</span>
        </div>
        {lc.scheduledAt && <p className="text-gray-600">Scheduled: {new Date(lc.scheduledAt).toLocaleString()}</p>}
      </div>
    );
  }

  if (lesson.type === 'material' && lesson.materialId) {
    const mat = lesson.materialId;
    return (
      <div className="space-y-1 text-xs">
        <p className="text-gray-300">{mat.title} <span className="text-gray-600">({mat.type})</span></p>
        {mat.fileUrl && <a href={mat.fileUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">View File</a>}
        {mat.thumbnail && <img src={typeof mat.thumbnail === 'string' ? mat.thumbnail : mat.thumbnail.secure_url} alt="" className="w-16 h-16 rounded object-cover mt-1" />}
      </div>
    );
  }

  return null;
}

function CertificateSection({ certificates }) {
  if (!certificates?.length) return null;
  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
        <Award className="w-4 h-4" /> Certificates ({certificates.length})
      </h3>
      <div className="space-y-3">
        {certificates.map((cert, i) => (
          <div key={cert._id || i} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
            {cert.certificateUrl && (
              <img src={cert.certificateUrl} alt="" className="w-14 h-10 rounded object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-gray-200 text-sm truncate">{cert.title}</p>
              <p className="text-gray-500 text-xs">{cert.skills?.join(', ') || 'No skills listed'}</p>
            </div>
            {cert.expiryDate && (
              <span className="text-gray-600 text-xs">Expires {new Date(cert.expiryDate).toLocaleDateString()}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CourseView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { courseId } = useParams();

  const courseData = useSelector(selectCurrentCourse);
  const loading = useSelector(selectCurrentCourseLoading);
  const error = useSelector(selectCurrentCourseError);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const fetchCourse = useCallback(() => {
    if (courseId) dispatch(getFullCourse(courseId));
  }, [dispatch, courseId]);

  useEffect(() => {
    fetchCourse();
    return () => { dispatch(resetCurrentCourse()); };
  }, [fetchCourse, dispatch]);

  if (loading) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8 space-y-4">
          <div className="h-6 w-48 bg-gray-800 rounded animate-pulse" />
          <div className="h-48 bg-[#111] border border-gray-800 rounded-xl animate-pulse" />
          <div className="h-32 bg-[#111] border border-gray-800 rounded-xl animate-pulse" />
          <div className="h-32 bg-[#111] border border-gray-800 rounded-xl animate-pulse" />
        </div>
      </InstructorLayout>
    );
  }

  if (error) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <AlertTriangle className="w-10 h-10 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Failed to load course</h2>
            <p className="text-gray-500 mb-6">{typeof error === 'string' ? error : 'Something went wrong.'}</p>
            <div className="flex gap-3">
              <button onClick={() => navigate('/instructor/courses')} className="px-5 py-2.5 bg-[#111] border border-gray-800 text-gray-300 rounded-lg hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 inline mr-2" />Back
              </button>
              <button onClick={fetchCourse} className="px-5 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors">
                <RefreshCw className="w-4 h-4 inline mr-2" />Retry
              </button>
            </div>
          </div>
        </div>
      </InstructorLayout>
    );
  }

  const course = courseData?.course || courseData;
  const modules = courseData?.modules || course?.modules || [];
  const certificates = course?.certificates || [];

  if (!course) return null;

  const thumbnailUrl = getThumbnailUrl(course.thumbnail);
  const instructorInfo = course.instructor;

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <Breadcrumb courseTitle={course.title} />

        {/* Header Section */}
        <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Thumbnail */}
            <div className="md:w-72 lg:w-80 h-48 md:h-auto bg-gray-900 flex-shrink-0 relative">
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <BookOpen className="w-12 h-12 text-gray-700" />
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  course.status === 'published' ? 'bg-green-500/20 text-green-400' :
                  course.status === 'archived' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-800 text-gray-300'
                }`}>
                  {course.status || 'draft'}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-5 flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h1 className="text-xl lg:text-2xl font-bold text-white">{course.title}</h1>
                <button
                  onClick={() => navigate(`/instructor/courses/${courseId}/edit`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors flex-shrink-0"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              {course.shortDescription && (
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{course.shortDescription}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {course.category && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-xs text-gray-400">
                    <Tag className="w-3 h-3" /> {course.category}
                  </span>
                )}
                {course.level && (
                  <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400 capitalize">{course.level}</span>
                )}
                {course.language && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-xs text-gray-400">
                    <Globe className="w-3 h-3" /> {course.language}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-3">
                <StatBadge icon={Users} label="Enrolled" value={course.enrolledCount || 0} />
                <StatBadge icon={Star} label="Rating" value={course.rating ? course.rating.toFixed(1) : '0.0'} />
                <StatBadge icon={Clock} label="Duration" value={`${course.totalDuration || 0}m`} />
                <StatBadge icon={Layers} label="Modules" value={course.totalModules || modules.length || 0} />
                <StatBadge icon={BookOpen} label="Lessons" value={course.totalLessons || 0} />
                <StatBadge icon={DollarSign} label="Price" value={course.isFree ? 'Free' : `${course.currency || '₹'}${course.price || 0}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <div className="bg-[#111] border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-2">Description</h3>
            <p className="text-gray-400 text-sm whitespace-pre-wrap">{course.description}</p>
          </div>
        )}

        {/* Learning Outcomes, Prerequisites, Target Audience */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {course.learningOutcomes?.length > 0 && (
            <div className="bg-[#111] border border-gray-800 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-3">What You'll Learn</h3>
              <ul className="space-y-1.5">
                {course.learningOutcomes.map((item, i) => (
                  <li key={i} className="text-gray-400 text-xs flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {course.prerequisites?.length > 0 && (
            <div className="bg-[#111] border border-gray-800 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-3">Prerequisites</h3>
              <ul className="space-y-1.5">
                {course.prerequisites.map((item, i) => (
                  <li key={i} className="text-gray-400 text-xs flex items-start gap-2">
                    <span className="text-gray-600">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {course.targetAudience?.length > 0 && (
            <div className="bg-[#111] border border-gray-800 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-3">Target Audience</h3>
              <ul className="space-y-1.5">
                {course.targetAudience.map((item, i) => (
                  <li key={i} className="text-gray-400 text-xs flex items-start gap-2">
                    <span className="text-blue-400">→</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Tags */}
        {course.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {course.tags.map((tag, i) => (
              <span key={i} className="px-2.5 py-1 bg-white/5 border border-gray-800 rounded-full text-xs text-gray-400">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Modules & Lessons */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Layers className="w-5 h-5" /> Course Content
          </h2>
          {modules.length > 0 ? (
            <div className="space-y-3">
              {modules.map((mod, i) => (
                <ModuleSection key={mod._id || i} module={mod} index={i} />
              ))}
            </div>
          ) : (
            <div className="bg-[#111] border border-gray-800 rounded-xl p-8 text-center">
              <Layers className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No modules added yet</p>
            </div>
          )}
        </div>

        {/* Certificates */}
        <CertificateSection certificates={certificates} />

        {/* Trailer Video */}
        {course.trailerVideo && (
          <div className="bg-[#111] border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
              <Play className="w-4 h-4" /> Trailer Video
            </h3>
            <video
              src={course.trailerVideo}
              controls
              className="w-full max-w-2xl rounded-lg"
              poster={thumbnailUrl}
            />
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
