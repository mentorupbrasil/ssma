"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { appointmentSchema } from "@/schemas";
import { createAppointment } from "@/actions";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type FormData = z.input<typeof appointmentSchema>;

type AppointmentFormProps = {
  patients: { id: string; fullName: string; companyId: string | null }[];
  companies: { id: string; legalName: string; tradeName: string | null }[];
  referrals: { id: string; protocol: string; patientId: string }[];
};

export function AppointmentForm({ patients, companies, referrals }: AppointmentFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { status: "AGENDADO" },
  });

  const patientId = watch("patientId");
  const filteredReferrals = referrals.filter((r) => !patientId || r.patientId === patientId);

  const onSubmit = async (data: FormData) => {
    const result = await createAppointment(data);
    if (result.success) {
      toast.success("Agendamento criado com sucesso!");
      router.push("/dashboard/agenda");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Título" error={errors.title?.message}>
            <Input className="form-input" placeholder="Ex.: Exame admissional" {...register("title")} />
          </FormField>

          <FormField label="Data e hora" error={errors.scheduledAt?.message}>
            <Input className="form-input" type="datetime-local" {...register("scheduledAt")} />
          </FormField>

          <FormField label="Paciente" error={errors.patientId?.message}>
            <select {...register("patientId")} className="form-select">
              <option value="">Selecione o paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </FormField>

          {companies.length > 1 && (
            <FormField label="Empresa (opcional)" error={errors.companyId?.message}>
              <select {...register("companyId")} className="form-select">
                <option value="">Vincular à empresa do paciente</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tradeName ?? c.legalName}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {filteredReferrals.length > 0 && (
            <FormField label="Encaminhamento vinculado (opcional)" error={errors.referralId?.message}>
              <select {...register("referralId")} className="form-select">
                <option value="">Nenhum</option>
                {filteredReferrals.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.protocol}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <FormField label="Tipo de atendimento" error={errors.type?.message}>
            <Input className="form-input" placeholder="Ex.: Exame ocupacional" {...register("type")} />
          </FormField>

          <FormField label="Observações" error={errors.notes?.message}>
            <Textarea className="form-input min-h-[80px]" {...register("notes")} />
          </FormField>

          <Button type="submit" variant="brand" disabled={isSubmitting} className="rounded-xl">
            {isSubmitting ? "Salvando..." : "Criar agendamento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
