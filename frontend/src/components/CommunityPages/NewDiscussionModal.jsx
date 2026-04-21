import { useMemo, useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import { BaseModal } from "../ui";
import { YellowButton } from "../DashboardPages/DashboardUI";

export default function NewDiscussionModal({
  isOpen,
  onClose,
  courses,
  createLoading,
  onCreate,
}) {
  const [form, setForm] = useState({
    course: "",
    title: "",
    content: "",
    tags: "",
  });

  const courseOptions = useMemo(() => courses || [], [courses]);

  const resetForm = () => {
    setForm({ course: "", title: "", content: "", tags: "" });
  };

  const handleSubmit = async () => {
    const tags = form.tags
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const ok = await onCreate({
      course: form.course,
      title: form.title.trim(),
      content: form.content.trim(),
      tags,
    });

    if (ok) {
      resetForm();
      onClose();
    }
  };

  const canSubmit = Boolean(form.course && form.title.trim() && form.content.trim());
  const inputCls = "w-full px-4 py-3 bg-black/40 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-colors";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Discussion"
      size="lg"
      className="bg-[#0f0f0f]! border-gray-800!"
      contentClassName="!bg-[#0f0f0f]"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 font-medium mb-1.5">Course</label>
          <select
            value={form.course}
            onChange={(event) => setForm((prev) => ({ ...prev, course: event.target.value }))}
            className={inputCls}
          >
            <option value="">Select course</option>
            {courseOptions.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 font-medium mb-1.5">Title</label>
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="What do you need help with?"
            className={inputCls}
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 font-medium mb-1.5">Question Details</label>
          <textarea
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            placeholder="Describe your issue clearly so mentors and peers can help quickly."
            className={`${inputCls} resize-none`}
            rows={5}
            maxLength={5000}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 font-medium mb-1.5">Tags (optional)</label>
          <input
            value={form.tags}
            onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
            placeholder="react, auth, mongodb"
            className={inputCls}
          />
        </div>

        <div className="flex justify-end">
          <YellowButton
            onClick={handleSubmit}
            disabled={createLoading || !canSubmit}
            className="inline-flex items-center gap-2"
          >
            {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            Post Discussion
          </YellowButton>
        </div>
      </div>
    </BaseModal>
  );
}
