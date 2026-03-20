import { Flashcard } from "@/components/flashcards/Flashcard";
import { Flashcard as FlashcardData } from "@/types/flashcard";

const testCard: FlashcardData = {
  id: "1",
  nativeWord: "แมว",
  englishWord: "Cat",
  partOfSpeech: "noun",
  level: "basic",
  exampleSentence: "The cat is sleeping on the mat.",
};

export default function FlashcardTest() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Flashcard data={testCard as any} />
    </div>
  );
}
