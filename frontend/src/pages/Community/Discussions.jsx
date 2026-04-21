/**
 * pages/Community/Discussions.jsx
 */
import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, EmptyState, SearchBar, YellowButton } from "../../components/DashboardPages/DashboardUI";
import { DiscussionCard } from "../../components/CommunityPages/DiscussionCard";
import DiscussionThread from "../../components/CommunityPages/DiscussionThread";
import NewDiscussionModal from "../../components/CommunityPages/NewDiscussionModal";
import SearchPulseLoader from "../../components/common/SearchPulseLoader";
import { ErrorToast, SuccessToast } from "../../components/ui";
import { getMyEnrollments } from "../../redux/slices/enrollment.slice";
import {
  addDiscussionReply,
  clearDiscussionStatus,
  clearSelectedDiscussion,
  createNewDiscussion,
  fetchCourseDiscussions,
  fetchDiscussionById,
  selectDiscussionState,
} from "../../redux/slices/discussion.slice";

export default function Discussions() {
  const dispatch = useDispatch();
  const { myEnrollments } = useSelector((state) => state.enrollment);
  const {
    discussions,
    selectedDiscussion,
    listLoading,
    listError,
    createLoading,
    replyLoading,
    createError,
    replyError,
  } = useSelector(selectDiscussionState);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [newDiscussionOpen, setNewDiscussionOpen] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "", visible: false });

  const enrolledCourses = useMemo(
    () =>
      (myEnrollments || [])
        .map((enrollment) => enrollment.course)
        .filter((course) => course && course._id),
    [myEnrollments]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    dispatch(getMyEnrollments({ page: 1, limit: 100 }));
    return () => {
      dispatch(clearDiscussionStatus());
      dispatch(clearSelectedDiscussion());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!selectedCourseId && enrolledCourses.length) {
      setSelectedCourseId(enrolledCourses[0]._id);
    }
  }, [selectedCourseId, enrolledCourses]);

  useEffect(() => {
    if (selectedCourseId) {
      dispatch(fetchCourseDiscussions({ courseId: selectedCourseId, search: debouncedQuery }));
    }
  }, [selectedCourseId, debouncedQuery, dispatch]);

  const handleOpenDiscussion = async (discussionId) => {
    const result = await dispatch(fetchDiscussionById(discussionId));
    if (fetchDiscussionById.rejected.match(result)) {
      setToast({ type: "error", message: result.payload || "Failed to load discussion thread.", visible: true });
    }
  };

  const handleCreateDiscussion = async (payload) => {
    const result = await dispatch(createNewDiscussion(payload));
    if (createNewDiscussion.fulfilled.match(result)) {
      setToast({ type: "success", message: "Discussion posted successfully.", visible: true });
      if (selectedCourseId) {
        dispatch(fetchCourseDiscussions({ courseId: selectedCourseId, search: debouncedQuery }));
      }
      return true;
    }

    setToast({ type: "error", message: result.payload || createError || "Failed to create discussion.", visible: true });
    return false;
  };

  const handleReply = async (content) => {
    if (!selectedDiscussion?._id) return false;
    const result = await dispatch(addDiscussionReply({ discussionId: selectedDiscussion._id, content }));
    if (addDiscussionReply.fulfilled.match(result)) {
      await dispatch(fetchDiscussionById(selectedDiscussion._id));
      await dispatch(fetchCourseDiscussions({ courseId: selectedCourseId, search: debouncedQuery }));
      setToast({ type: "success", message: "Reply added.", visible: true });
      return true;
    }

    setToast({ type: "error", message: result.payload || replyError || "Failed to add reply.", visible: true });
    return false;
  };

  return (
    <UserLayout>
      <PageShell
        title="Discussions & Q&A"
        subtitle="Ask questions, get answers from instructors and peers."
        actions={
          <YellowButton onClick={() => setNewDiscussionOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Discussion
          </YellowButton>
        }
      >
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <SearchBar value={query} onChange={setQuery} placeholder="Search discussions..." />
          <select
            value={selectedCourseId}
            onChange={(event) => setSelectedCourseId(event.target.value)}
            className="w-full sm:w-72 px-3 py-2 bg-[#111] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-yellow-400/50"
          >
            {enrolledCourses.length === 0 && <option value="">No enrolled courses</option>}
            {enrolledCourses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        {!selectedCourseId ? (
          <EmptyState icon={MessageSquare} title="No course selected" subtitle="Enroll in a course to start discussions." />
        ) : listLoading ? (
          <SearchPulseLoader
            label="Scanning discussions"
            sublabel="Matching threads are being fetched"
            className="my-2"
          />
        ) : listError ? (
          <div className="p-4 rounded-xl border border-red-400/20 bg-red-500/10 text-sm text-red-300">{listError}</div>
        ) : discussions.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No discussions found" subtitle="Be the first to start a conversation!" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {discussions.map((disc, i) => (
              <DiscussionCard
                key={disc._id}
                discussion={disc}
                delay={i * 0.05}
                onClick={() => handleOpenDiscussion(disc._id)}
              />
            ))}
          </div>
        )}
      </PageShell>

      <DiscussionThread
        discussion={selectedDiscussion}
        onClose={() => dispatch(clearSelectedDiscussion())}
        onReply={handleReply}
        replyLoading={replyLoading}
      />

      <NewDiscussionModal
        isOpen={newDiscussionOpen}
        onClose={() => setNewDiscussionOpen(false)}
        courses={enrolledCourses}
        createLoading={createLoading}
        onCreate={handleCreateDiscussion}
      />

      <SuccessToast
        isVisible={toast.visible && toast.type === "success"}
        onDismiss={() => setToast({ type: "", message: "", visible: false })}
        title="Success"
        message={toast.message}
      />
      <ErrorToast
        isVisible={toast.visible && toast.type === "error"}
        onDismiss={() => setToast({ type: "", message: "", visible: false })}
        title="Error"
        message={toast.message}
      />
    </UserLayout>
  );
}
