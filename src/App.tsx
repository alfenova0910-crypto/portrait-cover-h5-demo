import "./style.css";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const photos = [
  "./assets/photo-1.jpg",
  "./assets/photo-2.jpg",
  "./assets/photo-3.jpg",
  "./assets/photo-4.jpg",
  "./assets/photo-5.jpg",
  "./assets/photo-6.jpg",
];

type Phase = "cover" | "video" | "intro" | "gallery" | "ending";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("cover");
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [introReady, setIntroReady] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const timer = useRef<number | null>(null);
  const video = useRef<HTMLVideoElement>(null);

  const stopHold = () => {
    setHolding(false);
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    if (progress < 100) setProgress(0);
  };

  const startHold = () => {
    if (phase !== "cover" || timer.current) return;
    setHolding(true);
    timer.current = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(100, current + 4);
        if (next === 100) {
          if (timer.current) window.clearInterval(timer.current);
          timer.current = null;
          setPhase("video");
        }
        return next;
      });
    }, 45);
  };

  useEffect(() => {
    if (phase === "video") {
      video.current?.play().catch(() => undefined);
      const fallback = window.setTimeout(() => setPhase("intro"), 8000);
      return () => window.clearTimeout(fallback);
    }
    if (phase === "intro") {
      const timeout = window.setTimeout(() => setIntroReady(true), 1650);
      return () => window.clearTimeout(timeout);
    }
  }, [phase]);

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    if (video.current) video.current.muted = !next;
  };

  const ring = { "--progress": `${progress * 3.6}deg` } as CSSProperties;

  if (phase === "cover") return <main className={`cover ${holding ? "holding" : ""}`}>
    <div className="coverImage" />
    <div className="coverShade" />
    <div className="coverTop"><span>THE PORTRAIT</span><span>VOL. 01 / 2026</span></div>
    <div className="coverTitle"><p className="coverKicker">THE MOMENT SHE BECOMES</p><h1><span>此刻</span><br />的我</h1><em>林女士 · 人生封面</em><div className="coverMeta"><span>PORTRAIT STORY</span><span>01—06</span></div></div>
    <div className="coverBottom"><p>「我想留下的，是这一刻的自信。」</p><button className="hold" onPointerDown={startHold} onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold}><i className="ring" style={ring} /><span>{progress === 100 ? "正在进入" : "长按，打开人生封面"}</span><b>↗</b></button><small>请保持按住，镜头将随你推进</small></div>
  </main>;

  if (phase === "video") return <main className="videoScene">
    <div className="videoWait"><span>正在推开这一刻</span></div>
    <video style={{ opacity: videoReady ? 1 : 0 }} ref={video} src="./assets/opening.mp4" muted={!soundOn} playsInline preload="auto" onCanPlay={() => { setVideoReady(true); video.current?.play().catch(() => undefined); }} onEnded={() => setPhase("intro")} onError={() => setPhase("intro")} />
    <button className="sound" onClick={toggleSound}>{soundOn ? "声音 · 开" : "声音 · 关"}</button>
    <button className="skip" onClick={() => setPhase("intro")}>跳过片头</button>
    <div className="videoCaption">正在靠近<br />这一刻的自己</div>
  </main>;

  if (phase === "intro") return <main className="blackBridge" onClick={() => introReady && setPhase("gallery")}>
    <div className="bridgeCopy"><p>CHAPTER / ONE</p><h2>看见自己</h2><span>所有正在生长的你<br />都值得被认真看见</span></div>
    {introReady && <button className="enterScene">轻触，进入影像场景 <b>↓</b></button>}
  </main>;

  if (phase === "gallery") return <main className="galleryScene">
    <header><span>THE PORTRAIT</span><button onClick={() => setPhase("cover")}>重新开始</button></header>
    <div className="sceneTitle"><p>WOOD / 第一章</p><h1>看见自己</h1><span>轻触一幅影像，靠近此刻的她</span></div>
    <div className="frames">
      {[1, 3, 5].map((number, index) => <button className={`frame frame${index + 1}`} key={number} onClick={() => setSelected(number - 1)}><img src={photos[number - 1]} alt={`高光照片 ${index + 1}`} /><i>0{index + 1}</i></button>)}
    </div>
    <div className="sceneFooter"><span>第一章 · 完</span><button onClick={() => setPhase("ending")}>收下全部影像 →</button></div>
    {selected !== null && <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setSelected(null)}><div className="photoReveal"><img src={photos[selected]} alt="高光影像" /><p>{selected === 5 ? "愿你始终记得，今天的眼神。" : <>不必成为谁的标准，<br />你就是自己的光。</>}</p></div><button aria-label="关闭" className="close">×</button></div>}
  </main>;

  return <main className="endingScene">
    <div className="endingPortrait"><img src={photos[5]} alt="人物高光收尾" /></div>
    <div className="endingCopy"><p>YOUR PORTRAIT / 2026</p><h1>谢谢你，<br />认真看见自己。</h1><span>愿这些影像在未来某一天，<br />仍能提醒你此刻的笃定与光亮。</span></div>
    <div className="endingActions"><a href="./assets/all-photos.zip" download>下载全部照片</a><button onClick={() => setPhase("cover")}>再次观看</button><small>照片仅用于本次个人影像交付，请妥善保存</small></div>
  </main>;
}
