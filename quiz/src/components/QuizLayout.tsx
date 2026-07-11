import { ReactNode, useLayoutEffect } from "react";
import { BrandLogo } from "@/components/BrandLogo";

interface QuizLayoutProps {
  progress: number; // 0-100
  onBack?: () => void;
  children: ReactNode;
  currentStep?: number;
  totalSteps?: number;
}

export function QuizLayout({ progress, onBack, children, currentStep, totalSteps }: QuizLayoutProps) {
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const scrollTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    scrollTop();
    const r1 = requestAnimationFrame(() => {
      scrollTop();
      const r2 = requestAnimationFrame(scrollTop);
      (scrollTop as unknown as { _r2?: number })._r2 = r2;
    });
    const t = window.setTimeout(scrollTop, 120);
    return () => {
      cancelAnimationFrame(r1);
      window.clearTimeout(t);
    };
  }, [currentStep, progress]);

  const showPaddle = typeof currentStep === "number" && typeof totalSteps === "number" && currentStep > 0;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="relative mx-auto flex max-w-2xl items-center justify-center px-4 py-3">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Voltar"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <BrandLogo size="md" priority />
          {showPaddle && (
            <span className="paddle absolute right-4 tabular-nums" aria-hidden="true">
              Lote {pad(currentStep!)}<span className="text-muted-foreground">/{pad(totalSteps!)}</span>
            </span>
          )}
        </div>

        {/* Trilho do martelo — fio fino com cursor dourado que avança */}
        <div className="relative h-[3px] w-full bg-border/50">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary to-primary transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(2, progress)}%` }}
          />
          <div
            className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_1px] shadow-primary/60 transition-[left] duration-500 ease-out"
            style={{ left: `calc(${Math.max(2, progress)}% - 4px)` }}
            aria-hidden="true"
          />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 pb-10">{children}</main>
    </div>
  );
}
