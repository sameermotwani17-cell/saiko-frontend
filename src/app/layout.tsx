import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/context/SessionContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SAIKO — AI Japanese HR Interview Coach",
  description:
    "Upload your CV. Pick a company. Get interviewed. Find out what they were really thinking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-primary-text`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}