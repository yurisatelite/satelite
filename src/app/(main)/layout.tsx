import { Sidebar } from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main
        style={{
          marginLeft: '220px',
          flex: 1,
          background: '#0A0A0A',
          minHeight: '100vh',
        }}
      >
        {children}
      </main>
    </div>
  )
}
