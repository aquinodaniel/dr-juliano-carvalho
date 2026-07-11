import { useEffect, useMemo, useRef, useState } from "react";
import { screens } from "@/lib/quiz-data";

type ClickPoint = {
  rel_x: number;
  rel_y: number;
  viewport_width: number;
  viewport_height: number;
};

interface Props {
  clicks: ClickPoint[];
  screenId: string;
}

export function Heatmap({ clicks, screenId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 360;
  const H = 640;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    // Background grid for context
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fillRect(0, 0, W, H);

    // Render each click as a radial gradient blob
    for (const c of clicks) {
      const x = c.rel_x * W;
      const y = c.rel_y * H;
      const r = 28;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(255,80,40,0.55)");
      grad.addColorStop(0.5, "rgba(255,180,40,0.25)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [clicks]);

  const screenLabel = useMemo(() => {
    const idx = screens.findIndex((s) => s.id === screenId);
    return idx >= 0 ? `Etapa ${idx + 1} · ${screenId}` : screenId;
  }, [screenId]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{screenLabel}</span>
        <span className="text-muted-foreground">{clicks.length} cliques</span>
      </div>
      <div className="relative mx-auto overflow-hidden rounded-xl border bg-background" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0" />
      </div>
    </div>
  );
}

export function HeatmapPicker({
  allClicks,
}: {
  allClicks: (ClickPoint & { screen_id: string })[];
}) {
  const screenIds = useMemo(() => {
    const set = new Set(allClicks.map((c) => c.screen_id));
    return screens.filter((s) => set.has(s.id)).map((s) => s.id);
  }, [allClicks]);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    if (!selected && screenIds.length) setSelected(screenIds[0]);
  }, [screenIds, selected]);

  const filtered = useMemo(
    () => allClicks.filter((c) => c.screen_id === selected),
    [allClicks, selected],
  );

  if (!screenIds.length) {
    return <p className="text-sm text-muted-foreground">Sem cliques registrados ainda.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {screenIds.map((id) => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={`rounded-full border px-3 py-1 text-xs ${
              selected === id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {id}
          </button>
        ))}
      </div>
      <Heatmap clicks={filtered} screenId={selected} />
    </div>
  );
}
