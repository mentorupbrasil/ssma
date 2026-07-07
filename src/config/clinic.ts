export type ClinicSiteConfig = {
  clinicName: string;
  address: string;
  city: string;
  state: string;
  fullAddress: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  openingHours: string;
  googleMapsEmbedUrl: string;
  googleMapsExternalUrl: string;
  hasAddress: boolean;
  hasWhatsApp: boolean;
  hasMapEmbed: boolean;
  hasMapLink: boolean;
};

function env(key: string): string {
  return process.env[key]?.trim() ?? "";
}

function buildFullAddress(address: string, city: string, state: string): string {
  if (!address) return "";
  const cityState = [city, state].filter(Boolean).join("/");
  return cityState ? `${address} — ${cityState}` : address;
}

/** Dados institucionais e de localização — preencher via .env ou painel futuro. */
export function getClinicSiteConfig(): ClinicSiteConfig {
  const clinicName = env("NEXT_PUBLIC_CLINIC_NAME") || "Unimetra";
  const address = env("NEXT_PUBLIC_CLINIC_ADDRESS");
  const city = env("NEXT_PUBLIC_CLINIC_CITY");
  const state = env("NEXT_PUBLIC_CLINIC_STATE");
  const whatsapp = env("NEXT_PUBLIC_CLINIC_WHATSAPP");
  const googleMapsEmbedUrl = env("NEXT_PUBLIC_CLINIC_MAPS_EMBED");
  const googleMapsExternalUrl = env("NEXT_PUBLIC_CLINIC_MAPS_URL");

  return {
    clinicName,
    address,
    city,
    state,
    fullAddress: buildFullAddress(address, city, state),
    phone: env("NEXT_PUBLIC_CLINIC_PHONE"),
    whatsapp,
    email: env("NEXT_PUBLIC_CLINIC_EMAIL"),
    instagram: env("NEXT_PUBLIC_CLINIC_INSTAGRAM"),
    openingHours: env("NEXT_PUBLIC_CLINIC_OPENING_HOURS"),
    googleMapsEmbedUrl,
    googleMapsExternalUrl,
    hasAddress: Boolean(address),
    hasWhatsApp: Boolean(whatsapp),
    hasMapEmbed: Boolean(googleMapsEmbedUrl),
    hasMapLink: Boolean(googleMapsExternalUrl),
  };
}
