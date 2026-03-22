import { useMemo } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { PlayerTrack } from "@/store/usePlayerStore";
import { usePlayerStore } from "@/store/usePlayerStore";

const SIDE = 3;
const COVER_W = 112;
const COVER_H = 112;

type SlotCfg = {
  x: number;
  rotateY: number;
  translateZ: number;
  scale: number;
  zIndex: number;
};

/** Distance from center in queue steps: 3 = far, 1 = adjacent. Higher z = closer to viewer; center is always on top. */
const Z_FOR_DIST: Record<1 | 2 | 3, number> = { 1: 52, 2: 36, 3: 22 };

const LEFT_CFG: SlotCfg[] = [
  { x: -278, rotateY: 60, translateZ: -118, scale: 0.46, zIndex: Z_FOR_DIST[3] },
  { x: -172, rotateY: 52, translateZ: -68, scale: 0.6, zIndex: Z_FOR_DIST[2] },
  { x: -90, rotateY: 44, translateZ: -32, scale: 0.76, zIndex: Z_FOR_DIST[1] },
];

/** R0 sits next to center like L2; R2 is the far right like L0 — same depth → same z-index as the symmetric left slot. */
const RIGHT_CFG: SlotCfg[] = [2, 1, 0].map((leftIdx) => {
  const c = LEFT_CFG[leftIdx]!;
  return {
    x: -c.x,
    rotateY: -c.rotateY,
    translateZ: c.translateZ,
    scale: c.scale,
    zIndex: c.zIndex,
  };
});

const CENTER_CFG: SlotCfg = {
  x: 0,
  rotateY: 0,
  translateZ: 96,
  scale: 1.14,
  zIndex: 100,
};

function CoverArt({
  track,
  dimmed,
}: {
  track: PlayerTrack | null;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`cover-reflect overflow-hidden rounded-md border-2 border-neutral-400 bg-gradient-to-br from-[#6eb6ff] via-[#2477d1] to-[#1159b3] shadow-[0_12px_28px_rgba(0,0,0,0.35)] ${
        dimmed ? "opacity-45" : ""
      }`}
      style={{ width: COVER_W, height: COVER_H }}
    >
      {track?.coverUrl ? (
        <img
          src={track.coverUrl}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : null}
    </div>
  );
}

function FlowSlot({
  cfg,
  track,
  onPick,
  isCenter,
}: {
  cfg: SlotCfg;
  track: PlayerTrack | null;
  onPick: () => void;
  isCenter?: boolean;
}) {
  return (
    <button
      type="button"
      className="cover-flow-card absolute left-1/2 top-0 cursor-pointer border-0 bg-transparent p-0 outline-none hover:brightness-105"
      style={{
        width: COVER_W,
        height: COVER_H,
        marginLeft: -COVER_W / 2,
        transform: `translateX(${cfg.x}px) translateZ(${cfg.translateZ}px) rotateY(${cfg.rotateY}deg) scale(${cfg.scale})`,
        zIndex: cfg.zIndex,
        willChange: "transform",
      }}
      onClick={onPick}
      disabled={!track}
      aria-label={track ? `${track.title} — воспроизвести` : "Пусто"}
    >
      <CoverArt track={track} dimmed={!isCenter && Boolean(track)} />
    </button>
  );
}

export function CoverFlow({ previewTrack }: { previewTrack: PlayerTrack | null }) {
  const { t } = useI18n();
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const { leftTracks, centerTrack, rightTracks } = useMemo(() => {
    const left: (PlayerTrack | null)[] = [];
    for (let d = SIDE; d >= 1; d--) {
      const idx = queueIndex - d;
      left.push(idx >= 0 && idx < queue.length ? queue[idx]! : null);
    }

    let center: PlayerTrack | null = null;
    if (queue.length > 0 && queueIndex >= 0 && queueIndex < queue.length) {
      center = queue[queueIndex]!;
    } else if (currentTrack) {
      center = currentTrack;
    } else {
      center = previewTrack;
    }

    const right: (PlayerTrack | null)[] = [];
    for (let d = 1; d <= SIDE; d++) {
      const idx = queueIndex + d;
      right.push(idx < queue.length ? queue[idx]! : null);
    }

    return {
      leftTracks: left,
      centerTrack: center,
      rightTracks: right,
    };
  }, [queue, queueIndex, currentTrack, previewTrack]);

  const handlePick = (t: PlayerTrack | null) => {
    if (!t) return;
    void playTrack(t, queue.length ? queue : [t]);
  };

  return (
    <section className="rounded-xl border border-neutral-400/90 bg-gradient-to-b from-[#f2f2f2] via-white to-[#e8e8e8] shadow-lg dark:border-neutral-600 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
      <div className="metallic-bg--compact overflow-hidden rounded-t-xl px-3 py-2">
        <h2 className="text-center text-[13px] font-bold inset-text--on-metal">
          {t("cover.title")}
        </h2>
      </div>

      <div className="cover-flow-stage relative mx-auto h-[200px] w-full max-w-4xl overflow-hidden px-1 pb-2 pt-2 sm:h-[260px] sm:overflow-visible sm:px-2 sm:pt-4">
        <div
          className="cover-flow-pivot absolute left-1/2 top-[40%] w-0 -translate-x-1/2 -translate-y-1/2 max-[520px]:scale-[0.5] max-[520px]:origin-[50%_45%] sm:top-[42%] sm:scale-100"
          style={{ height: COVER_H, transformStyle: "preserve-3d" }}
        >
          {LEFT_CFG.map((cfg, i) => (
            <FlowSlot
              key={`L${i}`}
              cfg={cfg}
              track={leftTracks[i] ?? null}
              onPick={() => handlePick(leftTracks[i] ?? null)}
            />
          ))}
          {RIGHT_CFG.map((cfg, i) => (
            <FlowSlot
              key={`R${i}`}
              cfg={cfg}
              track={rightTracks[i] ?? null}
              onPick={() => handlePick(rightTracks[i] ?? null)}
            />
          ))}
          <FlowSlot
            cfg={CENTER_CFG}
            track={centerTrack}
            onPick={() => handlePick(centerTrack)}
            isCenter
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-b-xl border-t border-neutral-300 bg-white/80 px-4 pb-3 pt-1 text-center dark:border-neutral-700 dark:bg-neutral-900/90">
        {centerTrack ? (
          <>
            <p className="text-[15px] font-bold inset-text dark:text-neutral-100">
              {centerTrack.title}
            </p>
            <p className="text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
              {centerTrack.artist}
            </p>
          </>
        ) : (
          <p className="text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
            {t("cover.hint")}
          </p>
        )}
      </div>
    </section>
  );
}
