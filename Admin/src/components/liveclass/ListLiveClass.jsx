import { Search, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, WarningModal } from '../ui';
import {
  deleteLiveClass,
  selectDeleteLiveClassLoading,
} from '../../redux/slices/liveclass.slice.js';


export function ListLiveClass({ liveClasses, pagination, onLiveClassClick, onPageChange, searchTerm, onSearchChange }) {
  const dispatch = useDispatch();
  const deleteLoading = useSelector(selectDeleteLiveClassLoading);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [liveClassToDelete, setLiveClassToDelete] = useState(null);

  const filteredLiveClasses = liveClasses.filter(lc =>
    (lc.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (e, liveClass) => {
    e.stopPropagation();
    setLiveClassToDelete(liveClass);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (liveClassToDelete) {
      try {
        await dispatch(deleteLiveClass(liveClassToDelete._id)).unwrap();
      } catch (error) {
        console.error('Failed to delete live class:', error);
      }
    }
    setShowDeleteModal(false);
    setLiveClassToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setLiveClassToDelete(null);
  };

  const statusBadge = (status) => {
    const map = {
      scheduled: 'bg-blue-500/20 text-blue-400',
      live: 'bg-green-500/20 text-green-400',
      completed: 'bg-gray-500/20 text-gray-400',
      cancelled: 'bg-red-500/20 text-red-400',
    };
    return map[status] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Live Classes</h1>
        <p className="text-gray-400">Manage scheduled live classes and sessions</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by title..."
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
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Title</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Course</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Instructor</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Scheduled At</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Duration</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLiveClasses.map((lc) => (
                <tr
                  key={lc._id}
                  onClick={() => onLiveClassClick(lc)}
                  className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{lc.title}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    <span className="text-xs font-mono text-gray-500">{lc.courseId}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    <span className="text-xs font-mono text-gray-500">{lc.instructorId}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {lc.scheduledAt ? new Date(lc.scheduledAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {lc.duration ? `${lc.duration} mins` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="default"
                      className={statusBadge(lc.status)}
                    >
                      {lc.status || 'unknown'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="text-gray-400 hover:text-red-400 transition-colors p-2"
                        onClick={(e) => handleDeleteClick(e, lc)}
                        title="Delete live class"
                      >
                        {deleteLoading && liveClassToDelete?._id === lc._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="text-gray-400 hover:text-white transition-colors p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLiveClassClick(lc);
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
          Showing {filteredLiveClasses.length} of {pagination?.totalItems ?? liveClasses.length} live classes
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
        title="Delete Live Class"
        message={`Are you sure you want to delete "${liveClassToDelete?.title || ''}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
