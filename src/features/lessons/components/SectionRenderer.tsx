import type { Section, SectionBlock } from "../lesson.types";
import TextBlock from "./blocks/TextBlock";
import HeadingBlock from "./blocks/HeadingBlock";
import ExamplesBlock from "./blocks/ExamplesBlock";
import VocabListBlock from "./blocks/VocabListBlock";
import DialogueBlock from "./blocks/DialogueBlock";
import CalloutBlock from "./blocks/CalloutBlock";
import ExerciseBlock from "./blocks/ExerciseBlock";

function renderBlock(block: SectionBlock) {
  switch (block.type) {
    case "text": return <TextBlock content={block.content} />;
    case "heading": return <HeadingBlock content={block.content} />;
    case "examples": return <ExamplesBlock items={block.items} />;
    case "vocab-list": return <VocabListBlock items={block.items} />;
    case "dialogue": return <DialogueBlock lines={block.lines} />;
    case "callout": return <CalloutBlock variant={block.variant} content={block.content} />;
    case "exercise": return <ExerciseBlock exerciseType={block.exerciseType} exerciseId={block.exerciseId} />;
    default: return null;
  }
}

type Props = { section: Section };
export default function SectionRenderer({ section }: Props) {
  return (
    <div className="space-y-6">
      {section.blocks.map((block) => <div key={block.id}>{renderBlock(block)}</div>)}
    </div>
  );
}
