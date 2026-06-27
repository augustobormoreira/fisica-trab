import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Trabalho de Física",
  description:
    "Desenvolvido para a matéria de Fisica do curso de Ciências da Computação",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // h-full no html e body para propagar altura até o main
    <html className="h-full">
      <body className="h-full flex flex-col">
        <Navbar />
        {/* flex-1 + overflow-hidden garante que o main ocupe o restante sem scroll */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </body>
    </html>
  );
}
