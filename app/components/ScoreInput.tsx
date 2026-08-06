export default function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-ink-quiet">{label}</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-full text-sm border transition-colors ${
              value === n
                ? "bg-ink text-paper border-ink"
                : "border-rule text-ink-quiet hover:border-ink-quiet"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
