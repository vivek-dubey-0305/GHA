import { Search, MoreVertical, Trash2, Loader2, Star } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { WarningModal, SearchBar } from '../ui';
import {
  deleteReview,
  selectDeleteReviewLoading,
} from '../../redux/slices/review.slice.js';


export function ListReview({ reviews, pagination, onReviewClick, onPageChange, searchTerm, onSearchChange }) {
  const dispatch = useDispatch();
  const deleteLoading = useSelector(selectDeleteReviewLoading);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  const filteredReviews = reviews.filter(review =>
    (review.userId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (review.courseId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (review.comment?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (e, review) => {
    e.stopPropagation();
    setReviewToDelete(review);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (reviewToDelete) {
      try {
        await dispatch(deleteReview(reviewToDelete._id)).unwrap();
      } catch (error) {
        console.error('Failed to delete review:', error);
      }
    }
    setShowDeleteModal(false);
    setReviewToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setReviewToDelete(null);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
      />
    ));
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Reviews</h1>
        <p className="text-gray-400">Manage course reviews and ratings</p>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Search by user, course or comment..."
        context="reviews"
      />

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">User</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Course</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Rating</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Comment</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Date</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr
                  key={review._id}
                  onClick={() => onReviewClick(review)}
                  className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-gray-300">{review.userId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-gray-500">{review.courseId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-0.5">
                      {renderStars(review.rating)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    <span title={review.comment}>
                      {review.comment?.length > 50
                        ? `${review.comment.substring(0, 50)}...`
                        : review.comment}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="text-gray-400 hover:text-red-400 transition-colors p-2"
                        onClick={(e) => handleDeleteClick(e, review)}
                        title="Delete review"
                      >
                        {deleteLoading && reviewToDelete?._id === review._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="text-gray-400 hover:text-white transition-colors p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReviewClick(review);
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
          Showing {filteredReviews.length} of {pagination?.totalItems ?? reviews.length} reviews
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
        title="Delete Review"
        message={`Are you sure you want to delete this review? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
