import clsx from "clsx";

interface PatientFilterTabProps {
  tabs: string[];
  selected: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function PatientFilterTab({
  tabs,
  selected,
  onChange,
  className = "",
}: PatientFilterTabProps) {
  return (
    <div className={clsx("flex gap-2 p-1 bg-[var(--color-muted)] rounded-full", className)}>
      {tabs.map((tab) => {
        const isActive = selected === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={clsx(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              isActive
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--foreground)] hover:bg-[var(--color-primary)] hover:text-white"
            )}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
