import type { Metadata } from "next";
import { Geist, Geist_Mono, Besley } from "next/font/google";
import "./globals.css";

const besley = Besley({
  subsets: ['latin'],
  variable: '--font-besley', // Cria a variável CSS que o Tailwind v4 vai ler
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Persevera Store",
  description: "Desenvolvido por Marcos Ludgério - Todos os direitos reservados",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-br"
      className={`${besley.variable} h-full antialiased`}
    >
      <body className="flex flex-col">{children}</body>
    </html>
  );
}
