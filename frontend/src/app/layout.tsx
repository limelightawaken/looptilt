import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers";

export const metadata: Metadata = {
  title: "LoopTilt · Newsletter personalization for Kit",
  description:
    "Personalize every newsletter send for Kit (ConvertKit). Learn your archive, segment readers from behavior, and draft in your voice with per-segment variants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
