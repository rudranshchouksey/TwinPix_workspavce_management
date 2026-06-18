import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/providers/session-provider";
import { auth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TwinPix Studio",
    template: "%s | TwinPix Studio",
  },
  description:
    "Internal workspace management platform for TwinPix Studio team.",
  robots: { index: false, follow: false }, // Internal tool — never index
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="bg-[var(--color-surface-950)] text-[var(--color-text-primary)] antialiased" suppressHydrationWarning>
        <AuthProvider session={session}>
          <TooltipProvider delay={300}>
            {children}
            <Toaster theme="dark" position="bottom-right" />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
