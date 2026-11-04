import React, { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Heart,
  ImagePlus,
  Link2,
  MessageCircle,
  PenLine,
  Play,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { DesignAsset, JournalCategory, JournalPost, JournalSwatch } from "../types";
import { DesignThumbnail } from "../components/DesignThumbnail";
import { TrendArt } from "../components/TrendArt";
import { ScrollTop } from "../components/ScrollTop";
import { groupProjects, typeSummary } from "../lib/projects";
import { serviceName } from "../lib/taxonomy";

export const JOURNAL_CATEGORIES: JournalCategory[] = ["트렌드", "AI 뉴스", "레퍼런스", "툴·팁", "공지"];

const CATEGORY_TONE: Record<JournalCategory, string> = {
  트렌드: "#0071e3",
  "AI 뉴스": "#5e5ce6",
  레퍼런스: "#8e44ad",
  "툴·팁": "#c46a00",
  공지: "#1d1d1f",
};

const fmt = (d: string) => d.replace(/-/g, ".");

/** 표지: 이미지 → 팔레트 띠 → 카테고리 색 */
function Cover({ post, large }: { post: JournalPost; large?: boolean }) {
  if (post.coverUrl)
    return (
      <div className={`jr-cover ${large ? "is-large" : ""}`}>
        <img src={post.coverUrl} alt="" />
      </div>
    );
  if (post.coverArt)
    return (
      <div className={`jr-cover is-art ${large ? "is-large" : ""}`}>
        <TrendArt name={post.coverArt} />
      </div>
    );
  if (post.palette?.length)
    return (
      <div className={`jr-cover is-palette ${large ? "is-large" : ""}`}>
        {post.palette.map((s) => (
          <span key={s.hex + s.name} style={{ background: s.hex }} />
        ))}
        <b>{post.title}</b>
      </div>
    );
  return (
    <div
      className={`jr-cover is-plain ${large ? "is-large" : ""}`}
      style={{ background: CATEGORY_TONE[post.category] }}
    >
      <em className="jr-cover-cat">{post.category}</em>
      <b>{post.title}</b>
    </div>
  );
}

const toSeconds = (t: string) =>
  t.split(":").reduce((acc, n) => acc * 60 + (parseInt(n, 10) || 0), 0);

/**
 * 본문: 빈 줄 문단, '## ' 소제목, '- ' 목록
 * 그림과 영상: ![설명](이미지주소) · [[art:이름|설명]] · [[youtube:영상ID]] · [[t:2:42|설명]](영상 그 시점부터 보기)
 */
function Body({ text }: { text: string }) {
  const [start, setStart] = useState<number | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const videoId = text.match(/\[\[youtube:([\w-]{6,})\]\]/)?.[1];
  const jump = (sec: number) => {
    setStart(sec);
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push(<p key={`p${blocks.length}`}>{para.join(" ")}</p>);
    if (list.length)
      blocks.push(
        <ul key={`u${blocks.length}`}>
          {list.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>,
      );
    para = [];
    list = [];
  };
  text.split("\n").forEach((raw) => {
    const line = raw.trim();
    if (!line) return flush();
    const img = line.match(/^!\[(.*?)\]\((\S+?)\)$/);
    const art = line.match(/^\[\[art:([\w-]+)(?:\|(.*))?\]\]$/);
    const yt = line.match(/^\[\[youtube:([\w-]+)\]\]$/);
    const t = line.match(/^\[\[t:([\d:]+)(?:\|(.*))?\]\]$/);
    if (img || art || yt || t) flush();
    if (img) {
      blocks.push(
        <figure key={`i${blocks.length}`} className="jr-figure">
          <img src={img[2]} alt={img[1]} loading="lazy" />
          {img[1] && <figcaption>{img[1]}</figcaption>}
        </figure>,
      );
    } else if (art) {
      blocks.push(
        <figure key={`a${blocks.length}`} className="jr-figure is-art">
          <TrendArt name={art[1]} />
          {art[2] && <figcaption>{art[2]}</figcaption>}
        </figure>,
      );
    } else if (yt) {
      blocks.push(
        <div key={`y${blocks.length}`} className="jr-video" ref={playerRef}>
          <iframe
            key={start ?? 0}
            src={`https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0${start != null ? `&start=${start}&autoplay=1` : ""}`}
            title="YouTube 영상"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>,
      );
    } else if (t) {
      if (videoId)
        blocks.push(
          <button key={`t${blocks.length}`} type="button" className="jr-jump" onClick={() => jump(toSeconds(t[1]))}>
            <Play size={13} fill="currentColor" />
            {t[2] || "영상"} {t[1]}부터 보기
          </button>,
        );
    } else if (line.startsWith("## ")) {
      flush();
      blocks.push(<h2 key={`h${blocks.length}`}>{line.slice(3)}</h2>);
    } else if (line.startsWith("- ")) {
      if (para.length) {
        const p = para;
        para = [];
        blocks.push(<p key={`p${blocks.length}`}>{p.join(" ")}</p>);
      }
      list.push(line.slice(2));
    } else {
      if (list.length) flush();
      para.push(line);
    }
  });
  flush();
  return <div className="jr-body">{blocks}</div>;
}

interface Props {
  posts: JournalPost[];
  assets: DesignAsset[];
  /** 'new' = 글쓰기, 'edit:<id>' = 수정, 그 외 = 글 보기, 없음 = 목록 */
  postId?: string;
  me: string;
  canWrite: boolean;
  onOpen: (id?: string) => void;
  onBack: () => void;
  onSave: (post: JournalPost) => void;
  onDelete: (id: string) => void;
  onUpdate: (post: JournalPost) => void;
  onOpenProject: (key: string) => void;
}

export function JournalView(props: Props) {
  const { posts, postId } = props;
  let page: React.ReactNode;
  if (postId === "new") page = <Editor {...props} />;
  else if (postId?.startsWith("edit:")) {
    const p = posts.find((x) => x.id === postId.slice(5));
    page = <Editor {...props} initial={p} />;
  } else {
    const post = postId ? posts.find((p) => p.id === postId) : undefined;
    page = post ? <PostPage {...props} post={post} /> : <JournalList {...props} />;
  }
  return (
    <>
      {page}
      <ScrollTop />
    </>
  );
}

function JournalList({ posts, onOpen, canWrite }: Props) {
  const [cat, setCat] = useState<JournalCategory | "전체">("전체");
  const [tag, setTag] = useState("");
  const sorted = useMemo(
    () => [...posts].sort((a, b) => b.date.localeCompare(a.date)),
    [posts],
  );
  const list = sorted.filter(
    (p) => (cat === "전체" || p.category === cat) && (!tag || p.tags.includes(tag)),
  );
  const tags = Array.from(new Set(sorted.flatMap((p) => p.tags))).slice(0, 14);
  const [first, ...rest] = list;

  return (
    <main className="page-shell journal-page">
      <header className="jr-head">
        <div>
          <p className="jr-eyebrow">디자인 저널</p>
          <h1>트렌드와 레퍼런스, 작업 이야기를 나눠요</h1>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => onOpen("new")}>
            <PenLine size={16} />
            글쓰기
          </button>
        )}
      </header>

      <div className="jr-filters">
        <div className="jr-cats" role="tablist" aria-label="카테고리">
          {(["전체", ...JOURNAL_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={cat === c}
              className={cat === c ? "on" : ""}
              onClick={() => setCat(c)}
            >
              {c}
              <em>{c === "전체" ? posts.length : posts.filter((p) => p.category === c).length}</em>
            </button>
          ))}
        </div>
        <div className="jr-tags">
          {tags.map((t) => (
            <button key={t} className={tag === t ? "on" : ""} onClick={() => setTag(tag === t ? "" : t)}>
              #{t}
            </button>
          ))}
        </div>
      </div>

      {cat === "AI 뉴스" && (
        <p className="finder-note">
          <Sparkles size={14} />
          디자인에 쓰는 AI 툴 소식을 주 1회 정리해 올릴 예정이에요. 지금은 이번 주 글만 샘플로 있어요.
        </p>
      )}

      {!first ? (
        <p className="finder-empty">아직 글이 없어요.</p>
      ) : (
        <>
          <button className="jr-feature" onClick={() => onOpen(first.id)}>
            <Cover post={first} large />
            <div className="jr-feature-text">
              <span className="jr-cat" style={{ color: CATEGORY_TONE[first.category] }}>
                {first.category}
              </span>
              <h2>{first.title}</h2>
              <p>{first.summary}</p>
              <Meta post={first} />
            </div>
          </button>
          {rest.length > 0 && (
            <ul className="jr-grid">
              {rest.map((p) => (
                <li key={p.id}>
                  <button className="jr-card" onClick={() => onOpen(p.id)}>
                    <Cover post={p} />
                    <span className="jr-cat" style={{ color: CATEGORY_TONE[p.category] }}>
                      {p.category}
                    </span>
                    <h3>{p.title}</h3>
                    <p>{p.summary}</p>
                    <Meta post={p} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

function Meta({ post }: { post: JournalPost }) {
  return (
    <span className="jr-meta">
      {post.author} · {fmt(post.date)}
      <span>
        <Heart size={13} /> {post.likes.length}
      </span>
      <span>
        <MessageCircle size={13} /> {post.comments.length}
      </span>
    </span>
  );
}

function PostPage({
  post,
  assets,
  me,
  canWrite,
  onBack,
  onOpen,
  onUpdate,
  onDelete,
  onOpenProject,
}: Props & { post: JournalPost }) {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState("");
  const liked = post.likes.includes(me);
  const projects = groupProjects(assets).filter((p) => post.relatedProjects?.includes(p.key));
  const mine = post.author === me;

  const copyHex = async (s: JournalSwatch) => {
    try {
      await navigator.clipboard.writeText(s.hex);
    } catch {
      /* 무시 */
    }
    setCopied(s.hex);
    setTimeout(() => setCopied(""), 1400);
  };

  return (
    <main className="page-shell journal-page jr-post">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> 저널
      </button>
      <article>
        <header className="jr-post-head">
          <span className="jr-cat" style={{ color: CATEGORY_TONE[post.category] }}>
            {post.category}
          </span>
          <h1>{post.title}</h1>
          <p className="jr-post-summary">{post.summary}</p>
          <div className="jr-post-meta">
            <span>
              {post.author} · {fmt(post.date)}
            </span>
            {canWrite && mine && (
              <span className="jr-post-tools">
                <button className="text-button" onClick={() => onOpen(`edit:${post.id}`)}>
                  <PenLine size={14} /> 수정
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    if (window.confirm("이 글을 삭제할까요?")) onDelete(post.id);
                  }}
                >
                  <Trash2 size={14} /> 삭제
                </button>
              </span>
            )}
          </div>
        </header>

        {post.coverUrl && <Cover post={post} large />}

        {post.palette && post.palette.length > 0 && (
          <section className="jr-palette" aria-label="컬러 팔레트">
            {post.palette.map((s) => (
              <button key={s.hex + s.name} type="button" onClick={() => copyHex(s)} title="HEX 복사">
                <span className="jr-chip" style={{ background: s.hex }} />
                <b>{s.name}</b>
                <small>{s.code}</small>
                <small>{copied === s.hex ? "복사됨" : s.hex}</small>
              </button>
            ))}
          </section>
        )}

        <Body text={post.body} />

        {post.tags.length > 0 && (
          <div className="tag-list jr-post-tags">
            {post.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </div>
        )}

        {projects.length > 0 && (
          <section className="jr-related">
            <h2>관련 프로젝트</h2>
            <div>
              {projects.map((p) => (
                <button key={p.key} onClick={() => onOpenProject(p.key)}>
                  <span className="jr-related-thumb">
                    <DesignThumbnail asset={p.covers[0]} fit="cover" />
                  </span>
                  <span>
                    <b>{p.project}</b>
                    <small>
                      {serviceName(p.service)} · {typeSummary(p.files).join(", ")}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {post.sources && post.sources.length > 0 && (
          <section className="jr-sources">
            <h2>출처</h2>
            <ul>
              {post.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    <Link2 size={13} /> {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="jr-react">
          <button
            className={`jr-like ${liked ? "on" : ""}`}
            onClick={() =>
              onUpdate({
                ...post,
                likes: liked ? post.likes.filter((x) => x !== me) : [...post.likes, me],
              })
            }
            aria-pressed={liked}
          >
            <Heart size={17} fill={liked ? "currentColor" : "none"} />
            공감 {post.likes.length}
          </button>
          {post.likes.length > 0 && <span className="jr-likers">{post.likes.join(", ")}</span>}
        </div>

        <section className="jr-comments" aria-label="댓글">
          <h2>댓글 {post.comments.length}</h2>
          <ul>
            {post.comments.map((c) => (
              <li key={c.id}>
                <span className="jr-avatar">{c.author.slice(-2)}</span>
                <div>
                  <b>{c.author}</b> <small>{fmt(c.date)}</small>
                  <p>{c.text}</p>
                </div>
                {c.author === me && (
                  <button
                    className="jr-comment-del"
                    aria-label="댓글 삭제"
                    onClick={() =>
                      onUpdate({ ...post, comments: post.comments.filter((x) => x.id !== c.id) })
                    }
                  >
                    <X size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <form
            className="jr-comment-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              onUpdate({
                ...post,
                comments: [
                  ...post.comments,
                  {
                    id: `c${Date.now()}`,
                    author: me,
                    text: text.trim(),
                    date: new Date().toISOString().split("T")[0],
                  },
                ],
              });
              setText("");
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="의견이나 참고 레퍼런스를 남겨 주세요"
              aria-label="댓글"
            />
            <button className="btn btn-primary" disabled={!text.trim()}>
              <Send size={15} />
              남기기
            </button>
          </form>
        </section>
      </article>
    </main>
  );
}

function Editor({
  initial,
  assets,
  me,
  onBack,
  onSave,
}: Props & { initial?: JournalPost }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<JournalCategory>(initial?.category ?? "트렌드");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl);
  const [palette, setPalette] = useState<JournalSwatch[]>(initial?.palette ?? []);
  const [sw, setSw] = useState({ name: "", hex: "#0071e3", code: "" });
  const [sources, setSources] = useState(initial?.sources ?? []);
  const [src, setSrc] = useState({ title: "", url: "" });
  const [related, setRelated] = useState<string[]>(initial?.relatedProjects ?? []);
  const [error, setError] = useState("");
  const coverInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  /** 커서 자리에 한 블록(앞뒤 빈 줄)으로 넣는다 */
  const insertAtCursor = (snippet: string) => {
    const el = bodyRef.current;
    const pos = el ? el.selectionStart : body.length;
    const before = body.slice(0, pos).replace(/\s*$/, "");
    const after = body.slice(pos).replace(/^\s*/, "");
    const next = `${before}${before ? "\n\n" : ""}${snippet}\n\n${after}`;
    setBody(next);
    requestAnimationFrame(() => {
      if (!el) return;
      const at = (before ? before.length + 2 : 0) + snippet.length + 2;
      el.focus();
      el.setSelectionRange(at, at);
    });
  };
  const projects = useMemo(
    () => groupProjects(assets).sort((a, b) => b.latestDate.localeCompare(a.latestDate)),
    [assets],
  );

  const save = () => {
    if (!title.trim() || !body.trim()) {
      setError("제목과 본문을 써 주세요.");
      return;
    }
    onSave({
      id: initial?.id ?? `post-${Date.now()}`,
      title: title.trim(),
      summary: summary.trim() || body.replace(/^## .*$/gm, "").trim().split("\n")[0].slice(0, 80),
      body,
      category,
      tags,
      author: initial?.author ?? me,
      date: initial?.date ?? new Date().toISOString().split("T")[0],
      coverUrl,
      palette: palette.length ? palette : undefined,
      sources: sources.length ? sources : undefined,
      relatedProjects: related,
      likes: initial?.likes ?? [],
      comments: initial?.comments ?? [],
    });
  };

  return (
    <main className="page-shell journal-page jr-editor">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> 저널
      </button>
      <h1>{initial ? "글 수정" : "새 글"}</h1>

      <div className="jr-form">
        <div className="jr-cats" role="radiogroup" aria-label="카테고리">
          {JOURNAL_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={category === c ? "on" : ""}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <input
          className="jr-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          aria-label="제목"
        />
        <input
          className="jr-summary-input"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="한 줄 요약 (목록에 보여요)"
          aria-label="한 줄 요약"
        />

        <div className="jr-cover-pick">
          {coverUrl ? (
            <div className="jr-cover-preview">
              <img src={coverUrl} alt="" />
              <button type="button" onClick={() => setCoverUrl(undefined)} aria-label="표지 삭제">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button type="button" className="proof-add" onClick={() => coverInput.current?.click()}>
              <ImagePlus size={14} />
              표지 이미지 (선택)
            </button>
          )}
          <input
            ref={coverInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setCoverUrl(URL.createObjectURL(f));
              e.target.value = "";
            }}
          />
          <span className="review-hint">이미지가 없으면 팔레트나 카테고리 색으로 표지를 만들어요.</span>
        </div>

        <div className="jr-body-input">
          <span className="jr-body-label">
            본문 <small>빈 줄 = 문단 · ## 소제목 · - 목록</small>
          </span>
          <div className="jr-body-tools">
            <button type="button" className="proof-add" onClick={() => imageInput.current?.click()}>
              <ImagePlus size={14} />
              이미지 넣기
            </button>
            <button
              type="button"
              className="proof-add"
              onClick={() => {
                const url = window.prompt("유튜브 주소를 붙여 넣어 주세요");
                const id = url?.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{6,})/)?.[1];
                if (id) insertAtCursor(`[[youtube:${id}]]`);
              }}
            >
              <Play size={14} />
              유튜브 넣기
            </button>
            <input
              ref={imageInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length)
                  insertAtCursor(
                    files.map((f) => `![${f.name.replace(/\.[^.]+$/, "")}](${URL.createObjectURL(f)})`).join("\n\n"),
                  );
                e.target.value = "";
              }}
            />
          </div>
          <textarea
            ref={bodyRef}
            aria-label="본문"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            placeholder={"## 소제목\n내용을 적어 주세요.\n\n- 목록 항목"}
          />
          <small className="jr-body-hint">
            이미지는 넣은 자리에 보여요. 대괄호 안 글자(이미지 설명)는 사진 아래 설명으로 나와요.
          </small>
        </div>

        <fieldset className="jr-fieldset">
          <legend>컬러 팔레트 (선택)</legend>
          <div className="jr-swatches">
            {palette.map((s, i) => (
              <span key={s.hex + i} className="proof-chip">
                <i style={{ background: s.hex }} />
                {s.name || s.hex}
                <button type="button" onClick={() => setPalette(palette.filter((_, j) => j !== i))} aria-label="삭제">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="jr-inline">
            <input type="color" value={sw.hex} onChange={(e) => setSw({ ...sw, hex: e.target.value })} aria-label="색" />
            <input value={sw.name} onChange={(e) => setSw({ ...sw, name: e.target.value })} placeholder="색 이름" />
            <input value={sw.code} onChange={(e) => setSw({ ...sw, code: e.target.value })} placeholder="코드 (선택)" />
            <button
              type="button"
              className="btn"
              onClick={() => {
                setPalette([...palette, { name: sw.name.trim() || sw.hex, hex: sw.hex, code: sw.code.trim() || undefined }]);
                setSw({ name: "", hex: sw.hex, code: "" });
              }}
            >
              <Plus size={14} /> 추가
            </button>
          </div>
        </fieldset>

        <fieldset className="jr-fieldset">
          <legend>출처·참고 링크</legend>
          {sources.map((s, i) => (
            <span key={s.url + i} className="proof-chip">
              <Link2 size={12} /> {s.title || s.url}
              <button type="button" onClick={() => setSources(sources.filter((_, j) => j !== i))} aria-label="삭제">
                <X size={12} />
              </button>
            </span>
          ))}
          <div className="jr-inline">
            <input value={src.title} onChange={(e) => setSrc({ ...src, title: e.target.value })} placeholder="제목" />
            <input value={src.url} onChange={(e) => setSrc({ ...src, url: e.target.value })} placeholder="https://" />
            <button
              type="button"
              className="btn"
              disabled={!/^https?:\/\//.test(src.url)}
              onClick={() => {
                setSources([...sources, { title: src.title.trim() || src.url, url: src.url.trim() }]);
                setSrc({ title: "", url: "" });
              }}
            >
              <Plus size={14} /> 추가
            </button>
          </div>
        </fieldset>

        <fieldset className="jr-fieldset">
          <legend>관련 프로젝트 (선택)</legend>
          <div className="jr-project-pick">
            {projects.slice(0, 12).map((p) => (
              <label key={p.key} className={related.includes(p.key) ? "on" : ""}>
                <input
                  type="checkbox"
                  checked={related.includes(p.key)}
                  onChange={() =>
                    setRelated(related.includes(p.key) ? related.filter((k) => k !== p.key) : [...related, p.key])
                  }
                />
                {p.project}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="jr-fieldset">
          <legend>태그</legend>
          <div className="tag-list editable">
            {tags.map((t) => (
              <span key={t}>
                #{t}
                <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`${t} 삭제`}>
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              className="jr-tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = tagInput.trim().replace(/^#/, "").replace(/\s/g, "");
                  if (v && !tags.includes(v)) setTags([...tags, v]);
                  setTagInput("");
                }
              }}
              placeholder="태그 입력 후 Enter"
            />
          </div>
        </fieldset>

        <p role="alert" className="inline-feedback">
          {error}
        </p>
        <div className="jr-form-actions">
          <button type="button" className="btn" onClick={onBack}>
            취소
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            <Send size={15} />
            {initial ? "저장" : "올리기"}
          </button>
        </div>
      </div>
    </main>
  );
}
