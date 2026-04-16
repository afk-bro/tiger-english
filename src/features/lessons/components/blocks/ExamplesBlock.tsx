import type { ExampleItem } from "../../lesson.types";
type Props = { items: ExampleItem[] };
export default function ExamplesBlock({ items }: Props) {
  return (
    <div className="rounded-lg bg-semantic-surface-2 p-4 space-y-3">
      {items.map((item) => (
        <div key={`${item.english}-${item.translation}`} className="space-y-0.5">
          <p className="text-base text-semantic-text">{item.english}</p>
          <p className="text-sm text-semantic-text-muted">{item.translation}</p>
          {item.note && <p className="text-xs text-semantic-subtle italic">{item.note}</p>}
        </div>
      ))}
    </div>
  );
}
