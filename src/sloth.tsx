export type Mood = 'idle' | 'thinking' | 'done';

const COLORS: Record<string, string> = {
  D: '#4a3426', // outline
  F: '#9a7a57', // fur
  C: '#efe0c0', // cream face and claws
  K: '#2e1f16', // eye patch
  W: '#fff6dc', // pupil
  N: '#1a120d', // nose
  B: '#5b3d24', // branch dark
  b: '#7a5532', // branch light
  g: '#6fa83a', // leaf
};

const ROWS = [
  '.....gg.............................',
  '....gg..............................',
  '....................................',
  'bbbbbbbbbbbbb.......................',
  'BBBBBBBBBBBBBbbbbbbbbbbbbb..........',
  'BBBBBBBBBBBCCCCCBBBBBBBBBBbCCCCCbbbb',
  '...........DCBBBBBBBBBBBBBBBBBBBBBBB',
  '...........DFFFD..........BBBBBBBBBB',
  '...........DFFFD...........DFFFD....',
  '...........DFFFFD..........DFFFD....',
  '...........DFFFFD..........DFFFD....',
  '...........DFFFFD.........DFFFFD....',
  '............DFFFD..DDDDDDDDDFFFD....',
  '.......DDDDDDFFFDDDFFFFFFFFFDDD.....',
  '.....DDFFFFFDDFFDFFFFFFFFFFFFFDD....',
  '....DFFFFFFFFFDFFDFFFFFFFFFFFFFFD...',
  '...DFFFFFFFFFFFDFDFFFFFFFFFFFFFFFD..',
  '..DFFFFFCCCFFFFFDDFFFFFFFFFFFFFFFFD.',
  '..DFFFCCCCCCCFFFDDFFFFFFFFFFFFFFFFFD',
  '.DFFFKKKKCKKKKFFFDFFFFFFFFFFFFFFFFFD',
  '.DFFCKWKKCKWKKCFFDFFFFFFFFFFFFFFFFFD',
  '.DFFCKKKKCKKKKCFFDFFFFFFFFFFFFFFFFFD',
  '..DFCCCCCNNCCCCFDFFFFFFFFFFFFFFFFFFD',
  '..DFFCCCCCCCCCFFDFFFFFFFFFFFFFFFFFD.',
  '...DFFCCCCCCCFFDFFFFFFFFFFFFFFFFFD..',
  '....DFFFCCCFFFDFFFFFFFFFFFFFFFFFD...',
  '.....DDFFFFFDD.DDFFFFFFFFFFFFFDD....',
  '.......DDDDD.....DDFFFFFFFFFDD......',
  '...................DDDDDDDDD........',
  '....................................',
];

const COLS = 36;
const PUPILS = [[6, 20], [11, 20]];
const MOUTH = [[8, 23], [11, 23], [9, 24], [10, 24]];
const Z = ['####', '..#.', '.#..', '####'];
const Z_POS = [[1, 11], [6, 8]];

const CSS = `
.blink{animation:slothblink 4s steps(1) infinite}
.zz{opacity:0;animation:slothz 2.4s steps(1) infinite}
@keyframes slothblink{0%,94%{opacity:0}95%,100%{opacity:1}}
@keyframes slothz{0%{opacity:0}25%,75%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.blink,.zz{animation:none}.zz{opacity:1}}
`;

const px = (x: number, y: number, fill: string, key: string, cls?: string) => (
  <rect key={key} x={x} y={y} width={1} height={1} fill={fill} className={cls} />
);

export function Sloth({ mood = 'idle', scale = 5 }: { mood?: Mood; scale?: number }) {
  const closed = mood === 'thinking';
  return (
    <>
      <style>{CSS}</style>
      <svg
        viewBox={`0 0 ${COLS} ${ROWS.length}`}
        width={COLS * scale}
        height={ROWS.length * scale}
        shapeRendering="crispEdges"
        role="img"
        aria-label="pixel sloth hanging from a branch"
      >
        {ROWS.flatMap((row, y) =>
          [...row].map((c, x) => (c === '.' ? null : px(x, y, COLORS[c], `${x}-${y}`)))
        )}
        {PUPILS.map(([x, y]) =>
          px(x, y, COLORS.K, `lid${x}`, closed ? undefined : 'blink')
        )}
        {closed &&
          PUPILS.flatMap(([x, y]) =>
            [-1, 0, 1].map((d) => px(x + d, y, COLORS.K, `shut${x}${d}`))
          )}
        {mood === 'done' &&
          MOUTH.map(([x, y]) => px(x, y, COLORS.N, `m${x}${y}`))}
        {mood === 'thinking' &&
          Z_POS.map(([zx, zy], i) => (
            <g key={i} className="zz" style={{ animationDelay: `${i * 0.9}s` }}>
              {Z.flatMap((r, y) =>
                [...r].map((c, x) =>
                  c === '#' ? px(zx + x, zy + y, '#c9d98a', `z${i}${x}${y}`) : null
                )
              )}
            </g>
          ))}
      </svg>
    </>
  );
}

export default Sloth;