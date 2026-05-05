import type { Section, SectionBlock } from "../lesson.types";
import TextBlock from "./blocks/TextBlock";
import HeadingBlock from "./blocks/HeadingBlock";
import ExamplesBlock from "./blocks/ExamplesBlock";
import VocabListBlock from "./blocks/VocabListBlock";
import DialogueBlock from "./blocks/DialogueBlock";
import CalloutBlock from "./blocks/CalloutBlock";
import ExerciseBlock from "./blocks/ExerciseBlock";
import OutputTaskBlock from "./blocks/OutputTaskBlock";

function renderBlock(block: SectionBlock, onExerciseCorrect: (() => void) | undefined, unitSlug: string, sectionKey: string) {
  switch (block.type) {
    case "text": return <TextBlock content={block.content} translations={block.translations} />;
    case "heading": return <HeadingBlock content={block.content} translations={block.translations} />;
    case "examples": return <ExamplesBlock items={block.items} />;
    case "vocab-list": return <VocabListBlock items={block.items} />;
    case "dialogue": return <DialogueBlock lines={block.lines} imageUrl={block.imageUrl} />;
    case "callout": return <CalloutBlock variant={block.variant} content={block.content} translations={block.translations} />;
    case "exercise": return <ExerciseBlock exerciseType={block.exerciseType} exerciseId={block.exerciseId} imageUrl={block.imageUrl} onCorrect={onExerciseCorrect} unitSlug={unitSlug} sectionKey={sectionKey} />;
    case "output-task": return <OutputTaskBlock prompt={block.prompt} minWords={block.minWords} maxWords={block.maxWords} translations={block.translations} />;
    default: return null;
  }
}

type Props = {
  section: Section;
  onExerciseCorrect?: () => void;
  unitSlug: string;
  sectionKey: string;
};

export default function SectionRenderer({ section, onExerciseCorrect, unitSlug, sectionKey }: Props) {
  return (
    <div className="space-y-6">
      {section.blocks.map((block) => (
        <div key={block.id}>{renderBlock(block, onExerciseCorrect, unitSlug, sectionKey)}</div>
      ))}
    </div>
  );
}
