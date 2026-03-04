import { Search, MoreVertical, Star, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, WarningModal, SearchBar } from '../ui';
import {
  deleteInstructor,
  selectDeleteInstructorLoading,
} from '../../redux/slices/instructor.slice.js';


export function ListInstructor({ instructors = [], pagination, onInstructorClick, searchTerm, onSearchChange, onPageChange }) {
  const dispatch = useDispatch();
  const deleteLoading = useSelector(selectDeleteInstructorLoading);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState(null);

  const filteredInstructors = (instructors || []).filter(instructor =>
    (instructor?.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (instructor?.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (instructor?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (e, instructor) => {
    e.stopPropagation();
    setInstructorToDelete(instructor);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (instructorToDelete) {
      try {
        await dispatch(deleteInstructor(instructorToDelete._id)).unwrap();
      } catch (error) {
        console.error('Failed to delete instructor:', error);
      }
    }
    setShowDeleteModal(false);
    setInstructorToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setInstructorToDelete(null);
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Instructors</h1>
        <p className="text-gray-400">Manage instructor accounts and courses</p>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Search by name or email..."
        context="instructors"
      />

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Email</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Courses</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Students</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Rating</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstructors.map((instructor) => (
                <tr
                  key={instructor._id}
                  onClick={() => onInstructorClick(instructor)}
                  className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                        {instructor.profilePicture?.secure_url ? (
                          <img
                            src={instructor.profilePicture.secure_url}
                            alt={`${instructor.firstName} ${instructor.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                            {instructor.firstName?.[0]}{instructor.lastName?.[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{instructor.firstName} {instructor.lastName}</p>
                        <p className="text-xs text-gray-500">{instructor.yearsOfExperience} years exp</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{instructor.email}</td>
                  <td className="px-6 py-4 text-gray-300">{instructor.totalCourses || 0}</td>
                  <td className="px-6 py-4 text-gray-300">{instructor.totalStudentsTeaching || 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-white font-medium">{instructor.rating?.averageRating ?? 0}</span>
                      <span className="text-gray-500 text-sm">({instructor.rating?.totalReviews ?? 0})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={instructor.isActive && !instructor.isSuspended ? "default" : "secondary"}
                      className={instructor.isActive && !instructor.isSuspended ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {instructor.isSuspended ? 'Suspended' : instructor.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      className="text-red-500 hover:text-red-700 transition-colors p-2"
                      onClick={(e) => handleDeleteClick(e, instructor)}
                    >
                      {deleteLoading && instructorToDelete?._id === instructor._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
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
          Showing {filteredInstructors.length} of {pagination?.totalItems ?? (instructors || []).length} instructors
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

      <WarningModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Delete Instructor"
        message={`Are you sure you want to delete ${instructorToDelete?.firstName || ''} ${instructorToDelete?.lastName || ''}? This action cannot be undone and will also remove their profile picture from storage.`}
        confirmText="Delete Instructor"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
