import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { FloatingWhatsApp } from "@/components/public/FloatingWhatsApp";

// Evita pré-render no build (requer DATABASE_URL apenas em runtime)
export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a href="#conteudo-principal" className="skip-to-content">
        Pular para o conteúdo
      </a>
      <Header />
      <div id="conteudo-principal" className="flex-1" tabIndex={-1}>
        {children}
      </div>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
