import type { Metadata } from "next";
import "./globals.css";
import { QueryClientProvider } from "./QueryClientProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Billing EDA Dashboard",
  description: "Billing anomaly detection and analysis dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryClientProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
