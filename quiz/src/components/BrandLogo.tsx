import logoEvento from "@/assets/logo-evento.png";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
}

// Logo do evento "Imersão Casa Própria por Leilão" (navy + dourado).
// Altura por tamanho; a razão de aspecto (~3:2) fica no width auto.
const heightMap = {
  sm: "h-9",
  md: "h-11",
  lg: "h-24",
} as const;

export function BrandLogo({ className = "", size = "md", priority = false }: BrandLogoProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Halo de luz — separa o navy da logo do fundo teal (aparece nas
          áreas transparentes do PNG, dando contraste ao texto escuro). */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 130% at 50% 46%, rgba(236,231,221,0.34), rgba(236,231,221,0.12) 46%, transparent 72%)",
          filter: "blur(9px)",
          transform: "scale(1.22)",
        }}
      />
      <img
        src={logoEvento}
        alt="Imersão Casa Própria por Leilão · Juliano Carvalho"
        className={`relative ${heightMap[size]} w-auto`}
        style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
      />
    </div>
  );
}

export const brandLogoAssets = { evento: logoEvento };
