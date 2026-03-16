/**
 * pages/Achievements/Certificates.jsx
 */
import { Award } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, EmptyState } from "../../components/DashboardPages/DashboardUI";
import CertificateCard from "../../components/AchievementPages/CertificateCard";
import { mockCertificates } from "../../mock/dashboard";

export default function Certificates() {
  return (
    <UserLayout>
      <PageShell
        title="Certificates"
        subtitle="Download, share, or verify your earned certificates."
      >
        {mockCertificates.length === 0 ? (
          <EmptyState icon={Award} title="No certificates yet" subtitle="Complete a course to earn your first certificate!" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {mockCertificates.map((cert, i) => (
              <CertificateCard key={cert._id} certificate={cert} delay={i * 0.08} />
            ))}
          </div>
        )}
      </PageShell>
    </UserLayout>
  );
}
