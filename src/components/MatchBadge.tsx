interface MatchBadgeProps {
  score: number;
  breakdown?: { attribute: string; matched: boolean; weight: number }[];
  showDetails?: boolean;
}

export default function MatchBadge({ score, breakdown, showDetails = false }: MatchBadgeProps) {
  const color = score >= 80 ? "green" : score >= 60 ? "yellow" : "gray";
  const colorClasses = {
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div>
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-semibold ${colorClasses[color]}`}>
        {score}% match
      </span>
      {showDetails && breakdown && (
        <div className="mt-2 space-y-1">
          {breakdown.map((item) => (
            <div key={item.attribute} className="flex items-center gap-2 text-sm">
              <span className={item.matched ? "text-green-500" : "text-gray-300"}>
                {item.matched ? "✓" : "✗"}
              </span>
              <span className={item.matched ? "text-gray-700" : "text-gray-400"}>
                {item.attribute}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
