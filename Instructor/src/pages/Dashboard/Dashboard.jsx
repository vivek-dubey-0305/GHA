import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { DragDropContext, Draggable } from '@hello-pangea/dnd';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import {
  LayoutDashboard, BookOpen, Users, Star, DollarSign,
  Video, ClipboardList, RefreshCw, Clock, AlertTriangle,
  ArrowRight, GripVertical, TrendingUp, ChevronDown, ChevronUp,
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import { StrictModeDroppable } from '../../components/ui/StrictModeDroppable';
import { getDashboard, selectDashboardData, selectDashboardLoading, selectDashboardError } from '../../redux/slices/dashboard.slice';
import { getMyCourses, selectCourses, selectCoursesLoading } from '../../redux/slices/course.slice';
import { selectInstructor } from '../../redux/slices/auth.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';

// ─── Reusable Sub-Components ─────────────────────────────────────────

function StatCard({ icon: Icon, label, value, subtitle }) {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl p-5 flex flex-col gap-3 hover:border-gray-600 transition-colors group">
      <div className="flex items-center justify-between">
        <div className="p-2.5 rounded-lg bg-white/5">
          <Icon className="w-5 h-5 text-gray-300" />
        </div>
        <TrendingUp className="w-4 h-4 text-gray-700 group-hover:text-gray-500 transition-colors" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-400 mt-0.5">{label}</p>
        {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children, collapsible, collapsed, onToggle }) {
  if (collapsible) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-lg font-semibold text-gray-300 mb-3 hover:text-white transition-colors group"
      >
        {children}
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
        )}
      </button>
    );
  }
  return <h2 className="text-lg font-semibold text-gray-300 mb-3">{children}</h2>;
}

function SkeletonCard() {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl p-5 animate-pulse">
      <div className="w-10 h-10 bg-gray-800 rounded-lg mb-4" />
      <div className="w-20 h-6 bg-gray-800 rounded mb-2" />
      <div className="w-28 h-4 bg-gray-800 rounded" />
    </div>
  );
}

function ChartTooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-white text-sm font-medium">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

// ─── Default widget order ────────────────────────────────────────────

const DEFAULT_SECTIONS = [
  'overview',
  'charts',
  'courses',
  'pendingTasks',
  'quickNav',
];

const STORAGE_KEY = 'instructor_dashboard_order';
const COLLAPSED_KEY = 'instructor_dashboard_collapsed';

function loadOrder() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_SECTIONS;
}

