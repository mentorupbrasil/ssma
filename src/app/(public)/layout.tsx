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
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
