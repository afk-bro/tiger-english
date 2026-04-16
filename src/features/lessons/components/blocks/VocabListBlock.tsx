import { useState } from "react";
import type { VocabItem } from "../../lesson.types";

function VocabCard({ item }: { item: VocabItem }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped(!flipped)}
      className="w-full text-left card card-interactive p-4 min-h-[100px] flex flex-col justify-center"
    >
      {!flipped ? (
        <>
          <p className="text-lg font-semibold text-semantic-text">{item.word}</p>
          {item.phonetic && <p className="text-xs text-semantic-subtle mt-1">/{item.phonetic}/</p>}
          <p className="text-xs text-semantic-text-muted mt-2">Tap to reveal</p>
        </>
      ) : (
        <>
          <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">{item.translation}</p>
          {item.example && <p className="text-sm text-semantic-text-muted mt-2 italic">"{item.example}"</p>}
        </>
      )}
    </button>
  );
}

type Props = { items: VocabItem[] };
export default function VocabListBlock({ items }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, i) => <VocabCard key={i} item={item} />)}
    </div>
  );
}
