/**
 * 사이트 비밀번호 잠금 (Vercel Routing Middleware)
 *
 * - 비밀번호는 Vercel 프로젝트 환경 변수 SITE_PASSWORD 로 정한다.
 *   (설정 전에는 아래 DEFAULT_PASSWORD 로 열린다)
 * - 맞으면 '세션 쿠키'를 준다 (브라우저를 닫으면 사라짐, 최대 12시간).
 *   여기에 더해 앱이 탭마다 확인 표시(sessionStorage)를 보고, 없으면 /__logout 으로 보내
 *   새 탭·창으로 다시 들어올 때마다 비밀번호를 묻는다. (새로고침은 그대로 통과)
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
<meta name="theme-color" content="#f2f2f2" />
<title>디자인 자산 아카이브</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { height: 100%; }
  body {
    min-height: 100vh; display: grid; place-items: center; padding: 24px; overflow: hidden;
    font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif;
    background: #efefef; color: #1d1d1f; -webkit-font-smoothing: antialiased;
  }
  /* 배경: 아래쪽 검은 언덕 + 은은한 핑크 원 */
  .hill {
    position: fixed; left: -10vw; right: -10vw; bottom: -38vh; height: 70vh;
    background: #1d1d1f; border-radius: 50% 50% 0 0 / 40% 40% 0 0; transform: rotate(-4deg);
  }
  .sun {
    position: fixed; width: 220px; height: 220px; border-radius: 50%;
    left: calc(50% - 330px); top: calc(50% - 250px);
    background: radial-gradient(circle at 40% 40%, #f6c9c4, #fde9e6 60%, rgba(253,233,230,0) 72%);
  }
  .card {
    position: relative; width: 100%; max-width: 360px; text-align: center;
    padding: 44px 30px 30px; border-radius: 40px; background: #fff;
    box-shadow: 0 30px 80px rgba(0,0,0,.14), 0 2px 6px rgba(0,0,0,.04);
  }
  /* 캐릭터: 열쇠를 든 검은 폴더 */
  .buddy { width: 168px; height: 150px; margin: 0 auto 18px; display: block; overflow: visible; }
  .bob { animation: bob 2.6s ease-in-out infinite; transform-origin: 80px 120px; }
  @keyframes bob { 50% { transform: translateY(-6px); } }
  .shadow { animation: shadow 2.6s ease-in-out infinite; transform-origin: 80px 138px; }
  @keyframes shadow { 50% { transform: scaleX(.86); opacity: .7; } }
  .eyes { transition: transform .25s ease; }
  .lid { transform-origin: center; transform-box: fill-box; animation: blink 4.2s infinite; }
  @keyframes blink { 0%, 94%, 100% { transform: scaleY(1); } 97% { transform: scaleY(.1); } }
  .key { animation: key 2.6s ease-in-out infinite; transform-origin: 130px 92px; }
  @keyframes key { 50% { transform: rotate(-10deg); } }
  .sparkle { animation: twinkle 1.8s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
  .sparkle.s2 { animation-delay: .9s; }
  @keyframes twinkle { 50% { transform: scale(.4); opacity: .3; } }
  .sweat, .x-eye { opacity: 0; transition: opacity .2s; }
  body.typing .eyes { transform: translate(-4px, 5px); }
  body.wrong .open-eye { opacity: 0; }
  body.wrong .x-eye, body.wrong .sweat { opacity: 1; }
  body.wrong .bob { animation: shake .45s ease 1, bob 2.6s ease-in-out .45s infinite; }
  @keyframes shake { 20% { transform: translateX(-7px) rotate(-4deg); } 60% { transform: translateX(7px) rotate(4deg); } }
  body.ok .bob { animation: hop .5s ease forwards; }
  @keyframes hop { 40% { transform: translateY(-18px); } 100% { transform: translateY(0); } }

  h1 { font-size: 22px; font-weight: 800; letter-spacing: -.035em; }
  .lead { margin-top: 8px; font-size: 14px; line-height: 1.55; color: #6e6e73; }
  form { margin-top: 26px; display: grid; gap: 12px; }
  .field { position: relative; }
  input[type=password], input[type=text] {
    width: 100%; height: 56px; padding: 0 52px 0 22px;
    border: 2px solid transparent; border-radius: 18px; background: #f2f2f2;
    font: inherit; font-size: 16px; color: #1d1d1f; outline: none; transition: border-color .2s, background .2s;
  }
  input:focus { background: #fff; border-color: #1d1d1f; }
  body.wrong input { border-color: #ff4d4f; background: #fff; }
  .peek {
    position: absolute; right: 10px; top: 10px; width: 36px; height: 36px; border: 0; border-radius: 12px;
    background: transparent; color: #8e8e93; display: grid; place-items: center; cursor: pointer;
  }
  .peek:hover { background: #e8e8ed; color: #1d1d1f; }
  .go {
    height: 56px; border: 0; border-radius: 18px; background: #1d1d1f; color: #fff;
    font: inherit; font-size: 16px; font-weight: 700; cursor: pointer;
    box-shadow: 0 10px 24px rgba(0,0,0,.18); transition: transform .15s, background .2s;
  }
  .go:hover { background: #000; transform: translateY(-1px); }
  .go:active { transform: translateY(1px); }
  .msg { min-height: 18px; margin: -4px 0 -2px; font-size: 13px; color: #ff4d4f; font-weight: 600; }
  .help { margin-top: 18px; font-size: 13px; color: #8e8e93; }
  .help b { color: #1d1d1f; font-weight: 600; }
  @media (max-width: 480px) {
    body { padding: 16px; }
    .card { padding: 36px 22px 24px; border-radius: 32px; }
    .sun { left: -60px; top: 40px; }
  }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
</head>
<body class="${wrong ? "wrong" : ""}">
  <div class="sun" aria-hidden="true"></div>
  <div class="hill" aria-hidden="true"></div>
  <main class="card">
    <svg class="buddy" viewBox="0 0 168 150" aria-hidden="true">
      <ellipse class="shadow" cx="80" cy="138" rx="46" ry="6" fill="#e6e6e6" />
      <g class="bob">
        <!-- 다리 -->
        <rect x="54" y="116" width="12" height="18" rx="6" fill="#1d1d1f" />
        <rect x="92" y="116" width="12" height="18" rx="6" fill="#1d1d1f" />
        <!-- 폴더 뒤판(탭) -->
        <path d="M30 48 a12 12 0 0 1 12 -12 h22 a8 8 0 0 1 6 3 l7 8 h41 a12 12 0 0 1 12 12 v10 h-100 z" fill="#3a3a3c" />
        <!-- 안에 꽂힌 종이 -->
        <rect x="44" y="40" width="40" height="26" rx="4" fill="#fff" transform="rotate(-8 64 53)" />
        <rect x="76" y="38" width="38" height="28" rx="4" fill="#f6c9c4" transform="rotate(7 95 52)" />
        <!-- 폴더 앞판 -->
        <path d="M28 62 a6 6 0 0 1 6 -6 h92 a6 6 0 0 1 6 6 v48 a16 16 0 0 1 -16 16 h-72 a16 16 0 0 1 -16 -16 z" fill="#1d1d1f" />
        <!-- 눈 -->
        <g class="eyes">
          <g class="open-eye">
            <g class="lid"><ellipse cx="64" cy="86" rx="10" ry="11" fill="#fff" /><circle cx="66" cy="88" r="5" fill="#1d1d1f" /><circle cx="68" cy="85" r="1.8" fill="#fff" /></g>
            <g class="lid"><ellipse cx="96" cy="86" rx="10" ry="11" fill="#fff" /><circle cx="98" cy="88" r="5" fill="#1d1d1f" /><circle cx="100" cy="85" r="1.8" fill="#fff" /></g>
          </g>
          <g class="x-eye" stroke="#fff" stroke-width="3.4" stroke-linecap="round">
            <path d="M57 80 l13 12 M70 80 l-13 12" /><path d="M89 80 l13 12 M102 80 l-13 12" />
          </g>
        </g>
        <ellipse cx="54" cy="102" rx="6" ry="3.5" fill="#ff8b8b" opacity=".55" />
        <ellipse cx="106" cy="102" rx="6" ry="3.5" fill="#ff8b8b" opacity=".55" />
        <path class="sweat" d="M24 66 q6 9 0 13 q-6 -4 0 -13z" fill="#8cc3fa" />
        <!-- 열쇠 든 팔 -->
        <g class="key">
          <path d="M130 92 q14 -2 16 -24" fill="none" stroke="#1d1d1f" stroke-width="8" stroke-linecap="round" />
          <circle cx="148" cy="44" r="11" fill="none" stroke="#ffcc33" stroke-width="6" />
          <path d="M147 56 l-1 12 M146 62 h-6" stroke="#ffcc33" stroke-width="6" stroke-linecap="round" />
        </g>
      </g>
      <path class="sparkle" d="M22 30 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#ffcc33" />
      <path class="sparkle s2" d="M152 92 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#1d1d1f" />
    </svg>
    <h1>디자인 자산 아카이브</h1>
    <p class="lead">사내 전용 공간이에요.<br />비밀번호를 넣으면 문이 열려요.</p>
    <form method="post" action="/__login" id="f">
      <div class="field">
        <input id="pw" type="password" name="password" placeholder="비밀번호" autocomplete="current-password" autofocus required aria-label="비밀번호" />
        <button class="peek" type="button" id="peek" aria-label="비밀번호 보기">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
      <p class="msg" role="alert">${wrong ? "앗, 비밀번호가 달라요. 다시 입력해 주세요." : ""}</p>
      <button class="go" type="submit">들어가기</button>
      <input type="hidden" name="next" id="next" value="/" />
    </form>
    <p class="help">비밀번호를 모르면 <b>디자인팀</b>에 물어봐 주세요</p>
  </main>
  <script>
    var b = document.body, pw = document.getElementById("pw");
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
