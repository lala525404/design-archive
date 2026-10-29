import React, { useId } from "react";
import { DesignAsset } from "../types";
interface Props {
  asset: DesignAsset;
  className?: string;
  showOverlay?: boolean;
}
// Graphic previews for the original metadata-only sample assets. No source images were supplied.
export function DesignThumbnail({ asset, className = "" }: Props) {
  const id = useId().replace(/:/g, "");
  const n = Number(asset.id.split("-")[1]) || 1;
  const palettes = ["#A9D3FF", "#B7E1D1", "#FFE59A", "#FFB5B8"];
  const color = palettes[n % 4];
  const banner = asset.type === "배너",
    card = asset.type === "카드뉴스";
  return (
    <div className={`design-thumbnail ${className}`}>
      <svg
        viewBox="0 0 600 480"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={`${asset.title} 샘플 미리보기`}
      >
        <defs>
          <pattern
            id={`p${id}`}
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M30 0H0V30"
              fill="none"
              stroke="#191919"
              strokeWidth=".5"
              opacity=".12"
            />
          </pattern>
        </defs>
        <rect
          width="600"
          height="480"
          fill={banner ? "#F7F3EF" : card ? "#246BFD" : color}
        />
        {banner ? (
          <>
            <circle cx="480" cy="275" r="175" fill={color} />
            <circle cx="490" cy="260" r="105" fill="#246BFD" />
            <circle cx="480" cy="250" r="45" fill="#F7F3EF" />
            <path d="M370 70L560 380" stroke="#191919" strokeWidth="1" />
            <text x="48" y="62" fontSize="14" fontWeight="600">
              {asset.year} · {asset.type}
            </text>
            <text x="48" y="202" fontSize="46" fontWeight="800">
              {asset.course.length > 8
                ? asset.course.slice(0, 8)
                : asset.course}
            </text>
            <text x="48" y="259" fontSize="46" fontWeight="800">
              새롭게 시작하기
            </text>
            <path d="M50 388H240" stroke="#191919" />
            <text x="48" y="420" fontSize="14">
              {asset.professor} 교수
            </text>
          </>
        ) : card ? (
          <>
            <circle cx="462" cy="100" r="170" fill="#A9D3FF" />
            <path
              d="M260 380C260 250 470 220 600 310V480H260Z"
              fill="#B7E1D1"
            />
            <circle cx="489" cy="375" r="82" fill="#F7F3EF" />
            <text x="48" y="64" fill="white" fontSize="14">
              {asset.course}
            </text>
            <text x="48" y="196" fill="white" fontSize="39" fontWeight="800">
              생각을 넓히는
            </text>
            <text x="48" y="250" fill="white" fontSize="39" fontWeight="800">
              새로운 시선
            </text>
            <text x="48" y="409" fill="white" fontSize="17" fontWeight="600">
              {asset.professor} 교수
            </text>
          </>
        ) : (
          <>
            <rect width="600" height="480" fill={`url(#p${id})`} />
            <circle cx="470" cy="100" r="110" fill="#246BFD" />
            <path
              d="M350 330Q350 240 440 240T530 330T440 420T350 330"
              fill="#F7F3EF"
            />
            <text x="48" y="64" fontSize="14">
              {asset.year} · {asset.type}
            </text>
            <text x="48" y="187" fontSize="48" fontWeight="800">
              {asset.course.length > 8
                ? asset.course.slice(0, 8)
                : asset.course}
            </text>
            <text x="48" y="245" fontSize="42" fontWeight="800">
              {asset.type === "상세페이지" ? "배움의 새로운 감각" : asset.type}
            </text>
            <text x="48" y="410" fontSize="15" fontWeight="600">
              {asset.professor} 교수
            </text>
            <path d="M48 365H210" stroke="#191919" />
          </>
        )}
      </svg>
    </div>
  );
}
