import { useEffect, useState, type CSSProperties } from "react";
import type { OrderConfig } from "./SummonCover";

type Node = { photo: number; title: string; line: string; x: number; y: number; depth: number };

const nodes: Node[] = [
  { photo: 0, title: "看见", line: "她不必成为谁的标准。", x: 69, y: 46, depth: 1 },
  { photo: 2, title: "靠近", line: "光落下来，她站在自己的中心。", x: 80, y: 24, depth: 0.62 },
  { photo: 4, title: "留下", line: "这一刻，值得被认真收藏。", x: 25, y: 74, depth: 0.35 },
];

export default function MemorySpace({ config, onComplete }: { config: OrderConfig; onComplete: () => void }) {
  const [revealed, setRevealed] = useState<number[]>([]);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => { setArrived(true); setRevealed([0]); }, 540);
    return () => window.clearTimeout(timer);
  }, []);

  const reveal = (index: number) => setRevealed(prev => prev.includes(index) ? prev : [...prev, index]);
  const styleFor = (node: Node, index: number): CSSProperties => ({
    left: `${node.x}%`, top: `${node.y}%`,
    backgroundImage: `url(${config.photos[node.photo]})`,
    opacity: revealed.includes(index) ? 1 : index === 0 ? 0 : .22,
    transform: `translate(-50%,-50%) scale(${revealed.includes(index) ? 1 : .76 + node.depth * .12})`,
  });

  return <main className={`memory-space ${arrived ? "is-arrived" : ""}`} style={{ backgroundImage: `url(${config.memoryBackdrop || ""})` }}>
    <div className="space-veil" />
    <div className="space-copy"><span>CHAPTER / ONE</span><h1>看见自己</h1><p>{revealed.length < 2 ? "光里，有尚未被看见的瞬间" : "轻触远处微光，继续靠近她"}</p></div>
    {nodes.map((node, index) => <button key={node.title} className={`memory-node ${revealed.includes(index) ? "is-open" : ""} ${index === 0 ? "is-primary" : ""}`} style={styleFor(node,index)}
      disabled={index === 0 || revealed.includes(index)} onClick={() => reveal(index)}>
      <i>{String(index + 1).padStart(2,"0")}</i>
      {revealed.includes(index) && <div className="memory-line"><b>{node.title}</b><span>{node.line}</span></div>}
      {!revealed.includes(index) && index > 0 && <em>轻触显影</em>}
    </button>)}
    {revealed.length === nodes.length && <button className="space-finish" onClick={onComplete}>收下全部影像 <b>→</b></button>}
  </main>;
}
