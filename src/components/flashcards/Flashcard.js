import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import Button from "@/components/ui/Button";
export function Flashcard({ data }) {
    const { nativeWord, englishWord, partOfSpeech, level, exampleSentence } = data;
    const [isFlipped, setIsFlipped] = useState(false);
    const [showExample, setShowExample] = useState(false);
    const handleFlip = () => {
        setIsFlipped((prev) => !prev);
    };
    const handleExampleToggle = (e) => {
        e?.stopPropagation(); // Prevent card flip when clicking example button
        setShowExample((prev) => !prev);
    };
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'basic':
                return 'bg-success-100 text-success-700 border-success-200';
            case 'intermediate':
                return 'bg-accent-100 text-accent-700 border-accent-200';
            case 'advanced':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };
    return (_jsx("div", { className: "w-[640px] h-[384px] lg:w-[960px] lg:h-[576px] max-w-[90vw] perspective cursor-pointer mx-auto", onClick: handleFlip, children: _jsxs("div", { className: `relative w-full h-full transition-transform duration-700 preserve-3d transform-gpu origin-center ${isFlipped ? "rotate-y-180" : ""}`, style: { willChange: 'transform' }, children: [_jsx("div", { className: `absolute inset-0 w-full h-full backface-hidden transition-opacity duration-300 ${isFlipped ? 'opacity-0' : 'opacity-100'}`, children: _jsxs("div", { className: "w-full h-full bg-white border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow relative p-8", children: [level && (_jsx("div", { className: `absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(level)}`, children: level.toUpperCase() })), partOfSpeech && (_jsx("div", { className: "absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700 border border-primary-200", children: partOfSpeech })), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-4xl sm:text-5xl font-semibold text-gray-800 mb-4", children: nativeWord }), _jsx("div", { className: "w-16 h-1 bg-primary-300 mx-auto rounded-full" })] }) }), exampleSentence && (_jsxs("div", { className: "absolute bottom-8 left-0 right-0 text-center", children: [_jsx(Button, { variant: "secondary", size: "sm", onClick: handleExampleToggle, className: "mb-4 border-2 border-gray-400 bg-white text-gray-700 hover:bg-gray-100", children: showExample ? 'Hide Example' : 'Show Example' }), _jsx("div", { className: `transition-all duration-300 overflow-hidden ${showExample ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`, children: _jsxs("p", { className: "text-lg text-gray-600 italic text-center px-4", children: ["\"", exampleSentence, "\""] }) })] }))] }) }), _jsx("div", { className: `absolute inset-0 w-full h-full backface-hidden rotate-y-180 transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0'}`, children: _jsxs("div", { className: "w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow relative p-8", children: [level && (_jsx("div", { className: `absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(level)}`, children: level.toUpperCase() })), partOfSpeech && (_jsx("div", { className: "absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium bg-primary-200 text-primary-800 border border-primary-300", children: partOfSpeech })), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-4xl sm:text-5xl font-semibold text-primary-800 mb-4", children: englishWord }), _jsx("div", { className: "w-16 h-1 bg-primary-400 mx-auto rounded-full" })] }) }), exampleSentence && (_jsxs("div", { className: "absolute bottom-8 left-0 right-0 text-center", children: [_jsx(Button, { variant: "secondary", size: "sm", onClick: handleExampleToggle, className: "mb-4 border-2 border-primary-400 bg-white text-primary-700 hover:bg-primary-50", children: showExample ? 'Hide Example' : 'Show Example' }), _jsx("div", { className: `transition-all duration-300 overflow-hidden ${showExample ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`, children: _jsxs("p", { className: "text-lg text-primary-700 italic text-center px-4", children: ["\"", exampleSentence, "\""] }) })] }))] }) })] }) }));
}
