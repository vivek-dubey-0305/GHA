import { Search, MoreVertical, Star, Clock, Users } from 'lucide-react';
import { mockCourses } from '../../data/mockCourses';
import { Badge } from '../ui';


export function ListCourse({ courses, onCourseClick, searchTerm, onSearchChange }) {
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Courses</h1>
        <p className="text-gray-400">Manage course content and enrollment</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by title, instructor, or category..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#1a1a1a] text-white border border-gray-800 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-gray-600 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Course</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Instructor</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Category</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Price</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Enrolled</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Rating</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr
                  key={course._id}
                  onClick={() => onCourseClick(course)}
                  className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{course.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {Math.round(course.totalDuration / 60)}h
                        </div>
                        <div className="text-xs text-gray-500">
                          {course.totalModules} modules
                        </div>
                        <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                          {course.level}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{course.instructor.name}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                      {course.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {course.isFree ? (
                      <Badge className="bg-green-500/20 text-green-400">Free</Badge>
                    ) : (
                      <div>
                        {course.discountPrice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">${course.discountPrice}</span>
                            <span className="text-gray-500 line-through text-sm">${course.price}</span>
                          </div>
                        ) : (
                          <span className="text-white font-medium">${course.price}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-300">{course.enrolledCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {course.rating > 0 ? (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-white font-medium">{course.rating}</span>
                        <span className="text-gray-500 text-sm">({course.totalReviews})</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">No ratings</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant={course.isPublished ? "default" : "secondary"} 
                      className={course.isPublished ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}
                    >
                      {course.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      className="text-gray-400 hover:text-white transition-colors p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCourseClick(course);
                      }}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-gray-400">
          Showing {filteredCourses.length} of {courses.length} courses
        </p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg border border-gray-800 hover:bg-gray-900 transition-colors">
            Previous
          </button>
          <button className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg border border-gray-800 hover:bg-gray-900 transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
