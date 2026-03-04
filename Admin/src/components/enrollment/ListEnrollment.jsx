import { Search, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, WarningModal, SearchBar } from '../ui';
import {
  deleteEnrollment,
  selectDeleteEnrollmentLoading,
} from '../../redux/slices/enrollment.slice.js';


const statusColors = {
  active: 'bg-green-500/20 text-green-400',
  completed: 'bg-blue-500/20 text-blue-400',
  cancelled: 'bg-red-500/20 text-red-400',
  suspended: 'bg-yellow-500/20 text-yellow-400',
};

export function ListEnrollment({ enrollments, pagination, onEnrollmentClick, onPageChange, searchTerm, onSearchChange }) {
  const dispatch = useDispatch();
  const deleteLoading = useSelector(selectDeleteEnrollmentLoading);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [enrollmentToDelete, setEnrollmentToDelete] = useState(null);

  const filteredEnrollments = enrollments.filter(enrollment =>
    (enrollment.userId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (enrollment.courseId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (enrollment.status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (e, enrollment) => {
    e.stopPropagation();
    setEnrollmentToDelete(enrollment);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (enrollmentToDelete) {
      try {
        await dispatch(deleteEnrollment(enrollmentToDelete._id)).unwrap();
      } catch (error) {
        console.error('Failed to delete enrollment:', error);
      }
    }
    setShowDeleteModal(false);
    setEnrollmentToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setEnrollmentToDelete(null);
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Enrollments</h1>
        <p className="text-gray-400">Manage student enrollments and course access</p>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Search by user ID, course ID, or status..."
        context="enrollments"
      />

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">User</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Course</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Enrolled At</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Completed At</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnrollments.map((enrollment) => (
                <tr
                  key={enrollment._id}
                  onClick={() => onEnrollmentClick(enrollment)}
                  className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-gray-500">{enrollment.userId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-gray-500">{enrollment.courseId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="default"
                      className={statusColors[enrollment.status] || 'bg-gray-500/20 text-gray-400'}
                    >
                      {enrollment.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {enrollment.enrolledAt
                      ? new Date(enrollment.enrolledAt).toLocaleDateString()
                      : enrollment.createdAt
                        ? new Date(enrollment.createdAt).toLocaleDateString()
                        : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {enrollment.completedAt
                      ? new Date(enrollment.completedAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="text-gray-400 hover:text-red-400 transition-colors p-2"
                        onClick={(e) => handleDeleteClick(e, enrollment)}
                        title="Delete enrollment"
                      >
                        {deleteLoading && enrollmentToDelete?._id === enrollment._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="text-gray-400 hover:text-white transition-colors p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEnrollmentClick(enrollment);
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
          Showing {filteredEnrollments.length} of {pagination?.totalItems ?? enrollments.length} enrollments
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
        title="Delete Enrollment"
        message={`Are you sure you want to delete this enrollment? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
