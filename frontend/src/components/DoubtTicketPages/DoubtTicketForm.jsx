import { useMemo, useState } from "react";
import { Upload, X } from "lucide-react";
import { YellowButton } from "../DashboardPages/DashboardUI";
import { validateDoubtAttachments } from "../../utils/doubtTicket.utils";

export default function DoubtTicketForm({ onSubmit, enrolledCourses = [], disabled = false, loading = false }) {
  const [form, setForm] = useState({
    courseId: "",
    title: "",
    description: "",
    notes: "",
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);

  const hasCourses = enrolledCourses.length > 0;
  const formLocked = disabled || loading || !hasCourses;
  const activeCourseId = hasCourses && enrolledCourses.some((course) => course.id === form.courseId)
    ? form.courseId
    : (enrolledCourses[0]?.id || "");

  const selectedCourse = useMemo(
    () => enrolledCourses.find((course) => course.id === activeCourseId),
    [enrolledCourses, activeCourseId]
  );

  const onPickFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    const { validFiles, errors: fileErrors } = await validateDoubtAttachments(selected);
    setFiles(validFiles);
    setErrors(fileErrors);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (event) => {
    event.preventDefault();
    setErrors([]);

    if (!activeCourseId || !form.title.trim() || !form.description.trim()) {
      setErrors(["Course, title and description are required"]);
      return;
    }

    await onSubmit?.({ ...form, courseId: activeCourseId, files });

    setForm((prev) => ({
      ...prev,
      title: "",
      description: "",
      notes: "",
    }));
    setFiles([]);
  };

  return (
    <form onSubmit={submit} className="space-y-3 bg-[#111] border border-gray-800 rounded-xl p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          value={activeCourseId}
          onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}
          className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white"
          disabled={formLocked}
        >
          {enrolledCourses.length === 0 ? (
            <option value="">No active enrollments found</option>
          ) : (
            enrolledCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))
          )}
        </select>
        <input
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="Ticket title"
          className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white"
          disabled={formLocked}
        />
      </div>

      {selectedCourse ? (
        <p className="text-[11px] text-gray-500 -mt-1 px-0.5">
          Selected course: {selectedCourse.title}
        </p>
      ) : null}

      <textarea
        value={form.description}
        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        placeholder="Describe your doubt"
        rows={4}
        className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white resize-none"
        disabled={formLocked}
      />

      <textarea
        value={form.notes}
        onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
        placeholder="Additional notes (optional)"
        rows={2}
        className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white resize-none"
        disabled={formLocked}
      />

      <label className="flex items-center gap-2 text-xs text-gray-400 border border-dashed border-gray-700 rounded-lg px-3 py-3 cursor-pointer hover:border-gray-500 transition-colors">
        <Upload className="w-4 h-4" />
        Attach images/videos (video max 2 minutes)
        <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={onPickFiles} disabled={formLocked} />
      </label>

      {!hasCourses && (
        <p className="text-xs text-yellow-400">
          You need at least one active enrolled course to create a doubt ticket.
        </p>
      )}

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between text-xs text-gray-300 bg-[#0a0a0a] rounded-md px-2 py-1.5">
              <span className="truncate pr-3">{file.name}</span>
              <button type="button" onClick={() => removeFile(index)} className="text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error) => (
            <p key={error} className="text-red-400 text-xs">{error}</p>
          ))}
        </div>
      )}

      <YellowButton type="submit" disabled={formLocked} className="w-full justify-center">
        {loading ? "Submitting..." : "Submit Doubt Ticket"}
      </YellowButton>
    </form>
  );
}
