'use client'

import { FormEvent, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'

const C = {
  blue: '#004AAD',
  gold: '#F5C16C',
  lavender: '#CBC6E6',
  text: '#FAFAFA',
  muted: '#8A8A9A',
  dim: '#555565',
  green: '#4ADE80',
} as const

type Hook = { text: string; type: string; rationale: string }

type Script = {
  script: { hook: string; development: string; closing: string; cta: string }
  notes?: { adapted_from?: string; voice_notes?: string; duration_estimate?: string }
}

type Project = {
  id: string
  title: string
  topic: string | null
  reference: string | null
  niche: string | null
  style: string | null
  platform: string | null
  hooks: { hooks: Hook[] } | null
  selected_hook: string | null
  script: Script | null
  status: string
  updated_at: string
}

const steps = [
  { id: 'tema', label: '1 · Tema' },
  { id: 'referencia', label: '2 · Referência' },
  { id: 'ganchos', label: '3 · Ganchos' },
  { id: 'roteiro', label: '4 · Roteiro' },
] as const

type StepId = (typeof steps)[number]['id']

const typeColors: Record<string, string> = {
  'contradição': '#F5C16C',
  'dado chocante': '#F87171',
  'pergunta': '#CBC6E6',
  'confissão': '#4ADE80',
}

function inputStyle(focused: boolean) {
  return {
    width: '100%',
    background: 'rgba(8,13,27,0.55)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${focused ? 'rgba(46,111,216,0.7)' : 'rgba(148,163,199,0.16)'}`,
    boxShadow: focused
      ? '0 0 0 3px rgba(0,74,173,0.22), inset 0 1px 0 rgba(255,255,255,0.05)'
      : 'inset 0 1px 0 rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: C.text,
    fontFamily: 'var(--font-inter)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  } as const
}

function label(text: string) {
  return (
    <label
      style={{
        display: 'block',
        marginBottom: '8px',
        fontFamily: 'var(--font-inter)',
        fontSize: '13px',
        color: C.muted,
      }}
    >
      {text}
    </label>
  )
}

function Section({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '10px',
          fontWeight: 700,
          color: C.gold,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          margin: '0 0 6px',
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '14px',
          color: C.text,
          lineHeight: 1.7,
          margin: 0,
          whiteSpace: 'pre-wrap',
        }}
      >
        {value}
      </p>
    </div>
  )
}

