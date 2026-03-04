import { Search, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge, WarningModal } from '../ui';


export function ListProgress({ progressRecords, pagination, onEdit, onDelete, onPageChange }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [progressToDelete, setProgressToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = progressRecords.filter(record =>
    (record.user?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (record.user?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (record.course?.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (record.lesson?.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (record.status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (e, record) => {
    e.stopPropagation();
    setProgressToDelete(record);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (progressToDelete) {
      onDelete(progressToDelete._id);
    }
    setShowDeleteModal(false);
    setProgressToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setProgressToDelete(null);
  };

  const getStatusBadge = (status) => {
    const styles = {
      'not-started': 'bg-gray-500/20 text-gray-400',
      'in-progress': 'bg-yellow-500/20 text-yellow-400',
      'completed': 'bg-green-500/20 text-green-400',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-400';
  };

  const formatTimeSpent = (seconds) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Progress Records</h1>
        <p className="text-gray-400">View and manage student progress</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by user, course, lesson or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1a1a1a] text-white border border-gray-800 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-gray-600 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">User</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Course</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Lesson</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Progress %</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Time Spent</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Last Accessed</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr
                  key={record._id}
                  onClick={() => onEdit(record)}
                  className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-white">{record.user?.name || '—'}</p>
                      <p className="text-xs text-gray-500">{record.user?.email || ''}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {record.course?.title || '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {record.lesson?.title || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="default"
                      className={getStatusBadge(record.status)}
                    >
                      {record.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${record.progressPercentage || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-300">{record.progressPercentage || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {formatTimeSpent(record.timeSpent)}
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {record.lastAccessedAt ? new Date(record.lastAccessedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="text-gray-400 hover:text-white transition-colors p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(record);
                        }}
                        title="Edit progress"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="text-gray-400 hover:text-red-400 transition-colors p-2"
                        onClick={(e) => handleDeleteClick(e, record)}
                        title="Delete progress"
                      >
                        <Trash2 className="w-4 h-4" />
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
          Showing {filteredRecords.length} of {pagination?.totalItems ?? progressRecords.length} records
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
        title="Delete Progress"
        message="Are you sure you want to delete this progress record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
