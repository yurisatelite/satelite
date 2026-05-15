import type { Metadata } from "next";
import { Cinzel, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Satélite",
  description: "Análise estratégica de vídeos para criadores de conteúdo.",
};

const sidebarStyles = {
  aside: {
    width: "220px",
    position: "fixed" as const,
    top: 0,
    left: 0,
    height: "100vh",
    background: "#111116",
    borderRight: "1px solid #2A2A2A",
    display: "flex",
    flexDirection: "column" as const,
    zIndex: 50,
  },
  logo: {
    padding: "28px 20px 24px",
  },
  logoText: {
    fontFamily: "var(--font-cinzel)",
    fontSize: "18px",
    fontWeight: 700,
    color: "#F5C16C",
    letterSpacing: "0.12em",
  },
  nav: {
    flex: 1,
    padding: "0 12px",
  },
  ul: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  navItemActive: {
    display: "block",
    padding: "10px 14px",
    borderRadius: "8px",
    background: "rgba(0, 74, 173, 0.25)",
    color: "#F5C16C",
    fontFamily: "var(--font-inter)",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  },
  navItem: {
    display: "block",
    padding: "10px 14px",
    borderRadius: "8px",
    color: "#8A8A9A",
    fontFamily: "var(--font-inter)",
    fontSize: "14px",
    cursor: "pointer",
  },
  footer: {
    padding: "20px",
    borderTop: "1px solid #2A2A2A",
  },
  footerText: {
    fontFamily: "var(--font-inter)",
    fontSize: "11px",
    color: "#555565",
    margin: 0,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${cinzel.variable} ${playfair.variable} ${inter.variable}`}
    >
      <body>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <aside style={sidebarStyles.aside}>
            <div style={sidebarStyles.logo}>
              <span style={sidebarStyles.logoText}>SATÉLITE</span>
            </div>

            <nav style={sidebarStyles.nav}>
              <ul style={sidebarStyles.ul}>
                <li>
                  <span style={sidebarStyles.navItemActive}>Analisar</span>
                </li>
                <li>
                  <span style={sidebarStyles.navItem}>Histórico</span>
                </li>
                <li>
                  <span style={sidebarStyles.navItem}>Configurações</span>
                </li>
              </ul>
            </nav>

            <div style={sidebarStyles.footer}>
              <p style={sidebarStyles.footerText}>v1.0 · powered by Claude</p>
            </div>
          </aside>

          <main
            style={{
              marginLeft: "220px",
              flex: 1,
              background: "#0A0A0A",
              minHeight: "100vh",
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
