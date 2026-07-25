import type { Metadata } from "next";
import type { ReactNode } from "react";

import { geistMono, inter } from "@/app/fonts";
import { Providers } from "@/layouts/Providers";

import "@/app/styles/globals.css";

export const metadata: Metadata = {
  title: "UltraDoc AI",
  description: "Upload a logistics document, ask questions, and extract structured shipment data.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
