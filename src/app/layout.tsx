import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getClinicInfo } from "@/lib/helpers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
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
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] font-sans antialiased text-[#334155]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
