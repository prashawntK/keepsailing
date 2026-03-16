// Auth layout — no Navigation, no timer, just the ambient background + centered card
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "ADHD Scorecard — Sign In",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-surface-base text-gray-50 relative flex items-center justify-center">
        {/* Same ambient blobs as the main app */}
        <div
          className="ambient-blob bg-primary"
          style={{ width: "60vw", height: "60vh", top: "-15%", left: "-15%" }}
        />
        <div
          className="ambient-blob bg-xp"
          style={{ width: "70vw", height: "70vh", bottom: "-20%", right: "-10%", animationDelay: "-10s" }}
        />
        <div
          className="ambient-blob bg-success"
          style={{ width: "50vw", height: "50vh", top: "30%", left: "40%", animationDelay: "-5s" }}
        />

        <div className="relative z-10 w-full max-w-md px-4 py-12">
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}
