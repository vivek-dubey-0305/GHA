//LearningVideoPlayer.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  ChevronDown,
  Check,
} from "lucide-react";

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];

export default function LearningVideoPlayer({
  sourceUrl,
  title,
  poster,
  startAt = 0,
  onProgress,
  onEnded,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const startAppliedRef = useRef(false);
  const hideControlsTimerRef = useRef(null);
  const speedMenuRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);


  //New userffect for auto rotate and fullscreen change detection
  useEffect(() => {
  if (isFullscreen && screen.orientation?.lock) {
    screen.orientation.lock("landscape").catch(() => {});
  }

  return () => {
    screen.orientation?.unlock?.();
  };
}, [isFullscreen]);
  useEffect(() => {
    const onFullScreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullScreenChange);
  }, []);

//   useEffect(() => {
//     const container = containerRef.current;
//     if (!container) return;

//     const scheduleHideControls = () => {
//       if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
//       setShowControls(true);

//       if (!isPlaying) {
//         return;
//       }

//       hideControlsTimerRef.current = setTimeout(() => {
//         setShowControls(false);
//       }, 2000);
//     };

//     const handleMouseMove = () => {
//       scheduleHideControls();
//     };

//     const handleTouchStart = () => {
//       scheduleHideControls();
//     };

//     const handleMouseLeave = () => {
//       if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
//       if (isPlaying) {
//         setShowControls(false);
//       }
//     };

//     container.addEventListener("mousemove", handleMouseMove);
//     container.addEventListener("touchstart", handleTouchStart);
//     container.addEventListener("mouseleave", handleMouseLeave);

//     return () => {
//       container.removeEventListener("mousemove", handleMouseMove);
//       container.removeEventListener("touchstart", handleTouchStart);
//       container.removeEventListener("mouseleave", handleMouseLeave);
//       if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
//     };
//   }, [isPlaying]);

    useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const showControlsTemporarily = () => {
        setShowControls(true);

        if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
        }

        if (isPlaying) {
        hideControlsTimerRef.current = setTimeout(() => {
            setShowControls(false);
        }, 2000);
        }
    };

    const handleMouseMove = () => {
        showControlsTemporarily();
    };

    const handleTouch = () => {
        showControlsTemporarily();
    };

    const handleMouseLeave = () => {
        if (isPlaying) {
        setShowControls(false);
        }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("touchstart", handleTouch);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("touchstart", handleTouch);
        container.removeEventListener("mouseleave", handleMouseLeave);

        if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
        }
    };
    }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceUrl) return;

    startAppliedRef.current = false;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = /\.m3u8(\?|$)/i.test(sourceUrl);

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, autoStartLoad: true });
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else {
      video.src = sourceUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [sourceUrl]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (!isSpeedMenuOpen) return;

    const handleOutsidePress = (event) => {
      if (!speedMenuRef.current?.contains(event.target)) {
        setIsSpeedMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsSpeedMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePress);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePress);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isSpeedMenuOpen]);

  const applyStartTime = useCallback(() => {
    const video = videoRef.current;
    if (!video || startAppliedRef.current) return;

    const safeStart = Number(startAt || 0);
    if (safeStart > 0 && safeStart < (video.duration || Number.MAX_SAFE_INTEGER)) {
      video.currentTime = safeStart;
      setCurrentTime(safeStart);
    }
    startAppliedRef.current = true;
  }, [startAt]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);
    applyStartTime();
  }, [applyStartTime]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const nextTime = video.currentTime || 0;
    const nextDuration = video.duration || 0;
    const pct = nextDuration > 0 ? Math.min(100, Math.round((nextTime / nextDuration) * 100)) : 0;

    setCurrentTime(nextTime);
    setDuration(nextDuration);

    if (onProgress) {
      onProgress({
        currentTime: nextTime,
        duration: nextDuration,
        progressPercentage: pct,
      });
    }
  }, [onProgress]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      return;
    }
    video.pause();
  }, []);

  const seekTo = useCallback((value) => {
    const video = videoRef.current;
    if (!video) return;
    const next = Number(value || 0);
    video.currentTime = next;
    setCurrentTime(next);
  }, []);

  const seekBy = useCallback((delta) => {
    const video = videoRef.current;
    if (!video) return;
    const target = Math.min(Math.max(0, (video.currentTime || 0) + delta), video.duration || 0);
    video.currentTime = target;
    setCurrentTime(target);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setIsMuted(next);
  }, []);

  const handleVolume = useCallback((value) => {
    const video = videoRef.current;
    if (!video) return;

    const next = Number(value);
    video.volume = next;
    video.muted = next === 0;
    setVolume(next);
    setIsMuted(next === 0);
  }, []);

//   const toggleFullscreen = useCallback(async () => {
//     const el = containerRef.current;
//     if (!el) return;

//     if (!document.fullscreenElement) {
//       await el.requestFullscreen();
//       return;
//     }

