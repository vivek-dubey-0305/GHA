/**
 * pages/Account/Reviews.jsx
 */
import { Star } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, EmptyState } from "../../components/DashboardPages/DashboardUI";
import ReviewCard from "../../components/AccountPages/ReviewCard";
import { mockReviews } from "../../mock/dashboard";

export default function Reviews() {
  return (
    <UserLayout>
      <PageShell
        title="My Reviews"
        subtitle="Courses you've reviewed — help future students make great decisions."
      >
        {mockReviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews yet"
            subtitle="Complete a course to leave your first review!"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {mockReviews.map((rev, i) => (
              <ReviewCard key={rev._id} review={rev} delay={i * 0.07} />
            ))}
          </div>
        )}
      </PageShell>
    </UserLayout>
  );
}
