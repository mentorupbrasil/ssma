"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companySchema } from "@/schemas";
import { createCompany } from "@/actions";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";

type FormData = z.infer<typeof companySchema>;

export default function NovaEmpresaPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(companySchema),
  });

  const onSubmit = async (data: FormData) => {
    const result = await createCompany(data);
    if (result.success) {
      toast.success("Empresa cadastrada!");
      router.push(`/dashboard/empresas/${result.id}`);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div>
      <PageHeader title="Nova empresa" />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div><Label>Razão social</Label><Input {...register("legalName")} />{errors.legalName && <p className="text-sm text-red-500">{errors.legalName.message}</p>}</div>
            <div><Label>Nome fantasia</Label><Input {...register("tradeName")} /></div>
            <div><Label>CNPJ</Label><Input {...register("cnpj")} />{errors.cnpj && <p className="text-sm text-red-500">{errors.cnpj.message}</p>}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>E-mail</Label><Input type="email" {...register("email")} /></div>
              <div><Label>Telefone</Label><Input {...register("phone")} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Cidade</Label><Input {...register("city")} /></div>
              <div><Label>Estado</Label><Input {...register("state")} /></div>
            </div>
            <div><Label>Endereço</Label><Input {...register("address")} /></div>
            <div><Label>Responsável</Label><Input {...register("responsibleName")} /></div>
            <div><Label>Observações</Label><Textarea {...register("notes")} /></div>
            <Button type="submit" disabled={isSubmitting} className="bg-[#16A085] hover:bg-[#138d75]">Salvar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