//     await document.exitFullscreen();
//   }, []);

    const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    try {
        if (!document.fullscreenElement) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
        } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
        }
    } catch (err) {
        console.error("Fullscreen error:", err);
    }
    }, []);

  const fmt = useMemo(
    () => (sec) => {
      if (!Number.isFinite(sec)) return "0:00";
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      return `${m}:${String(s).padStart(2, "0")}`;
    },
    []
  );

  const formatRateLabel = useCallback((rate) => {
    return rate === 1 ? "Normal" : `${rate}x`;
  }, []);

  if (!sourceUrl) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-[#111] p-8 text-center text-gray-500">
        Select a lesson to start learning.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
    //   className="group relative rounded-2xl overflow-hidden border border-gray-800 bg-black w-full"
    className={`group relative overflow-hidden bg-black w-full 
  ${isFullscreen ? "fixed inset-0 z-9999 rounded-none" : "rounded-2xl border border-gray-800"}`}
      style={{ maxWidth: "100%" }}
    >
      {/* <div className="relative w-full bg-black aspect-video"> */}
      <div
  className={`relative bg-black flex items-center justify-center overflow-hidden 
  ${isFullscreen ? "h-screen w-screen" : "aspect-video w-full"}`}
>
        <video
          ref={videoRef}
        //   className="w-full h-full"
        //   className="w-full h-full object-contain"
        className={`w-full h-full transition-[object-fit] duration-200 
${isFullscreen ? "object-cover" : "object-contain"}`}
          poster={poster}
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            onEnded?.();
          }}
        />

        {/* Centered Play/Pause Button Overlay */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
          style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}
        >
          <div className="bg-black/50 rounded-full p-4 sm:p-6 hover:bg-black/70 transition-colors">
            {isPlaying ? (
              <Pause className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            ) : (
              <Play className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            )}
          </div>
        </button>
      </div>
{/* 
      <div
        className={`border-t border-gray-800 bg-linear-to-t from-black to-black/80 transition-all duration-200 w-full overflow-x-auto ${
          showControls ? "p-2 sm:p-3 md:p-4" : "p-1 sm:p-2"
        } space-y-2 sm:space-y-3`}
      > */}
      <div
        className={`absolute bottom-0 left-0 right-0 border-t border-gray-800 bg-linear-to-t from-black to-black/60 transition-all duration-300 pointer-events-auto ${
          showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        } p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-white truncate flex-1">{title || "Lesson Video"}</p>
          <span className="text-xs text-gray-400 whitespace-nowrap">Greed Hunter Academy</span>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(duration, 0)}
          step={1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => seekTo(e.target.value)}
          className="w-full accent-yellow-400 cursor-pointer h-1 sm:h-1.5"
          style={{ pointerEvents: showControls ? "auto" : "auto" }}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
          {/* Primary Controls */}
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
            <button
              onClick={() => seekBy(-10)}
              className="p-1.5 sm:p-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-800/50 transition-colors shrink-0"
              title="Back 10s"
            >
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="p-1.5 sm:p-2 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 transition-colors shrink-0"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </button>
            <button
              onClick={() => seekBy(10)}
              className="p-1.5 sm:p-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-800/50 transition-colors shrink-0"
              title="Forward 10s"
            >
              <RotateCw className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 sm:p-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-800/50 transition-colors shrink-0"
              title="Mute"
            >
              {isMuted ? (
                <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolume(e.target.value)}
              className="w-16 sm:w-24 accent-yellow-400 cursor-pointer h-1 sm:h-1.5 shrink-0"
            />

            <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
              {fmt(currentTime)} / {fmt(duration)}
            </span>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 w-full sm:w-auto sm:ml-auto">
            <div ref={speedMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsSpeedMenuOpen((prev) => !prev)}
                className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-200 ease-out active:scale-95 active:translate-y-px touch-manipulation ${
                  isSpeedMenuOpen
                    ? "border-yellow-300 bg-linear-to-r from-yellow-300 to-yellow-500 text-black shadow-[0_0_20px_rgba(250,204,21,0.45)]"
                    : "border-yellow-300/70 bg-linear-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-300 hover:to-yellow-400 hover:shadow-[0_0_16px_rgba(250,204,21,0.35)]"
                }`}
                aria-label="Playback speed"
                aria-haspopup="listbox"
                aria-expanded={isSpeedMenuOpen}
              >
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-black/75 hidden sm:inline">Speed</span>
                <span className="min-w-11 text-left">{formatRateLabel(playbackRate)}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isSpeedMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div
                className={`absolute bottom-full right-0 mb-2 w-40 rounded-2xl border-l-2 border-b-2 border-yellow-300/90 bg-black/95 shadow-[0_18px_42px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all duration-200 origin-bottom-right z-30 ${
                  isSpeedMenuOpen
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-2 scale-95 pointer-events-none"
                }`}
              >
                <div className="p-1.5" role="listbox" aria-label="Playback speed options">
                  {PLAYBACK_RATES.map((rate) => {
                    const isSelected = playbackRate === rate;

                    return (
                      <button
                        key={rate}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setPlaybackRate(rate);
                          setIsSpeedMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-all duration-150 ease-out active:scale-[0.98] active:translate-y-px ${
                          isSelected
                            ? "bg-linear-to-r from-yellow-300 to-red-500 text-black shadow-[0_0_12px_rgba(250,204,21,0.4)]"
                            : "text-white hover:bg-purple-300/10 cursor-pointer hover:text-yellow-300"
                        }`}
                      >
                        <span>{formatRateLabel(rate)}</span>
                        <Check className={`w-3.5 h-3.5 transition-opacity duration-150 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-800/50 transition-colors shrink-0"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

