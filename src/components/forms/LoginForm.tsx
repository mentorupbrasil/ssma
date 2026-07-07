"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";

type LoginData = z.infer<typeof loginSchema>;

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      toast.error("E-mail ou senha inválidos.");
      return;
    }

    toast.success("Login realizado!");
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md border-slate-200 shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F3D4A] text-lg font-bold text-white">
          U
        </div>
        <CardTitle className="text-2xl text-[#0F3D4A]">Entrar no painel</CardTitle>
        <CardDescription>Acesse com suas credenciais</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>E-mail</Label>
            <Input type="email" placeholder="seu@email.com" {...register("email")} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <Label>Senha</Label>
            <Input type="password" {...register("password")} />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#16A085] hover:bg-[#138d75]">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="text-[#16A085] hover:underline">Voltar ao site</Link>
        </p>
      </CardContent>
    </Card>
  );
}

export function LoginPageClient() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <Suspense fallback={<div className="text-slate-500">Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
