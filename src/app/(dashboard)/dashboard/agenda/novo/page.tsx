import { PageHeader } from "@/components/dashboard/PageHeader";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { getAppointmentFormData } from "@/actions";

export default async function NovoAgendamentoPage() {
  const { patients, companies, referrals } = await getAppointmentFormData();

  return (
    <div>
      <PageHeader
        title="Novo agendamento"
        description="Agende atendimentos e exames ocupacionais"
      />
      <AppointmentForm patients={patients} companies={companies} referrals={referrals} />
    </div>
  );
}
