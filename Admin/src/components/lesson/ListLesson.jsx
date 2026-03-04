import { Search, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, WarningModal, SearchBar } from '../ui';
import {
  deleteLesson,
  selectDeleteLessonLoading,
} from '../../redux/slices/lesson.slice.js';


export function ListLesson({ lessons, pagination, onLessonClick, onPageChange, searchTerm, onSearchChange }) {
  const dispatch = useDispatch();
  const deleteLoading = useSelector(selectDeleteLessonLoading);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState(null);

  const filteredLessons = lessons.filter(lesson =>
    (lesson.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (e, lesson) => {
    e.stopPropagation();
    setLessonToDelete(lesson);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (lessonToDelete) {
      try {
        await dispatch(deleteLesson(lessonToDelete._id)).unwrap();
      } catch (error) {
        console.error('Failed to delete lesson:', error);
      }
    }
    setShowDeleteModal(false);
    setLessonToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setLessonToDelete(null);
  };

  const typeBadge = (type) => {
    const styles = {
      video: 'bg-purple-500/20 text-purple-400',
      text: 'bg-blue-500/20 text-blue-400',
      quiz: 'bg-yellow-500/20 text-yellow-400',
      assignment: 'bg-orange-500/20 text-orange-400',
    };
    return styles[type] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Lessons</h1>
        <p className="text-gray-400">Manage lessons and learning content</p>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Search by title..."
        context="lessons"
      />

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Title</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Module</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Type</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Duration</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Order</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.map((lesson) => (
                <tr
                  key={lesson._id}
                  onClick={() => onLessonClick(lesson)}
                  className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{lesson.title}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    <span className="text-xs font-mono text-gray-500">{lesson.moduleId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={typeBadge(lesson.type)}>
                      {lesson.type || 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {lesson.duration != null ? `${lesson.duration} min` : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{lesson.order}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="text-gray-400 hover:text-red-400 transition-colors p-2"
                        onClick={(e) => handleDeleteClick(e, lesson)}
                        title="Delete lesson"
                      >
                        {deleteLoading && lessonToDelete?._id === lesson._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="text-gray-400 hover:text-white transition-colors p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLessonClick(lesson);
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
          Showing {filteredLessons.length} of {pagination?.totalItems ?? lessons.length} lessons
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
        title="Delete Lesson"
        message={`Are you sure you want to delete "${lessonToDelete?.title || ''}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
