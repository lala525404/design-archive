import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Settings,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Check,
  Copy,
  FileCode,
  Sparkles,
  Menu,
} from "lucide-react";
import { PageTitle, Disclosure } from "../components/Chrome";
import { NamingRuleConfig } from "../types";
import { INITIAL_NAMING_RULE } from "../data/sampleAssets";

interface NamingRuleViewProps {
  onBack: () => void;
  onOpenMenu: () => void;
}

export const NamingRuleView: React.FC<NamingRuleViewProps> = ({
  onBack,
  onOpenMenu,
}) => {
  const [config, setConfig] = useState<NamingRuleConfig>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("archive-naming-rule") || "null") ||
        INITIAL_NAMING_RULE
      );
    } catch {
      return INITIAL_NAMING_RULE;
    }
  });
  const [saveMessage, setSaveMessage] = useState("");
  const [newTypeInput, setNewTypeInput] = useState("");
  const [newToolInput, setNewToolInput] = useState("");
  const [copiedExample, setCopiedExample] = useState(false);

  // Field names in Korean
  const fieldLabels: Record<string, string> = {
    year: "연도",
    courseAndTitle: "작업명",
    tools: "사용도구",
    designer: "디자이너",
    version: "버전",
  };

  // Sample data tokens to preview
  const sampleValues: Record<string, string> = {
    year: "2026",
    courseAndTitle: "색채학상세페이지",
    tools: ["Figma", "GPT", "산돌"].join(config.toolSeparator),
    designer: "김디자인",
    version: config.versionFormat.replace("NN", "03").replace("N", "3"),
  };

  // Live generated sample filename
  const liveFileName = useMemo(() => {
    const parts = config.order.map((key) => sampleValues[key]);
    return parts.join(config.separator) + config.extension;
  }, [config]);

  // Reorder fields up / down
  const moveField = (index: number, direction: "up" | "down") => {
    const newOrder = [...config.order];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setConfig({ ...config, order: newOrder });
  };

  const handleCopyExample = async () => {
    try {
      await navigator.clipboard.writeText(liveFileName);
      setCopiedExample(true);
      setTimeout(() => setCopiedExample(false), 2000);
    } catch {
      setSaveMessage("예시 파일명을 직접 선택해 복사해주세요.");
    }
  };

  const handleAddType = () => {
    if (!newTypeInput.trim()) return;
    if (!config.allowedTypes.includes(newTypeInput.trim())) {
      setConfig({
        ...config,
        allowedTypes: [...config.allowedTypes, newTypeInput.trim()],
      });
    }
    setNewTypeInput("");
  };

  const handleRemoveType = (item: string) => {
    setConfig({
      ...config,
      allowedTypes: config.allowedTypes.filter((t) => t !== item),
    });
  };

  const handleAddTool = () => {
    if (!newToolInput.trim()) return;
    if (!config.allowedTools.includes(newToolInput.trim())) {
      setConfig({
        ...config,
        allowedTools: [...config.allowedTools, newToolInput.trim()],
      });
    }
    setNewToolInput("");
  };

  const handleRemoveTool = (tool: string) => {
    setConfig({
      ...config,
      allowedTools: config.allowedTools.filter((t) => t !== tool),
    });
  };

  const listEditor = (
    title: string,
    items: string[],
    remove: (s: string) => void,
    value: string,
    set: (s: string) => void,
    add: () => void,
  ) => (
    <div className="field-stack">
      <span className="field-label">{title}</span>
      <div className="tag-list editable">
        {items.map((t) => (
          <span key={t}>
            {t}
            <button onClick={() => remove(t)} aria-label={`${t} 삭제`}>
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
      <div className="inline-input">
        <input
          aria-label={title + " 추가"}
          value={value}
          placeholder="항목 입력"
          onChange={(e) => set(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
        />
        <button className="btn" onClick={add}>
          추가
        </button>
      </div>
    </div>
  );
  return (
    <main className="page-shell narrow-page naming-page">
      <PageTitle title="파일명 규칙" onBack={onBack} />
      <section className="naming-preview">
        <div className="section-heading">
          <span className="muted">파일명 예시</span>
          <button className="text-button" onClick={handleCopyExample}>
            {copiedExample ? <Check size={15} /> : <Copy size={15} />}{" "}
            {copiedExample ? "복사 완료" : "복사"}
          </button>
        </div>
        <p>{liveFileName}</p>
      </section>
      <section className="plain-section">
        <h2>정보 순서</h2>
        <ol className="order-list">
          {config.order.map((key, i) => (
            <li key={key}>
              <span className="order-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{fieldLabels[key]}</span>
              <span className="order-actions">
                <button
                  className="icon-btn"
                  disabled={i === 0}
                  onClick={() => moveField(i, "up")}
                  aria-label={fieldLabels[key] + " 위로 이동"}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  className="icon-btn"
                  disabled={i === config.order.length - 1}
                  onClick={() => moveField(i, "down")}
                  aria-label={fieldLabels[key] + " 아래로 이동"}
                >
                  <ArrowDown size={16} />
                </button>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <Disclosure title="구분자 · 버전 표기" open>
        <div className="form-grid">
          <label className="field">
            항목 구분자
            <select
              value={config.separator}
              onChange={(e) =>
                setConfig({ ...config, separator: e.target.value })
              }
            >
              <option value="_">밑줄 ( _ )</option>
              <option value="-">하이픈 ( - )</option>
              <option value=".">마침표 ( . )</option>
            </select>
          </label>
          <label className="field">
            도구 구분자
            <select
              value={config.toolSeparator}
              onChange={(e) =>
                setConfig({ ...config, toolSeparator: e.target.value })
              }
            >
              <option value="-">하이픈 ( - )</option>
              <option value="+">더하기 ( + )</option>
              <option value="_">밑줄 ( _ )</option>
            </select>
          </label>
          <label className="field">
            버전 표기
            <select
              value={config.versionFormat}
              onChange={(e) =>
                setConfig({ ...config, versionFormat: e.target.value })
              }
            >
              {["vNN", "vN", "ver_NN", "V0N"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
      </Disclosure>
      <Disclosure title="작업 유형 · 도구 목록">
        {listEditor(
          "작업 유형",
          config.allowedTypes,
          handleRemoveType,
          newTypeInput,
          setNewTypeInput,
          handleAddType,
        )}
        {listEditor(
          "사용 도구",
          config.allowedTools,
          handleRemoveTool,
          newToolInput,
          setNewToolInput,
          handleAddTool,
        )}
      </Disclosure>
      <div className="wizard-footer">
        <p role="status" className="muted">
          {saveMessage}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            try {
              localStorage.setItem(
                "archive-naming-rule",
                JSON.stringify(config),
              );
              setSaveMessage("이 브라우저에 규칙을 저장했어요.");
            } catch {
              setSaveMessage(
                "규칙을 저장하지 못했어요. 브라우저 저장 공간을 확인해주세요.",
              );
            }
          }}
        >
          규칙 저장
        </button>
      </div>
    </main>
  );
};
