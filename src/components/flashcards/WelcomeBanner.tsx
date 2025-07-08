// src/components/flashcards/WelcomeBanner.tsx
export function WelcomeBanner() {
  return (
    <div className="text-center py-8 px-4">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-800 mb-4">
        Master English with{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-accent-400">
          Flashcards
        </span>
      </h1>
      <p className="text-lg md:text-xl text-primary-600 max-w-2xl mx-auto leading-relaxed">
        Practice vocabulary, improve pronunciation, and build confidence in your English learning journey.
      </p>
      <div className="mt-6 w-24 h-1 bg-gradient-to-r from-accent-600 to-accent-400 mx-auto rounded-full"></div>
    </div>
  );
}
