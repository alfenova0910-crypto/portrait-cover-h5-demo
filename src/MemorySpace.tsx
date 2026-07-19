import { useEffect, useState, type CSSProperties } from "react";
import type { OrderConfig } from "./SummonCover";

type Node = { photo: number; title: string; line: string; x: number; y: number; delay: number };
const nodes: Node[] = [
  { photo: 0, title: "看见", line: "她不必成为谁的标准。", x: 51, y: 56, delay: 2350 },
  { photo: 2, title: "靠近", line: "光落下来，她站在自己的中心。", x: 17, y: 31, delay: 2670 },
  { photo: 4, title: "留下", line: "这一刻，值得被认真收藏。", x: 83, y: 70, delay: 2990 },
];

export default function MemorySpace({ config, onComplete }: { config: OrderConfig; onComplete: () => void }) {
  const [visible, setVisible] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [opened, setOpened] = useState<number[]>([]);

  useEffect(() => {
    const timers = nodes.map((node, index) => window.setTimeout(() => setVisible(prev => [...prev, index]), node.delay));
    return () => timers.forEach(window.clearTimeout);
  }, []);
  const open = (index: number) => { setSelected(index); setOpened(prev => prev.includes(index) ? prev : [...prev, index]); };
  const styleFor = (node: Node): CSSProperties => ({ left: `${node.x}%`, top: `${node.y}%`, backgroundImage: `url(${config.photos[node.photo]})` });

  return <main className={`memory-space clean-space ${visible.length ? "is-populated" : ""}`}>
    <div className="space-void" /><div className="space-horizon" /><div className="space-ray space-ray-one" /><div className="space-ray space-ray-two" />
    <div className="space-copy"><span>CHAPTER / ONE</span><h1>看见自己</h1><p>三束微光，正在靠近</p></div>
    {nodes.map((node, index) => <button key={node.title} className={`memory-node node-${index} ${visible.includes(index) ? "is-open" : ""} ${index === 0 ? "is-primary" : ""}`} style={styleFor(node)} onClick={() => open(index)}>
      <i>{String(index + 1).padStart(2, "0")}</i><span className="node-light" />
      <div className="memory-line" aria-hidden="true"><b>{node.title}</b><span>{node.line}</span></div>
    </button>)}
    {opened.length === nodes.length && <button className="space-finish" onClick={onComplete}>收下全部影像 <b>→</b></button>}
    {selected !== null && <div className="memory-lightbox" onClick={() => setSelected(null)}><div className="memory-reveal" onClick={e => e.stopPropagation()}><img src={config.photos[nodes[selected].photo]} alt={nodes[selected].title} /><p><b>{nodes[selected].title}</b>{nodes[selected].line}</p><button onClick={() => setSelected(null)}>×</button></div></div>}
  </main>;
}
