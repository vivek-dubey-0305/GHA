import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Upload, X, Loader2, Trash2 } from "lucide-react";
import { validateProfileImageFile } from "../../utils/accountValidation.utils";

export default function ProfileImageModal({
  isOpen,
  imageUrl,
  onClose,
  onUpload,
  onDelete,
  imageLoading,
  onError,
}) {
  const [localPreview, setLocalPreview] = useState("");

  if (!isOpen) return null;

  const preview = localPreview || imageUrl || "";

  const handlePickFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateProfileImageFile(file);
    if (!validation.valid) {
      onError?.(validation.message);
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setLocalPreview(localUrl);
    onUpload(file);
  };

  const handleClose = () => {
    setLocalPreview("");
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            handleClose();
          }
        }}
      >
        <motion.div
          className="w-full max-w-3xl bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h3 className="text-white font-semibold">Profile Image</h3>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4">
            <div className="relative bg-black border border-gray-800 rounded-xl overflow-hidden min-h-60 flex items-center justify-center">
              {preview ? (
                <img src={preview} alt="Profile preview" className="max-h-105 w-auto object-contain" />
              ) : (
                <p className="text-sm text-gray-500">No profile image available.</p>
              )}

              {imageLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-black text-sm font-semibold cursor-pointer hover:bg-yellow-300 transition-colors">
                <Upload className="w-4 h-4" />
                Upload New
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePickFile}
                  disabled={imageLoading}
                />
              </label>

              <button
                type="button"
                onClick={onDelete}
                disabled={imageLoading || !imageUrl}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-400/30 text-red-400 text-sm font-medium hover:bg-red-400/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove Image
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
