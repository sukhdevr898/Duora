import { useMemo } from 'react';

/** Tiny deterministic PRNG so the same code always draws the same pattern. */
function hashString(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIZE = 25;

type Props = {
  value: string;
  size?: number;
  color?: string;
  background?: string;
  className?: string;
};

/**
 * Decorative pairing QR — a deterministic matrix with proper finder patterns.
 * It is not a real encoder; the pairing screen also shows the typed code.
 */
export function QRCode({
  value,
  size = 188,
  color = '#1d1533',
  background = '#ffffff',
  className = '',
}: Props) {
  const matrix = useMemo(() => {
    const rnd = mulberry32(hashString(value || 'duora'));
    const grid: boolean[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));

    const inFinder = (x: number, y: number) => {
      const corners = [
        [0, 0],
        [SIZE - 7, 0],
        [0, SIZE - 7],
      ];
      return corners.some(([cx, cy]) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7);
    };

    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        if (inFinder(x, y)) continue;
        if (x === 6 || y === 6) {
          grid[y][x] = (x + y) % 2 === 0;
          continue;
        }
        grid[y][x] = rnd() > 0.52;
      }
    }

    // finder patterns (7x7 ring + 3x3 core)
    const drawFinder = (cx: number, cy: number) => {
      for (let y = 0; y < 7; y += 1) {
        for (let x = 0; x < 7; x += 1) {
          const edge = x === 0 || y === 0 || x === 6 || y === 6;
          const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
          grid[cy + y][cx + x] = edge || core;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(SIZE - 7, 0);
    drawFinder(0, SIZE - 7);

    // keep a quiet alignment blob bottom-right
    for (let y = SIZE - 9; y < SIZE - 4; y += 1) {
      for (let x = SIZE - 9; x < SIZE - 4; x += 1) {
        const d = Math.max(Math.abs(x - (SIZE - 7)), Math.abs(y - (SIZE - 7)));
        grid[y][x] = d === 2 || d === 1;
      }
    }

    return grid;
  }, [value]);

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="Pairing QR code"
      shapeRendering="crispEdges"
    >
      <rect width={SIZE} height={SIZE} fill={background} rx="2" />
      {matrix.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect
              key={`${x}-${y}`}
              x={x * 1}
              y={y * 1}
              width={1.02}
              height={1.02}
              rx={0.28}
              fill={color}
            />
          ) : null,
        ),
      )}
      {/* brand heart in the centre, like a logo-embedded QR */}
      <g transform={`translate(${SIZE / 2 - 3.4} ${SIZE / 2 - 3}) scale(0.075)`} opacity="0.92">
        <rect x="-6" y="-6" width="112" height="104" rx="12" fill={background} />
        <path
          d="M50 88 C 20 66, 6 48, 6 33 C 6 18, 18 8, 31 8 C 40 8, 47 13, 50 19 C 53 13, 60 8, 69 8 C 82 8, 94 18, 94 33 C 94 48, 80 66, 50 88 Z"
          fill="#6D4BF6"
        />
      </g>
      <rect x="0.5" y="0.5" width={SIZE - 1} height={SIZE - 1} rx="2" fill="none" stroke={background} strokeWidth="1" />
    </svg>
  );
}
