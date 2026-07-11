import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  rounded?: "xl" | "full";
  /** índice para a cascata de entrada das opções */
  index?: number;
  /** mostra o marcador de seleção à direita (single/multi textuais) */
  showMark?: boolean;
}

export function OptionCard({
  selected,
  onClick,
  children,
  className,
  rounded = "xl",
  index = 0,
  showMark = false,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      className={cn(
        "anim-opt-in group relative flex w-full items-stretch overflow-hidden border text-left transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        rounded === "full" ? "rounded-full" : "rounded-xl",
        selected
          ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--color-primary)_inset]"
          : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/60 hover:bg-popover",
        className,
      )}
    >
      {/* fio dourado na borda esquerda quando selecionado */}
      <span
        aria-hidden="true"
        className={cn(
          "w-1 shrink-0 bg-primary transition-opacity duration-200",
          selected ? "opacity-100" : "opacity-0",
        )}
      />
      <span className="flex min-w-0 flex-1 items-center">{children}</span>
      {showMark && (
        <span
          aria-hidden="true"
          className={cn(
            "mr-3 flex h-6 w-6 shrink-0 items-center justify-center self-center rounded-full border transition-all duration-200",
            selected
              ? "border-primary bg-primary text-primary-foreground scale-100"
              : "border-border bg-transparent text-transparent scale-90",
          )}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}

interface OptionLabelProps {
  selected?: boolean;
  children: ReactNode;
}

export function OptionLabel({ selected, children }: OptionLabelProps) {
  return (
    <span
      className={cn(
        "block px-4 py-3.5 text-[0.95rem] font-medium leading-snug transition-colors",
        selected ? "text-foreground" : "text-foreground/90",
      )}
    >
      {children}
    </span>
  );
}
