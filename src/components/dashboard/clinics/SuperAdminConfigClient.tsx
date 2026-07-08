"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertGlobalSettingVoid } from "@/actions/clinics";
import { toast } from "sonner";

export function SuperAdminConfigClient({ settings }: { settings: { key: string; value: string }[] }) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  async function save() {
    const result = await upsertGlobalSettingVoid(key, value);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Salvo");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="Configurações SaaS" description="Parâmetros globais da plataforma" />
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex gap-2">
          <Input placeholder="Chave" value={key} onChange={(e) => setKey(e.target.value)} />
          <Input placeholder="Valor" value={value} onChange={(e) => setValue(e.target.value)} />
          <Button onClick={save}>Salvar</Button>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {settings.map((s) => (
            <li key={s.key}><strong>{s.key}</strong>: {s.value}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
