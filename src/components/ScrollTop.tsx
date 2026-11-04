import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** 긴 페이지 오른쪽 아래 '맨 위로' 버튼. 조금 내려가면 나타난다 */
export function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 400);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <button
      type="button"
      className={`scroll-top ${show ? "is-on" : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="맨 위로"
      tabIndex={show ? 0 : -1}
    >
      <ArrowUp size={20} strokeWidth={2.4} />
      <span>TOP</span>
    </button>
  );
}
