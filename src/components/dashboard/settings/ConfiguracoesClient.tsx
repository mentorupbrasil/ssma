"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertSetting, deleteSetting } from "@/actions/settings";
import { toast } from "sonner";

type SettingRow = { key: string; value: string };

export function ConfiguracoesClient({
  clinic,
  settings,
}: {
  clinic: { name: string; phone: string; whatsapp: string; email: string; address: string; hours: string };
  settings: SettingRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  async function saveSetting() {
    const result = await upsertSetting(key, value);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Configuração salva");
    setKey("");
    setValue("");
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <PageHeader title="Configurações" description="Dados institucionais e parâmetros do sistema" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Dados da clínica (arquivo estático)</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Nome:</strong> {clinic.name}</p>
            <p><strong>Telefone:</strong> {clinic.phone}</p>
            <p><strong>WhatsApp:</strong> {clinic.whatsapp}</p>
            <p><strong>E-mail:</strong> {clinic.email}</p>
            <p><strong>Endereço:</strong> {clinic.address}</p>
            <p><strong>Horário:</strong> {clinic.hours}</p>
            <p className="pt-2 text-xs text-slate-500">Edite em `src/config/clinic.ts` ou use as configurações abaixo.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Configurações dinâmicas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Chave" value={key} onChange={(e) => setKey(e.target.value)} />
              <Input placeholder="Valor" value={value} onChange={(e) => setValue(e.target.value)} />
              <Button onClick={saveSetting} disabled={pending || !key}>Salvar</Button>
            </div>
            <ul className="space-y-2 text-sm">
              {settings.map((s) => (
                <li key={s.key} className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span><strong>{s.key}</strong>: {s.value}</span>
                  <Button size="sm" variant="ghost" onClick={() => startTransition(async () => {
                    await deleteSetting(s.key);
                    router.refresh();
                  })}>Excluir</Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
