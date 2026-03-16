/**
 * components/AchievementPages/CertificateCard.jsx
 */
import { motion } from "framer-motion";
import { Award, Download, Share2, ExternalLink } from "lucide-react";
import { gradeColor, formatDate } from "../../utils/format.utils";

export default function CertificateCard({ certificate, delay = 0 }) {
  const { title, course, issuedAt, grade, skills, completionPercentage, certificateId, status } = certificate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden hover:border-yellow-400/20 transition-colors group"
    >
      {/* Certificate visual header */}
      <div className="relative h-32 bg-gradient-to-br from-yellow-400/10 via-orange-400/5 to-transparent
        flex items-center justify-center border-b border-gray-800 overflow-hidden">
        {/* Decorative rings */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-yellow-400/10" />
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full border border-yellow-400/10" />

        <div className="text-center z-10">
          <div className="w-12 h-12 mx-auto rounded-full bg-yellow-400/20 border border-yellow-400/30
            flex items-center justify-center mb-2">
            <Award className="w-6 h-6 text-yellow-400" />
          </div>
          {grade && (
            <span className={`text-2xl font-black ${gradeColor(grade)}`}>{grade}</span>
          )}
        </div>

        {/* GHA watermark */}
        <div className="absolute bottom-2 right-3 text-gray-800 text-xs font-bold tracking-widest select-none">
          GHA
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-white font-bold text-sm leading-snug mb-1 line-clamp-2">{title}</h3>
        <p className="text-gray-500 text-xs mb-3">{course?.title}</p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills?.slice(0, 4).map((s) => (
            <span key={s} className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700">
              {s}
            </span>
          ))}
          {(skills?.length ?? 0) > 4 && (
            <span className="text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
              +{skills.length - 4} more
            </span>
          )}
        </div>

        <p className="text-xs text-gray-600 mb-4">
          Issued {formatDate(issuedAt)} · {certificateId}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={certificate.certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-yellow-400 text-black
              font-semibold text-xs rounded-xl hover:bg-yellow-300 transition-colors active:scale-95"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </a>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-700 text-gray-400
            text-xs rounded-xl hover:border-gray-500 hover:text-white transition-colors active:scale-95">
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-700 text-gray-400
            text-xs rounded-xl hover:border-gray-500 hover:text-white transition-colors active:scale-95">
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
