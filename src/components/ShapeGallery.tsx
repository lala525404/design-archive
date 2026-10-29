import React from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { DesignAsset } from "../types";
import { DesignThumbnail } from "./DesignThumbnail";
interface Props {
  assets: DesignAsset[];
  onSelectAsset: (id: string) => void;
  onNavigateToSearch: (q: string) => void;
  onNavigateToLicense: () => void;
}
export function ShapeGallery({
  assets,
  onSelectAsset,
  onNavigateToSearch,
  onNavigateToLicense,
}: Props) {
  const get = (type: string) =>
    assets
      .filter((a) => a.type === type)
      .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))[0] || assets[0];
  return (
    <div className="shape-gallery" aria-label="최근 디자인과 레퍼런스">
      <button
        className="gallery-item gallery-hex"
        onClick={() => onSelectAsset(get("상세페이지").id)}
      >
        <div className="shape shape-hex">
          <DesignThumbnail asset={get("상세페이지")} />
          <span className="shape-arrow">
            <ArrowUpRight size={18} />
          </span>
        </div>
        <span className="shape-label">최근 과정 작업</span>
      </button>
      <button
        className="gallery-item gallery-rect"
        onClick={() => onSelectAsset(get("배너").id)}
      >
        <div className="shape shape-rect">
          <DesignThumbnail asset={get("배너")} />
          <span className="shape-arrow">
            <ArrowUpRight size={18} />
          </span>
        </div>
        <span className="shape-label">홍보 디자인</span>
      </button>
      <button
        className="gallery-item gallery-clover"
        onClick={onNavigateToLicense}
      >
        <div className="shape shape-clover">
          <Check size={42} strokeWidth={1.2} />
        </div>
        <span className="shape-label">라이선스 확인</span>
      </button>
      <button
        className="gallery-item gallery-circle"
        onClick={() => onSelectAsset(get("카드뉴스").id)}
      >
        <div className="shape shape-circle">
          <DesignThumbnail asset={get("카드뉴스")} />
        </div>
        <span className="shape-label">교수 소개 · 카드뉴스</span>
      </button>
      <button
        className="gallery-item gallery-colors"
        onClick={() => onNavigateToSearch("색채학")}
      >
        <div className="shape shape-colors">
          {["#A9D3FF", "#B7E1D1", "#FFE59A", "#FFB5B8"].map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
        </div>
        <span className="shape-label">컬러 레퍼런스</span>
      </button>
    </div>
  );
}
