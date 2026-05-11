"use client";

import { FormEvent, useState } from "react";

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

const initialInput = {
  input: "",
  niche: "",
  style: "",
};

export default function HomePage() {
  const [form, setForm] = useState(initialInput);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Falha ao analisar conteúdo.");
      }

      setResult(data);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Erro inesperado durante a análise.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-14">
      <section className="mb-10 rounded-2xl border border-slate-800/70 bg-slate-950/70 p-8 shadow-[0_0_60px_rgba(56,189,248,0.08)] backdrop-blur">
        <p className="mb-3 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs tracking-[0.2em] text-cyan-300 uppercase">
          Satélite
        </p>
        <h1 className="text-3xl font-semibold text-slate-100 md:text-5xl">
          Decode vídeos, amplifique ideias.
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
          O Satélite transforma vídeos e transcrições em inteligência prática:
          análise estratégica do que funcionou, pontos fracos e roteiro pronto
          para sua próxima publicação no seu nicho e no seu estilo.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-6 md:p-8">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              URL do vídeo ou transcrição
            </label>
            <textarea
              required
              rows={6}
              value={form.input}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, input: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="Cole a URL (YouTube) ou a transcrição completa aqui..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Nicho</label>
              <input
                required
                type="text"
                value={form.niche}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, niche: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="Ex: Marketing digital, saúde, finanças..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Estilo
              </label>
              <input
                required
                type="text"
                value={form.style}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, style: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="Ex: Direto, provocativo, educativo..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
          >
            {loading ? "Analisando..." : "Gerar Análise"}
          </button>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </form>
      </section>

      {result ? (
        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
            <h2 className="mb-4 text-lg font-semibold text-cyan-300">
              Análise
            </h2>
            <dl className="space-y-3 text-sm text-slate-300">
              <div>
                <dt className="text-slate-400">Tipo de gancho</dt>
                <dd>{result.analysis.hook_type}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Estrutura</dt>
                <dd>{result.analysis.structure}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Por que funcionou</dt>
                <dd>{result.analysis.why_it_worked}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Ponto mais forte</dt>
                <dd>{result.analysis.strongest_point}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Ponto mais fraco</dt>
                <dd>{result.analysis.weakest_point}</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
            <h2 className="mb-4 text-lg font-semibold text-cyan-300">
              Roteiro e Dicas
            </h2>
            <dl className="space-y-3 text-sm text-slate-300">
              <div>
                <dt className="text-slate-400">Gancho</dt>
                <dd>{result.script.hook}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Desenvolvimento</dt>
                <dd>{result.script.development}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Fechamento</dt>
                <dd>{result.script.closing}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Luz</dt>
                <dd>{result.script.filming_tips.light}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Enquadramento</dt>
                <dd>{result.script.filming_tips.framing}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Presença</dt>
                <dd>{result.script.filming_tips.presence}</dd>
              </div>
            </dl>
          </article>
        </section>
      ) : null}
    </main>
  );
}
