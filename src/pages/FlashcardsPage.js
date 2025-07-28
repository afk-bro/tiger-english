import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/FlashcardsPage.tsx
import { useState } from "react";
import { DifficultySelector } from "@/components/flashcards/DifficultySelector";
import { FlashcardViewer } from "@/components/flashcards/FlashcardViewer";
import { ActionBar } from "@/components/flashcards/ActionBar";
export default function FlashcardsPage() {
    const [selectedDifficulty, setSelectedDifficulty] = useState(null);
    return (_jsx("div", { className: "min-h-screen bg-surface-light dark:bg-surface-dark", children: _jsxs("div", { className: "container mx-auto px-4 py-8 max-w-6xl", children: [_jsx(DifficultySelector, { selectedDifficulty: selectedDifficulty, onDifficultyChange: setSelectedDifficulty }), _jsx(FlashcardViewer, { selectedDifficulty: selectedDifficulty }), _jsx("div", { className: "mt-12", children: _jsx(ActionBar, {}) })] }) }));
}
