"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { contactSchema, quoteSchema } from "@/schemas";
import { submitContact } from "@/actions";
import { EMPLOYEE_RANGES } from "@/data/marketing";
import { whatsappLink } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle } from "lucide-react";
import { z } from "zod";

type ContactFormProps = {
  type?: "contato" | "orcamento";
};

type ContactData = z.infer<typeof contactSchema>;
type QuoteData = z.infer<typeof quoteSchema>;

function buildWhatsAppQuote(data: QuoteData): string {
  const lines = [
    "Olá! Gostaria de solicitar um orçamento.",
    `Nome: ${data.name}`,
    `E-mail: ${data.email}`,
    `Telefone: ${data.phone}`,
    `Empresa: ${data.companyName}`,
  ];
  if (data.employees) lines.push(`Colaboradores: ${data.employees}`);
  if (data.message) lines.push(`Mensagem: ${data.message}`);
  return lines.join("\n");
}

export function ContactForm({ type = "contato" }: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const isOrcamento = type === "orcamento";

  const contactForm = useForm<ContactData>({
    resolver: zodResolver(contactSchema),
  });

  const quoteForm = useForm<QuoteData>({
    resolver: zodResolver(quoteSchema),
  });

  const onSubmitContact = async (data: ContactData) => {
    setLoading(true);
    const result = await submitContact({
      name: data.name,
      email: data.email,
      phone: data.phone,
      companyName: data.companyName,
      message: data.message,
      type: "CONTATO",
    });
    setLoading(false);
    if (result.success) {
      toast.success("Mensagem enviada!");
      contactForm.reset();
    } else {
      toast.error(result.error);
    }
  };

  const onSubmitQuote = async (data: QuoteData) => {
    setLoading(true);
    const result = await submitContact({
      name: data.name,
      email: data.email,
      phone: data.phone,
      companyName: data.companyName,
      employees: data.employees,
      message: data.message,
      type: "ORCAMENTO",
    });
    setLoading(false);
    if (result.success) {
      toast.success("Solicitação enviada!");
      quoteForm.reset();
    } else {
      toast.error(result.error);
    }
  };

  if (isOrcamento) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = quoteForm;
    const watched = watch();

    const sendWhatsApp = () => {
      const parsed = quoteSchema.safeParse(watched);
      if (!parsed.success) {
        toast.error("Preencha os campos obrigatórios antes de enviar pelo WhatsApp.");
        return;
      }
      window.open(whatsappLink(buildWhatsAppQuote(parsed.data)), "_blank");
    };

    return (
      <form onSubmit={handleSubmit(onSubmitQuote)} className="space-y-4">
        <div>
          <Label>Nome</Label>
          <Input className="form-input" {...register("name")} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>E-mail</Label>
            <Input className="form-input" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <Label>WhatsApp / Telefone</Label>
            <Input className="form-input" {...register("phone")} />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
          </div>
        </div>
        <div>
          <Label>Nome da empresa</Label>
          <Input className="form-input" {...register("companyName")} />
          {errors.companyName && <p className="text-sm text-red-500">{errors.companyName.message}</p>}
        </div>
        <div>
          <Label>Quantidade de colaboradores</Label>
          <select {...register("employees")} className="form-select">
            <option value="">Selecione</option>
            {EMPLOYEE_RANGES.map((r) => (
              <option key={r.value} value={r.label}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Mensagem (opcional)</Label>
          <Textarea className="form-input" rows={4} {...register("message")} />
        </div>
        <label className="flex items-start gap-3">
          <Checkbox
            checked={watch("consent") === true}
            onCheckedChange={(c) => setValue("consent", c ? true : (undefined as never))}
          />
          <span className="text-sm text-slate-600">
            Concordo com o tratamento dos meus dados conforme a Política de Privacidade.
          </span>
        </label>
        {errors.consent && <p className="text-sm text-red-500">{errors.consent.message}</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" variant="brand" disabled={loading} className="rounded-xl">
            {loading ? "Enviando..." : "Enviar orçamento"}
          </Button>
          <Button type="button" variant="outline" onClick={sendWhatsApp} className="rounded-xl">
            <MessageCircle className="mr-2 h-4 w-4 text-[var(--brand-green)]" />
            Enviar via WhatsApp
          </Button>
        </div>
      </form>
    );
  }

  const { register, handleSubmit, setValue, watch, formState: { errors } } = contactForm;
  return (
    <form onSubmit={handleSubmit(onSubmitContact)} className="space-y-4">
      <div>
        <Label>Nome</Label>
        <Input className="form-input" {...register("name")} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>E-mail</Label>
          <Input className="form-input" type="email" {...register("email")} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <Label>Telefone</Label>
          <Input className="form-input" {...register("phone")} />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
        </div>
      </div>
      <div>
        <Label>Empresa (opcional)</Label>
        <Input className="form-input" {...register("companyName")} />
      </div>
      <div>
        <Label>Mensagem</Label>
        <Textarea className="form-input" rows={4} {...register("message")} />
        {errors.message && <p className="text-sm text-red-500">{errors.message.message}</p>}
      </div>
      <label className="flex items-start gap-3">
        <Checkbox
          checked={watch("consent") === true}
          onCheckedChange={(c) => setValue("consent", c ? true : (undefined as never))}
        />
        <span className="text-sm text-slate-600">
          Concordo com o tratamento dos meus dados conforme a Política de Privacidade.
        </span>
      </label>
      {errors.consent && <p className="text-sm text-red-500">{errors.consent.message}</p>}
      <Button type="submit" variant="brand" disabled={loading} className="rounded-xl">
        {loading ? "Enviando..." : "Enviar mensagem"}
      </Button>
    </form>
  );
}
