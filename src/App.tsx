import "./style.css";
import { useEffect, useRef, useState } from "react";
import SummonCover from "./SummonCover";
import MemorySpace from "./MemorySpace";
import ChapterPortal from "./ChapterPortal";
import Reflection from "./Reflection";
import type { OrderConfig } from "./SummonCover";
import orderData from "./config/order.json";

const config = orderData as OrderConfig;

type Phase = "cover" | "intro" | "portal" | "memory" | "reflection" | "gallery" | "ending";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("cover");
  const [introReady, setIntroReady] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  if (!musicRef.current) {
    const music = new Audio(config.backgroundMusic);
    music.preload = "auto";
    music.loop = false;
    music.volume = 0.52;
    musicRef.current = music;
  }
  const startMusic = () => {
    const music = musicRef.current;
    if (!music) return;
    if (music.ended) music.currentTime = 0;
    music.play().catch(() => {});
  };

  useEffect(() => () => { musicRef.current?.pause(); }, []);

  // 由订单数据驱动的消费入口
  const { photos, tier, choice, themeSkin } = config;

  const handleSummonComplete = () => setPhase("intro");
  const handleSummonFallback = () => setPhase("intro");

  useEffect(() => {
    if (phase === "intro") {
      const timeout = window.setTimeout(() => setIntroReady(true), 1650);
      return () => window.clearTimeout(timeout);
    }
  }, [phase]);

  // ---- 封面阶段 ----
  if (phase === "cover") {
    return (
      <>
      <SummonCover
        config={config}
        onComplete={handleSummonComplete}
        onFallback={handleSummonFallback}
        onActivate={startMusic}
      />
      </>
    );
  }

  // ---- 黑场章节（数据驱动章节标题） ----
  if (phase === "intro") {
    // 根据 choice 决定章节文案
    const chapterTitle =
      choice === "strength" ? "力量" :
      choice === "freedom" ? "自由" :
      choice === "transformation" ? "蜕变" : "看见自己";

    const chapterSub =
      choice === "strength" ? "她站在那里，像一束光穿过尘埃。" :
      choice === "freedom" ? "不需要被定义，她本身就是风的形状。" :
      choice === "transformation" ? "在成为自己的路上，她从不回头。" :
      "她站在那里，像一束光穿过尘埃。";

    return (
      <>
      <main className="blackBridge">
        <div className={`bridgeContent ${introReady ? "bridgeReady" : ""}`}>
          <p className="bridgeKicker">{themeSkin.toUpperCase()} / 第一章</p>
          <h1 className="bridgeTitle">{chapterTitle}</h1>
          <p className="bridgeSub">{chapterSub}</p>
          <span className="bridgeNext" onClick={() => setPhase("portal")}>
            {introReady ? "轻触，走进她的记忆 →" : ""}
          </span>
        </div>
      </main>
      </>
    );
  }

  if (phase === "portal") {
    return <ChapterPortal src={config.chapterVideo} onComplete={() => setPhase("memory")} />;
  }

  if (phase === "memory") {
    return <MemorySpace config={config} onComplete={() => setPhase("reflection")} />;
  }

  if (phase === "reflection") {
    return <Reflection config={config} onComplete={() => setPhase("ending")} />;
  }

  // ---- 保留的旧照片展示（不再从主流程进入）

  if (phase === "gallery") {
    const chapterTitle =
      choice === "strength" ? "力量" :
      choice === "freedom" ? "自由" :
      choice === "transformation" ? "蜕变" : "看见自己";

    return (
      <main className="galleryScene">
        <div className="sceneTitle">
          <p>{themeSkin.toUpperCase()} / 第一章</p>
          <h1>{chapterTitle}</h1>
          <span>轻触一幅影像，靠近此刻的她</span>
        </div>
        <div className="frames">
          {[1, 3, 5].map((number, index) => (
            <button
              className={`frame frame${index + 1}`}
              key={number}
              onClick={() => setSelected(number - 1)}
            >
              <img src={photos[number - 1]} alt={`高光照片 ${index + 1}`} />
              <i>0{index + 1}</i>
            </button>
          ))}
        </div>
        <div className="sceneFooter">
          <span>第一章 · 完</span>
          <button onClick={() => setPhase("ending")}>收下全部影像 →</button>
        </div>
        {selected !== null && (
          <div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            onClick={() => setSelected(null)}
          >
            <div className="photoReveal">
              <img src={photos[selected]} alt="高光影像" />
              <p>
                {selected === 5
                  ? "愿你始终记得，今天的眼神。"
                  : <>不必成为谁的标准，<br />你就是自己的光。</>}
              </p>
            </div>
            <button aria-label="关闭" className="close">×</button>
          </div>
        )}
      </main>
    );
  }

  // ---- 结尾 ----
  return (
    <main className="endingScene">
      <div className="endingPortrait">
        <img src={photos[5]} alt="人物高光收尾" />
      </div>
      <div className="endingCopy">
        <p>YOUR PORTRAIT / 2026</p>
        <h1>谢谢你，<br />认真看见自己。</h1>
        <span>
          愿这些影像在未来某一天，<br />
          仍能提醒你此刻的笃定与光亮。
        </span>
      </div>
      <div className="endingActions">
        <a href="./assets/all-photos.zip" download>下载全部照片</a>
        <button onClick={() => setPhase("cover")}>再次观看</button>
        <small>照片仅用于本次个人影像交付，请妥善保存</small>
      </div>
    </main>
  );
}