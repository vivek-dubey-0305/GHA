/**
 * pages/Account/Reviews.jsx
 */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Star } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, EmptyState } from "../../components/DashboardPages/DashboardUI";
import SearchPulseLoader from "../../components/common/SearchPulseLoader";
import ReviewCard from "../../components/AccountPages/ReviewCard";
import ReviewEditorModal from "../../components/common/ReviewEditorModal.jsx";
import { getMyEnrollments } from "../../redux/slices/enrollment.slice.js";
import {
  getMyReviews,
  updateCourseReview,
} from "../../redux/slices/course.slice.js";

export default function Reviews() {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState(null);
  const [pageError, setPageError] = useState("");

  const {
    myReviews,
    loadingMyReviews,
    myReviewsError,
    reviewActionLoading,
    reviewActionError,
  } = useSelector((state) => state.course);

  useEffect(() => {
    dispatch(getMyReviews({ page: 1, limit: 50 }));
  }, [dispatch]);

  const handleEdit = (review) => {
    setPageError("");
    setActiveReview(review);
    setIsModalOpen(true);
  };

  const handleSubmit = async ({ rating, comment }) => {
    if (!activeReview?._id) return;

    try {
      setPageError("");
      await dispatch(updateCourseReview({
        reviewId: activeReview._id,
        rating,
        comment,
      })).unwrap();

      await Promise.all([
        dispatch(getMyReviews({ page: 1, limit: 50 })),
        dispatch(getMyEnrollments({ page: 1, limit: 100 })),
      ]);

      setIsModalOpen(false);
    } catch (error) {
      setPageError(error || "Unable to update review right now.");
    }
  };

  return (
    <UserLayout>
      <PageShell
        title="My Reviews"
        subtitle="Courses you've reviewed — help future students make great decisions."
      >
        {loadingMyReviews ? (
          <SearchPulseLoader
            label="Loading your reviews"
            sublabel="Bringing back your published feedback"
            className="my-4"
          />
        ) : myReviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews yet"
            subtitle="Complete a course to leave your first review!"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {myReviews.map((rev, i) => (
              <ReviewCard key={rev._id} review={rev} delay={i * 0.07} onEdit={handleEdit} />
            ))}
          </div>
        )}

        {(pageError || myReviewsError || reviewActionError) && (
          <p className="text-red-400 text-xs mt-3">{pageError || myReviewsError || reviewActionError}</p>
        )}

        <ReviewEditorModal
          key={`${activeReview?._id || "review"}-${activeReview?.course?._id || "course"}`}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          courseTitle={activeReview?.course?.title}
          initialReview={activeReview}
          onSubmit={handleSubmit}
          isSubmitting={reviewActionLoading}
          submitError={pageError || reviewActionError}
        />
      </PageShell>
    </UserLayout>
  );
}
