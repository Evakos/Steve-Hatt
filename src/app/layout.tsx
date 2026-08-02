import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import CookieBanner from "@/components/cookie-banner";
import Preloader from "@/components/preloader";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Steve Hatt Fishmongers | London's Finest Since 1895",
  description: "Fresh fish from the British coastline to the Islington community. Online ordering with local delivery and click & collect.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen flex-col bg-cream text-foreground antialiased">
        <Preloader />
        <CartProvider>{children}</CartProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
