import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import BaseModal from "../ui/modals/BaseModal";

export default function ReviewEditorModal({
  isOpen,
  onClose,
  courseTitle,
  initialReview,
  initialSelectedRating,
  onSubmit,
  isSubmitting = false,
  submitError,
}) {
  const isEditMode = Boolean(initialReview?._id);
  const minAllowedRating = useMemo(() => {
    if (!isEditMode) return 1;
    return Number(initialReview?.rating || 1);
  }, [initialReview?.rating, isEditMode]);

  const [rating, setRating] = useState(
    isEditMode
      ? Number(initialReview?.rating || 1)
      : Number(initialSelectedRating || 5)
  );
  const [comment, setComment] = useState(isEditMode ? (initialReview?.comment || "") : "");
  const [localError, setLocalError] = useState("");

  const handleStarClick = (value) => {
    if (isEditMode && value < minAllowedRating) return;
    setRating(value);
    setLocalError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = comment.trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setLocalError("Please choose a rating between 1 and 5.");
      return;
    }

    if (isEditMode && rating < minAllowedRating) {
      setLocalError(`You can only keep or increase your previous rating (${minAllowedRating}).`);
      return;
    }

    if (trimmed.length < 10) {
      setLocalError("Comment must be at least 10 characters.");
      return;
    }

    await onSubmit({ rating, comment: trimmed });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Review" : "Write A Review"}
      size="lg"
      className="border-yellow-400/40 bg-[#0f0f0f]"
      contentClassName="bg-[#0f0f0f]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-white">
        <div>
          <p className="text-xs text-gray-400">Course</p>
          <p className="text-sm font-semibold text-yellow-300">{courseTitle || "Selected course"}</p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-2">Your rating</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              const isFilled = value <= rating;
              const isLocked = isEditMode && value < minAllowedRating;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleStarClick(value)}
                  className={`p-1 rounded transition-colors ${isLocked ? "cursor-not-allowed opacity-50" : "hover:bg-white/10"}`}
                  disabled={isSubmitting}
                  title={isLocked ? `Minimum allowed rating is ${minAllowedRating}` : `Rate ${value}`}
                >
                  <Star className={`w-6 h-6 ${isFilled ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} />
                </button>
              );
            })}
            <span className="ml-2 text-sm text-gray-300">{rating}/5</span>
          </div>
          {isEditMode && (
            <p className="text-[11px] text-gray-500 mt-1">
              You can only keep or increase your previous rating ({minAllowedRating}/5).
            </p>
          )}
        </div>

        <div>
          <label htmlFor="review-comment" className="text-xs text-gray-400 block mb-2">
            Comment
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={5}
            className="w-full rounded-xl bg-[#171717] border border-gray-700 text-sm text-white px-3 py-2 focus:outline-none focus:border-yellow-400/60"
            placeholder="Share your honest learning experience..."
            disabled={isSubmitting}
          />
          <p className="text-[11px] text-gray-500 mt-1">Minimum 10 characters.</p>
        </div>

        {(localError || submitError) && (
          <p className="text-xs text-red-400">{localError || submitError}</p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-600 text-xs text-gray-300 hover:border-gray-400"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-yellow-400 text-black text-xs font-semibold hover:bg-yellow-300 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : isEditMode ? "Update Review" : "Submit Review"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
