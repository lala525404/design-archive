/**
 * 사이트 비밀번호 잠금 (Vercel Routing Middleware)
 *
 * - 비밀번호는 Vercel 프로젝트 환경 변수 SITE_PASSWORD 로 정한다.
 *   (설정 전에는 아래 DEFAULT_PASSWORD 로 열린다)
 * - 맞으면 30일 동안 기억하는 쿠키를 주고, 그동안은 다시 묻지 않는다.
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
const MAX_AGE = 60 * 60 * 24 * 30;

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

const cookieHeader = (value: string, maxAge: number) =>
  `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const expected = await tokenOf(env("SITE_PASSWORD") || DEFAULT_PASSWORD);

  if (url.pathname === "/__login" && request.method === "POST") {
    const form = await request.formData();
    const password = String(form.get("password") ?? "");
    const back = safeNext(String(form.get("next") ?? "/"));
    if ((await tokenOf(password)) === expected) {
      return new Response(null, {
        status: 303,
        headers: { Location: back, "Set-Cookie": cookieHeader(expected, MAX_AGE), "Cache-Control": "no-store" },
      });
    }
    // 틀리면 조금 기다렸다가 다시 묻는다 (마구 대입 방지)
    await new Promise((r) => setTimeout(r, 800));
    return loginPage(true);
  }

  if (url.pathname === "/__logout") {
    return new Response(null, {
      status: 303,
      headers: { Location: "/", "Set-Cookie": cookieHeader("", 0), "Cache-Control": "no-store" },
    });
  }

  const cookies = (request.headers.get("cookie") ?? "").split(/;\s*/);
  if (cookies.includes(`${COOKIE}=${expected}`)) return next();

  return loginPage(false);
}

function loginPage(wrong: boolean) {
  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>디자인 자산 아카이브</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<style>
  :root { --blue: #0071e3; }
  * { box-sizing: border-box; margin: 0; }
  body {
    min-height: 100vh; display: grid; place-items: center; padding: 24px;
    font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif;
    background: radial-gradient(1200px 600px at 50% -10%, #e8f1fd 0%, #fff 60%);
    color: #1d1d1f; -webkit-font-smoothing: antialiased;
  }
  .card {
    width: 100%; max-width: 380px; text-align: center;
    padding: 40px 32px 32px; border-radius: 28px;
    background: rgba(255,255,255,.85); backdrop-filter: blur(20px);
    box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 24px 60px rgba(0,0,0,.08);
  }
  .logo { width: 64px; height: 64px; margin: 0 auto 20px; display: block; }
  h1 { font-size: 24px; font-weight: 700; letter-spacing: -.03em; }
  p { margin-top: 8px; font-size: 14px; color: #6e6e73; line-height: 1.5; }
  form { margin-top: 26px; display: grid; gap: 10px; }
  .field { position: relative; }
  input {
    width: 100%; height: 52px; padding: 0 52px 0 18px;
    border: 1px solid ${wrong ? "#ff3b30" : "#d2d2d7"}; border-radius: 14px;
    font: inherit; font-size: 16px; background: #fff; outline: none;
  }
  input:focus { border-color: var(--blue); box-shadow: 0 0 0 4px rgba(0,113,227,.15); }
  .go {
    position: absolute; right: 6px; top: 6px; width: 40px; height: 40px;
    border: 0; border-radius: 50%; background: #1d1d1f; color: #fff;
    display: grid; place-items: center; cursor: pointer;
  }
  .go:hover { background: var(--blue); }
  .err { font-size: 13px; color: #e5254d; min-height: 18px; }
  .shake { animation: shake .35s; }
  @keyframes shake { 25% { transform: translateX(-6px) } 75% { transform: translateX(6px) } }
  small { display: block; margin-top: 18px; font-size: 12px; color: #aeaeb2; }
</style>
</head>
<body>
  <main class="card${wrong ? " shake" : ""}">
    <svg class="logo" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="#0071e3"/>
      <g transform="rotate(-10 32 32)" fill="#fff">
        <rect x="16" y="16" width="14" height="14" rx="3.5"/><rect x="34" y="16" width="14" height="14" rx="3.5"/>
        <rect x="16" y="34" width="14" height="14" rx="3.5"/><circle cx="41" cy="41" r="7"/>
      </g>
    </svg>
    <h1>디자인 자산 아카이브</h1>
    <p>사내 전용 페이지예요.<br />비밀번호를 입력해 주세요.</p>
    <form method="post" action="/__login" id="f">
      <div class="field">
        <input type="password" name="password" placeholder="비밀번호" autocomplete="current-password" autofocus required aria-label="비밀번호" />
        <button class="go" type="submit" aria-label="들어가기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </div>
      <input type="hidden" name="next" id="next" value="/" />
      <div class="err" role="alert">${wrong ? "비밀번호가 맞지 않아요." : ""}</div>
    </form>
    <small>비밀번호는 디자인팀에 문의해 주세요.</small>
  </main>
  <script>
    // 보던 화면(# 주소 포함)으로 돌아가도록
    document.getElementById("f").addEventListener("submit", function () {
      var p = location.pathname === "/__login" ? "/" : location.pathname;
      document.getElementById("next").value = p + location.search + location.hash;
    });
  </script>
</body>
</html>`;
  return new Response(html, {
    status: 401,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
