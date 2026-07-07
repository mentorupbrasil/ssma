"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { patientSchema } from "@/schemas";
import { createPatient } from "@/actions";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";

type FormData = z.infer<typeof patientSchema>;

export default function NovoPacientePage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<{ id: string; legalName: string; tradeName: string | null }[]>([]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(patientSchema),
  });

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then(setCompanies)
      .catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    const result = await createPatient(data);
    if (result.success) {
      toast.success("Paciente cadastrado!");
      router.push(`/dashboard/pacientes/${result.id}`);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div>
      <PageHeader title="Novo paciente" />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div><Label>Nome completo</Label><Input {...register("fullName")} />{errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>CPF</Label><Input {...register("cpf")} />{errors.cpf && <p className="text-sm text-red-500">{errors.cpf.message}</p>}</div>
              <div><Label>RG</Label><Input {...register("rg")} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Data de nascimento</Label><Input type="date" {...register("birthDate")} /></div>
              <div>
                <Label>Sexo</Label>
                <select {...register("gender")} className="flex h-9 w-full rounded-md border px-3 text-sm">
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Telefone</Label><Input {...register("phone")} /></div>
              <div><Label>E-mail</Label><Input type="email" {...register("email")} /></div>
            </div>
            <div>
              <Label>Empresa</Label>
              <select {...register("companyId")} className="flex h-9 w-full rounded-md border px-3 text-sm">
                <option value="">Sem vínculo</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.tradeName ?? c.legalName}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Função</Label><Input {...register("jobTitle")} /></div>
              <div><Label>Setor</Label><Input {...register("department")} /></div>
            </div>
            <div><Label>Observações</Label><Textarea {...register("notes")} /></div>
            <Button type="submit" disabled={isSubmitting} className="bg-[#16A085] hover:bg-[#138d75]">Salvar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
