import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getClinicInfo } from "@/lib/helpers";
import { getSiteUrl, PUBLIC_PAGE_SEO } from "@/lib/seo";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const clinic = getClinicInfo();
const homeSeo = PUBLIC_PAGE_SEO.home;
const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${clinic.name} | Medicina e Segurança do Trabalho`,
    template: `%s | ${clinic.name}`,
  },
  description: homeSeo.description,
  alternates: { canonical: siteUrl },
  icons: {
    icon: "/brand/unimetra-logo.png",
    apple: "/brand/unimetra-logo.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: clinic.name,
    title: `${clinic.name} | Medicina e Segurança do Trabalho`,
    description: homeSeo.description,
    url: siteUrl,
    images: [{ url: "/brand/unimetra-logo.png", alt: `${clinic.name} — Medicina e Segurança do Trabalho` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${clinic.name} | Medicina e Segurança do Trabalho`,
    description: homeSeo.description,
    images: ["/brand/unimetra-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[var(--brand-bg)] font-sans text-[var(--brand-text)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
