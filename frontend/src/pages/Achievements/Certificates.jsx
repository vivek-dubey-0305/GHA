/**
 * pages/Achievements/Certificates.jsx
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Award } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, EmptyState } from "../../components/DashboardPages/DashboardUI";
import CertificateCard from "../../components/AchievementPages/CertificateCard";
import { apiClient } from "../../utils/api.utils";
import { getMyEnrollments } from "../../redux/slices/enrollment.slice";

export default function Certificates() {
  const dispatch = useDispatch();
  const { myEnrollments } = useSelector((state) => state.enrollment);

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingForCourse, setGeneratingForCourse] = useState("");

  useEffect(() => {
    dispatch(getMyEnrollments({ page: 1, limit: 100 }));
  }, [dispatch]);

  const loadCertificates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/certificates/my?limit=100");
      setCertificates(res?.data?.data?.certificates || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load certificates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  const cardItems = useMemo(() => {
    const certByCourse = new Map(
      (certificates || []).map((cert) => [String(cert?.course?._id || cert?.course), cert])
    );

    return (myEnrollments || [])
      .filter((enr) => ["active", "completed"].includes(enr?.status))
      .map((enr) => {
        const courseId = String(enr?.course?._id || enr?.course);
        const cert = certByCourse.get(courseId);
        const unlocked = Boolean(cert) || Number(enr?.progressPercentage || 0) >= 100;

        if (cert) {
          return {
            ...cert,
            courseProgress: Number(enr?.progressPercentage || cert?.completionPercentage || 0),
            isLocked: false,
          };
        }

        return {
          _id: `locked-${courseId}`,
          title: `${enr?.course?.title || "Course"} Certificate`,
          course: enr?.course,
          issuedAt: null,
          grade: null,
          skills: [],
          completionPercentage: Number(enr?.progressPercentage || 0),
          certificateId: "LOCKED",
          certificateUrl: "",
          shareableUrl: "",
          verificationCode: "",
          isLocked: !unlocked,
          courseId,
        };
      });
  }, [certificates, myEnrollments]);

  const handleUnlock = useCallback(async (courseId) => {
    if (!courseId) return;
    setGeneratingForCourse(courseId);
    setError("");
    try {
      await apiClient.post("/certificates/generate", { courseId });
      await loadCertificates();
      dispatch(getMyEnrollments({ page: 1, limit: 100 }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to unlock certificate.");
    } finally {
      setGeneratingForCourse("");
    }
  }, [dispatch, loadCertificates]);

  return (
    <UserLayout>
      <PageShell
        title="Certificates"
        subtitle="Download, share, or verify your earned certificates."
      >
        {loading && <p className="text-gray-500 text-sm py-2">Loading certificates...</p>}
        {!loading && error && <p className="text-red-400 text-sm py-2">{error}</p>}

        {!loading && cardItems.length === 0 ? (
          <EmptyState icon={Award} title="No certificates yet" subtitle="Complete a course to earn your first certificate!" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cardItems.map((cert, i) => (
              <CertificateCard
                key={cert._id}
                certificate={cert}
                delay={i * 0.08}
                onUnlock={() => handleUnlock(cert.courseId || cert?.course?._id)}
                unlockLoading={generatingForCourse === String(cert.courseId || cert?.course?._id || "")}
              />
            ))}
          </div>
        )}
      </PageShell>
    </UserLayout>
  );
}
