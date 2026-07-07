"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { contactSchema, quoteSchema } from "@/schemas";
import { submitContact } from "@/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";

type ContactFormProps = {
  type?: "contato" | "orcamento";
};

type ContactData = z.infer<typeof contactSchema>;
type QuoteData = z.infer<typeof quoteSchema>;

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
    return (
      <form onSubmit={handleSubmit(onSubmitQuote)} className="space-y-4">
        <div><Label>Nome</Label><Input {...register("name")} />{errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>E-mail</Label><Input type="email" {...register("email")} />{errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}</div>
          <div><Label>Telefone</Label><Input {...register("phone")} />{errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}</div>
        </div>
        <div><Label>Nome da empresa</Label><Input {...register("companyName")} />{errors.companyName && <p className="text-sm text-red-500">{errors.companyName.message}</p>}</div>
        <div><Label>Mensagem (opcional)</Label><Textarea rows={4} {...register("message")} /></div>
        <label className="flex items-start gap-3">
          <Checkbox checked={watch("consent") === true} onCheckedChange={(c) => setValue("consent", c ? true : undefined as never)} />
          <span className="text-sm text-slate-600">Concordo com o tratamento dos meus dados conforme a Política de Privacidade.</span>
        </label>
        {errors.consent && <p className="text-sm text-red-500">{errors.consent.message}</p>}
        <Button type="submit" disabled={loading} className="bg-[#16A085] hover:bg-[#138d75]">
          {loading ? "Enviando..." : "Solicitar orçamento"}
        </Button>
      </form>
    );
  }

  const { register, handleSubmit, setValue, watch, formState: { errors } } = contactForm;
  return (
    <form onSubmit={handleSubmit(onSubmitContact)} className="space-y-4">
      <div><Label>Nome</Label><Input {...register("name")} />{errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>E-mail</Label><Input type="email" {...register("email")} />{errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}</div>
        <div><Label>Telefone</Label><Input {...register("phone")} />{errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}</div>
      </div>
      <div><Label>Empresa (opcional)</Label><Input {...register("companyName")} /></div>
      <div><Label>Mensagem</Label><Textarea rows={4} {...register("message")} />{errors.message && <p className="text-sm text-red-500">{errors.message.message}</p>}</div>
      <label className="flex items-start gap-3">
        <Checkbox checked={watch("consent") === true} onCheckedChange={(c) => setValue("consent", c ? true : undefined as never)} />
        <span className="text-sm text-slate-600">Concordo com o tratamento dos meus dados conforme a Política de Privacidade.</span>
      </label>
      {errors.consent && <p className="text-sm text-red-500">{errors.consent.message}</p>}
      <Button type="submit" disabled={loading} className="bg-[#16A085] hover:bg-[#138d75]">
        {loading ? "Enviando..." : "Enviar mensagem"}
      </Button>
    </form>
  );
}
