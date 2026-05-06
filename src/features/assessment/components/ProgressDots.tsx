type Props = {
  total: number;
  current: number; // 0-indexed
  completed: number[];
};

export default function ProgressDots({ total, current, completed }: Props) {
  return (
    <div className="flex items-center gap-2" role="list" aria-label="Assessment progress">
      {Array.from({ length: total }, (_, i) => {
        const isCompleted = completed.includes(i);
        const isCurrent = i === current;

        let className =
          "w-3 h-3 rounded-full transition-all duration-200 ";
        if (isCompleted) {
          className += "bg-green-500";
        } else if (isCurrent) {
          className += "bg-primary-500";
        } else {
          className += "border-2 border-gray-300 dark:border-gray-600 bg-transparent";
        }

        return (
          <div
            key={i}
            role="listitem"
            className={className}
            aria-label={
              isCompleted
                ? `Section ${i + 1} completed`
                : isCurrent
                ? `Section ${i + 1} in progress`
                : `Section ${i + 1} pending`
            }
          />
        );
      })}
    </div>
  );
}
