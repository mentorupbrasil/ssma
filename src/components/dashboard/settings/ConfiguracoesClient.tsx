"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { upsertSettingsBulk } from "@/actions/settings";
import { SETTINGS_SECTIONS, settingsMapFromRows } from "@/lib/settings-schema";
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
  const [values, setValues] = useState<Record<string, string>>(() => settingsMapFromRows(settings));

  const setValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  async function saveSection(sectionId: string) {
    const section = SETTINGS_SECTIONS.find((s) => s.id === sectionId);
    if (!section) return;
    const payload: Record<string, string> = {};
    for (const field of section.fields) {
      payload[field.key] = values[field.key] ?? field.defaultValue ?? "";
    }
    const result = await upsertSettingsBulk(payload);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Configurações salvas");
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Parâmetros institucionais, operacionais e LGPD"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Referência estática</CardTitle>
          <CardDescription>Valores padrão em `src/config/clinic.ts` — use as abas abaixo para sobrescrever no banco.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p><strong>Nome:</strong> {clinic.name}</p>
          <p><strong>Telefone:</strong> {clinic.phone}</p>
          <p><strong>WhatsApp:</strong> {clinic.whatsapp}</p>
          <p><strong>E-mail:</strong> {clinic.email}</p>
          <p className="sm:col-span-2"><strong>Endereço:</strong> {clinic.address}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="clinica">
        <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
          {SETTINGS_SECTIONS.map((s) => (
            <TabsTrigger key={s.id} value={s.id}>{s.label}</TabsTrigger>
          ))}
        </TabsList>

        {SETTINGS_SECTIONS.map((section) => (
          <TabsContent key={section.id} value={section.id}>
            <Card>
              <CardHeader>
                <CardTitle>{section.label}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    {field.description && (
                      <p className="text-xs text-slate-500">{field.description}</p>
                    )}
                    {field.type === "textarea" ? (
                      <Textarea
                        id={field.key}
                        value={values[field.key] ?? ""}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    ) : field.type === "boolean" ? (
                      <select
                        id={field.key}
                        className="flex h-10 w-full max-w-xs rounded-lg border border-slate-200 px-3 text-sm"
                        value={values[field.key] ?? field.defaultValue ?? "false"}
                        onChange={(e) => setValue(field.key, e.target.value)}
                      >
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                      </select>
                    ) : (
                      <Input
                        id={field.key}
                        type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
                        value={values[field.key] ?? ""}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="max-w-lg"
                      />
                    )}
                  </div>
                ))}
                <Button onClick={() => saveSection(section.id)} disabled={pending}>
                  Salvar {section.label.toLowerCase()}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
