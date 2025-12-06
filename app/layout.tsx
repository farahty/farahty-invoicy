import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
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
    startupImage: [
      // iPhone SE, iPod touch 7th generation, iPhone 8, iPhone 7, iPhone 6s, iPhone 6
      {
        url: "/splash/apple-splash-750x1334.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPhone 14, iPhone 13, iPhone 12, iPhone 11 Pro, iPhone XS, iPhone X
      {
        url: "/splash/apple-splash-1170x2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 14 Plus, iPhone 13 Pro Max, iPhone 12 Pro Max
      {
        url: "/splash/apple-splash-1284x2778.png",
        media:
          "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 14 Pro
      {
        url: "/splash/apple-splash-1179x2556.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 14 Pro Max
      {
        url: "/splash/apple-splash-1290x2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 15, iPhone 15 Pro
      {
        url: "/splash/apple-splash-1179x2556.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 15 Plus, iPhone 15 Pro Max
      {
        url: "/splash/apple-splash-1290x2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPad Mini, iPad Air
      {
        url: "/splash/apple-splash-1536x2048.png",
        media:
          "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPad Pro 11"
      {
        url: "/splash/apple-splash-1668x2388.png",
        media:
          "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPad Pro 12.9"
      {
        url: "/splash/apple-splash-2048x2732.png",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
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
