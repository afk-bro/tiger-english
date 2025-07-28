import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/flashcards/FlashcardViewer.tsx
import { useState, useEffect } from "react";
import { Flashcard } from "./Flashcard";
import Button from "@/components/ui/Button";
// Mock flashcard data using the complete Flashcard interface
const mockFlashcards = [
    // Basic Level Cards
    {
        id: '1',
        nativeWord: 'สวัสดี',
        englishWord: 'Hello',
        partOfSpeech: 'interjection',
        level: 'basic',
        exampleSentence: 'สวัสดีครับ - Hello (polite form)',
        imageUrl: '/images/hello.jpg'
    },
    {
        id: '2',
        nativeWord: 'น้ำ',
        englishWord: 'Water',
        partOfSpeech: 'noun',
        level: 'basic',
        exampleSentence: 'ฉันดื่มน้ำ - I drink water'
    },
    {
        id: '3',
        nativeWord: 'อาหาร',
        englishWord: 'Food',
        partOfSpeech: 'noun',
        level: 'basic',
        exampleSentence: 'อาหารอร่อย - The food is delicious'
    },
    // Intermediate Level Cards
    {
        id: '4',
        nativeWord: 'การศึกษา',
        englishWord: 'Education',
        partOfSpeech: 'noun',
        level: 'intermediate',
        exampleSentence: 'การศึกษาสำคัญมาก - Education is very important'
    },
    {
        id: '5',
        nativeWord: 'ประสบการณ์',
        englishWord: 'Experience',
        partOfSpeech: 'noun',
        level: 'intermediate',
        exampleSentence: 'เขามีประสบการณ์มาก - He has a lot of experience'
    },
    {
        id: '6',
        nativeWord: 'โอกาส',
        englishWord: 'Opportunity',
        partOfSpeech: 'noun',
        level: 'intermediate',
        exampleSentence: 'นี่เป็นโอกาสดี - This is a good opportunity'
    },
    // Advanced Level Cards
    {
        id: '7',
        nativeWord: 'ความรับผิดชอบ',
        englishWord: 'Responsibility',
        partOfSpeech: 'noun',
        level: 'advanced',
        exampleSentence: 'เขามีความรับผิดชอบสูง - He has high responsibility'
    },
    {
        id: '8',
        nativeWord: 'การพัฒนา',
        englishWord: 'Development',
        partOfSpeech: 'noun',
        level: 'advanced',
        exampleSentence: 'การพัฒนาเทคโนโลยี - Technology development'
    },
    {
        id: '9',
        nativeWord: 'ความเข้าใจ',
        englishWord: 'Understanding',
        partOfSpeech: 'noun',
        level: 'advanced',
        exampleSentence: 'ความเข้าใจที่ลึกซึ้ง - Deep understanding'
    }
];
export function FlashcardViewer({ selectedDifficulty }) {
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    // Filter cards based on selected difficulty
    const filteredCards = selectedDifficulty
        ? mockFlashcards.filter(card => card.level === selectedDifficulty)
        : mockFlashcards;
    // Reset to first card when difficulty changes
    useEffect(() => {
        setCurrentCardIndex(0);
    }, [selectedDifficulty]);
    // Handle navigation
    const goToPrevious = () => {
        setCurrentCardIndex(prev => prev === 0 ? filteredCards.length - 1 : prev - 1);
    };
    const goToNext = () => {
        setCurrentCardIndex(prev => prev === filteredCards.length - 1 ? 0 : prev + 1);
    };
    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'ArrowLeft') {
                goToPrevious();
            }
            else if (event.key === 'ArrowRight') {
                goToNext();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [filteredCards.length]);
    // Show empty state if no cards available
    if (filteredCards.length === 0) {
        return (_jsx("div", { className: "flex flex-col items-center justify-center py-16", children: _jsxs("div", { className: "text-center", children: [_jsx("h3", { className: "text-xl font-semibold text-primary-700 mb-2", children: "No flashcards available" }), _jsx("p", { className: "text-primary-600", children: selectedDifficulty
                            ? `No cards found for ${selectedDifficulty} level`
                            : 'No flashcards to display' })] }) }));
    }
    const currentCard = filteredCards[currentCardIndex];
    return (_jsxs("div", { className: "flex flex-col items-center space-y-6 py-8", children: [_jsxs("div", { className: "text-sm text-primary-600 font-medium", children: ["Card ", currentCardIndex + 1, " of ", filteredCards.length, selectedDifficulty && (_jsx("span", { className: "ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs capitalize", children: selectedDifficulty }))] }), _jsx("div", { className: "flex justify-center", children: _jsx(Flashcard, { data: currentCard }) }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(Button, { variant: "secondary", size: "sm", onClick: goToPrevious, className: "px-4 py-2", children: "\u2190 Previous" }), _jsx("div", { className: "flex space-x-1", children: filteredCards.map((_, index) => (_jsx("button", { onClick: () => setCurrentCardIndex(index), className: `w-2 h-2 rounded-full transition-colors ${index === currentCardIndex
                                ? 'bg-primary-500'
                                : 'bg-primary-200 hover:bg-primary-300'}`, "aria-label": `Go to card ${index + 1}` }, index))) }), _jsx(Button, { variant: "secondary", size: "sm", onClick: goToNext, className: "px-4 py-2", children: "Next \u2192" })] }), _jsx("p", { className: "text-xs text-primary-500 text-center", children: "Use \u2190 \u2192 arrow keys to navigate" })] }));
}
