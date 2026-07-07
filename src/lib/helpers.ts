export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5"
  );
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

export function getClinicInfo() {
  return {
    name: process.env.NEXT_PUBLIC_CLINIC_NAME ?? "Unimetra",
    phone: process.env.NEXT_PUBLIC_CLINIC_PHONE ?? "(11) 0000-0000",
    whatsapp: process.env.NEXT_PUBLIC_CLINIC_WHATSAPP ?? "5511000000000",
    email: process.env.NEXT_PUBLIC_CLINIC_EMAIL ?? "contato@clinica.com.br",
    address:
      process.env.NEXT_PUBLIC_CLINIC_ADDRESS ??
      "Av. Paulista, 1000 — São Paulo/SP",
    instagram:
      process.env.NEXT_PUBLIC_CLINIC_INSTAGRAM ??
      "https://instagram.com/clinica",
    hours: "Segunda a sexta, 7h às 18h | Sábado, 7h às 12h",
    mapsEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.197!2d-46.656!3d-23.561!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDMzJzQwLjAiUyA0NsKwMzknMjEuNiJX!5e0!3m2!1spt-BR!2sbr!4v1",
  };
}

export function whatsappLink(message: string): string {
  const phone = getClinicInfo().whatsapp;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
