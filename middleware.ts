/**
 * 사이트 비밀번호 잠금 (Vercel Routing Middleware)
 *
 * - 비밀번호는 Vercel 프로젝트 환경 변수 SITE_PASSWORD 로 정한다.
 *   (설정 전에는 아래 DEFAULT_PASSWORD 로 열린다)
 * - 맞으면 '세션 쿠키'를 준다 (브라우저를 닫으면 사라짐, 최대 12시간).
 *   여기에 더해 앱(index.html)이 비밀번호 화면에서 남긴 일회용 표시(sessionStorage)를 확인하고 바로 지운다.
 *   그래서 새로고침·새 탭·다시 방문 때마다 비밀번호를 묻는다 (시연용 동작).
 * - /__logout 으로 가면 잠금 상태로 돌아간다.
 * - 비밀번호를 바꾸면 기존 쿠키는 모두 무효가 된다.
 */
import { next } from "@vercel/functions";

export const config = {
  // 아이콘은 잠금 화면에서도 보이게 둔다
  matcher: "/((?!favicon\\.svg|favicon-32\\.png|apple-touch-icon\\.png).*)",
};

const DEFAULT_PASSWORD = "design2026!";
const COOKIE = "da_gate";
const MAX_AGE = 60 * 60 * 12;

const env = (k: string): string | undefined =>
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[k];

