import { getClinicSiteConfig } from "@/config/clinic";

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
  if (digits.length === 13 && digits.startsWith("55")) {
    return formatPhone(digits.slice(2));
  }
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  if (!digits.length) return "";
  return phone;
}

/** @deprecated Prefer getClinicSiteConfig() — mantido para compatibilidade. */
export function getClinicInfo() {
  const config = getClinicSiteConfig();
  return {
    name: config.clinicName,
    address: config.fullAddress,
    city: config.city,
    state: config.state,
    phone: config.phone,
    whatsapp: config.whatsapp,
    email: config.email,
    instagram: config.instagram,
    facebook: config.facebook,
    hours: config.openingHours,
    openingHours: config.openingHours,
    mapsEmbed: config.googleMapsEmbedUrl,
    googleMapsEmbedUrl: config.googleMapsEmbedUrl,
    googleMapsExternalUrl: config.googleMapsExternalUrl,
    hasAddress: config.hasAddress,
    hasWhatsApp: config.hasWhatsApp,
    hasMapEmbed: config.hasMapEmbed,
  };
}

export function whatsappLink(message: string): string {
  const { whatsapp } = getClinicSiteConfig();
  if (!whatsapp) return "/contato";
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
}
