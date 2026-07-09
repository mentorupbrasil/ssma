"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";

import { LoginDotMap } from "@/components/auth/LoginDotMap";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/schemas";
import { cn } from "@/lib/utils";

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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = resolveCallbackUrl(searchParams.get("callbackUrl"));
  const authError = searchParams.get("error");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
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
    <div className="flex h-full w-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/80"
      >
        <div className="relative hidden h-[min(600px,90vh)] w-1/2 overflow-hidden border-r border-slate-100 md:block">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-green-light)] via-emerald-50 to-teal-100">
            <LoginDotMap />

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8">
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.45 }}
                className="mb-5"
              >
                <BrandLogo height={44} showLink href="/" priority />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.45 }}
                className="mb-2 bg-gradient-to-r from-[var(--brand-navy)] to-[var(--brand-green)] bg-clip-text text-center text-3xl font-bold text-transparent"
              >
                Unimetra
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.45 }}
                className="max-w-xs text-center text-sm leading-relaxed text-slate-600"
              >
                Painel de SST, exames ocupacionais e encaminhamentos para sua clínica
              </motion.p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col justify-center bg-white p-8 md:w-1/2 md:p-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="mb-8 md:hidden">
              <BrandLogo height={36} showLink href="/" priority />
            </div>

            <h1 className="text-2xl font-bold text-[var(--brand-navy)] md:text-3xl">
              Bem-vindo de volta
            </h1>
            <p className="mb-8 text-slate-500">Entre com suas credenciais de acesso</p>

            {authError && (
              <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Sessão não iniciada. Confira AUTH_SECRET e AUTH_URL nas variáveis de ambiente.
              </p>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Label htmlFor="email" className="mb-1.5 text-slate-700">
                  E-mail <span className="text-[var(--brand-green)]">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className="rounded-lg border-slate-200 bg-slate-50"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="mb-1.5 text-slate-700">
                  Senha <span className="text-[var(--brand-green)]">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    className="rounded-lg border-slate-200 bg-slate-50 pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 transition-colors hover:text-slate-700"
                    onClick={() => setIsPasswordVisible((v) => !v)}
                    aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="pt-1"
              >
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "relative inline-flex h-11 w-full items-center justify-center overflow-hidden rounded-lg text-sm font-medium text-white transition-all duration-300 disabled:pointer-events-none disabled:opacity-50",
                    "bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-navy)] hover:from-[var(--brand-green-dark)] hover:to-[var(--brand-navy-deep)]",
                    isHovered && "shadow-lg shadow-emerald-200/80"
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {loading ? "Entrando..." : "Entrar"}
                    {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </span>
                  {isHovered && !loading && (
                    <motion.span
                      initial={{ left: "-100%" }}
                      animate={{ left: "100%" }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      style={{ filter: "blur(8px)" }}
                    />
                  )}
                </button>
              </motion.div>
            </form>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
              <p className="font-semibold text-slate-700">Acesso demo (após seed do banco)</p>
              <p className="mt-1">Admin: admin@demo.com · Admin@123</p>
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              <Link href="/" className="text-[var(--brand-green)] transition-colors hover:text-[var(--brand-green-dark)] hover:underline">
                Voltar ao site
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export function LoginPageClient() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[var(--brand-green-light)] via-slate-50 to-teal-50 p-4">
      <Suspense fallback={<div className="text-slate-500">Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
