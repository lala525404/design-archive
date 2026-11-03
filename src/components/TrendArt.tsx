import React from "react";

/**
 * 저널 트렌드 글에 넣는 설명용 그림 (직접 그린 원본 일러스트).
 * 본문에서 [[art:이름|설명]] 으로 넣는다.
 */
export const TREND_ART = [
  "handmade",
  "cute",
  "process",
  "texture",
  "surreal",
  "type",
  "dumb",
] as const;
export type TrendArtName = (typeof TREND_ART)[number];

const W = 800;
const H = 450;

export function TrendArt({ name }: { name: string }) {
  const art = ARTS[name as TrendArtName];
  if (!art) return null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${name} 예시 그림`} className="trend-art">
      {art}
    </svg>
  );
}

const grain = (id: string, opacity = 0.35, freq = 0.9) => (
  <filter id={id} x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="3" stitchTiles="stitch" />
    <feColorMatrix type="saturate" values="0" />
    <feComponentTransfer>
      <feFuncA type="linear" slope={opacity} />
    </feComponentTransfer>
    <feComposite in2="SourceGraphic" operator="in" />
  </filter>
);

const ARTS: Record<TrendArtName, React.ReactNode> = {
  // 1. 핸드메이드 & 아날로그: 종이, 찢긴 가장자리, 손 선, 도장, 마스킹테이프
  handmade: (
    <>
      <defs>
        {grain("g-hand", 0.28, 0.8)}
        <filter id="wob">
          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="6" />
        </filter>
      </defs>
      <rect width={W} height={H} fill="#e9e1d3" />
      <rect width={W} height={H} fill="#fff" filter="url(#g-hand)" />
      <path
        d="M110 70 L690 62 L700 120 L688 170 L702 230 L690 300 L698 380 L120 392 L112 330 L104 260 L114 190 L102 130 Z"
        fill="#fbf7ef"
        stroke="#d8ccb6"
        strokeWidth="2"
        filter="url(#wob)"
      />
      <rect x="320" y="44" width="160" height="40" fill="#f2c94c" opacity=".75" transform="rotate(-4 400 64)" />
      <g filter="url(#wob)" fill="none" stroke="#2b2b2b" strokeWidth="5" strokeLinecap="round">
        <path d="M170 170 C 230 120, 300 220, 360 160 S 470 120, 520 170" />
        <path d="M170 230 C 260 210, 330 260, 430 228" />
        <circle cx="590" cy="190" r="56" stroke="#e2553d" strokeWidth="6" />
      </g>
      <g transform="rotate(-12 590 300)" filter="url(#wob)">
        <rect x="520" y="270" width="150" height="62" rx="8" fill="none" stroke="#e2553d" strokeWidth="5" />
        <text x="595" y="312" textAnchor="middle" fontSize="28" fontWeight="800" fill="#e2553d">
          HANDMADE
        </text>
      </g>
      <text x="170" y="320" fontSize="44" fontWeight="800" fill="#2b2b2b" filter="url(#wob)">
        손으로 만든
      </text>
    </>
  ),

  // 2. 큐트모피즘: 둥글둥글한 원본 마스코트
  cute: (
    <>
      <defs>
        <radialGradient id="blob" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffd7e8" />
          <stop offset="1" stopColor="#ff9cc6" />
        </radialGradient>
        <radialGradient id="blob2" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#d9ecff" />
          <stop offset="1" stopColor="#8cc3fa" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="#fff6e9" />
      <circle cx="120" cy="80" r="60" fill="#ffe7b8" />
      <circle cx="700" cy="390" r="90" fill="#ffe7b8" />
      <g>
        <ellipse cx="330" cy="395" rx="120" ry="16" fill="#000" opacity=".06" />
        <path d="M210 300 C 200 170, 290 110, 340 110 C 400 110, 470 170, 455 300 C 450 360, 230 370, 210 300 Z" fill="url(#blob)" />
        <ellipse cx="300" cy="240" rx="11" ry="15" fill="#2b2b2b" />
        <ellipse cx="372" cy="240" rx="11" ry="15" fill="#2b2b2b" />
        <circle cx="304" cy="235" r="4" fill="#fff" />
        <circle cx="376" cy="235" r="4" fill="#fff" />
        <ellipse cx="272" cy="270" rx="18" ry="10" fill="#ff6fa5" opacity=".55" />
        <ellipse cx="402" cy="270" rx="18" ry="10" fill="#ff6fa5" opacity=".55" />
        <path d="M325 268 Q 336 280 347 268" fill="none" stroke="#2b2b2b" strokeWidth="5" strokeLinecap="round" />
        <path d="M330 112 C 320 80, 350 70, 345 95" fill="none" stroke="#ff9cc6" strokeWidth="8" strokeLinecap="round" />
      </g>
      <g transform="translate(520 210)">
        <ellipse cx="80" cy="180" rx="80" ry="12" fill="#000" opacity=".06" />
        <rect x="0" y="40" width="160" height="130" rx="65" fill="url(#blob2)" />
        <circle cx="58" cy="100" r="8" fill="#2b2b2b" />
        <circle cx="102" cy="100" r="8" fill="#2b2b2b" />
        <path d="M70 124 Q 80 132 90 124" fill="none" stroke="#2b2b2b" strokeWidth="4" strokeLinecap="round" />
        <path d="M40 50 L30 10 L66 42 Z M120 50 L130 10 L94 42 Z" fill="#8cc3fa" />
      </g>
      <g fill="#ffb3d1">
        <path d="M600 90 l8 16 18 3 -13 12 3 18 -16-9 -16 9 3-18 -13-12 18-3z" />
        <path d="M150 330 l6 12 13 2 -10 9 2 13 -11-6 -12 6 2-13 -9-9 13-2z" />
      </g>
    </>
  ),

  // 3. 과정 공개: 스케치 → 와이어프레임 → 완성, 빨간 수정 흔적
  process: (
    <>
      <defs>
        {grain("g-proc", 0.12, 1)}
      </defs>
      <rect width={W} height={H} fill="#f5f5f7" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${50 + i * 245} 70) rotate(${[-3, 1.5, -1][i]} 105 150)`}>
          <rect width="210" height="300" rx="10" fill="#fff" stroke="#e0e0e5" />
          <text x="14" y="28" fontSize="14" fontWeight="700" fill="#86868b">
            {["01 스케치", "02 와이어", "03 완성"][i]}
          </text>
        </g>
      ))}
      <g transform="translate(50 70) rotate(-3 105 150)" fill="none" stroke="#6e6e73" strokeWidth="2.5" strokeLinecap="round">
        <path d="M30 60 q 70 -14 150 4" />
        <path d="M30 90 q 50 8 110 -4" />
        <path d="M34 130 h 140 v 90 h -140 z" strokeDasharray="6 5" />
        <path d="M60 160 l 30 30 40 -50" />
        <path d="M30 250 q 60 6 120 -2" />
      </g>
      <g transform="translate(295 70) rotate(1.5 105 150)">
        <rect x="28" y="50" width="154" height="16" rx="4" fill="#d2d2d7" />
        <rect x="28" y="76" width="110" height="10" rx="4" fill="#e5e5ea" />
        <rect x="28" y="104" width="154" height="100" rx="8" fill="#ececf0" />
        <rect x="28" y="220" width="70" height="26" rx="13" fill="#c7c7cc" />
        <path d="M100 120 l 40 60 M140 120 l -40 60" stroke="#d2d2d7" strokeWidth="2" />
        <circle cx="182" cy="56" r="20" fill="none" stroke="#ff3b30" strokeWidth="3" />
        <path d="M188 40 q 30 -20 10 -40" fill="none" stroke="#ff3b30" strokeWidth="3" />
        <text x="150" y="-6" fontSize="16" fontWeight="700" fill="#ff3b30">
          더 크게!
        </text>
      </g>
      <g transform="translate(540 70) rotate(-1 105 150)">
        <rect x="14" y="40" width="182" height="160" rx="8" fill="#0071e3" />
        <circle cx="150" cy="90" r="30" fill="#ffd60a" />
        <text x="30" y="150" fontSize="26" fontWeight="800" fill="#fff">
          과정 안내
        </text>
        <rect x="28" y="220" width="96" height="30" rx="15" fill="#1d1d1f" />
        <text x="76" y="240" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">
          신청하기
        </text>
      </g>
      <rect width={W} height={H} fill="#fff" filter="url(#g-proc)" opacity=".5" />
    </>
  ),

  // 4. 진짜 질감: 스캔한 듯한 종이·콘크리트·천 결
  texture: (
    <>
      <defs>
        <filter id="tx-paper">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="5" seed="7" />
          <feColorMatrix values="0 0 0 0 0.86  0 0 0 0 0.80  0 0 0 0 0.70  0 0 0 0.9 0" />
        </filter>
        <filter id="tx-stone">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" seed="2" />
          <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.56  0 0 0 0 0.58  0 0 0 0.85 0" />
        </filter>
        <filter id="tx-cloth">
          <feTurbulence type="turbulence" baseFrequency="0.02 0.4" numOctaves="2" seed="9" />
          <feColorMatrix values="0 0 0 0 0.28  0 0 0 0 0.42  0 0 0 0 0.62  0 0 0 1 0" />
        </filter>
        <filter id="tx-moss">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="4" seed="4" />
          <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.48  0 0 0 0 0.25  0 0 0 1.4 -0.3" />
        </filter>
      </defs>
      <rect width={W} height={H} fill="#2b2b2b" />
      <rect x="0" y="0" width="400" height="225" fill="#ece3d2" />
      <rect x="0" y="0" width="400" height="225" filter="url(#tx-paper)" />
      <rect x="400" y="0" width="400" height="225" fill="#8e9094" />
      <rect x="400" y="0" width="400" height="225" filter="url(#tx-stone)" />
      <rect x="0" y="225" width="400" height="225" fill="#4a6b9e" />
      <rect x="0" y="225" width="400" height="225" filter="url(#tx-cloth)" />
      <rect x="400" y="225" width="400" height="225" fill="#cfd6c0" />
      <rect x="400" y="225" width="400" height="225" filter="url(#tx-moss)" />
      {[
        ["종이", 24, 40],
        ["콘크리트", 424, 40],
        ["천", 24, 265],
        ["이끼·곰팡이", 424, 265],
      ].map(([t, x, y]) => (
        <g key={t as string}>
          <rect x={x as number} y={(y as number) - 22} width={(t as string).length * 18 + 22} height="32" rx="16" fill="rgba(0,0,0,.55)" />
          <text x={(x as number) + 11} y={(y as number) + 0} fontSize="16" fontWeight="700" fill="#fff">
            {t}
          </text>
        </g>
      ))}
    </>
  ),

  // 5. 초현실주의: 작은 도시 위 거대한 연필과 떠 있는 구름 눈
  surreal: (
    <>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb38a" />
          <stop offset="1" stopColor="#ffe3c2" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#sky)" />
      <circle cx="640" cy="110" r="60" fill="#fff4d6" />
      <g fill="#6a5acd" opacity=".9">
        {[60, 130, 190, 250, 520, 580, 650, 720].map((x, i) => (
          <rect key={x} x={x} y={360 - [60, 90, 50, 110, 70, 100, 55, 80][i]} width="48" height={[60, 90, 50, 110, 70, 100, 55, 80][i] + 90} />
        ))}
      </g>
      <rect y="360" width={W} height="90" fill="#4b3f9e" />
      <g transform="rotate(32 400 220)">
        <rect x="370" y="-40" width="60" height="320" fill="#ffd60a" />
        <rect x="370" y="-40" width="20" height="320" fill="#ffe55c" />
        <rect x="370" y="-70" width="60" height="34" fill="#ff8fab" />
        <rect x="366" y="-40" width="68" height="16" fill="#c0c0c8" />
        <path d="M370 280 L400 340 L430 280 Z" fill="#f2d2a9" />
        <path d="M392 324 L400 340 L408 324 Z" fill="#1d1d1f" />
      </g>
      <path d="M455 375 C 520 360, 560 400, 640 380" fill="none" stroke="#1d1d1f" strokeWidth="8" strokeLinecap="round" />
      <g transform="translate(150 110)">
        <ellipse cx="60" cy="30" rx="70" ry="34" fill="#fff" />
        <ellipse cx="20" cy="40" rx="40" ry="26" fill="#fff" />
        <ellipse cx="60" cy="32" rx="22" ry="16" fill="#fff" stroke="#1d1d1f" strokeWidth="3" />
        <circle cx="60" cy="32" r="9" fill="#1d1d1f" />
        <circle cx="63" cy="29" r="3" fill="#fff" />
      </g>
    </>
  ),

  // 6. 개성 있는 타이포: 서로 다른 재료·스타일의 글자
  type: (
    <>
      <defs>
        <filter id="drip">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 0.12" numOctaves="2" seed="5" />
          <feDisplacementMap in="SourceGraphic" scale="14" />
        </filter>
        <filter id="clay">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="11" />
          <feDisplacementMap in="SourceGraphic" scale="9" />
        </filter>
      </defs>
      <rect width={W} height={H} fill="#1d1d1f" />
      <text x="60" y="190" fontSize="170" fontWeight="900" fill="#ff3b30" filter="url(#drip)" letterSpacing="-6">
        20
      </text>
      <text x="300" y="190" fontSize="170" fontWeight="300" fontStyle="italic" fill="#fff" fontFamily="Georgia, serif">
        2
      </text>
      <text x="420" y="190" fontSize="170" fontWeight="900" fill="#b0855c" filter="url(#clay)">
        7
      </text>
      <text x="560" y="150" fontSize="64" fontWeight="800" fill="#ffd60a" transform="rotate(-8 600 140)">
        Aa
      </text>
      <path d="M70 300 C 140 250, 200 350, 270 290 S 380 260, 420 310" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <text x="70" y="390" fontSize="40" fontWeight="800" fill="#fff" letterSpacing="18">
        CUSTOM
      </text>
      <text x="470" y="330" fontSize="46" fontWeight="900" fill="none" stroke="#5ac8fa" strokeWidth="2.5">
        LETTERING
      </text>
      <text x="470" y="390" fontSize="22" fill="#86868b">
        손글씨 · 소스 · 진흙 · 전용 폰트
      </text>
    </>
  ),

  // 7. 투박한 B급 디자인: 클립아트 별, 무지개 워드아트, 엉성한 배치
  dumb: (
    <>
      <defs>
        <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="0">
          {["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#007aff", "#af52de"].map((c, i) => (
            <stop key={c} offset={i / 5} stopColor={c} />
          ))}
        </linearGradient>
        <pattern id="checker" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#e6f7ff" />
          <rect width="20" height="20" fill="#cdeeff" />
          <rect x="20" y="20" width="20" height="20" fill="#cdeeff" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#checker)" />
      <g transform="translate(150 140) rotate(-12)">
        <path d="M0 -90 L24 -30 L88 -30 L36 8 L56 70 L0 32 L-56 70 L-36 8 L-88 -30 L-24 -30 Z" fill="#ffcc00" stroke="#1d1d1f" strokeWidth="5" />
        <text x="0" y="12" textAnchor="middle" fontSize="26" fontWeight="900" fill="#ff3b30">
          NEW!
        </text>
      </g>
      <text
        x="260"
        y="210"
        fontSize="78"
        fontWeight="900"
        fill="url(#rainbow)"
        stroke="#1d1d1f"
        strokeWidth="3"
        fontFamily="'Comic Sans MS', 'Comic Neue', cursive"
        transform="rotate(-4 260 210) skewX(-8)"
      >
        대박 할인
      </text>
      <rect x="470" y="250" width="250" height="130" fill="#fff" stroke="#1d1d1f" strokeWidth="4" transform="rotate(5 595 315)" />
      <circle cx="560" cy="300" r="22" fill="#ff9500" />
      <path d="M520 360 l40 -40 30 25 40 -45 50 60 z" fill="#34c759" />
      <text x="80" y="370" fontSize="30" fontWeight="700" fill="#1d1d1f" fontFamily="'Comic Sans MS', 'Comic Neue', cursive">
        click here →→
      </text>
      <path d="M300 290 q 20 -30 40 0 t 40 0 t 40 0" fill="none" stroke="#af52de" strokeWidth="6" />
    </>
  ),
};
