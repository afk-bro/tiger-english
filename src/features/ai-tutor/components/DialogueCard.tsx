import { useState } from 'react';
import type { TutorTurnDTO } from '../types';
import { DialogueButtons } from './DialogueButtons';

interface Props {
  turn: TutorTurnDTO;
  translation?: string | null; // optional Vi translation lookup
  onRepeat: () => void;
  onFlag: () => void;
}

export function DialogueCard({ turn, translation, onRepeat, onFlag }: Props) {
  const [hidden, setHidden] = useState(false);
  const [translated, setTranslated] = useState(false);

  if (turn.speaker === 'user') {
    return (
      <article className="ml-auto max-w-[80%] rounded-2xl bg-primary-50 dark:bg-primary-900/30 px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
        {turn.text_en}
      </article>
    );
  }

  // AI variant
  const displayText =
    translated && translation ? translation : hidden ? '— — —' : turn.text_en;
  return (
    <article className="mr-auto max-w-[80%] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-3 text-sm">
      <p className="font-medium text-gray-900 dark:text-gray-100">{displayText}</p>
      <DialogueButtons
        onRepeat={onRepeat}
        onTranslate={() => setTranslated((v) => !v)}
        onToggleHide={() => setHidden((v) => !v)}
        onFlag={onFlag}
        textHidden={hidden}
        isTranslated={translated}
      />
    </article>
  );
}
