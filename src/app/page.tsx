"use client";

import { FormEvent, useState } from "react";

type Platform = "instagram" | "tiktok" | "youtube";

type AnalysisResponse = {
  analysis: {
    hook_type: string;
    structure: string;
    why_it_worked: string;
    strongest_point: string;
    weakest_point: string;
  };
  script: {
    hook: string;
    development: string;
    closing: string;
    filming_tips: {
      light: string;
      framing: string;
      presence: string;
    };
  };
};

const C = {
  bgPrimary: "#0A0A0A",
  bgSecondary: "#111116",
  card: "#2A2A2A",
  blue: "#004AAD",
  gold: "#F5C16C",
  lavender: "#CBC6E6",
  text: "#FAFAFA",
  muted: "#8A8A9A",
} as const;

const platforms: { id: Platform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
];

function inputStyle(focused: boolean) {
  return {
    width: "100%",
    background: C.bgSecondary,
    border: `1px solid ${focused ? C.blue : C.card}`,
    borderRadius: "10px",
    padding: "12px 16px",
    color: C.text,
    fontFamily: "var(--font-inter)",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s ease",
  };
}

function ResultCard({
  title,
  fields,
}: {
  title: string;
  fields: { label: string; value: string }[];
}) {
  return (
    <div
      style={{
        background: C.bgSecondary,
        border: `1px solid ${C.card}`,
        borderRadius: "12px",
        padding: "24px",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-cinzel)",
          fontSize: "15px",
          fontWeight: 600,
          color: C.gold,
          marginBottom: "20px",
          marginTop: 0,
          letterSpacing: "0.06em",
        }}
      >
        {title}
      </h2>
      <dl style={{ display: "flex", flexDirection: "column", gap: "16px", margin: 0 }}>
        {fields.map(({ label, value }) => (
          <div key={label}>
            <dt
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "10px",
                fontWeight: 700,
                color: C.gold,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "5px",
              }}
            >
              {label}
            </dt>
            <dd
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "13px",
                color: C.text,
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function HomePage() {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [form, setForm] = useState({ input: "", niche: "", style: "" });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [btnHover, setBtnHover] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, platform }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "Falha ao analisar conteúdo.");
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro inesperado durante a análise."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "48px", maxWidth: "900px" }}>
      {/* Header */}
      <h1
        style={{
          fontFamily: "var(--font-cinzel)",
          fontSize: "clamp(26px, 3.5vw, 40px)",
          fontWeight: 700,
          color: C.text,
          margin: "0 0 8px",
          letterSpacing: "0.06em",
        }}
      >
        Analisar Vídeo
      </h1>
      <p
        style={{
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          color: C.lavender,
          fontSize: "16px",
          margin: "0 0 40px",
        }}
      >
        Inteligência estratégica para criadores de conteúdo
      </p>

      {/* Platform selector */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
        {platforms.map((p) => {
          const active = platform === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlatform(p.id)}
              style={{
                padding: "10px 22px",
                borderRadius: "8px",
                border: active ? `1px solid ${C.gold}` : `1px solid ${C.card}`,
                background: active ? C.blue : C.card,
                color: active ? C.text : C.muted,
                fontFamily: "var(--font-inter)",
                fontSize: "14px",
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        {/* Textarea */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontFamily: "var(--font-inter)",
              fontSize: "13px",
              color: C.muted,
            }}
          >
            URL do vídeo ou transcrição
          </label>
          <textarea
            required
            rows={7}
            value={form.input}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, input: e.target.value }))
            }
            onFocus={() => setFocusedField("input")}
            onBlur={() => setFocusedField(null)}
            placeholder="Cole a URL (YouTube) ou a transcrição completa aqui..."
            style={{
              ...inputStyle(focusedField === "input"),
              resize: "vertical",
              lineHeight: "1.6",
              padding: "14px 16px",
            }}
          />
        </div>

        {/* Nicho + Estilo */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          {(
            [
              {
                key: "niche" as const,
                label: "Nicho",
                placeholder: "Ex: Marketing digital, saúde...",
              },
              {
                key: "style" as const,
                label: "Estilo",
                placeholder: "Ex: Direto, provocativo, educativo...",
              },
            ] as const
          ).map(({ key, label, placeholder }) => (
            <div key={key}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontFamily: "var(--font-inter)",
                  fontSize: "13px",
                  color: C.muted,
                }}
              >
                {label}
              </label>
              <input
                required
                type="text"
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
                onFocus={() => setFocusedField(key)}
                onBlur={() => setFocusedField(null)}
                placeholder={placeholder}
                style={inputStyle(focusedField === key)}
              />
            </div>
          ))}
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              padding: "13px 32px",
              background: btnHover && !loading ? C.gold : C.blue,
              color: btnHover && !loading ? "#0A0A0A" : C.text,
              border: "none",
              borderRadius: "10px",
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.2s ease",
              letterSpacing: "0.03em",
            }}
          >
            {loading ? "Analisando..." : "Gerar Análise"}
          </button>
        </div>

        {error && (
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "13px",
              color: "#F87171",
              margin: 0,
            }}
          >
            {error}
          </p>
        )}
      </form>

      {/* Results */}
      {result && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginTop: "44px",
          }}
        >
          <ResultCard
            title="Análise"
            fields={[
              { label: "Tipo de gancho", value: result.analysis.hook_type },
              { label: "Estrutura", value: result.analysis.structure },
              { label: "Por que funcionou", value: result.analysis.why_it_worked },
              { label: "Ponto mais forte", value: result.analysis.strongest_point },
              { label: "Ponto mais fraco", value: result.analysis.weakest_point },
            ]}
          />
          <ResultCard
            title="Roteiro e Dicas"
            fields={[
              { label: "Gancho", value: result.script.hook },
              { label: "Desenvolvimento", value: result.script.development },
              { label: "Fechamento", value: result.script.closing },
              { label: "Luz", value: result.script.filming_tips.light },
              { label: "Enquadramento", value: result.script.filming_tips.framing },
              { label: "Presença", value: result.script.filming_tips.presence },
            ]}
          />
        </div>
      )}
    </div>
  );
}
