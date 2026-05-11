import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Satélite",
  description: "Análise estratégica de vídeos para criadores de conteúdo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
