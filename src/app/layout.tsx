import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TimerProvider } from "@/components/providers/TimerProvider";
import { Navigation } from "@/components/ui/Navigation";
import { ServiceWorkerRegistrar } from "@/components/providers/ServiceWorkerRegistrar";

export const viewport: Viewport = {
  themeColor: "#F97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "ADHD Scorecard",
  description: "Your daily dopamine-powered accountability companion",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ADHD Scorecard",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ServiceWorkerRegistrar />
        <ThemeProvider>
          <TimerProvider>
            <div className="min-h-screen bg-surface-base text-gray-50">
              <Navigation />
              <main className="max-w-4xl mx-auto px-4 pb-28 pt-6">
                {children}
              </main>
            </div>
          </TimerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
