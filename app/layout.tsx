import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata = {
  title: "PRJX Leaderboard",
  description: "Community leaderboard with daily snapshots and deltas."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body>
        <div className="relative">
          <div className="absolute inset-0 bg-grid-fade" />
          <header className="container-hero py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="PRJX" width={36} height={36} />
              <div className="text-xl font-grotesk font-semibold tracking-tight">PRJX Leaderboard</div>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://prjx.com" target="_blank" className="btn btn-accent">Go to PRJX</a>
            </div>
          </header>
          <main className="container-hero pb-24">{children}</main>
        </div>
      </body>
    </html>
  );
}
