import { ExamSearch } from "@/components/public/ExamSearch";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Exames e Preparos" };

export default async function ExamesPage() {
  const exams = await prisma.exam.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <section className="bg-[#0F3D4A] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold">Exames e preparos</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Consulte o preparo necessário para cada exame e compartilhe com seus colaboradores.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ExamSearch exams={exams} />
        </div>
      </section>
    </>
  );
}
