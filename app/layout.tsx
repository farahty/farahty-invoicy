import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { AppLoader } from "@/components/pwa/app-loader";
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
    statusBarStyle: "default",
    title: "Farahty",
  },
  applicationName: "Farahty",
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
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
        {/* iOS Splash Screens - must be link tags for iOS to recognize */}
        {/* iPhone SE, 6, 7, 8 (375x667 @2x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPhone 6+, 7+, 8+ (414x736 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1242x2208.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone X, XS, 11 Pro (375x812 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1125x2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone XR, 11 (414x896 @2x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-828x1792.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPhone XS Max, 11 Pro Max (414x896 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1242x2688.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 12 mini, 13 mini (360x780 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1080x2340.png"
          media="(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 12, 12 Pro, 13, 13 Pro, 14 (390x844 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 12 Pro Max, 13 Pro Max, 14 Plus (428x926 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 14 Pro, 15, 15 Pro (393x852 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1179x2556.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 14 Pro Max, 15 Plus, 15 Pro Max (430x932 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1290x2796.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 16, 16 Pro (402x874 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1206x2622.png"
          media="(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 16 Plus, 16 Pro Max (440x956 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1320x2868.png"
          media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPad Mini, iPad Air 9.7" (768x1024 @2x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1536x2048.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPad Air 10.5" (834x1112 @2x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1668x2224.png"
          media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPad Pro 11" (834x1194 @2x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1668x2388.png"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPad Pro 12.9" (1024x1366 @2x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-2048x2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
      </head>
      <body
        className={`${inter.variable} ${notoSansArabic.variable} ${
          isRtl ? "font-arabic" : "font-sans"
        } antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppLoader />
          <TopLoader />
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster position="top-center" richColors />
            <ServiceWorkerRegistration />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
