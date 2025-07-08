// src/components/flashcards/ActionBar.tsx
import { FlashcardActionButton } from "./FlashcardActionButton";
import clsx from "clsx";

export interface ActionBarProps {
  onPlayAudio: () => void;
  onShowImage: () => void;
  onToggleStudyMode: () => void;
  onAddWord: () => void;
  studyModeActive?: boolean;
  isAuthenticated?: boolean;
  imageAvailable?: boolean;
  className?: string;
}

// Placeholder icons - replace with actual icon library
const SpeakerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12H5a1 1 0 01-1-1V9a1 1 0 011-1h4l5-5v14l-5-5z" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BookIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

export function ActionBar({
  onPlayAudio,
  onShowImage,
  onToggleStudyMode,
  onAddWord,
  studyModeActive = false,
  isAuthenticated = false,
  imageAvailable = true,
  className = ""
}: ActionBarProps) {
  return (
    <div 
      className={clsx(
        "flex items-center justify-center gap-6 p-4",
        "bg-white border border-gray-200 rounded-lg shadow-sm",
        "sm:gap-8", // More spacing on larger screens
        className
      )}
    >
      {/* Play Audio Button */}
      <FlashcardActionButton
        icon={<SpeakerIcon />}
        label="Play Audio"
        tooltip="Play pronunciation"
        onClick={onPlayAudio}
      />

      {/* Show Image Button */}
      <FlashcardActionButton
        icon={<ImageIcon />}
        label="Show Image"
        tooltip={imageAvailable ? "View related image" : "No image available"}
        onClick={onShowImage}
        disabled={!imageAvailable}
      />

      {/* Study Mode Toggle Button */}
      <FlashcardActionButton
        icon={<BookIcon />}
        label="Study Mode"
        tooltip="Toggle study mode"
        onClick={onToggleStudyMode}
        active={studyModeActive}
      />

      {/* Add Word Button */}
      <FlashcardActionButton
        icon={<PlusIcon />}
        label="Add Word"
        tooltip={isAuthenticated ? "Add to personal deck" : "Login to add words"}
        onClick={onAddWord}
        disabled={!isAuthenticated}
      />
    </div>
  );
}
