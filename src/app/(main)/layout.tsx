import { Sidebar } from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Atmosfera orbital ao fundo */}
      <div
        className="orb"
        style={{
          width: '520px',
          height: '520px',
          top: '-160px',
          right: '-120px',
          background: 'radial-gradient(circle, rgba(0,74,173,0.35), transparent 70%)',
        }}
      />
      <div
        className="orb"
        style={{
          width: '420px',
          height: '420px',
          bottom: '-140px',
          left: '160px',
          background: 'radial-gradient(circle, rgba(245,193,108,0.10), transparent 70%)',
          animationDelay: '-11s',
        }}
      />
      <Sidebar />
      <main
        style={{
          marginLeft: '220px',
          flex: 1,
          minHeight: '100vh',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {children}
      </main>
    </div>
  )
}
