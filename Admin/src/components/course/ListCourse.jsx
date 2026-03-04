import { Search, MoreVertical, Star, Clock, Users, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, WarningModal, SearchBar } from '../ui';
import {
  deleteCourse,
  selectDeleteCourseLoading,
} from '../../redux/slices/course.slice.js';


export function ListCourse({ courses, pagination, onCourseClick, onPageChange, searchTerm, onSearchChange }) {
  const dispatch = useDispatch();
  const deleteLoading = useSelector(selectDeleteCourseLoading);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const filteredCourses = courses.filter(course =>
    (course.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (course.instructor?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (course.category?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (e, course) => {
    e.stopPropagation();
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (courseToDelete) {
      try {
        await dispatch(deleteCourse(courseToDelete._id)).unwrap();
      } catch (error) {
        console.error('Failed to delete course:', error);
      }
    }
    setShowDeleteModal(false);
    setCourseToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCourseToDelete(null);
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Courses</h1>
        <p className="text-gray-400">Manage course content and enrollment</p>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Search by title, instructor, or category..."
        context="courses"
      />

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
                          {Math.round((course.totalDuration || 0) / 60)}h
                        </div>
                        <div className="text-xs text-gray-500">
                          {course.totalModules || 0} modules
                        </div>
                        <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                          {course.level}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{course.instructor?.name || 'N/A'}</td>
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
                      <span className="text-gray-300">{course.enrolledCount ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(course.rating ?? 0) > 0 ? (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-white font-medium">{course.rating}</span>
                        <span className="text-gray-500 text-sm">({course.totalReviews ?? 0})</span>
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
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="text-gray-400 hover:text-red-400 transition-colors p-2"
                        onClick={(e) => handleDeleteClick(e, course)}
                        title="Delete course"
                      >
                        {deleteLoading && courseToDelete?._id === course._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="text-gray-400 hover:text-white transition-colors p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCourseClick(course);
                        }}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
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
          Showing {filteredCourses.length} of {pagination?.totalItems ?? courses.length} courses
          {pagination?.totalPages > 1 && (
            <span> &mdash; Page {pagination.currentPage} of {pagination.totalPages}</span>
          )}
        </p>
        <div className="flex gap-2">
          <button
            disabled={!pagination?.hasPrevPage}
            onClick={() => onPageChange && onPageChange(pagination.currentPage - 1)}
            className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg border border-gray-800 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            disabled={!pagination?.hasNextPage}
            onClick={() => onPageChange && onPageChange(pagination.currentPage + 1)}
            className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg border border-gray-800 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Delete Warning Modal */}
      <WarningModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Delete Course"
        message={`Are you sure you want to delete "${courseToDelete?.title || ''}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