async function tokenOf(password: string) {
  const data = new TextEncoder().encode(`design-archive:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 같은 사이트 안의 경로만 돌아갈 곳으로 허용 */
const safeNext = (v: string) => (v.startsWith("/") && !v.startsWith("//") ? v : "/");

/** maxAge 없이 주면 세션 쿠키 (브라우저를 닫으면 사라짐). 서버 쪽 만료는 쿠키 값의 시각으로 확인 */
const cookieHeader = (value: string, maxAge?: number) =>
  `${COOKIE}=${value}; Path=/;${maxAge !== undefined ? ` Max-Age=${maxAge};` : ""} HttpOnly; Secure; SameSite=Strict`;

async function sign(issuedAt: number, secret: string) {
  return `${issuedAt}.${await tokenOf(`${secret}:${issuedAt}`)}`;
}

async function isValid(value: string | undefined, secret: string) {
  if (!value) return false;
  const [at] = value.split(".");
  const issuedAt = Number(at);
  if (!issuedAt || Date.now() - issuedAt > MAX_AGE * 1000) return false;
  return value === (await sign(issuedAt, secret));
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const password = env("SITE_PASSWORD") || DEFAULT_PASSWORD;
  const expected = await tokenOf(password);

  if (url.pathname === "/__login" && request.method === "POST") {
    const form = await request.formData();
    const password = String(form.get("password") ?? "");
    const back = safeNext(String(form.get("next") ?? "/"));
    if ((await tokenOf(password)) === expected) {
      return new Response(null, {
        status: 303,
        headers: { Location: back, "Set-Cookie": cookieHeader(await sign(Date.now(), expected)), "Cache-Control": "no-store" },
      });
    }
    // 틀리면 조금 기다렸다가 다시 묻는다 (마구 대입 방지)
    await new Promise((r) => setTimeout(r, 800));
    return loginPage(true);
  }

  if (url.pathname === "/__logout") {
    const back = safeNext(url.searchParams.get("next") ?? "/");
    return new Response(null, {
      status: 303,
      headers: {
        Location: `/__login?next=${encodeURIComponent(back)}`,
        "Set-Cookie": cookieHeader("", 0),
        "Cache-Control": "no-store",
      },
    });
  }

  if (url.pathname === "/__login") return loginPage(false);

  const value = (request.headers.get("cookie") ?? "")
    .split(/;\s*/)
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (await isValid(value, expected)) return next();

  return loginPage(false);
}

function loginPage(wrong: boolean) {
  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<meta name="theme-color" content="#ffffff" />
<title>디자인 자산 아카이브</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<style>
  /* 사이트와 같은 색: 글자 #1d1d1f · 보조 #6e6e73 · 면 #f5f5f7 · 선 #e8e8ed · 파랑 #0071e3 */
  * { box-sizing: border-box; margin: 0; }
  body {
    min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1fr); place-items: center; padding: 24px;
    font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif;
    background: #fff; color: #1d1d1f; -webkit-font-smoothing: antialiased;
  }
  main { width: 100%; max-width: 380px; text-align: center; }
  /* 노이즈 글래스 돋보기 + 차오르는 파란 물결 */
  .orb {
    position: relative; width: 128px; height: 128px; margin: 0 auto 28px; border-radius: 50%;
    overflow: hidden; isolation: isolate;
    background: radial-gradient(circle at 50% 30%, #f7fbff, #e6f0fc);
    box-shadow: 0 18px 40px rgba(0, 113, 227, .18), 0 2px 6px rgba(0, 0, 0, .06);
    transition: transform .4s cubic-bezier(.2,.8,.3,1);
  }
  .liquid {
    position: absolute; left: 0; right: 0; bottom: 0; height: 0%;
    background: linear-gradient(180deg, #2b8cff, #0071e3 60%, #0058b8);
    transition: height 2.2s cubic-bezier(.2,.7,.2,1);
  }
  body.loaded .liquid { height: 46%; }
  body.loaded.typing .liquid { height: 60%; }
  body.ok .liquid { height: 112%; transition-duration: .7s; }
  .wave {
    position: absolute; left: 0; bottom: 100%; width: 200%; height: 18px; margin-bottom: -1px;
    animation: drift 3.2s linear infinite;
  }
  .wave.back { opacity: .45; height: 22px; animation-duration: 5s; animation-direction: reverse; }
  @keyframes drift { to { transform: translateX(-50%); } }
  .glass {
    position: absolute; inset: 0; border-radius: 50%; z-index: 2;
    background:
      radial-gradient(90% 60% at 30% 12%, rgba(255,255,255,.7), rgba(255,255,255,0) 50%),
      linear-gradient(160deg, rgba(255,255,255,.22), rgba(255,255,255,0)),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: auto, auto, 140px 140px;
    -webkit-backdrop-filter: blur(2.5px) saturate(1.3); backdrop-filter: blur(2.5px) saturate(1.3);
    box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.7), inset 0 -10px 24px rgba(0, 60, 140, .18);
    mix-blend-mode: normal;
  }
  .glyph {
    position: absolute; inset: 0; z-index: 3; display: grid; place-items: center; color: #fff;
    filter: drop-shadow(0 1px 1px rgba(0, 40, 100, .35)) drop-shadow(0 4px 10px rgba(0, 60, 140, .35));
    transition: transform .4s cubic-bezier(.2,.8,.3,1);
  }
  .glyph svg { width: 46px; height: 46px; }
    .glyph { transition: transform .4s cubic-bezier(.2,.8,.3,1), color 1.2s ease .6s; }
  body.typing .glyph { transform: rotate(-14deg) scale(1.06); }
  body.ok .orb { transform: scale(1.06); }
  body.wrong .orb { animation: shake .45s ease; }
  @keyframes shake { 20% { transform: translateX(-8px) } 60% { transform: translateX(8px) } }
  /* 화면 아래에도 은은하게 차오르는 물결 */
  .sea { position: fixed; left: 0; right: 0; bottom: 0; height: 0; pointer-events: none; z-index: -1; transition: height 2.6s cubic-bezier(.2,.7,.2,1) .2s; }
  body.loaded .sea { height: 15vh; }
  body.ok .sea { height: 32vh; transition-duration: .8s; transition-delay: 0s; }
  .sea .body { position: absolute; inset: 0; background: linear-gradient(180deg, #e6f1fc, #d6e8fb); }
  .sea .wave { margin-bottom: -2px; }
  .sea .wave { height: 26px; animation-duration: 7s; }
  .sea .wave.back { height: 34px; animation-duration: 11s; }
  h1 { font-size: 26px; font-weight: 700; letter-spacing: -.035em; }
  .lead { margin-top: 8px; font-size: 15px; line-height: 1.55; color: #6e6e73; word-break: keep-all; }
  form { margin-top: 32px; }
  .field {
    display: flex; align-items: center; gap: 6px; height: 60px; padding: 0 6px 0 22px;
    border-radius: 980px; background: #f5f5f7; border: 2px solid transparent;
    transition: border-color .2s, background .2s;
  }
  .field:focus-within { background: #fff; border-color: #1d1d1f; }
  body.wrong .field { background: #fff; border-color: #ff3b30; }
  input {
    flex: 1; min-width: 0; height: 100%; border: 0; outline: none; background: transparent;
    font: inherit; font-size: 16px; color: #1d1d1f;
  }
  input::placeholder { color: #86868b; }
  .peek {
    width: 36px; height: 36px; border: 0; border-radius: 50%; background: transparent;
    color: #86868b; display: grid; place-items: center; cursor: pointer;
  }
  .peek:hover { color: #1d1d1f; background: #e8e8ed; }
  .go {
    width: 48px; height: 48px; flex: 0 0 auto; border: 0; border-radius: 50%;
    background: #1d1d1f; color: #fff; display: grid; place-items: center; cursor: pointer;
    transition: background .2s, transform .15s;
  }
  .go:hover { background: #0071e3; }
  .go:active { transform: scale(.94); }
  .msg { min-height: 20px; margin-top: 12px; font-size: 13px; font-weight: 600; color: #ff3b30; }
  .help { margin-top: 18px; font-size: 13px; color: #86868b; }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
</style>
</head>
<body class="${wrong ? "wrong" : ""}">
  <div class="sea" aria-hidden="true">
    <svg class="wave back" viewBox="0 0 200 30" preserveAspectRatio="none"><path d="M0 9 Q 12.5 0 25 9 T 50 9 T 75 9 T 100 9 T 125 9 T 150 9 T 175 9 T 200 9 V 30 H 0 Z" fill="#f0f6fe" /></svg>
    <svg class="wave" viewBox="0 0 200 30" preserveAspectRatio="none"><path d="M0 9 Q 12.5 0 25 9 T 50 9 T 75 9 T 100 9 T 125 9 T 150 9 T 175 9 T 200 9 V 30 H 0 Z" fill="#e6f1fc" /></svg>
    <div class="body"></div>
  </div>
  <main>
    <div class="orb" aria-hidden="true">
      <div class="liquid">
        <svg class="wave back" viewBox="0 0 200 30" preserveAspectRatio="none"><path d="M0 9 Q 12.5 0 25 9 T 50 9 T 75 9 T 100 9 T 125 9 T 150 9 T 175 9 T 200 9 V 30 H 0 Z" fill="#5aa9ff" /></svg>
        <svg class="wave" viewBox="0 0 200 30" preserveAspectRatio="none"><path d="M0 9 Q 12.5 0 25 9 T 50 9 T 75 9 T 100 9 T 125 9 T 150 9 T 175 9 T 200 9 V 30 H 0 Z" fill="#2b8cff" /></svg>
      </div>
      <div class="glass"></div>
      <div class="glyph">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 L20 20" />
        </svg>
      </div>
    </div>
    <h1>디자인 자산 아카이브</h1>
    <p class="lead">사내 전용 페이지예요. 비밀번호를 입력해 주세요.</p>
    <form method="post" action="/__login" id="f">
      <div class="field">
        <input id="pw" type="password" name="password" placeholder="비밀번호" autocomplete="current-password" autofocus required aria-label="비밀번호" />
        <button class="peek" type="button" id="peek" aria-label="비밀번호 보기">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="go" type="submit" aria-label="들어가기">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </div>
      <p class="msg" role="alert">${wrong ? "비밀번호가 맞지 않아요. 다시 입력해 주세요." : ""}</p>
      <input type="hidden" name="next" id="next" value="/" />
    </form>
    <p class="help">비밀번호는 디자인팀에 문의해 주세요.</p>
  </main>
  <script>
    var b = document.body, pw = document.getElementById("pw");
    requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add("loaded"); }); });
    pw.addEventListener("focus", function () { b.classList.add("typing"); });
    pw.addEventListener("blur", function () { b.classList.remove("typing"); });
    pw.addEventListener("input", function () { b.classList.remove("wrong"); });
    document.getElementById("peek").addEventListener("click", function () {
      pw.type = pw.type === "password" ? "text" : "password"; pw.focus();
    });
    // 보던 화면(# 주소 포함)으로 돌아가도록, 그리고 이 탭은 열어 둔 것으로 표시
    document.getElementById("f").addEventListener("submit", function () {
      b.classList.add("ok");
      var q = new URLSearchParams(location.search).get("next");
      document.getElementById("next").value =
        q || (location.pathname === "/__login" ? "/" : location.pathname + location.search + location.hash);
      try { sessionStorage.setItem("da_unlocked", "1"); } catch (e) {}
    });
  </script>
</body>
</html>`;
  return new Response(html, {
    status: 401,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
