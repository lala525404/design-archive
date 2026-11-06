import React from "react";

export function SampleNotice({ onClick, active = false }: { onClick: () => void; active?: boolean }) {
  return <div className="shared-sample-notice"><span>AI 디자인 생성은 아직 연결되지 않았어요. 미리 제작한 샘플로 사용 흐름을 확인해 보세요.</span><button type="button" className="shared-sample-button" onClick={onClick}>{active ? "샘플 종료" : "샘플로 사용해 보기"}</button></div>;
}
