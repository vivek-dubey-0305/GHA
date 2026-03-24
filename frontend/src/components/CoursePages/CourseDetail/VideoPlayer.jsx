// import { useEffect, useRef } from "react";
// import Hls from "hls.js";
// import { X } from "lucide-react";
// import "./video-player.css";

// /**
//  * VideoPlayer Modal Component
//  * Handles playing trailer videos, preview lessons, and course content videos
//  * 
//  * Props:
//  * - isOpen: boolean - Whether modal is open
//  * - onClose: function - Callback to close modal
//  * - videoUrl: string - URL of the video to play
//  * - title: string - Title of the video
//  * - lessonTitle: string - Lesson title (optional)
//  * - onEnded: function - Callback when video ends (optional)
//  */
// export default function VideoPlayer({
//   isOpen,
//   onClose,
//   videoUrl,
//   title = "Video Preview",
//   lessonTitle,
//   onEnded,
// }) {
//   const videoRef = useRef(null);

//   // Close on Escape key
//   useEffect(() => {
//     const handleEscape = (e) => {
//       if (e.key === "Escape") onClose();
//     };

//     if (isOpen) {
//       document.addEventListener("keydown", handleEscape);
//       document.body.style.overflow = "hidden";
//     }

//     return () => {
//       document.removeEventListener("keydown", handleEscape);
//       document.body.style.overflow = "auto";
//     };
//   }, [isOpen, onClose]);

//   // Attach HLS for .m3u8 streams when needed.
//   useEffect(() => {
//     if (!isOpen || !videoUrl || !videoRef.current) return;

//     const video = videoRef.current;
//     const isHlsSource = /\.m3u8(\?|$)/i.test(videoUrl);

//     if (isHlsSource && Hls.isSupported()) {
//       const hls = new Hls({
//         enableWorker: true,
//         lowLatencyMode: true,
//       });

//       hls.loadSource(videoUrl);
//       hls.attachMedia(video);

//       hls.on(Hls.Events.MANIFEST_PARSED, () => {
//         video.play().catch(() => {});
//       });

//       return () => {
//         hls.destroy();
//       };
//     }

//     // Safari and browsers with native HLS support
//     if (isHlsSource && video.canPlayType("application/vnd.apple.mpegurl")) {
//       video.src = videoUrl;
//       video.play().catch(() => {});
//       return undefined;
//     }

//     video.src = videoUrl;
//     video.play().catch(() => {});

//     return undefined;
//   }, [isOpen, videoUrl]);

//   if (!isOpen) return null;

//   return (
//     <div className="video-player-overlay" onClick={onClose}>
//       <div className="video-player-modal" onClick={(e) => e.stopPropagation()}>
//         {/* Header */}
//         <div className="video-player-header">
//           <div className="video-player-title">
//             <h3>{title}</h3>
//             {lessonTitle && <p className="lesson-subtitle">{lessonTitle}</p>}
//           </div>
//           <button className="video-player-close" onClick={onClose}>
//             <X size={24} />
//           </button>
//         </div>

//         {/* Video Container */}
//         <div className="video-player-container">
//           {videoUrl ? (
//             <video
//               ref={videoRef}
//               className="video-player-element"
//               controls
//               autoPlay
//               onEnded={onEnded}
//             >
//               <p>Your browser does not support the video tag.</p>
//             </video>
//           ) : (
//             <div className="video-player-error">
//               <p>Video not available</p>
//             </div>
//           )}
//         </div>

//         {/* Footer Info */}
//         {lessonTitle && (
//           <div className="video-player-footer">
//             <p className="video-player-info">
//               Now Playing: <strong>{lessonTitle}</strong>
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


// import { useEffect, useRef, useState } from "react";
// import { createPortal } from "react-dom";
// import Hls from "hls.js";
// import { X, Play, Pause } from "lucide-react";
// import "./video-player.css";

// export default function VideoPlayer({
//   isOpen,
//   onClose,
//   videoUrl,
//   title = "Video Preview",
//   lessonTitle,
//   onEnded,
// }) {
//   const videoRef = useRef(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [currentTime, setCurrentTime] = useState(0);
//   const [duration, setDuration] = useState(0);

//   // Escape + scroll lock
//   useEffect(() => {
//     const handleEscape = (e) => {
//       if (e.key === "Escape") onClose();
//     };

//     if (isOpen) {
//       document.addEventListener("keydown", handleEscape);

//       // HARD LOCK scroll (better than overflow only)
//       document.body.style.overflow = "hidden";
//       document.body.style.position = "fixed";
//       document.body.style.width = "100%";
//     }

