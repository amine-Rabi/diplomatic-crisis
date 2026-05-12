import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./Providers";

export const metadata: Metadata = {
  title: "Diplomatic Crisis — Tweet-Length Statecraft on GenLayer",
  description:
    "Multiplayer geopolitics simulator. Each round a fictional crisis breaks; every delegate has 120s to issue a tweet-length dispatch. AI judges score wit, plausibility, and diplomatic tone via GenLayer's Optimistic Democracy consensus.",
  openGraph: {
    title: "Diplomatic Crisis — Tweet-Length Statecraft on GenLayer",
    description:
      "Cable in 280 characters. Be witty. Be plausible. Don't start a war.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700;8..60,800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
