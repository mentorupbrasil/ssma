import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClinicInfo } from "@/lib/helpers";

export default async function ConfiguracoesPage() {
  const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } });
  const clinic = getClinicInfo();

  return (
    <div>
      <PageHeader title="Configurações" description="Dados institucionais e LGPD" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Dados da clínica</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Nome:</strong> {clinic.name}</p>
            <p><strong>Telefone:</strong> {clinic.phone}</p>
            <p><strong>WhatsApp:</strong> {clinic.whatsapp}</p>
            <p><strong>E-mail:</strong> {clinic.email}</p>
            <p><strong>Endereço:</strong> {clinic.address}</p>
            <p><strong>Horário:</strong> {clinic.hours}</p>
            <p className="pt-2 text-xs text-slate-500">Configure via variáveis de ambiente ou tabela Settings.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Configurações do banco</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {settings.map((s) => (
                <li key={s.key} className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="font-medium text-slate-600">{s.key}</span>
                  <span className="text-slate-800">{s.value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