export default function ProjetosPage() {
  const [supabase] = useState(() => getSupabase())
  const [projects, setProjects] = useState<Project[]>([])
  const [current, setCurrent] = useState<Project | null>(null)
  const [step, setStep] = useState<StepId>('tema')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({ title: '', topic: '', reference: '' })
  const [profile, setProfile] = useState({ niche: '', style: '' })

  useEffect(() => {
    if (!supabase) return
    async function load() {
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: projs }, { data: prof }] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .order('updated_at', { ascending: false }),
        supabase.from('profiles').select('niche, style').maybeSingle(),
      ])
      setProjects((projs as Project[]) ?? [])
      if (prof) setProfile({ niche: prof.niche ?? '', style: prof.style ?? '' })
      setLoading(false)
    }
    load()
  }, [supabase])

  function openProject(p: Project) {
    setCurrent(p)
    setForm({ title: p.title, topic: p.topic ?? '', reference: p.reference ?? '' })
    setError('')
    if (p.script) setStep('roteiro')
    else if (p.hooks) setStep('ganchos')
    else if (p.reference) setStep('referencia')
    else setStep('tema')
  }

  function backToList() {
    setCurrent(null)
    setForm({ title: '', topic: '', reference: '' })
    setError('')
  }

  async function updateProject(fields: Partial<Project>) {
    if (!supabase || !current) return null
    const { data, error: err } = await supabase
      .from('projects')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', current.id)
      .select('*')
      .single()
    if (err || !data) {
      setError('Erro ao salvar o projeto.')
      return null
    }
    const updated = data as Project
    setCurrent(updated)
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    return updated
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setWorking(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error: err } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: form.title.trim() || 'Novo projeto',
        topic: form.topic.trim() || null,
        niche: profile.niche || null,
        style: profile.style || null,
        status: 'referencia',
      })
      .select('*')
      .single()

    setWorking(false)
    if (err || !data) {
      setError('Erro ao criar o projeto. A tabela projects existe no Supabase?')
      return
    }
    const proj = data as Project
    setProjects((prev) => [proj, ...prev])
    openProject(proj)
    setStep('referencia')
  }

  async function saveTopic() {
    setWorking(true)
    const updated = await updateProject({
      title: form.title.trim() || current?.title || 'Projeto',
      topic: form.topic.trim() || null,
    })
    setWorking(false)
    if (updated) setStep('referencia')
  }

  async function saveReference() {
    setWorking(true)
    const updated = await updateProject({
      reference: form.reference.trim() || null,
      status: 'ganchos',
    })
    setWorking(false)
    if (updated) setStep('ganchos')
  }

  async function generateHooks() {
    if (!current) return
    setWorking(true)
    setError('')
    try {
      const content = [current.topic, form.reference || current.reference]
        .filter(Boolean)
        .join('\n\nReferência:\n')
      const response = await fetch('/api/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Falha ao gerar ganchos.')
      await updateProject({ hooks: data, status: 'ganchos' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.')
    } finally {
      setWorking(false)
    }
  }

  async function selectHook(hook: Hook) {
    setWorking(true)
    const updated = await updateProject({ selected_hook: hook.text, status: 'roteiro' })
    setWorking(false)
    if (updated) setStep('roteiro')
  }

  async function generateScript() {
    if (!current) return
    setWorking(true)
    setError('')
    try {
      const reference =
        current.reference || current.topic || 'Crie um vídeo original sobre o tema do projeto.'
      const response = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          platform: current.platform ?? 'instagram',
          hook: current.selected_hook ?? undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Falha ao gerar roteiro.')
      await updateProject({ script: data, status: 'concluido' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.')
    } finally {
      setWorking(false)
    }
  }

  async function deleteProject(id: string) {
    if (!supabase) return
    setProjects((prev) => prev.filter((p) => p.id !== id))
    if (current?.id === id) backToList()
    await supabase.from('projects').delete().eq('id', id)
  }

  async function copyScript() {
    const s = current?.script?.script
    if (!s) return
    await navigator.clipboard.writeText(
      [`GANCHO:\n${s.hook}`, `DESENVOLVIMENTO:\n${s.development}`, `FECHAMENTO:\n${s.closing}`, `CTA:\n${s.cta}`].join('\n\n')
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const stepReached = (id: StepId): boolean => {
    if (!current) return id === 'tema'
    switch (id) {
      case 'tema':
        return true
      case 'referencia':
        return true
      case 'ganchos':
        return Boolean(current.reference || current.topic)
      case 'roteiro':
        return Boolean(current.selected_hook || current.script)
    }
  }

  return (
    <div style={{ padding: '48px', maxWidth: '980px' }}>
      <h1
        style={{
          fontFamily: 'var(--font-cinzel)',
          fontSize: 'clamp(26px, 3.5vw, 40px)',
          fontWeight: 700,
          color: C.text,
          margin: '0 0 8px',
          letterSpacing: '0.06em',
        }}
      >
        Projetos
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-playfair)',
          fontStyle: 'italic',
          color: C.lavender,
          fontSize: '16px',
          margin: '0 0 40px',
        }}
      >
        Do tema ao roteiro final, num fluxo só
      </p>

      {/* ===== LISTA ===== */}
      {!current && (
        <>
          <form
            onSubmit={handleCreate}
            className="glass-card"
            style={{ padding: '24px 28px', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div>
              {label('Nome do projeto')}
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                onFocus={() => setFocused('title')}
                onBlur={() => setFocused(null)}
                placeholder="Ex: As 10 mentiras sobre criar conteúdo"
                style={inputStyle(focused === 'title')}
              />
            </div>
            <div>
              {label('Tema ou ideia central (opcional — dá pra preencher depois)')}
              <textarea
                rows={3}
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                onFocus={() => setFocused('topic')}
                onBlur={() => setFocused(null)}
                placeholder="Descreva a ideia do vídeo..."
                style={{ ...inputStyle(focused === 'topic'), resize: 'vertical', lineHeight: '1.6' }}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={working}
                className="btn-primary"
                style={{
                  padding: '12px 28px',
                  color: C.text,
                  borderRadius: '12px',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: working ? 'not-allowed' : 'pointer',
                  opacity: working ? 0.7 : 1,
                }}
              >
                {working ? 'Criando...' : '+ Novo Projeto'}
              </button>
            </div>
            {error && (
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', color: '#F87171', margin: 0 }}>{error}</p>
            )}
          </form>

          {loading ? (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: C.muted }}>Carregando...</p>
          ) : projects.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: C.muted }}>
              Nenhum projeto ainda. Crie o primeiro acima — o Satélite te leva do tema ao roteiro pronto.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => openProject(p)}
                  className="glass-card glass-card--hover"
                  style={{
                    padding: '18px 24px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '15px', fontWeight: 600, color: C.text, margin: '0 0 4px' }}>
                      {p.title}
                    </p>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: C.muted, margin: 0 }}>
                      {p.status === 'concluido' ? (
                        <span style={{ color: C.green }}>✓ Roteiro pronto</span>
                      ) : (
                        `Etapa: ${p.status}`
                      )}
                      {' · '}
                      {new Date(p.updated_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteProject(p.id)
                    }}
                    style={{
                      flexShrink: 0,
                      background: 'none',
                      border: 'none',
                      color: C.dim,
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== WORKSPACE ===== */}
      {current && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button
              onClick={backToList}
              className="glass-chip"
              style={{
                padding: '8px 16px',
                color: C.muted,
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              ← Projetos
            </button>
            <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '18px', fontWeight: 700, color: C.gold, margin: 0, letterSpacing: '0.05em' }}>
              {current.title}
            </h2>
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
            {steps.map((s) => {
              const isActive = step === s.id
              const reachable = stepReached(s.id)
              return (
                <button
                  key={s.id}
                  onClick={() => reachable && setStep(s.id)}
                  className={isActive ? 'btn-primary' : undefined}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '20px',
                    border: isActive
                      ? '1px solid rgba(245,193,108,0.5)'
                      : '1px solid rgba(148,163,199,0.18)',
                    background: isActive ? undefined : 'rgba(14,20,38,0.5)',
                    color: isActive ? C.text : reachable ? C.muted : C.dim,
                    fontFamily: 'var(--font-inter)',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: reachable ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {s.label}
                </button>
              )
            })}
          </div>

          {error && (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', color: '#F87171', margin: '0 0 20px' }}>{error}</p>
          )}

          <div className="glass-card fade-up" style={{ padding: '28px' }}>
            {/* Etapa 1: Tema */}
            {step === 'tema' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  {label('Nome do projeto')}
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    onFocus={() => setFocused('title')}
                    onBlur={() => setFocused(null)}
                    style={inputStyle(focused === 'title')}
                  />
                </div>
                <div>
                  {label('Tema ou ideia central do vídeo')}
                  <textarea
                    rows={4}
                    value={form.topic}
                    onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                    onFocus={() => setFocused('topic')}
                    onBlur={() => setFocused(null)}
                    placeholder="Ex: As 10 mentiras que contam sobre fazer conteúdo..."
                    style={{ ...inputStyle(focused === 'topic'), resize: 'vertical', lineHeight: '1.6' }}
                  />
                </div>
                <div>
                  <button
                    onClick={saveTopic}
                    disabled={working}
                    className="btn-primary"
                    style={{ padding: '12px 28px', color: C.text, borderRadius: '12px', fontFamily: 'var(--font-inter)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {working ? 'Salvando...' : 'Salvar e continuar →'}
                  </button>
                </div>
              </div>
            )}

            {/* Etapa 2: Referência */}
            {step === 'referencia' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  {label('Vídeo de referência (transcrição ou URL do YouTube) — opcional, mas melhora muito o resultado')}
                  <textarea
                    rows={7}
                    value={form.reference}
                    onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                    onFocus={() => setFocused('reference')}
                    onBlur={() => setFocused(null)}
                    placeholder="Cole a transcrição de um vídeo que viralizou nesse tema..."
                    style={{ ...inputStyle(focused === 'reference'), resize: 'vertical', lineHeight: '1.6' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={saveReference}
                    disabled={working}
                    className="btn-primary"
                    style={{ padding: '12px 28px', color: C.text, borderRadius: '12px', fontFamily: 'var(--font-inter)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {working ? 'Salvando...' : 'Salvar e continuar →'}
                  </button>
                </div>
              </div>
            )}

            {/* Etapa 3: Ganchos */}
            {step === 'ganchos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {!current.hooks && (
                  <>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: C.muted, margin: 0, lineHeight: 1.6 }}>
                      O Satélite vai gerar 10 ganchos a partir do tema{current.reference ? ' e da referência' : ''}. Depois é só escolher o melhor.
                    </p>
                    <div>
                      <button
                        onClick={generateHooks}
                        disabled={working}
                        className="btn-primary"
                        style={{ padding: '12px 28px', color: C.text, borderRadius: '12px', fontFamily: 'var(--font-inter)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: working ? 0.7 : 1 }}
                      >
                        {working ? 'Gerando ganchos...' : 'Gerar 10 Ganchos'}
                      </button>
                    </div>
                  </>
                )}
                {current.hooks?.hooks?.map((hook, i) => {
                  const selected = current.selected_hook === hook.text
                  return (
                    <div
                      key={i}
                      onClick={() => !working && selectHook(hook)}
                      className="glass-card glass-card--hover"
                      style={{
                        padding: '16px 20px',
                        cursor: 'pointer',
                        ...(selected ? { borderColor: 'rgba(245,193,108,0.55)', boxShadow: '0 10px 36px rgba(245,193,108,0.12)' } : {}),
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: typeColors[hook.type?.toLowerCase()] ?? C.gold,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {hook.type}
                        {selected && <span style={{ color: C.green }}> · escolhido</span>}
                      </span>
                      <p style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: C.text, margin: '6px 0 0', lineHeight: 1.55, fontWeight: 500 }}>
                        {hook.text}
                      </p>
                    </div>
                  )
                })}
                {current.hooks && (
                  <div>
                    <button
                      onClick={generateHooks}
                      disabled={working}
                      className="glass-chip"
                      style={{ padding: '10px 20px', color: C.muted, fontFamily: 'var(--font-inter)', fontSize: '13px', cursor: 'pointer' }}
                    >
                      {working ? 'Gerando...' : '↻ Gerar novos ganchos'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Etapa 4: Roteiro */}
            {step === 'roteiro' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {current.selected_hook && (
                  <div className="glass-chip" style={{ padding: '14px 18px' }}>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '10px', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 5px' }}>
                      Gancho escolhido
                    </p>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: C.text, margin: 0, lineHeight: 1.5 }}>
                      {current.selected_hook}
                    </p>
                  </div>
                )}

                {!current.script ? (
                  <div>
                    <button
                      onClick={generateScript}
                      disabled={working}
                      className="btn-primary"
                      style={{ padding: '12px 28px', color: C.text, borderRadius: '12px', fontFamily: 'var(--font-inter)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: working ? 0.7 : 1 }}
                    >
                      {working ? 'Roteirizando...' : 'Gerar Roteiro Final'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '15px', fontWeight: 600, color: C.gold, letterSpacing: '0.06em', margin: 0 }}>
                        Roteiro Final
                      </h3>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={copyScript}
                          className="glass-chip"
                          style={{ padding: '8px 16px', color: copied ? C.green : C.gold, fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          {copied ? 'Copiado!' : 'Copiar roteiro'}
                        </button>
                        <button
                          onClick={generateScript}
                          disabled={working}
                          className="glass-chip"
                          style={{ padding: '8px 16px', color: C.muted, fontFamily: 'var(--font-inter)', fontSize: '12px', cursor: 'pointer' }}
                        >
                          {working ? 'Gerando...' : '↻ Regerar'}
                        </button>
                      </div>
                    </div>
                    <Section title="Gancho" value={current.script.script.hook} />
                    <Section title="Desenvolvimento" value={current.script.script.development} />
                    <Section title="Fechamento" value={current.script.script.closing} />
                    <Section title="CTA" value={current.script.script.cta} />
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
