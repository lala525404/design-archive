import React from "react";
import { DesignAsset } from "../types";

interface Props {
  asset: DesignAsset;
  className?: string;
  showOverlay?: boolean;
}

// 원본 이미지가 없는 샘플용 그래픽 미리보기.
// 작업 유형마다 실제 시안 비율로 그리고, 보는 칸의 비율과 상관없이 잘리지 않게 여백(매트) 위에 놓는다.

interface Combo {
  bg: string;
  ink: string;
  a: string;
  b: string;
}
const COMBOS: Combo[] = [
  { bg: "#F5CC55", ink: "#191919", a: "#6E9BF7", b: "#F7F3EF" },
  { bg: "#7FE495", ink: "#191919", a: "#F5BFF0", b: "#F7F3EF" },
  { bg: "#6E9BF7", ink: "#FFFFFF", a: "#F5CC55", b: "#F7F3EF" },
  { bg: "#F5BFF0", ink: "#191919", a: "#F28C5A", b: "#F7F3EF" },
  { bg: "#F7F3EF", ink: "#191919", a: "#7FE495", b: "#6E9BF7" },
  { bg: "#F28C5A", ink: "#191919", a: "#F7F3EF", b: "#F5CC55" },
];

const FRAME: Record<string, { w: number; h: number }> = {
  상세페이지: { w: 300, h: 420 },
  포스터: { w: 300, h: 420 },
  카드뉴스: { w: 400, h: 400 },
  배너: { w: 640, h: 360 },
  썸네일: { w: 640, h: 360 },
  소개자료: { w: 600, h: 400 },
};

