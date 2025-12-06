import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { PWASplashScreen } from "@/components/pwa/splash-screen";
import { TopLoader } from "@/components/top-loader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Farahty - Invoice Management",
    template: "%s | Farahty",
  },
  description: "Professional invoice management made simple",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Farahty",
  },
  applicationName: "Farahty",
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const isRtl = locale === "ar";

  return (
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        {/* Inline splash screen styles - loads before any JS */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #pwa-splash {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: none;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: oklch(0.9818 0.0054 95.0986);
                transition: opacity 0.5s ease-out;
              }
              .dark #pwa-splash {
                background: oklch(0.2679 0.0036 106.6427);
              }
              @media (display-mode: standalone) {
                #pwa-splash { display: flex; }
              }
              #pwa-splash.hide {
                opacity: 0;
                pointer-events: none;
              }
              #pwa-splash-logo {
                width: 96px;
                height: 96px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 24px;
                background: oklch(0.9818 0.0054 95.0986);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                border: 1px solid oklch(0.8847 0.0069 97.3627);
                margin-bottom: 32px;
              }
              .dark #pwa-splash-logo {
                background: oklch(0.2679 0.0036 106.6427);
                border-color: oklch(0.3618 0.0101 106.8928);
              }
              #pwa-splash-logo span {
                font-size: 48px;
                font-weight: bold;
                color: oklch(0.6171 0.1375 39.0427);
              }
              .dark #pwa-splash-logo span {
                color: oklch(0.6724 0.1308 38.7559);
              }
              #pwa-splash h1 {
                font-size: 30px;
                font-weight: bold;
                color: oklch(0.3438 0.0269 95.7226);
                margin: 0 0 8px 0;
              }
              .dark #pwa-splash h1 {
                color: oklch(0.8074 0.0142 93.0137);
              }
              #pwa-splash p {
                font-size: 14px;
                color: oklch(0.6059 0.0075 97.4233);
                margin: 0 0 32px 0;
              }
              .dark #pwa-splash p {
                color: oklch(0.7713 0.0169 99.0657);
              }
              #pwa-splash-dots {
                display: flex;
                gap: 8px;
              }
              #pwa-splash-dots span {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: oklch(0.6171 0.1375 39.0427);
                animation: bounce 1s infinite;
              }
              .dark #pwa-splash-dots span {
                background: oklch(0.6724 0.1308 38.7559);
              }
              #pwa-splash-dots span:nth-child(1) { animation-delay: -0.3s; }
              #pwa-splash-dots span:nth-child(2) { animation-delay: -0.15s; }
              @keyframes bounce {
                0%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-8px); }
              }
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${notoSansArabic.variable} ${
          isRtl ? "font-arabic" : "font-sans"
        } antialiased`}
      >
        {/* Inline splash screen - shows instantly before React hydrates */}
        <div id="pwa-splash">
          <div id="pwa-splash-logo">
            <span>F</span>
          </div>
          <h1>Farahty</h1>
          <p>Invoice Management</p>
          <div id="pwa-splash-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TopLoader />
          <NextIntlClientProvider messages={messages}>
            <PWASplashScreen />
            {children}
            <Toaster position="top-center" richColors />
            <ServiceWorkerRegistration />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
