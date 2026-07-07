import type { Metadata } from "next";
import "./globals.css";
import { QueryClientProvider } from "./QueryClientProvider";
import { PasswordGate } from "@/components/PasswordGate";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "@/components/Sidebar";

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
          <ThemeProvider>
            <PasswordGate>
              <Sidebar />
              <div className="pl-64">{children}</div>
            </PasswordGate>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
