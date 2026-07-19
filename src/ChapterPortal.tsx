import { useRef, useState } from "react";

export default function ChapterPortal({ src, onComplete }: { src?: string; onComplete: () => void }) {
  const [sinking, setSinking] = useState(false);
  const [ready, setReady] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  if (!src) { onComplete(); return null; }
  return <main className={`chapter-portal ${sinking ? "is-sinking" : ""}`}>
    <video ref={video} src={src} autoPlay muted playsInline preload="auto"
      onCanPlay={() => { setReady(true); video.current?.play().catch(() => {}); }}
      onTimeUpdate={() => { const v=video.current; if (v && v.duration && v.currentTime >= Math.max(0, v.duration - 1.05)) setSinking(true); }}
      onEnded={onComplete} onError={onComplete} />
    <div className="portal-sink" />
    {!ready && <span className="portal-wait">正在走进光里</span>}
    <button className="portal-skip" onClick={onComplete}>跳过</button>
  </main>;
}
