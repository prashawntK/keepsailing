import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TimerProvider } from "@/components/providers/TimerProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { Navigation } from "@/components/ui/Navigation";
import { ServiceWorkerRegistrar } from "@/components/providers/ServiceWorkerRegistrar";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "keepsailing",
  description: "Your daily accountability companion",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "keepsailing",
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
            <ToastProvider>
            <div className="min-h-screen bg-surface-base text-gray-50 relative">
              {/* Dynamic Ambient Background Blobs */}
              <div
                className="ambient-blob bg-primary"
                style={{ width: '60vw', height: '60vh', top: '-15%', left: '-15%' }}
              />
              <div 
                className="ambient-blob bg-xp"
                style={{ width: '70vw', height: '70vh', bottom: '-20%', right: '-10%', animationDelay: '-10s' }}
              />
              <div 
                className="ambient-blob bg-success"
                style={{ width: '50vw', height: '50vh', top: '30%', left: '40%', animationDelay: '-5s' }}
              />

              {/* Main App Container */}
              <div className="relative z-10 flex flex-col min-h-screen">
                <Navigation />
                <main className="max-w-4xl mx-auto px-4 pb-28 pt-6 w-full flex-grow">
                  {children}
                </main>
              </div>
            </div>
            </ToastProvider>
          </TimerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
