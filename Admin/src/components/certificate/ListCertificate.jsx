import { Search, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, WarningModal } from '../ui';
import {
  deleteCertificate,
  selectDeleteCertificateLoading,
} from '../../redux/slices/certificate.slice.js';


export function ListCertificate({ certificates, pagination, onCertificateClick, onPageChange, searchTerm, onSearchChange }) {
  const dispatch = useDispatch();
  const deleteLoading = useSelector(selectDeleteCertificateLoading);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState(null);

  const filteredCertificates = certificates.filter(cert =>
    (cert._id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (cert.userId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (cert.courseId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (e, certificate) => {
    e.stopPropagation();
    setCertificateToDelete(certificate);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (certificateToDelete) {
      try {
        await dispatch(deleteCertificate(certificateToDelete._id)).unwrap();
      } catch (error) {
        console.error('Failed to delete certificate:', error);
      }
    }
    setShowDeleteModal(false);
    setCertificateToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCertificateToDelete(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'issued':
        return 'bg-green-500/20 text-green-400';
      case 'revoked':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Certificates</h1>
        <p className="text-gray-400">Manage issued certificates and revocations</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by ID, user, or course..."
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
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Certificate ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">User</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Course</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Issued At</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCertificates.map((cert) => (
                <tr
                  key={cert._id}
                  onClick={() => onCertificateClick(cert)}
                  className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-gray-300" title={cert._id}>
                      {cert._id?.substring(0, 10)}...
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-gray-500">{cert.userId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-gray-500">{cert.courseId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="default"
                      className={getStatusColor(cert.status)}
                    >
                      {cert.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="text-gray-400 hover:text-red-400 transition-colors p-2"
                        onClick={(e) => handleDeleteClick(e, cert)}
                        title="Delete certificate"
                      >
                        {deleteLoading && certificateToDelete?._id === cert._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="text-gray-400 hover:text-white transition-colors p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCertificateClick(cert);
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
          Showing {filteredCertificates.length} of {pagination?.totalItems ?? certificates.length} certificates
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
        title="Delete Certificate"
        message={`Are you sure you want to delete certificate "${certificateToDelete?._id || ''}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
