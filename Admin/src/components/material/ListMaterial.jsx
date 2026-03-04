import { Search, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, WarningModal, SearchBar } from '../ui';
import {
  deleteMaterial,
  selectDeleteMaterialLoading,
} from '../../redux/slices/material.slice.js';


export function ListMaterial({ materials, pagination, onMaterialClick, onPageChange, searchTerm, onSearchChange }) {
  const dispatch = useDispatch();
  const deleteLoading = useSelector(selectDeleteMaterialLoading);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);

  const filteredMaterials = materials.filter(m =>
    (m.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (e, material) => {
    e.stopPropagation();
    setMaterialToDelete(material);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (materialToDelete) {
      try {
        await dispatch(deleteMaterial(materialToDelete._id)).unwrap();
      } catch (error) {
        console.error('Failed to delete material:', error);
      }
    }
    setShowDeleteModal(false);
    setMaterialToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setMaterialToDelete(null);
  };

  const typeBadge = (type) => {
    const map = {
      pdf: 'bg-red-500/20 text-red-400',
      video: 'bg-blue-500/20 text-blue-400',
      document: 'bg-green-500/20 text-green-400',
      link: 'bg-purple-500/20 text-purple-400',
    };
    return map[type] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Materials</h1>
        <p className="text-gray-400">Manage course materials and resources</p>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Search by title..."
        context="materials"
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
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Type</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">File URL</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((material) => (
                <tr
                  key={material._id}
                  onClick={() => onMaterialClick(material)}
                  className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{material.title}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    <span className="text-xs font-mono text-gray-500">{material.courseId}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    <span className="text-xs font-mono text-gray-500">{material.instructorId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="default"
                      className={typeBadge(material.type)}
                    >
                      {material.type || 'unknown'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {material.fileUrl ? (
                      <a
                        href={material.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-400 hover:text-blue-300 text-sm truncate block max-w-[200px]"
                        title={material.fileUrl}
                      >
                        {material.fileUrl.length > 40
                          ? `${material.fileUrl.substring(0, 40)}...`
                          : material.fileUrl}
                      </a>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="text-gray-400 hover:text-red-400 transition-colors p-2"
                        onClick={(e) => handleDeleteClick(e, material)}
                        title="Delete material"
                      >
                        {deleteLoading && materialToDelete?._id === material._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="text-gray-400 hover:text-white transition-colors p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMaterialClick(material);
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
          Showing {filteredMaterials.length} of {pagination?.totalItems ?? materials.length} materials
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
        title="Delete Material"
        message={`Are you sure you want to delete "${materialToDelete?.title || ''}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
