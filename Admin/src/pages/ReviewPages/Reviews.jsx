import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ListReview } from '../../components/review/ListReview';
import { EditReview } from '../../components/review/EditReview';
import { useToast } from '../../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllReviews,
  selectReviews,
  selectReviewsLoading,
  selectReviewsError,
  selectReviewPagination,
  selectUpdateReviewSuccess,
  selectDeleteReviewSuccess,
  resetUpdateReviewState,
  resetDeleteReviewState,
} from '../../redux/slices/review.slice.js';

export default function Reviews() {
  const dispatch = useDispatch();
  const reviews = useSelector(selectReviews);
  const reviewsLoading = useSelector(selectReviewsLoading);
  const reviewsError = useSelector(selectReviewsError);
  const pagination = useSelector(selectReviewPagination);
  const updateReviewSuccess = useSelector(selectUpdateReviewSuccess);
  const deleteReviewSuccess = useSelector(selectDeleteReviewSuccess);
  const [selectedReview, setSelectedReview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllReviews({ page: currentPage }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (updateReviewSuccess) {
      toast.success('Review updated successfully!');
      dispatch(resetUpdateReviewState());
      dispatch(getAllReviews({ page: currentPage }));
    }
  }, [updateReviewSuccess, toast, dispatch, currentPage]);

  useEffect(() => {
    if (deleteReviewSuccess) {
      toast.success('Review deleted successfully!');
      dispatch(resetDeleteReviewState());
      dispatch(getAllReviews({ page: currentPage }));
    }
  }, [deleteReviewSuccess, toast, dispatch, currentPage]);

  const handleReviewClick = (review) => {
    setSelectedReview(review);
  };

  const handleCloseRightSidebar = () => {
    setSelectedReview(null);
  };

  const handleSaveReview = (updatedReview) => {
    handleCloseRightSidebar();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <AdminLayout>
      <div className="flex h-full relative">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <ListReview
            reviews={reviews}
            pagination={pagination}
            onReviewClick={handleReviewClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Overlay Backdrop */}
        {selectedReview && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleCloseRightSidebar}
            aria-label="Close sidebar"
          />
        )}

        {/* Right Sidebar Overlay */}
        {selectedReview && (
          <div className="fixed inset-y-0 right-0 z-50 w-[500px] overflow-y-auto overflow-x-hidden
               bg-[#1a1a1a]
               overscroll-contain">
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              <EditReview
                review={selectedReview}
                onClose={handleCloseRightSidebar}
                onSave={handleSaveReview}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
