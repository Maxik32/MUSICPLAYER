import { useMemo } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { PlayerTrack } from "@/store/usePlayerStore";
import { usePlayerStore } from "@/store/usePlayerStore";

const SIDE = 2; // only two cards on each side
const COVER_W = 136;
const COVER_H = 136;

type SlotCfg = {
  x: number;
  rotateY: number;
  translateZ: number;
  scale: number;
  zIndex: number;
};

/** Distance from center in queue steps. Higher z = closer to viewer; center is always on top. */
const Z_FOR_DIST: Record<1 | 2, number> = { 1: 56, 2: 34 };

const LEFT_CFG: SlotCfg[] = [
  // far (d=2)
  { x: -230, rotateY: 52, translateZ: -70, scale: 0.6, zIndex: Z_FOR_DIST[2] },
  // near (d=1)
  { x: -110, rotateY: 44, translateZ: -34, scale: 0.78, zIndex: Z_FOR_DIST[1] },
];

/** R0 sits next to center like L2; R2 is the far right like L0 — same depth → same z-index as the symmetric left slot. */
const RIGHT_CFG: SlotCfg[] = [1, 0].map((leftIdx) => {
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
      className={`cover-reflect overflow-hidden rounded-md border-2 border-neutral-400 bg-gradient-to-br from-[#e9e9e9] via-[#cfcfcf] to-[#9a9a9a] shadow-[0_12px_28px_rgba(0,0,0,0.35)] ${
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
  // Don't render empty side slots (so left side can be empty when queueIndex===0).
  if (!isCenter && !track) return null;

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
        transition: "transform 320ms ease",
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
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const prevTrack = usePlayerStore((s) => s.prevTrack);

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
    <section className="rounded-xl border border-neutral-400/90 shadow-lg dark:border-neutral-600">
      <div className="overflow-hidden rounded-t-xl bg-gradient-to-b from-[#91aac7] via-[#6b8fb3] to-[#3e5c82] px-3 py-2">
        <h2 className="text-center text-[13px] font-bold text-white drop-shadow-sm">
          {t("cover.title")}
        </h2>
      </div>

      <div
        className="cover-flow-stage relative mx-auto h-[240px] w-full max-w-4xl overflow-hidden px-1 pb-2 pt-2 sm:h-[280px] sm:overflow-visible sm:px-2 sm:pt-4"
        style={{ touchAction: "pan-y" }}
        onPointerDown={(e) => {
          if (e.target !== e.currentTarget) return; // keep clicks on cards working
          // lightweight swipe navigation
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          (e.currentTarget as HTMLDivElement).dataset.swipeStartX = String(e.clientX);
        }}
        onPointerUp={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          if (e.target !== e.currentTarget) return;
          const startX = Number(el.dataset.swipeStartX ?? NaN);
          const dx = e.clientX - startX;
          // threshold: only meaningful swipe
          if (Number.isFinite(startX)) {
            if (dx < -60) void nextTrack();
            if (dx > 60) void prevTrack();
          }
          el.dataset.swipeStartX = "";
        }}
        onPointerCancel={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.dataset.swipeStartX = "";
        }}
      >
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

      <div className="overflow-hidden rounded-b-xl border-t border-[#91aac7]/30 bg-gradient-to-b from-[#e8eef5] to-[#d4dde8] px-4 pb-3 pt-1 text-center dark:border-neutral-700 dark:from-neutral-900 dark:to-neutral-950">
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
