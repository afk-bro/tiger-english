// src/components/flashcards/DifficultySelector.tsx
import Button from "@/components/ui/Button";

type DifficultyLevel = 'basic' | 'intermediate' | 'advanced';

interface DifficultySelectorProps {
  selectedDifficulty: DifficultyLevel | null;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
}

export function DifficultySelector({ selectedDifficulty, onDifficultyChange }: DifficultySelectorProps) {
  const difficulties: { level: DifficultyLevel; label: string }[] = [
    { level: 'basic', label: 'Beginner' },
    { level: 'intermediate', label: 'Intermediate' },
    { level: 'advanced', label: 'Expert' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center py-6">
      <h2 className="text-lg font-semibold text-primary-700 mb-2 sm:mb-0 sm:mr-4">
        Choose your level:
      </h2>
      <div className="flex flex-col sm:flex-row gap-3">
        {difficulties.map(({ level, label }) => (
          <Button
            key={level}
            variant={selectedDifficulty === level ? 'primary' : 'secondary'}
            size="md"
            className={`min-w-[120px] transition-all duration-200 ${
              selectedDifficulty === level 
                ? 'ring-2 ring-accent-400 ring-offset-2' 
                : 'hover:ring-1 hover:ring-primary-300'
            }`}
            onClick={() => onDifficultyChange(level)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
