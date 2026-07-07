import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getClinicInfo } from "@/lib/helpers";

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

export const metadata: Metadata = {
  title: {
    default: `${clinic.name} | Medicina e Segurança do Trabalho`,
    template: `%s | ${clinic.name}`,
  },
  description:
    "Atendimento ocupacional completo para empresas. Exames, ASO, PCMSO, encaminhamento online e gestão digital.",
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
