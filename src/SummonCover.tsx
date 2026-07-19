import { useEffect, useRef, useState, useCallback, type CSSProperties } from "react";

export interface OrderConfig {
  orderId: string;
  customerName: string;
  shootDate: string;
  tier: string;
  choice: string;
  themeSkin: string;
  keywords: string[];
  summonPortrait: string;
  summonPortraitFocus: string;
  photos: string[];
  openingVideo: string;
  chapterVideo?: string;
  memoryBackdrop?: string;
  backgroundMusic?: string;
  downloadUrl: string;
}

type Phase = "idle" | "summoning" | "reveal" | "dimming" | "loading" | "playing" | "outro";

interface Props {
  config: OrderConfig;
  onComplete: () => void;
  onFallback: () => void;
  onActivate?: () => void;
}

const HOLD_MS = 2500;
const VIDEO_TIMEOUT_MS = 8000;
const FADE_IN_MS = 300;
const REVEAL_HOLD_MS = 650;
const PORTRAIT_DIM_MS = 850;
const VIDEO_OUTRO_MS = 1250;

export default function SummonCover({ config, onComplete, onFallback, onActivate }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [soundOn, setSoundOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const completedRef = useRef(false);

  const safeSetPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);
      if (sequenceRef.current) clearTimeout(sequenceRef.current);
    };
  }, []);

  // ---- 视频预加载（仅挂载一次，监听 loadeddata）----
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      // 视频首帧已解码
      return;
    }
    // 不额外设置 state，等 enterLoading 时检查 readyState
  }, []);

  // ---- 长按逻辑 ----
  const startHold = useCallback(() => {
    if (phaseRef.current !== "idle") return;
    if (completedRef.current) return;
    completedRef.current = false;
    onActivate?.();
    setSoundOn(true);
    safeSetPhase("summoning");
    setProgress(0);
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const pct = Math.min(100, (elapsed / HOLD_MS) * 100);
      setProgress(pct);

      if (pct >= 100) {
        completedRef.current = true;
        beginReveal();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const cancelHold = useCallback(() => {
    if (completedRef.current) return;
    if (phaseRef.current !== "summoning") return;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    safeSetPhase("idle");
    setProgress(0);
  }, []);

  // ---- 进入黑场加载 ----
  const enterLoading = useCallback(() => {
    safeSetPhase("loading");

    // 8 秒超时
    fallbackRef.current = setTimeout(() => {
      if (phaseRef.current === "loading" || phaseRef.current === "playing") {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (fadeRef.current) clearTimeout(fadeRef.current);
        onFallback();
      }
    }, VIDEO_TIMEOUT_MS);

    // 检查视频是否已就绪
    const v = videoRef.current;
    if (v && v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      scheduleFadeIn();
    } else {
      // 等 loadeddata，出错则由全局 handleVideoError 处理
      const onReady = () => {
        v?.removeEventListener('loadeddata', onReady);
        if (phaseRef.current === 'loading') {
          scheduleFadeIn();
        }
      };
      v?.addEventListener('loadeddata', onReady);
    }
  }, [onFallback]);

  const scheduleFadeIn = useCallback(() => {
    if (fadeRef.current) clearTimeout(fadeRef.current);
    fadeRef.current = setTimeout(() => {
      safeSetPhase("playing");
      videoRef.current?.play().catch(() => {});
      if (fallbackRef.current) {
        clearTimeout(fallbackRef.current);
        fallbackRef.current = null;
      }
    }, FADE_IN_MS);
  }, []);

  // ---- 视频事件 ----
  const beginReveal = useCallback(() => {
    safeSetPhase("reveal");
    sequenceRef.current = setTimeout(() => {
      safeSetPhase("dimming");
      sequenceRef.current = setTimeout(() => enterLoading(), PORTRAIT_DIM_MS);
    }, REVEAL_HOLD_MS);
  }, []);

  const handleVideoEnded = useCallback(() => {
    safeSetPhase("outro");
    sequenceRef.current = setTimeout(onComplete, VIDEO_OUTRO_MS);
  }, [onComplete]);

  const handleVideoError = useCallback(() => {
    if (phaseRef.current === "loading" || phaseRef.current === "playing") {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
      onFallback();
    }
  }, [onFallback]);



  // ---- 可见性变化 ----
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        if (phaseRef.current === "summoning") {
          safeSetPhase("idle");
          setProgress(0);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // ---- 计算样式 ----
  const isPeak = phase === "reveal" || phase === "dimming";
  const grayscale = isPeak ? 0 : Math.max(0, 1 - progress * 0.008);
  const saturate = isPeak ? 0.88 : Math.max(0.1, progress * 0.006 + 0.1);
  const brightness = isPeak ? 1.05 : 0.55 + progress * 0.003;
  const scale = 1 + progress * 0.0012;
  const scanX = `${-50 + progress * 1.5}%`;

  const nameOpacity = progress >= 20 ? Math.min(1, (progress - 20) / 10) : 0;
  const dateOpacity = progress >= 40 ? Math.min(1, (progress - 40) / 10) : 0;
  const keywordOpacity = progress >= 60 ? Math.min(1, (progress - 60) / 10) : 0;

  const portraitStyle: CSSProperties = {
    backgroundImage: `url(${config.summonPortrait})`,
    backgroundPosition: config.summonPortraitFocus,
    filter: `grayscale(${grayscale}) saturate(${saturate}) brightness(${brightness})`,
    transform: `scale(${scale})`,
  };

  const scanStyle: CSSProperties = {
    transform: `translateX(${scanX})`,
  };

  // 视频元素类名：根据 phase 控制可见性
  const isVideoVisible = phase === "playing" || phase === "outro";
  const videoClass = isVideoVisible ? "summon-video" : "summon-video-bg";
  const videoMuted = true;

  // ---- 渲染（所有 phase 共享同一 video 元素）----
  return (
    <main
      className={`summon-cover ${phase === "summoning" ? "is-summoning" : ""} ${phase === "reveal" ? "is-reveal" : ""} ${phase === "dimming" ? "is-dimming" : ""} ${phase === "loading" ? "is-loading" : ""} ${phase === "playing" ? "is-playing" : ""} ${phase === "outro" ? "is-outro" : ""}`}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
    >
      {/* 背景肖像（idle / summoning 时显示） */}
      {phase !== "loading" && phase !== "playing" && phase !== "outro" && (
        <>
          <div className="summon-portrait" style={portraitStyle} />
          <div className="summon-shade" />
          <div className="summon-scan" style={scanStyle} aria-hidden="true" />
        </>
      )}

      {/* 黑场遮罩（loading 时显示，playing 时淡出） */}
      {phase === "dimming" && <div className="summon-portrait-dim" />}
      {phase === "loading" && <div className="summon-black" />}
      {phase === "playing" && <div className="summon-black-fade" />}
      {phase === "outro" && <div className="summon-video-outro" />}

      {/* 单视频元素：始终挂载，通过 class 控制可见性 */}
      <video
        ref={videoRef}
        src={config.openingVideo}
        muted={videoMuted}
        playsInline
        preload="auto"
        className={videoClass}
        onEnded={handleVideoEnded}
        onError={handleVideoError}
      />

      {/* 播放控制（playing 时显示） */}
      {phase === "playing" && (
        <>
        </>
      )}

      {phase !== "loading" && phase !== "playing" && phase !== "outro" && <div className="summon-cover-title" style={{ opacity: progress >= 35 ? Math.min(1, (progress - 35) / 35) : 0 }}>此刻的我</div>}

      {phase === "idle" && !soundOn && <button className="summon-audio-start" onPointerDown={e => { e.stopPropagation(); setSoundOn(true); onActivate?.(); }}>轻触开启声音</button>}

      {/* 引导提示（idle 时显示） */}
      {phase === "idle" && (
        <div className="summon-hint">
          <span className="summon-hint-text">长按，唤醒这一刻的你</span>
          <span className="summon-hint-arrow">↘</span>
        </div>
      )}

      {/* 底部信息区（idle / summoning 时显示） */}
      {phase !== "loading" && phase !== "playing" && phase !== "outro" && (
        <div className="summon-info">
          {config.keywords.length > 0 && (
            <p className="summon-keywords" style={{ opacity: keywordOpacity }}>
              {config.keywords.map((kw, i) => (
                <span key={kw} className="summon-keyword">
                  {kw}
                  {i < config.keywords.length - 1 && (
                    <span className="summon-keyword-dot"> · </span>
                  )}
                </span>
              ))}
            </p>
          )}
          <p className="summon-date" style={{ opacity: dateOpacity }}>
            {config.shootDate}
          </p>
          <h1 className="summon-name" style={{ opacity: nameOpacity }}>
            {config.customerName}
          </h1>
        </div>
      )}
    </main>
  );
}