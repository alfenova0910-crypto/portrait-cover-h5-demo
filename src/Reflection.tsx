import { useEffect, useState } from "react";
import type { OrderConfig } from "./SummonCover";

const copyFor = (choice: string) => {
  if (choice === "strength") return ["力量，不是永远向前。", "是在看见自己以后，\n仍愿意坚定地站在这里。"];
  if (choice === "freedom") return ["自由，不是逃离定义。", "是终于允许自己，\n成为自己。"];
  if (choice === "transformation") return ["生长，不是成为另一个人。", "是让真实的你，\n拥有更辽阔的地方。"];
  return ["看见自己，", "便是所有光开始的地方。"];
};

export default function Reflection({ config, onComplete }: { config: OrderConfig; onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const lines = copyFor(config.choice);
  useEffect(() => {
    const one = window.setTimeout(() => setStep(1), 550);
    const two = window.setTimeout(() => setStep(2), 1850);
    const three = window.setTimeout(() => setStep(3), 3400);
    return () => [one, two, three].forEach(window.clearTimeout);
  }, []);
  return <main className="reflection-scene">
    <div className="reflection-portrait" style={{ backgroundImage: `url(${config.photos[5]})` }} />
    <div className="reflection-glow" />
    <p className={`reflection-kicker ${step >= 1 ? "is-visible" : ""}`}>{config.keywords.join(" · ")}</p>
    <h1 className={`reflection-line reflection-first ${step >= 1 ? "is-visible" : ""}`}>{lines[0]}</h1>
    <h2 className={`reflection-line reflection-second ${step >= 2 ? "is-visible" : ""}`}>{lines[1].split("\n").map(part => <span key={part}>{part}</span>)}</h2>
    <button className={`reflection-next ${step >= 3 ? "is-visible" : ""}`} onClick={onComplete}>收下全部影像 <b>→</b></button>
  </main>;
}
