import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/flashcards/DifficultySelector.tsx
import Button from "@/components/ui/Button";
export function DifficultySelector({ selectedDifficulty, onDifficultyChange }) {
    const difficulties = [
        { level: 'basic', label: 'Beginner' },
        { level: 'intermediate', label: 'Intermediate' },
        { level: 'advanced', label: 'Expert' },
    ];
    return (_jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center items-center py-6", children: [_jsx("h2", { className: "text-lg font-semibold text-primary-700 mb-2 sm:mb-0 sm:mr-4", children: "Choose your level:" }), _jsx("div", { className: "flex flex-col sm:flex-row gap-3", children: difficulties.map(({ level, label }) => (_jsx(Button, { variant: selectedDifficulty === level ? 'primary' : 'secondary', size: "md", className: `min-w-[120px] transition-all duration-200 ${selectedDifficulty === level
                        ? 'ring-2 ring-accent-400 ring-offset-2'
                        : 'hover:ring-1 hover:ring-primary-300'}`, onClick: () => onDifficultyChange(level), children: label }, level))) })] }));
}
