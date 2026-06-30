import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Todos",
  description: "A responsive todo app backed by the deployed API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
