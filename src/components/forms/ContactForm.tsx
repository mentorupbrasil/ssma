"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactFormData } from "@/schemas";
import { submitContactMessage } from "@/actions";
import { CONTACT_SUBJECTS, CONTACT_WHATSAPP_MESSAGES } from "@/data/contact";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, MessageCircle, Home } from "lucide-react";
import { whatsappLink } from "@/lib/helpers";

type ContactFormProps = {
  prefill?: {
    subject?: string;
    message?: string;
  };
};

export function ContactForm({ prefill }: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      subject: (prefill?.subject as ContactFormData["subject"]) || "",
      message: prefill?.message ?? "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, touchedFields, isSubmitted },
  } = form;

  const showError = (name: keyof ContactFormData) => {
    const touched = touchedFields[name] || attemptedSubmit || isSubmitted;
    return touched ? errors[name]?.message : undefined;
  };

  const onSubmit = async (data: ContactFormData) => {
    setAttemptedSubmit(true);
    setLoading(true);
    const result = await submitContactMessage({
      ...data,
      email: data.email.trim() || undefined,
      company: data.company?.trim() || undefined,
      consentAccepted: true,
    });
    setLoading(false);

    if (result.success) {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (submitted) {
    return (
      <div className="contact-success">
        <div className="contact-success-icon">
          <CheckCircle2 className="h-8 w-8 text-[var(--brand-green)]" strokeWidth={1.75} />
        </div>
        <h3 className="contact-success-title">Mensagem enviada com sucesso</h3>
        <p className="contact-success-text">
          Recebemos seu contato. Nossa equipe irá retornar pelo telefone ou e-mail informado.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={whatsappLink(CONTACT_WHATSAPP_MESSAGES.afterSubmit)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="brand" className="w-full rounded-xl">
              <MessageCircle className="mr-2 h-4 w-4" />
              Falar agora no WhatsApp
            </Button>
          </a>
          <Link href="/">
            <Button variant="outline" className="w-full rounded-xl">
              <Home className="mr-2 h-4 w-4" />
              Voltar para a página inicial
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-labelledby="contato-formulario-titulo">
      <FormField label="Nome *" error={showError("name")}>
        <Input className="form-input" autoComplete="name" {...register("name")} />
      </FormField>

      <FormField label="E-mail" hint="Opcional" error={showError("email")}>
        <Input className="form-input" type="email" autoComplete="email" {...register("email")} />
      </FormField>

      <FormField label="Telefone / WhatsApp *" error={showError("phone")}>
        <Input className="form-input" autoComplete="tel" placeholder="(99) 99999-9999" {...register("phone")} />
      </FormField>

      <FormField label="Empresa" hint="Opcional" error={showError("company")}>
        <Input className="form-input" autoComplete="organization" {...register("company")} />
      </FormField>

      <FormField label="Assunto *" error={showError("subject")}>
        <select className="form-select" {...register("subject")}>
          <option value="">Selecione um assunto</option>
          {CONTACT_SUBJECTS.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Mensagem *" error={showError("message")}>
        <textarea
          className="form-input min-h-[120px] resize-y"
          rows={4}
          placeholder="Como podemos ajudar?"
          {...register("message")}
        />
      </FormField>

      <label htmlFor="contato-consentimento" className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <Checkbox
          id="contato-consentimento"
          checked={watch("consent") === true}
          onCheckedChange={(c) =>
            setValue("consent", c ? true : (undefined as never), { shouldValidate: false })
          }
        />
        <span className="text-sm leading-relaxed text-slate-600">
          Concordo com o tratamento dos meus dados conforme a{" "}
          <a
            href="/politica-de-privacidade"
            className="font-medium text-[var(--brand-green)] underline"
            target="_blank"
          >
            Política de Privacidade
          </a>
          .
        </span>
      </label>
      {showError("consent") && <p className="form-error">{showError("consent")}</p>}

      <Button type="submit" variant="brand" disabled={loading} className="w-full rounded-xl sm:w-auto">
        {loading ? "Enviando..." : "Enviar mensagem"}
      </Button>
    </form>
  );
}