//     return () => {
//       document.removeEventListener("keydown", handleEscape);
//       document.body.style.overflow = "auto";
//       document.body.style.position = "static";
//     };
//   }, [isOpen, onClose]);

//   // HLS Setup
//   useEffect(() => {
//     if (!isOpen || !videoUrl || !videoRef.current) return;

//     const video = videoRef.current;
//     const isHlsSource = /\.m3u8(\?|$)/i.test(videoUrl);

//     if (isHlsSource && Hls.isSupported()) {
//       const hls = new Hls({ enableWorker: true });

//       hls.loadSource(videoUrl);
//       hls.attachMedia(video);

//       hls.on(Hls.Events.MANIFEST_PARSED, () => {
//         video.play().catch(() => {});
//         setIsPlaying(true);
//       });

//       return () => hls.destroy();
//     }

//     video.src = videoUrl;
//     video.play().catch(() => {});
//     setIsPlaying(true);
//   }, [isOpen, videoUrl]);

//   // Play/Pause handler
//   const togglePlayPause = () => {
//     if (!videoRef.current) return;
//     if (videoRef.current.paused) {
//       videoRef.current.play();
//       setIsPlaying(true);
//     } else {
//       videoRef.current.pause();
//       setIsPlaying(false);
//     }
//   };

//   // Update timeline
//   const handleTimeUpdate = () => {
//     if (videoRef.current) {
//       setCurrentTime(videoRef.current.currentTime);
//     }
//   };

//   const handleLoadedMetadata = () => {
//     if (videoRef.current) {
//       setDuration(videoRef.current.duration);
//     }
//   };

//   // Seek on timeline click
//   const handleProgressClick = (e) => {
//     if (!videoRef.current || !duration) return;
//     const bar = e.currentTarget;
//     const clickX = e.clientX - bar.getBoundingClientRect().left;
//     const newTime = (clickX / bar.offsetWidth) * duration;
//     videoRef.current.currentTime = newTime;
//   };

//   const formatTime = (time) => {
//     if (!time || isNaN(time)) return "0:00";
//     const mins = Math.floor(time / 60);
//     const secs = Math.floor(time % 60);
//     return `${mins}:${secs.toString().padStart(2, "0")}`;
//   };

//   if (!isOpen) return null;

//   return createPortal(
//     <div className="vp-overlay" onClick={onClose}>
//       <div className="vp-modal" onClick={(e) => e.stopPropagation()}>
//         {/* Header */}
//         <div className="vp-header">
//           <div>
//             <h3>{title}</h3>
//             {lessonTitle && <p>{lessonTitle}</p>}
//           </div>
//           <button onClick={onClose}>
//             <X size={20} />
//           </button>
//         </div>

//         {/* Video with Custom Play Button */}
//         <div className="vp-video-wrap">
//           <video
//             ref={videoRef}
//             className="vp-video"
//             onTimeUpdate={handleTimeUpdate}
//             onLoadedMetadata={handleLoadedMetadata}
//             onEnded={onEnded}
//             playsInline
//           />
          
//           {/* Center Play/Pause Button */}
//           <button className="vp-play-button" onClick={togglePlayPause}>
//             {isPlaying ? <Pause size={48} /> : <Play size={48} />}
//           </button>
//         </div>

//         {/* Footer with Timeline */}
//         <div className="vp-footer">
//           {/* Timeline */}
//           <div className="vp-timeline" onClick={handleProgressClick}>
//             <div 
//               className="vp-timeline-progress" 
//               style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
//             />
//           </div>
          
//           {/* Now Playing Info */}
//           <div className="vp-footer-info">
//             <span className="vp-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
//             {lessonTitle && (
//               <span className="vp-playing">
//                 Now Playing: <strong>{lessonTitle}</strong>
//               </span>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>,
//     document.body
//   );
// }



import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Hls from "hls.js";
import { X, Play, Pause, Volume2, VolumeX } from "lucide-react";
import "./video-player.css";

export default function VideoPlayer({
  isOpen,
  onClose,
  videoUrl,
  title = "Video Preview",
  lessonTitle,
  onEnded,
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const rippleRef = useRef(null);

  // ── Escape + scroll lock ──────────────────────────────────────────────────
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isOpen, onClose]);

  // ── HLS Setup ─────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!isOpen || !videoUrl || !videoRef.current) return;

//     const video = videoRef.current;
//     const isHlsSource = /\.m3u8(\?|$)/i.test(videoUrl);

//     if (isHlsSource && Hls.isSupported()) {
//       const hls = new Hls({ enableWorker: true, startLevel:2});
//       hls.loadSource(videoUrl);
//       hls.attachMedia(video);

