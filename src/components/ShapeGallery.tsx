import React from "react";
import { DesignAsset } from "../types";

interface Props {
  assets: DesignAsset[];
  onSelectAsset: (id: string) => void;
  onNavigateToSearch: (q: string) => void;
  onNavigateToLicense: () => void;
}

type BlockStyle = React.CSSProperties & {
  "--drop-delay": string;
  "--drop-turn": string;
  "--drop-drift": string;
};

function FallingBlock({
  shape,
  color,
  level = "bottom",
  delay,
  turn,
  label,
  onClick,
  children,
}: {
  shape: "hexagon" | "rectangle" | "clover" | "circle" | "palette";
  color?: string;
  level?: "bottom" | "top";
  delay: number;
  turn: number;
  label: string;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      className={`falling-block falling-block--${shape} falling-block--${level}`}
      style={
        {
          backgroundColor: color,
          "--drop-delay": `${delay}ms`,
          "--drop-turn": `${turn}deg`,
          "--drop-drift": `${turn * 1.5}%`,
        } as BlockStyle
      }
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

export function ShapeGallery({
  assets,
  onSelectAsset,
  onNavigateToSearch,
  onNavigateToLicense,
}: Props) {
  const openRecent = (type: string) => {
    const asset = assets
      .filter((a) => a.type === type)
      .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))[0];
    if (asset) onSelectAsset(asset.id);
    else onNavigateToSearch(type);
  };

  return (
    <section className="shape-gallery" aria-label="디자인 도형과 바로가기">
      <div className="block-stage">
        <div className="block-cluster">
          <div className="block-column">
            <FallingBlock
              shape="rectangle"
              color="#B7E1D1"
              delay={0}
              turn={-9}
              label="상세페이지 작업 찾기"
              onClick={() => onNavigateToSearch("상세페이지")}
            />
            <FallingBlock
              shape="hexagon"
              color="#A9D3FF"
              level="top"
              delay={760}
              turn={12}
              label="최근 과정 작업 보기"
              onClick={() => openRecent("상세페이지")}
            />
            <span className="block-caption">과정 작업</span>
          </div>
          <div className="block-column">
            <FallingBlock
              shape="rectangle"
              color="#FFB5B8"
              delay={150}
              turn={11}
              label="홍보 배너 찾기"
              onClick={() => onNavigateToSearch("배너")}
            />
            <FallingBlock
              shape="hexagon"
              color="#246BFD"
              level="top"
              delay={1030}
              turn={-12}
              label="최근 홍보 디자인 보기"
              onClick={() => openRecent("배너")}
            />
            <span className="block-caption">홍보 디자인</span>
          </div>
        </div>
        <div className="block-column block-column--clover">
          <FallingBlock
            shape="clover"
            color="#FFE59A"
            delay={310}
            turn={-17}
            label="산돌 라이선스 확인"
            onClick={onNavigateToLicense}
          />
          <span className="block-caption">라이선스</span>
        </div>
        <div className="block-column block-column--circle">
          <FallingBlock
            shape="circle"
            color="#246BFD"
            delay={470}
            turn={16}
            label="최근 카드뉴스 보기"
            onClick={() => openRecent("카드뉴스")}
          />
          <span className="block-caption">카드뉴스</span>
        </div>
        <div className="block-column block-column--palette">
          <FallingBlock
            shape="palette"
            delay={630}
            turn={-10}
            label="색채학 컬러 레퍼런스 찾기"
            onClick={() => onNavigateToSearch("색채학")}
          >
            {["#A9D3FF", "#B7E1D1", "#FFE59A", "#FFB5B8"].map((color) => (
              <i
                key={color}
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
            ))}
          </FallingBlock>
          <span className="block-caption">컬러 참고</span>
        </div>
      </div>
    </section>
  );
}
