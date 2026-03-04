import { Search, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { WarningModal, SearchBar } from '../ui';
import {
  deleteAssignment,
  selectDeleteAssignmentLoading,
} from '../../redux/slices/assignment.slice.js';


export function ListAssignment({ assignments, pagination, onAssignmentClick, onPageChange, searchTerm, onSearchChange }) {
  const dispatch = useDispatch();
  const deleteLoading = useSelector(selectDeleteAssignmentLoading);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);

  const filteredAssignments = assignments.filter(assignment =>
    (assignment.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (assignment.courseId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (assignment.instructorId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (e, assignment) => {
    e.stopPropagation();
    setAssignmentToDelete(assignment);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (assignmentToDelete) {
      try {
        await dispatch(deleteAssignment(assignmentToDelete._id)).unwrap();
      } catch (error) {
        console.error('Failed to delete assignment:', error);
      }
    }
    setShowDeleteModal(false);
    setAssignmentToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setAssignmentToDelete(null);
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Assignments</h1>
        <p className="text-gray-400">Manage course assignments and grading</p>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Search by title, course or instructor..."
        context="assignments"
      />

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Title</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Course</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Instructor</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Due Date</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Max Score</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map((assignment) => (
                <tr
                  key={assignment._id}
                  onClick={() => onAssignmentClick(assignment)}
                  className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{assignment.title}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    <span className="text-xs font-mono text-gray-500">{assignment.courseId}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    <span className="text-xs font-mono text-gray-500">{assignment.instructorId}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {assignment.dueDate
                      ? new Date(assignment.dueDate).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{assignment.maxScore ?? '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="text-gray-400 hover:text-red-400 transition-colors p-2"
                        onClick={(e) => handleDeleteClick(e, assignment)}
                        title="Delete assignment"
                      >
                        {deleteLoading && assignmentToDelete?._id === assignment._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="text-gray-400 hover:text-white transition-colors p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAssignmentClick(assignment);
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
          Showing {filteredAssignments.length} of {pagination?.totalItems ?? assignments.length} assignments
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
        title="Delete Assignment"
        message={`Are you sure you want to delete "${assignmentToDelete?.title || ''}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