//       hls.on(Hls.Events.MANIFEST_PARSED, () => {
//         video.play().catch(() => {});
//         setIsPlaying(true);
//       });

//       return () => hls.destroy();
//     }

//     video.src = videoUrl;
//     video.play().catch(() => {});
//     setIsPlaying(true);
//   }, [isOpen, videoUrl]);

useEffect(() => {
  if (!isOpen || !videoUrl || !videoRef.current) return;

  const video = videoRef.current;
  const isHlsSource = /\.m3u8(\?|$)/i.test(videoUrl);

  if (isHlsSource && Hls.isSupported()) {
    const hls = new Hls({
      enableWorker: true,
      autoStartLoad: true,
    });

    hls.loadSource(videoUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("Available Levels:", hls.levels);
      // 🔥 FORCE 720p intelligently
      const levels = hls.levels;
       hls.levels.forEach((l, i) => {
    console.log(i, l.height, l.bitrate);
  });

      let level720 = levels.findIndex(l => l.height === 720);

      if (level720 !== -1) {
        hls.currentLevel = level720;  // force 720p   
      } else {
        // fallback → highest available
        hls.currentLevel = levels.length - 1;
      }

      video.play().catch(() => {});
      setIsPlaying(true);
    });

    return () => hls.destroy();
  }

  video.src = videoUrl;
  video.play().catch(() => {});
  setIsPlaying(true);
}, [isOpen, videoUrl]);
  // ── Play / Pause ──────────────────────────────────────────────────────────
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // ── Click ripple on video wrap ────────────────────────────────────────────
  const handleVideoClick = (e) => {
    togglePlayPause();

    // Ripple effect at click position
    const wrap = e.currentTarget;
    const rect = wrap.getBoundingClientRect();
    const ripple = document.createElement("div");
    ripple.className = "vp-click-ripple";
    ripple.style.left = `${e.clientX - rect.left - 40}px`;
    ripple.style.top = `${e.clientY - rect.top - 40}px`;
    wrap.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  // ── Time Update ───────────────────────────────────────────────────────────
  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  // ── Seek ──────────────────────────────────────────────────────────────────
  const handleProgressClick = (e) => {
    if (!videoRef.current || !duration) return;
    const bar = e.currentTarget;
    const clickX = e.clientX - bar.getBoundingClientRect().left;
    const newTime = (clickX / bar.offsetWidth) * duration;
    videoRef.current.currentTime = newTime;
  };

  // ── Volume ────────────────────────────────────────────────────────────────
  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    videoRef.current.muted = next;
  };

  // ── Format time ───────────────────────────────────────────────────────────
  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  if (!isOpen) return null;

  return createPortal(
    <div className="vp-overlay" onClick={onClose}>
      <div className="vp-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="vp-header">
          <div className="vp-header-left">
            <h3>{title}</h3>
            {lessonTitle && <p>{lessonTitle}</p>}
          </div>
          <button className="vp-close-btn" onClick={onClose} aria-label="Close player">
            <X size={16} />
          </button>
        </div>

        {/* ── Video ── */}
        <div
          className={`vp-video-wrap ${!isPlaying ? "is-paused" : ""}`}
          onClick={handleVideoClick}
        >
          <video
            ref={videoRef}
            className="vp-video"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => {
              setIsPlaying(false);
              onEnded?.();
            }}
            playsInline
          />

          {/* Centre play/pause ghost button */}
          <button
            className="vp-play-center"
            onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={30} /> : <Play size={30} />}
          </button>
        </div>

        {/* ── Footer ── */}
        <div className="vp-footer">

          {/* Timeline */}
          <div className="vp-timeline-wrap" onClick={handleProgressClick}>
            <div className="vp-timeline-track">
              <div
                className="vp-timeline-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Controls row */}
          <div className="vp-footer-row">
            <div className="vp-footer-left">
              {/* Play / Pause */}
              <button
                className="vp-controls-btn"
                onClick={togglePlayPause}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>

              {/* Volume */}
              <div className="vp-volume-wrap">
                <button
                  className="vp-controls-btn"
                  onClick={toggleMute}
                  aria-label="Toggle mute"
                >
                  {isMuted || volume === 0
                    ? <VolumeX size={15} />
                    : <Volume2 size={15} />}
                </button>
                <input
                  className="vp-volume-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  aria-label="Volume"
                />
              </div>

              {/* Time */}
              <span className="vp-time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Now playing */}
            {lessonTitle && (
              <div className="vp-footer-right">
                <span className="vp-now-playing-label">Now Playing</span>
                <span className="vp-now-playing-title">{lessonTitle}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}