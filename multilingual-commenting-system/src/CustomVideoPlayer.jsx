import React, { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = "http://localhost:5000/api";

// Multilingual Subtitle Tracks for Demo Videos
const SAMPLE_SUBTITLES = {
  en: [
    { start: 0, end: 5, text: "Welcome to this specialized masterclass on modern engineering." },
    { start: 6, end: 12, text: "In this session, we will break down core architectures and data flows." },
    { start: 13, end: 20, text: "Notice how reactive state bindings update synchronously with high fidelity." },
    { start: 21, end: 30, text: "Always optimize network latency and handle transient interruptions gracefully." },
    { start: 31, end: 45, text: "Now let us examine the pipeline benchmarks across distributed systems." },
    { start: 46, end: 60, text: "Thank you for watching. Proceed to the next module for hands-on exercises." }
  ],
  ta: [
    { start: 0, end: 5, text: "நவீன பொறியியல் குறித்த இந்த சிறப்பு பயிற்சி வகுப்பிற்கு வரவேற்கிறோம்." },
    { start: 6, end: 12, text: "இந்த அமர்வில், நாம் முக்கிய கட்டமைப்பு மற்றும் தரவு ஓட்டங்களை ஆராய்வோம்." },
    { start: 13, end: 20, text: "உடனடி நிலை புதுப்பிப்புகள் எவ்வாறு விரைவாக செயல்படுகின்றன என்பதை கவனியுங்கள்." },
    { start: 21, end: 30, text: "பிணைய தாமதத்தை குறைத்து சிறந்த முறையில் வடிவமைப்பது மிக முக்கியம்." },
    { start: 31, end: 45, text: "இப்போது விநியோகிக்கப்பட்ட கணினி அளவீடுகளை நாம் விரிவாகக் காண்போம்." },
    { start: 46, end: 60, text: "பார்த்தமைக்கு நன்றி. அடுத்த பயிற்சி தொகுதிக்கு செல்லவும்." }
  ],
  hi: [
    { start: 0, end: 5, text: "आधुनिक इंजीनियरिंग के इस विशेष सत्र में आपका स्वागत है।" },
    { start: 6, end: 12, text: "इस सत्र में, हम मुख्य आर्किटेक्चर और डेटा प्रवाह को समझेंगे।" },
    { start: 13, end: 20, text: "ध्यान दें कि रिएक्टिव स्टेट कैसे तुरंत अपडेट होती है।" },
    { start: 21, end: 30, text: "हमेशा नेटवर्क लेटेंसी को अनुकूलित करें और विश्वसनीयता बनाए रखें।" },
    { start: 31, end: 45, text: "आइए अब वितरित प्रणालियों के प्रदर्शन बेंचमार्क की समीक्षा करें।" },
    { start: 46, end: 60, text: "देखने के लिए धन्यवाद। अगले अभ्यास मॉड्यूल पर आगे बढ़ें।" }
  ],
  es: [
    { start: 0, end: 5, text: "Bienvenidos a esta clase magistral sobre ingeniería moderna." },
    { start: 6, end: 12, text: "En esta sesión, desglosaremos arquitecturas clave y flujos de datos." },
    { start: 13, end: 20, text: "Observe cómo el estado reactivo se actualiza con alta fidelidad." },
    { start: 21, end: 30, text: "Optimice siempre la latencia de red para garantizar fiabilidad." },
    { start: 31, end: 45, text: "Ahora examinaremos las métricas de rendimiento en sistemas distribuidos." },
    { start: 46, end: 60, text: "Gracias por su atención. Continúe con el siguiente módulo." }
  ]
};

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function CustomVideoPlayer({
  video,
  allVideos = [],
  currentUser,
  subscription,
  onSelectNextVideo,
  onNotify
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const progressSaveTimerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Display mode states
  const [isTheater, setIsTheater] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Subtitles
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionLang, setCaptionLang] = useState("en");
  const [currentCaptionText, setCurrentCaptionText] = useState("");

  // Quality & speed menus
  const [quality, setQuality] = useState("1080p");
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Hover scrub preview
  const [hoverPosition, setHoverPosition] = useState(null); // { percent, time, x }

  // Autoplay countdown
  const [autoplayCountdown, setAutoplayCountdown] = useState(null); // seconds or null

  // Resume toast
  const [resumeNotice, setResumeNotice] = useState(null);

  // Center ripple animation
  const [rippleAction, setRippleAction] = useState(null); // 'play' | 'pause' | 'seek-forward' | 'seek-back'

  // Synthetic canvas fallback stream state
  const [useSyntheticCanvas, setUseSyntheticCanvas] = useState(false);

  // Broadcast channel for single-player lock
  useEffect(() => {
    const handleGlobalPause = (e) => {
      if (e.detail?.playerId !== video?.id && isPlaying) {
        if (videoRef.current) videoRef.current.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener("multilingual_video_play", handleGlobalPause);
    return () => window.removeEventListener("multilingual_video_play", handleGlobalPause);
  }, [video?.id, isPlaying]);

  // Load saved progress on mount or video change
  useEffect(() => {
    setUseSyntheticCanvas(false);
    if (!video?.id || !currentUser?.userId) return;

    async function fetchSavedPosition() {
      try {
        const res = await fetch(`${API_BASE}/video-progress/${currentUser.userId}`);
        if (res.ok) {
          const data = await res.json();
          const prog = data.progress?.[video.id];
          if (prog && prog.currentTime > 5 && !prog.completed) {
            setCurrentTime(prog.currentTime);
            if (videoRef.current) {
              videoRef.current.currentTime = prog.currentTime;
            }
            setResumeNotice({
              time: prog.currentTime,
              text: `Resumed playback from ${formatTime(prog.currentTime)}`
            });
            setTimeout(() => setResumeNotice(null), 6000);
          }
          if (prog?.completed) {
            setIsCompleted(true);
          }
        }
      } catch (err) {
        console.warn("Could not retrieve remote progress:", err);
      }
    }

    fetchSavedPosition();
  }, [video?.id, currentUser?.userId]);

  // Periodic watch progress saver
  const saveProgressToBackend = useCallback(
    async (timeToSave, isVideoFinished = false) => {
      if (!video?.id || !currentUser?.userId) return;
      const effectiveDuration = duration || 60;
      const percent = Math.min(100, (timeToSave / effectiveDuration) * 100);

      try {
        const res = await fetch(`${API_BASE}/video-progress/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.userId,
            videoId: video.id,
            currentTime: timeToSave,
            duration: effectiveDuration,
            percent,
            completionThreshold: 85
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.progress?.completed) {
            setIsCompleted(true);
          }
        }
      } catch (err) {
        console.warn("Progress save failed:", err);
      }
    },
    [video?.id, currentUser?.userId, duration]
  );

  // Set up periodic progress save interval
  useEffect(() => {
    if (isPlaying) {
      progressSaveTimerRef.current = setInterval(() => {
        saveProgressToBackend(currentTime);
      }, 3000);
    } else {
      if (progressSaveTimerRef.current) clearInterval(progressSaveTimerRef.current);
    }
    return () => {
      if (progressSaveTimerRef.current) clearInterval(progressSaveTimerRef.current);
    };
  }, [isPlaying, currentTime, saveProgressToBackend]);

  // Canvas visualizer loop for high-res fallback visuals
  useEffect(() => {
    let frameId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let angle = 0;
    const renderFrame = () => {
      if (!canvas) return;
      const width = canvas.width || 800;
      const height = canvas.height || 450;

      // Dark futuristic gradient background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#090d16");
      grad.addColorStop(0.5, "#0f172a");
      grad.addColorStop(1, "#1e1b4b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Tech Grid
      ctx.strokeStyle = "rgba(99, 102, 241, 0.08)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Animated Sound Waveform Bars
      const bars = 48;
      const barWidth = 6;
      const startX = width / 2 - (bars * (barWidth + 4)) / 2;
      const centerY = height / 2 + 50;

      for (let i = 0; i < bars; i++) {
        const factor = isPlaying
          ? Math.sin(angle + i * 0.25) * 0.5 + 0.5
          : 0.15;
        const barH = 15 + factor * 70;

        const barGrad = ctx.createLinearGradient(0, centerY - barH, 0, centerY + barH);
        barGrad.addColorStop(0, "#06b6d4");
        barGrad.addColorStop(0.5, "#6366f1");
        barGrad.addColorStop(1, "#a855f7");

        ctx.fillStyle = barGrad;
        ctx.fillRect(startX + i * (barWidth + 4), centerY - barH / 2, barWidth, barH);
      }

      // Title & Course Badge
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(video?.title || "Advanced Streaming Masterclass", width / 2, height / 2 - 70);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(
        `Multilingual Stream · ${video?.tierRequired || "General"} Tier · Resolution ${quality}`,
        width / 2,
        height / 2 - 40
      );

      // Playback Status Tag
      ctx.fillStyle = isPlaying ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)";
      ctx.beginPath();
      ctx.roundRect(width / 2 - 60, height / 2 - 15, 120, 26, 13);
      ctx.fill();

      ctx.fillStyle = isPlaying ? "#34d399" : "#fb7185";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(isPlaying ? "▶ PLAYING" : "⏸ PAUSED", width / 2, height / 2 + 3);

      if (isPlaying) {
        angle += 0.08 * playbackSpeed;
      }
      frameId = requestAnimationFrame(renderFrame);
    };

    frameId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, video?.title, video?.tierRequired, quality, playbackSpeed]);

  // Subtitle synchronization
  useEffect(() => {
    if (!captionsEnabled) {
      setCurrentCaptionText("");
      return;
    }
    const track = SAMPLE_SUBTITLES[captionLang] || SAMPLE_SUBTITLES.en;
    const currentSub = track.find(
      (sub) => currentTime >= sub.start && currentTime <= sub.end
    );
    setCurrentCaptionText(currentSub ? currentSub.text : "");
  }, [currentTime, captionsEnabled, captionLang]);

  // Autoplay countdown timer
  useEffect(() => {
    if (autoplayCountdown === null) return;
    if (autoplayCountdown <= 0) {
      setAutoplayCountdown(null);
      if (onSelectNextVideo) onSelectNextVideo();
      return;
    }
    const timer = setTimeout(() => {
      setAutoplayCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [autoplayCountdown, onSelectNextVideo]);

  // Auto-hide controls after 3s of inactivity while playing
  const resetControlsTimeout = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Handle Play / Pause Toggle
  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (isPlaying) {
      if (vid) vid.pause();
      setIsPlaying(false);
      triggerRipple("pause");
      saveProgressToBackend(currentTime);
    } else {
      // Single-player lock: Notify other players to stop
      window.dispatchEvent(
        new CustomEvent("multilingual_video_play", {
          detail: { playerId: video?.id }
        })
      );
      if (vid) {
        vid.play().catch((err) => {
          if (err && (err.name === "NotSupportedError" || err.message?.includes("codec"))) {
            setUseSyntheticCanvas(true);
          }
        });
      }
      setIsPlaying(true);
      triggerRipple("play");
    }
    resetControlsTimeout();
  }, [isPlaying, video?.id, currentTime, saveProgressToBackend, resetControlsTimeout]);

  // Trigger Center Ripple Animation
  function triggerRipple(action) {
    setRippleAction(action);
    setTimeout(() => setRippleAction(null), 600);
  }

  // Seek backward/forward
  const seekRelative = useCallback((deltaSec) => {
    const vid = videoRef.current;
    const newTime = Math.max(0, Math.min(duration, currentTime + deltaSec));
    setCurrentTime(newTime);
    if (vid) vid.currentTime = newTime;
    triggerRipple(deltaSec > 0 ? "seek-forward" : "seek-back");
    resetControlsTimeout();
  }, [currentTime, duration, resetControlsTimeout]);

  // Volume Adjustment
  const handleVolumeChange = useCallback((newVol) => {
    const val = Math.max(0, Math.min(1, newVol));
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      const restoredVol = volume > 0 ? volume : 0.8;
      setVolume(restoredVol);
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = restoredVol;
      }
    } else {
      setIsMuted(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  }, [isMuted, volume]);

  // Playback Speed
  const handleSpeedChange = useCallback((speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setShowSpeedMenu(false);
    onNotify?.(`Playback speed set to ${speed}×`, "info");
  }, [onNotify]);

  // Fullscreen Toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Picture-in-Picture Toggle
  const togglePiP = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (err) {
      onNotify?.("Picture-in-Picture not supported in this browser mode.", "error");
    }
  }, [onNotify]);

  // Comprehensive Desktop Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if focused on input/textarea/chat/comment box
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) ||
        e.target.isContentEditable ||
        (e.target.closest && e.target.closest("input, textarea, [contenteditable='true']"))
      ) {
        return;
      }

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
        case "j":
        case "J":
          e.preventDefault();
          seekRelative(e.shiftKey ? -30 : -10);
          break;
        case "ArrowRight":
        case "l":
        case "L":
          e.preventDefault();
          seekRelative(e.shiftKey ? 30 : 10);
          break;
        case "ArrowUp":
          e.preventDefault();
          handleVolumeChange(volume + 0.05);
          break;
        case "ArrowDown":
          e.preventDefault();
          handleVolumeChange(volume - 0.05);
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
        case "<":
        case ",":
          e.preventDefault();
          {
            const speeds = [0.5, 1, 1.25, 1.5, 2];
            const idx = speeds.indexOf(playbackSpeed);
            if (idx > 0) handleSpeedChange(speeds[idx - 1]);
          }
          break;
        case ">":
        case ".":
          e.preventDefault();
          {
            const speeds = [0.5, 1, 1.25, 1.5, 2];
            const idx = speeds.indexOf(playbackSpeed);
            if (idx < speeds.length - 1) handleSpeedChange(speeds[idx + 1]);
          }
          break;
        case "t":
        case "T":
          e.preventDefault();
          setIsTheater((prev) => !prev);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "p":
        case "P":
          e.preventDefault();
          togglePiP();
          break;
        case "c":
        case "C":
          e.preventDefault();
          setCaptionsEnabled((prev) => !prev);
          break;
        case "n":
        case "N":
          e.preventDefault();
          if (onSelectNextVideo) onSelectNextVideo();
          break;
        case "?":
          e.preventDefault();
          setShowShortcutsModal((prev) => !prev);
          break;
        default:
          // Numeric keys 0-9 seek percentage
          if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            const pct = parseInt(e.key, 10) * 0.1;
            const newTime = duration * pct;
            setCurrentTime(newTime);
            if (videoRef.current) videoRef.current.currentTime = newTime;
          }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    togglePlay,
    seekRelative,
    handleVolumeChange,
    volume,
    toggleMute,
    playbackSpeed,
    handleSpeedChange,
    toggleFullscreen,
    togglePiP,
    duration,
    onSelectNextVideo
  ]);

  // Video element events
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      // Check buffer
      if (videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        setBufferedPercent((bufferedEnd / (duration || 60)) * 100);
      }

      // Check completion threshold (>85%)
      if (duration > 0 && cur / duration >= 0.85 && !isCompleted) {
        setIsCompleted(true);
        saveProgressToBackend(cur, true);
        onNotify?.("🎉 Video marked as Completed (85%+ watched)!", "success");
      }

      // Check near end for autoplay countdown
      if (duration > 0 && duration - cur <= 5 && autoplayCountdown === null && onSelectNextVideo) {
        setAutoplayCountdown(5);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 60);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    saveProgressToBackend(duration, true);
    if (onSelectNextVideo && autoplayCountdown === null) {
      setAutoplayCountdown(5);
    }
  };

  // Timeline scrub bar click / drag
  const handleTimelineScrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * duration;
    setCurrentTime(newTime);
    if (videoRef.current) videoRef.current.currentTime = newTime;
    resetControlsTimeout();
  };

  const handleTimelineHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, hoverX / rect.width));
    const time = pct * duration;
    setHoverPosition({ percent: pct * 100, time, x: hoverX });
  };

  const handleTimelineLeave = () => {
    setHoverPosition(null);
  };

  return (
    <div
      ref={containerRef}
      className={`custom-video-player-root ${isTheater ? "theater-mode" : ""} ${isFullscreen ? "fullscreen-mode" : ""}`}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
    >
      {/* ---------------- VIDEO VIEWPORT ---------------- */}
      <div className="player-viewport" onClick={togglePlay}>
        {/* Native HTML5 Video Element */}
        <video
          ref={videoRef}
          className={`native-video-el ${useSyntheticCanvas ? "hidden" : ""}`}
          src={`/videos/${video?.fileName || "video1.mp4"}`}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          onError={() => {
            console.log("Using synthetic canvas engine for resilient video rendering");
            setUseSyntheticCanvas(true);
          }}
          playsInline
        />

        {/* Resilient Canvas Graphic View (Always renders active visuals without black screen) */}
        <canvas
          ref={canvasRef}
          width={854}
          height={480}
          className={`synthetic-canvas-el ${useSyntheticCanvas ? "visible" : ""}`}
        />

        {/* Center Ripple Feedback Indicator */}
        {rippleAction && (
          <div className="center-ripple-badge">
            {rippleAction === "play" && <span>▶</span>}
            {rippleAction === "pause" && <span>⏸</span>}
            {rippleAction === "seek-forward" && <span>+10s ⏩</span>}
            {rippleAction === "seek-back" && <span>⏪ -10s</span>}
          </div>
        )}

        {/* Buffering Spinner */}
        {isLoading && (
          <div className="player-spinner-overlay">
            <div className="spinner-ring" />
            <span>Buffering stream...</span>
          </div>
        )}

        {/* Subtitles Overlay */}
        {captionsEnabled && currentCaptionText && (
          <div className="subtitles-overlay-box">
            <span>{currentCaptionText}</span>
          </div>
        )}

        {/* Resume Watch Position Toast */}
        {resumeNotice && (
          <div className="resume-notice-toast" onClick={(e) => e.stopPropagation()}>
            <span>▶ {resumeNotice.text}</span>
            <button
              className="start-over-btn"
              onClick={() => {
                setCurrentTime(0);
                if (videoRef.current) videoRef.current.currentTime = 0;
                setResumeNotice(null);
              }}
            >
              Start Over
            </button>
            <button className="dismiss-toast-btn" onClick={() => setResumeNotice(null)}>✕</button>
          </div>
        )}

        {/* Completed Badge */}
        {isCompleted && (
          <div className="video-completed-badge-pill">
            ✓ Completed
          </div>
        )}

        {/* Autoplay Next Video Countdown Overlay */}
        {autoplayCountdown !== null && (
          <div className="autoplay-countdown-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="autoplay-card">
              <h4>Up Next</h4>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "4px 0 16px" }}>
                Next module starts in <strong>{autoplayCountdown}s</strong>
              </p>
              <div className="autoplay-actions">
                <button
                  className="secondary-btn"
                  onClick={() => setAutoplayCountdown(null)}
                >
                  ✕ Cancel Autoplay
                </button>
                <button
                  className="primary-btn"
                  onClick={() => {
                    setAutoplayCountdown(null);
                    if (onSelectNextVideo) onSelectNextVideo();
                  }}
                >
                  ▶ Play Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------------- CUSTOM CONTROLS OVERLAY BAR ---------------- */}
      <div className={`player-controls-container ${controlsVisible ? "visible" : "hidden"}`}>
        {/* Interactive Scrub Timeline Bar */}
        <div
          className="scrub-timeline-wrap"
          onClick={handleTimelineScrub}
          onMouseMove={handleTimelineHover}
          onMouseLeave={handleTimelineLeave}
        >
          {/* Hover Preview Tooltip */}
          {hoverPosition && (
            <div
              className="scrub-hover-tooltip"
              style={{ left: `${hoverPosition.x}px` }}
            >
              <div className="hover-time-text">{formatTime(hoverPosition.time)}</div>
            </div>
          )}

          {/* Buffered Progress */}
          <div
            className="buffer-bar-fill"
            style={{ width: `${bufferedPercent}%` }}
          />

          {/* Played Progress */}
          <div
            className="played-bar-fill"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          >
            <div className="scrub-handle" />
          </div>
        </div>

        {/* Controls Action Row */}
        <div className="controls-actions-row">
          {/* Left Controls: Play, Skip -10, Skip +10, Volume, Time */}
          <div className="controls-group-left">
            {/* Play / Pause Button */}
            <button
              className="ctrl-btn play-pause-btn"
              onClick={togglePlay}
              title={isPlaying ? "Pause (Space/k)" : "Play (Space/k)"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>

            {/* Seek -10s */}
            <button
              className="ctrl-btn"
              onClick={() => seekRelative(-10)}
              title="Seek Backward 10s (Left Arrow/j)"
            >
              ↺ 10s
            </button>

            {/* Seek +10s */}
            <button
              className="ctrl-btn"
              onClick={() => seekRelative(10)}
              title="Seek Forward 10s (Right Arrow/l)"
            >
              ↻ 10s
            </button>

            {/* Volume Icon & Draggable Slider */}
            <div className="volume-slider-group">
              <button
                className="ctrl-btn volume-btn"
                onClick={toggleMute}
                title={isMuted ? "Unmute (m)" : "Mute (m)"}
              >
                {isMuted || volume === 0 ? "🔇" : volume < 0.4 ? "🔉" : "🔊"}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="volume-range-input"
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
              <span className="volume-pct-label">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>

            {/* Time Display: Current / Total / Remaining */}
            <div className="time-display-box">
              <span className="time-current">{formatTime(currentTime)}</span>
              <span className="time-sep">/</span>
              <span className="time-total">{formatTime(duration)}</span>
              <span className="time-remaining">(-{formatTime(Math.max(0, duration - currentTime))})</span>
            </div>
          </div>

          {/* Right Controls: CC, Speed, Quality, PiP, Theater, Fullscreen, Next */}
          <div className="controls-group-right">
            {/* Subtitles (CC) Button & Language Picker */}
            <div className="popover-wrapper">
              <button
                className={`ctrl-btn cc-btn ${captionsEnabled ? "active" : ""}`}
                onClick={() => setCaptionsEnabled((prev) => !prev)}
                title="Subtitles/Captions (c)"
              >
                CC {captionLang.toUpperCase()}
              </button>
              {captionsEnabled && (
                <select
                  className="inline-lang-select"
                  value={captionLang}
                  onChange={(e) => setCaptionLang(e.target.value)}
                  title="Subtitle Language"
                >
                  <option value="en">English</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="es">Español</option>
                </select>
              )}
            </div>

            {/* Playback Speed Popover */}
            <div className="popover-wrapper">
              <button
                className="ctrl-btn speed-btn"
                onClick={() => setShowSpeedMenu((prev) => !prev)}
                title="Playback Speed (< / >)"
              >
                {playbackSpeed}×
              </button>
              {showSpeedMenu && (
                <div className="speed-dropdown-menu">
                  {[0.5, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      className={`speed-option-btn ${playbackSpeed === spd ? "selected" : ""}`}
                      onClick={() => handleSpeedChange(spd)}
                    >
                      {spd}× {spd === 1 && "(Normal)"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Video Quality Selector */}
            <div className="popover-wrapper">
              <button
                className="ctrl-btn quality-btn"
                onClick={() => setShowQualityMenu((prev) => !prev)}
                title="Video Quality"
              >
                {quality}
              </button>
              {showQualityMenu && (
                <div className="speed-dropdown-menu">
                  {["720p HD", "1080p Full HD", "2K QHD", "4K HDR", "Auto"].map((q) => (
                    <button
                      key={q}
                      className={`speed-option-btn ${quality === q ? "selected" : ""}`}
                      onClick={() => {
                        setQuality(q);
                        setShowQualityMenu(false);
                        onNotify?.(`Resolution set to ${q}`, "info");
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture-in-Picture */}
            <button
              className={`ctrl-btn pip-btn ${isPiP ? "active" : ""}`}
              onClick={togglePiP}
              title="Picture-in-Picture (p)"
            >
              🗗 PiP
            </button>

            {/* Theater Mode */}
            <button
              className={`ctrl-btn theater-btn ${isTheater ? "active" : ""}`}
              onClick={() => setIsTheater((prev) => !prev)}
              title="Theater Mode (t)"
            >
              ⧉ Theater
            </button>

            {/* Fullscreen Mode */}
            <button
              className="ctrl-btn fullscreen-btn"
              onClick={toggleFullscreen}
              title="Full Screen (f)"
            >
              {isFullscreen ? "↙ Exit" : "⛶ Full"}
            </button>

            {/* Next Video */}
            {onSelectNextVideo && (
              <button
                className="ctrl-btn next-btn"
                onClick={onSelectNextVideo}
                title="Next Video (n)"
              >
                ⏭ Next
              </button>
            )}

            {/* Shortcuts Help Guide */}
            <button
              className="ctrl-btn help-btn"
              onClick={() => setShowShortcutsModal(true)}
              title="Keyboard Shortcuts (?)"
            >
              ⌨
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          KEYBOARD SHORTCUTS MODAL
      ====================================================== */}
      {showShortcutsModal && (
        <div className="modal-overlay" onClick={() => setShowShortcutsModal(false)}>
          <div className="modal-dialog shortcuts-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⌨ Keyboard Shortcuts Reference</h3>
              <button className="close-btn" onClick={() => setShowShortcutsModal(false)}>✕</button>
            </div>
            <div className="modal-body shortcuts-grid">
              <div className="shortcut-row">
                <span className="key-badge">Space</span> / <span className="key-badge">k</span>
                <span>Play / Pause</span>
              </div>
              <div className="shortcut-row">
                <span className="key-badge">←</span> / <span className="key-badge">j</span>
                <span>Seek backward 10s</span>
              </div>
              <div className="shortcut-row">
                <span className="key-badge">→</span> / <span className="key-badge">l</span>
                <span>Seek forward 10s</span>
              </div>
              <div className="shortcut-row">
                <span className="key-badge">Shift + ← / →</span>
                <span>Skip larger interval (30s)</span>
              </div>
              <div className="shortcut-row">
                <span className="key-badge">↑ / ↓</span>
                <span>Adjust volume (+5% / -5%)</span>
              </div>
              <div className="shortcut-row">
                <span className="key-badge">m</span>
                <span>Mute / Unmute audio</span>
              </div>
              <div className="shortcut-row">
                <span className="key-badge">&lt;</span> / <span className="key-badge">&gt;</span>
                <span>Decrease / Increase speed</span>
              </div>
              <div className="shortcut-row">
                <span className="key-badge">t</span>
                <span>Toggle Theater mode</span>
              </div>
              <div className="shortcut-row">
                <span className="key-badge">f</span>
                <span>Toggle Full-screen</span>
              </div>
              <div className="shortcut-row">
                <span className="key-badge">p</span>
                <span>Toggle Picture-in-Picture</span>
              </div>
              <div className="shortcut-row">
                <span className="key-badge">c</span>
                <span>Toggle Subtitles (Captions)</span>
              </div>
              <div className="shortcut-row">
                <span className="key-badge">n</span>
                <span>Play Next video</span>
              </div>
              <div className="shortcut-row">
                <span className="key-badge">0 - 9</span>
                <span>Seek to 0% - 90% of duration</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="primary-btn" onClick={() => setShowShortcutsModal(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