const short = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max)}` : text;

export function DesignThumbnail({ asset, className = "" }: Props) {
  if (asset.imageUrl)
    return (
      <div className={`design-thumbnail ${className}`}>
        <img src={asset.imageUrl} alt={`${asset.title} 미리보기`} />
      </div>
    );
  const n = Number(asset.id.split("-")[1]) || 1;
  const c = COMBOS[(n - 1) % COMBOS.length];
  const { w, h } = FRAME[asset.type] ?? FRAME["카드뉴스"];
  const course = short(asset.course, 9);
  const prof = `${asset.professor} 교수`;
  const T = (props: React.SVGProps<SVGTextElement>) => (
    <text fill={c.ink} {...props} />
  );

  let art: React.ReactNode;
  switch (asset.type) {
    case "상세페이지":
      art = (
        <>
          <rect width={w} height={h} fill="#FFFFFF" />
          <rect width={w} height="230" fill={c.bg} />
          <circle cx="232" cy="78" r="46" fill={c.a} />
          <T x="24" y="40" fontSize="11" fontWeight="600" opacity=".7">
            {asset.year} · {asset.type}
          </T>
          <T x="24" y="128" fontSize="30" fontWeight="800">
            {course}
          </T>
          <T x="24" y="164" fontSize="30" fontWeight="800">
            과정 안내
          </T>
          <T x="24" y="206" fontSize="11" opacity=".8">
            {prof}
          </T>
          <rect x="24" y="254" width="120" height="8" rx="4" fill="#191919" />
          <rect x="24" y="272" width="210" height="5" rx="2.5" fill="#D9D4CD" />
          <rect x="24" y="284" width="180" height="5" rx="2.5" fill="#D9D4CD" />
          <rect x="24" y="310" width="78" height="78" rx="10" fill={c.a} />
          <rect x="111" y="310" width="78" height="78" rx="10" fill={c.bg} />
          <rect x="198" y="310" width="78" height="78" rx="10" fill="#EFEAE4" />
          <rect x="24" y="402" width="252" height="5" rx="2.5" fill="#D9D4CD" />
        </>
      );
      break;
    case "포스터":
      art = (
        <>
          <rect width={w} height={h} fill={c.bg} />
          <circle cx="150" cy="150" r="96" fill={c.a} />
          <rect x="102" y="102" width="96" height="96" rx="14" fill={c.b} />
          <T x="24" y="300" fontSize="34" fontWeight="800">
            {short(asset.course, 7)}
          </T>
          <T x="24" y="336" fontSize="16" fontWeight="600">
            특강 포스터
          </T>
          <line x1="24" y1="370" x2="276" y2="370" stroke={c.ink} opacity=".5" />
          <T x="24" y="394" fontSize="11">
            {prof}
          </T>
          <T x="276" y="394" fontSize="11" textAnchor="end">
            {asset.year}
          </T>
        </>
      );
      break;
    case "카드뉴스":
      art = (
        <>
          <rect width={w} height={h} fill={c.bg} />
          <T x="32" y="56" fontSize="13" fontWeight="600" opacity=".7">
            {asset.course}
          </T>
          <T x="32" y="168" fontSize="110" fontWeight="800">
            01
          </T>
          <T x="32" y="236" fontSize="30" fontWeight="800">
            {short(asset.title.replace(asset.professor, "").trim(), 10)}
          </T>
          <circle cx="330" cy="330" r="62" fill={c.a} />
          <rect x="32" y="300" width="150" height="6" rx="3" fill={c.ink} opacity=".35" />
          <rect x="32" y="316" width="110" height="6" rx="3" fill={c.ink} opacity=".35" />
          <T x="32" y="368" fontSize="13" fontWeight="600">
            {prof}
          </T>
        </>
      );
      break;
    case "배너":
      art = (
        <>
          <rect width={w} height={h} fill={c.bg} />
          <circle cx="500" cy="180" r="130" fill={c.a} />
          <rect x="430" y="110" width="140" height="140" rx="22" fill={c.b} />
          <T x="40" y="64" fontSize="14" fontWeight="600" opacity=".7">
            {asset.year} 모집
          </T>
          <T x="40" y="160" fontSize="48" fontWeight="800">
            {short(asset.course, 8)}
          </T>
          <T x="40" y="218" fontSize="28" fontWeight="600">
            지금 시작하기
          </T>
          <rect x="40" y="270" width="132" height="40" rx="10" fill={c.ink} />
          <text x="106" y="296" fontSize="15" fontWeight="600" textAnchor="middle" fill={c.bg}>
            수강 신청
          </text>
        </>
      );
      break;
    case "썸네일":
      art = (
        <>
          <rect width={w} height={h} fill={c.bg} />
          <rect x="380" y="40" width="220" height="280" rx="24" fill={c.a} />
          <circle cx="490" cy="150" r="58" fill={c.b} />
          <rect x="420" y="222" width="140" height="98" rx="49" fill={c.b} />
          <T x="40" y="74" fontSize="16" fontWeight="600" opacity=".7">
            워크숍
          </T>
          <T x="40" y="170" fontSize="52" fontWeight="800">
            {short(asset.course, 6)}
          </T>
          <T x="40" y="236" fontSize="52" fontWeight="800">
            핵심 정리
          </T>
          <T x="40" y="300" fontSize="15" fontWeight="600">
            {prof}
          </T>
        </>
      );
      break;
    default:
      // 소개자료: 3단 접지 리플렛
      art = (
        <>
          <rect width={w} height={h} fill="#FFFFFF" />
          <rect width="200" height={h} fill={c.bg} />
          <rect x="400" width="200" height={h} fill={c.a} opacity=".55" />
          <line x1="200" y1="0" x2="200" y2={h} stroke="#191919" opacity=".12" />
          <line x1="400" y1="0" x2="400" y2={h} stroke="#191919" opacity=".12" />
          <T x="24" y="52" fontSize="11" fontWeight="600" opacity=".7">
            {asset.year} · {asset.type}
          </T>
          <T x="24" y="200" fontSize="28" fontWeight="800">
            {short(asset.course, 6)}
          </T>
          <T x="24" y="236" fontSize="28" fontWeight="800">
            실습 안내
          </T>
          <T x="24" y="370" fontSize="11">
            {prof}
          </T>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x="224" y={60 + i * 26} width={i % 2 ? 120 : 150} height="6" rx="3" fill="#D9D4CD" />
          ))}
          {["#F5CC55", "#7FE495", "#6E9BF7", "#F28C5A", "#F5BFF0", "#191919"].map((col, i) => (
            <rect key={col} x={224 + (i % 3) * 52} y={190 + Math.floor(i / 3) * 52} width="44" height="44" rx="8" fill={col} />
          ))}
          <circle cx="500" cy="200" r="64" fill="#FFFFFF" />
          <circle cx="500" cy="200" r="30" fill={c.bg} />
        </>
      );
  }

  return (
    <div className={`design-thumbnail ${className}`}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`${asset.title} 샘플 미리보기`}
      >
        <g>{art}</g>
      </svg>
    </div>
  );
}
