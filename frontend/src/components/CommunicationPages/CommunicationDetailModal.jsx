import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, CalendarClock, Link as LinkIcon } from "lucide-react";
import { formatDateTime } from "../../utils/format.utils";
import { NOTIFICATION_TYPES } from "../../constants/dashboard.constants";

function MetaRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 text-xs py-1.5 border-b border-gray-800/70 last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200 wrap-break-word">{String(value)}</span>
    </div>
  );
}

function LiveClassDetails({ data = {} }) {
  const liveClassDate = data.liveClassDate || data.scheduledAt || data.startTime;
  const joinUrl = data.joinUrl || data.liveClassLink || data.actionUrl;
  const notes = data.notes || data.note;

  if (!liveClassDate && !joinUrl && !notes) return null;

  return (
    <div className="mt-4 rounded-xl border border-blue-400/20 bg-blue-400/5 p-3">
      <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">Live Class Details</p>
      {liveClassDate && (
        <div className="flex items-center gap-2 text-sm text-gray-200">
          <CalendarClock className="w-4 h-4 text-blue-300" />
          <span>{formatDateTime(liveClassDate)}</span>
        </div>
      )}
      {notes && <p className="mt-2 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{notes}</p>}
      {joinUrl && (
        <a
          href={joinUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-blue-200"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Join Live Class
        </a>
      )}
    </div>
  );
}

function extractLinks(data = {}) {
  const links = [];
  const candidates = [
    data.meetingLink,
    data.joinUrl,
    data.liveClassLink,
    data.resourceLink,
    data.referenceLink,
    data.actionUrl,
  ];

  candidates.forEach((value) => {
    if (typeof value === "string" && value.trim()) {
      links.push(value.trim());
    }
  });

  if (Array.isArray(data.links)) {
    data.links.forEach((item) => {
      if (typeof item === "string" && item.trim()) links.push(item.trim());
      if (item && typeof item === "object" && typeof item.url === "string" && item.url.trim()) {
        links.push(item.url.trim());
      }
    });
  }

  return [...new Set(links)];
}

function findProgressLabel(data = {}) {
  const done = data.completedCount ?? data.doneCount ?? data.currentCount;
  const total = data.totalCount ?? data.totalLessons ?? data.totalModules;
  const percent = data.progressPercent ?? data.percent;

  if (done !== undefined && total !== undefined) {
    return `${done}/${total}`;
  }

  if (percent !== undefined) {
    return `${percent}%`;
  }

  return "";
}

function findGradeLabel(data = {}) {
  if (data.grade) return String(data.grade);

  if (data.score !== undefined && data.maxMarks !== undefined) {
    return `${data.score}/${data.maxMarks}`;
  }

  if (data.score !== undefined && data.totalMarks !== undefined) {
    return `${data.score}/${data.totalMarks}`;
  }

  return "";
}

export default function CommunicationDetailModal({ open, item, mode = "notification", onClose }) {
  if (!open || !item) return null;

  const isNotification = mode === "notification";
  const type = item.type || "general";
  const cfg = NOTIFICATION_TYPES[type] ?? NOTIFICATION_TYPES.general;
  const data = item.data || {};
  const notes = data.notes || data.note || data.comment || "";
  const links = extractLinks(data);
  const progress = findProgressLabel(data);
  const grade = findGradeLabel(data);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-100 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-2xl border border-gray-800 bg-[#0f0f0f]"
        >
          <div className="px-5 py-4 border-b border-gray-800 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">
                {isNotification ? "Notification" : "Announcement"}
              </p>
              <h3 className="text-white text-lg font-semibold mt-0.5 leading-snug">{item.title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-4 overflow-y-auto max-h-[70vh]">
            <div className="flex items-center gap-2 mb-3">
              {isNotification && (
                <span className="text-xl leading-none" aria-hidden>{cfg.icon}</span>
              )}
              <span className="text-[11px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                {isNotification ? cfg.label : (item.type || "general")}
              </span>
              <span className="text-xs text-gray-500">{formatDateTime(item.createdAt)}</span>
            </div>

            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
              {isNotification ? item.message : item.content}
            </p>

            {isNotification && /live_class/.test(type) && <LiveClassDetails data={data} />}

            {(notes || links.length || progress || grade) && (
              <div className="mt-5 border border-gray-800 rounded-xl px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Additional Details</p>
                {notes && <MetaRow label="Notes" value={notes} />}
                {grade && <MetaRow label="Grade" value={grade} />}
                {progress && <MetaRow label="Progress" value={progress} />}
                {links.length > 0 && (
                  <div className="py-1.5">
                    <p className="text-xs text-gray-500 mb-1.5">Links</p>
                    <div className="flex flex-wrap gap-2">
                      {links.map((url, index) => (
                        <a
                          key={`${url}-${index}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-yellow-300 hover:text-yellow-200 border border-yellow-400/30 rounded-full px-2.5 py-1"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          Open Link {links.length > 1 ? index + 1 : ""}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
