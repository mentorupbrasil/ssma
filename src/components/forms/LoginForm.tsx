"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { toast } from "sonner";
import { z } from "zod";

type LoginData = z.infer<typeof loginSchema>;

function resolveCallbackUrl(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (raw.startsWith("/")) return raw;
  try {
    const url = new URL(raw);
    return url.pathname + url.search;
  } catch {
    return "/dashboard";
  }
}

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = resolveCallbackUrl(searchParams.get("callbackUrl"));
  const authError = searchParams.get("error");

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setLoading(true);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    const failed =
      !result ||
      result.error ||
      result.ok === false ||
      result.url?.includes("error=");

    if (failed) {
      const message =
        result?.error === "CredentialsSignin"
          ? "E-mail ou senha inválidos."
          : "Não foi possível entrar. Verifique AUTH_SECRET e AUTH_URL na Vercel.";
      toast.error(message);
      return;
    }

    const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
    const session = (await sessionRes.json()) as { user?: { email?: string } };

    if (!session?.user) {
      toast.error(
        "Credenciais aceitas, mas a sessão não foi criada. Confira AUTH_SECRET e AUTH_URL no ambiente de produção."
      );
      return;
    }

    toast.success("Login realizado!");
    window.location.assign(callbackUrl);
  };

  return (
    <Card className="w-full max-w-md border-slate-200 shadow-lg">
      <CardHeader className="items-center space-y-4 text-center">
        <BrandLogo height={40} showLink href="/" />
        <div>
          <CardTitle className="text-2xl text-[var(--brand-navy)]">Entrar no painel</CardTitle>
          <CardDescription>Acesse com suas credenciais</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {authError && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Sessão não iniciada. Confira AUTH_SECRET e AUTH_URL nas variáveis de ambiente.
          </p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>E-mail</Label>
            <Input type="email" placeholder="seu@email.com" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <Label>Senha</Label>
            <Input type="password" autoComplete="current-password" {...register("password")} />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#16A085] hover:bg-[#138d75]">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
          <p className="font-semibold text-slate-700">Acesso demo (após seed do banco)</p>
          <p className="mt-1">Admin: admin@demo.com · Admin@123</p>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="text-[#16A085] hover:underline">Voltar ao site</Link>
        </p>
      </CardContent>
    </Card>
  );
}

export function LoginPageClient() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 pb-8 pt-[var(--header-height)]">
      <Suspense fallback={<div className="text-slate-500">Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