function loadCollapsed() {
  try {
    const saved = localStorage.getItem(COLLAPSED_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {};
}

// ─── Dashboard Component ─────────────────────────────────────────────

export default function Dashboard() {
  const dispatch = useDispatch();
  const dashboardData = useSelector(selectDashboardData);
  const loading = useSelector(selectDashboardLoading);
  const error = useSelector(selectDashboardError);
  const instructor = useSelector(selectInstructor);
  const courses = useSelector(selectCourses);
  const coursesLoading = useSelector(selectCoursesLoading);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [sectionOrder, setSectionOrder] = useState(loadOrder);
  const [collapsedSections, setCollapsedSections] = useState(loadCollapsed);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  useEffect(() => {
    dispatch(getDashboard());
    dispatch(getMyCourses({ limit: 5 }));
    setLastRefreshed(new Date());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(getDashboard());
    dispatch(getMyCourses({ limit: 5 }));
    setLastRefreshed(new Date());
  }, [dispatch]);

  const toggleSection = useCallback((key) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const items = Array.from(sectionOrder);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setSectionOrder(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [sectionOrder]);

  const stats = dashboardData?.data?.stats;
  const profile = dashboardData?.data?.profile;

  // Chart data derived from dashboard stats
  const enrollmentChartData = [
    { name: 'Mon', students: Math.floor((stats?.totalEnrollments || 0) * 0.1) },
    { name: 'Tue', students: Math.floor((stats?.totalEnrollments || 0) * 0.15) },
    { name: 'Wed', students: Math.floor((stats?.totalEnrollments || 0) * 0.12) },
    { name: 'Thu', students: Math.floor((stats?.totalEnrollments || 0) * 0.18) },
    { name: 'Fri', students: Math.floor((stats?.totalEnrollments || 0) * 0.2) },
    { name: 'Sat', students: Math.floor((stats?.totalEnrollments || 0) * 0.14) },
    { name: 'Sun', students: Math.floor((stats?.totalEnrollments || 0) * 0.11) },
  ];

  const courseEngagementData = courses?.slice(0, 5).map(c => ({
    name: c.title?.substring(0, 15) + (c.title?.length > 15 ? '...' : ''),
    enrollments: c.enrollmentCount || 0,
    rating: (c.averageRating || 0) * 20,
  })) || [];

  const navigationItems = [
    { name: 'My Courses', href: '/instructor/courses', icon: BookOpen },
    { name: 'Students', href: '/instructor/students', icon: Users },
    { name: 'Assignments', href: '/instructor/assignments', icon: ClipboardList },
    { name: 'Live Classes', href: '/instructor/live-classes', icon: Video },
    { name: 'Earnings', href: '/instructor/earnings', icon: DollarSign },
    { name: 'Reviews', href: '/instructor/reviews', icon: Star },
  ];

  // ─── Section Renderers ─────────────────────────────────────────

  const renderSection = (key) => {
    const isCollapsed = collapsedSections[key];

    switch (key) {
      case 'overview':
        return (
          <div>
            <SectionTitle collapsible collapsed={isCollapsed} onToggle={() => toggleSection(key)}>
              Overview
            </SectionTitle>
            {!isCollapsed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={BookOpen} label="Total Courses" value={stats?.totalCourses?.toLocaleString()} subtitle="All created courses" />
                <StatCard icon={Users} label="Enrolled Students" value={stats?.totalEnrollments?.toLocaleString()} subtitle="Across all courses" />
                <StatCard icon={Star} label="Total Reviews" value={stats?.totalReviews?.toLocaleString()} subtitle={profile?.rating ? `Avg: ${profile.rating.toFixed(1)} / 5` : 'No ratings yet'} />
                <StatCard icon={DollarSign} label="Students Teaching" value={stats?.totalStudentsTeaching?.toLocaleString()} subtitle="Active learners" />
              </div>
            )}
          </div>
        );

      case 'charts':
        return (
          <div>
            <SectionTitle collapsible collapsed={isCollapsed} onToggle={() => toggleSection(key)}>
              Analytics
            </SectionTitle>
            {!isCollapsed && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Enrollment Trend */}
                <div className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                  <h3 className="text-white text-sm font-semibold mb-4">Student Enrollment Trend</h3>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={enrollmentChartData}>
                        <defs>
                          <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                        <XAxis dataKey="name" stroke="#555" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#555" tick={{ fontSize: 12 }} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="students" stroke="#ffffff" strokeWidth={2} fill="url(#enrollGrad)" name="Students" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Course Engagement */}
                <div className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                  <h3 className="text-white text-sm font-semibold mb-4">Course Engagement</h3>
                  <div className="h-[220px]">
                    {courseEngagementData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={courseEngagementData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                          <XAxis dataKey="name" stroke="#555" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#555" tick={{ fontSize: 12 }} />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="enrollments" fill="#ffffff" radius={[4, 4, 0, 0]} name="Enrollments" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-600 text-sm">No course data available</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'courses':
        return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionTitle collapsible collapsed={isCollapsed} onToggle={() => toggleSection(key)}>
                Recent Courses
              </SectionTitle>
              {!isCollapsed && (
                <Link to="/instructor/courses" className="text-gray-400 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            {!isCollapsed && (
              coursesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : courses?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.slice(0, 6).map((course) => (
                    <Link key={course._id} to="/instructor/courses" className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-all group">
                      <div className="flex items-start gap-3">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white text-sm font-semibold truncate">{course.title || 'Untitled'}</h3>
                          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{course.shortDescription || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-800/50 text-xs text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${course.status === 'published' ? 'bg-white/10 text-white' : 'bg-gray-800 text-gray-400'}`}>
                          {course.status || 'draft'}
                        </span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.enrollmentCount || 0}</span>
                        {course.averageRating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {course.averageRating.toFixed(1)}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-[#111] border border-gray-800 rounded-xl p-8 text-center">
                  <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No courses yet</p>
                  <Link to="/instructor/courses" className="inline-flex items-center gap-1 mt-3 text-white text-sm font-medium hover:underline">
                    Create your first course <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )
            )}
          </div>
        );

      case 'pendingTasks':
        return (
          <div>
            <SectionTitle collapsible collapsed={isCollapsed} onToggle={() => toggleSection(key)}>
              Live Classes & Activity
            </SectionTitle>
            {!isCollapsed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-white/5"><Video className="w-5 h-5 text-gray-300" /></div>
                    <div>
                      <p className="text-white font-semibold text-sm">Live Classes</p>
                      <p className="text-gray-500 text-xs">Your scheduled sessions</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Total</span><span className="text-white font-medium">{stats?.liveClasses?.total || 0}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Scheduled</span><span className="text-white font-medium">{stats?.liveClasses?.scheduled || 0}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Completed</span><span className="text-white font-medium">{stats?.liveClasses?.completed || 0}</span></div>
                  </div>
                  <Link to="/instructor/live-classes" className="flex items-center gap-1 mt-4 pt-3 border-t border-gray-800 text-gray-400 hover:text-white text-xs font-medium transition-colors">
                    Manage Live Classes <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-white/5"><ClipboardList className="w-5 h-5 text-gray-300" /></div>
                    <div>
                      <p className="text-white font-semibold text-sm">Teaching Summary</p>
                      <p className="text-gray-500 text-xs">Your teaching overview</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Courses Created</span><span className="text-white font-medium">{stats?.totalCourses || 0}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Total Reviews</span><span className="text-white font-medium">{stats?.totalReviews || 0}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Videos</span><span className="text-white font-medium">{stats?.videos?.totalVideos || 0}</span></div>
                  </div>
                  <Link to="/instructor/assignments" className="flex items-center gap-1 mt-4 pt-3 border-t border-gray-800 text-gray-400 hover:text-white text-xs font-medium transition-colors">
                    View Assignments <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        );

      case 'quickNav':
        return (
          <div>
            <SectionTitle collapsible collapsed={isCollapsed} onToggle={() => toggleSection(key)}>
              Quick Navigation
            </SectionTitle>
            {!isCollapsed && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} to={item.href} className="group bg-[#111] border border-gray-800 rounded-xl p-4 hover:border-gray-600 hover:bg-[#151515] transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                          <Icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 transition-colors" />
                      </div>
                      <h3 className="text-gray-300 group-hover:text-white text-sm font-medium transition-colors">{item.name}</h3>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Loading State ─────────────────────────────────────────────

  if (loading && !dashboardData) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8 space-y-8">
          <div className="animate-pulse">
            <div className="w-48 h-8 bg-gray-800 rounded mb-2" />
            <div className="w-72 h-4 bg-gray-800 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-5 animate-pulse h-[280px]" />
            ))}
          </div>
        </div>
      </InstructorLayout>
    );
  }

  // ─── Error State ───────────────────────────────────────────────

  if (error && !dashboardData) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="p-4 rounded-full bg-white/5 mb-4">
              <AlertTriangle className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Failed to load dashboard</h2>
            <p className="text-gray-500 mb-6 max-w-md">
              {typeof error === 'string' ? error : 'An unexpected error occurred while loading dashboard data.'}
            </p>
            <button onClick={handleRefresh} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg transition-colors font-medium hover:bg-gray-200">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      </InstructorLayout>
    );
  }

  // ─── Main Render ───────────────────────────────────────────────

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <LayoutDashboard className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
            </div>
            <p className="text-gray-500">
              Welcome back,{' '}
              <span className="text-gray-300 font-medium">
                {profile?.firstName || instructor?.firstName || 'Instructor'}
              </span>
              {profile?.rating > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-gray-500">
                  <Star className="w-3 h-3" /> {profile.rating.toFixed(1)}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Drag-and-Drop Dashboard Sections */}
        <DragDropContext onDragEnd={onDragEnd}>
          <StrictModeDroppable droppableId="dashboard-sections">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-8">
                {sectionOrder.map((sectionKey, index) => (
                  <Draggable key={sectionKey} draggableId={sectionKey} index={index}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} className={`relative group/drag ${snapshot.isDragging ? 'z-50' : ''}`}>
                        <div {...provided.dragHandleProps} className="absolute -left-2 top-1 opacity-0 group-hover/drag:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4 text-gray-700 hover:text-gray-500" />
                        </div>
                        <div className={snapshot.isDragging ? 'bg-[#0f0f0f] rounded-2xl p-4 border border-gray-800 shadow-2xl' : ''}>
                          {renderSection(sectionKey)}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </StrictModeDroppable>
        </DragDropContext>
      </div>
    </InstructorLayout>
  );
}
