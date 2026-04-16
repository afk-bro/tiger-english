import { clsx } from "clsx";
import type { DialogueLine } from "../../lesson.types";
type Props = { lines: DialogueLine[] };
export default function DialogueBlock({ lines }: Props) {
  return (
    <div className="space-y-3">
      {lines.map((line, i) => (
        <div key={i} className={clsx("max-w-[85%] rounded-lg p-3", i % 2 === 0 ? "bg-primary-500/10 mr-auto" : "bg-semantic-surface-2 ml-auto")}>
          <p className="text-xs font-semibold text-semantic-text-muted mb-1">{line.speaker}</p>
          <p className="text-base text-semantic-text">{line.text}</p>
          <p className="text-sm text-semantic-text-muted mt-1">{line.translation}</p>
        </div>
      ))}
    </div>
  );
}
