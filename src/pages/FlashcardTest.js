import { jsx as _jsx } from "react/jsx-runtime";
import { Flashcard } from "@/components/flashcards/Flashcard";
const testCard = {
    id: "1",
    nativeWord: "แมว",
    englishWord: "Cat",
    partOfSpeech: "noun",
    level: "basic",
    exampleSentence: "The cat is sleeping on the mat.",
};
export default function FlashcardTest() {
    return (_jsx("div", { className: "min-h-screen bg-gray-100 flex items-center justify-center", children: _jsx(Flashcard, { data: testCard }) }));
}
