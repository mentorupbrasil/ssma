export type ClinicSiteConfig = {
  clinicName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
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

function buildFullAddress(
  address: string,
  city: string,
  state: string,
  postalCode: string
): string {
  if (!address) return "";

  let result = address;
  if (postalCode && !address.includes(postalCode)) {
    result = `${result} · CEP ${postalCode}`;
  }

  const cityState = [city, state].filter(Boolean).join(" – ");
  if (cityState && !address.toLowerCase().includes(city.toLowerCase())) {
    result = `${result} · ${cityState}`;
  }

  return result;
}

/** Links curtos (goo.gl) não funcionam em iframe — só como link externo. */
function isShortOrShareMapsUrl(url: string): boolean {
  return (
    url.includes("goo.gl") ||
    url.includes("maps.app.goo.gl") ||
    (url.includes("google.com/maps") &&
      !url.includes("/embed") &&
      !url.includes("output=embed"))
  );
}

function buildMapsEmbedUrl(options: {
  embed: string;
  external: string;
  address: string;
  city: string;
  state: string;
  lat: string;
  lng: string;
}): string {
  const { embed, external, address, city, state, lat, lng } = options;

  if (embed && !isShortOrShareMapsUrl(embed)) {
    return embed;
  }

  const externalUrl = external || (isShortOrShareMapsUrl(embed) ? embed : "");

  if (lat && lng) {
    return `https://www.google.com/maps?q=${lat},${lng}&hl=pt-BR&z=16&output=embed`;
  }

  const query = [address, city, state].filter(Boolean).join(", ");
  if (query) {
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=pt-BR&z=16&output=embed`;
  }

  return "";
}

function resolveMapsExternalUrl(embed: string, external: string): string {
  if (external) return external;
  if (isShortOrShareMapsUrl(embed)) return embed;
  return "";
}

/** Dados institucionais e de localização — preencher via .env. */
export function getClinicSiteConfig(): ClinicSiteConfig {
  const clinicName = env("NEXT_PUBLIC_CLINIC_NAME") || "Unimetra";
  const address = env("NEXT_PUBLIC_CLINIC_ADDRESS");
  const city = env("NEXT_PUBLIC_CLINIC_CITY");
  const state = env("NEXT_PUBLIC_CLINIC_STATE");
  const postalCode = env("NEXT_PUBLIC_CLINIC_POSTAL_CODE");
  const whatsapp = env("NEXT_PUBLIC_CLINIC_WHATSAPP");
  const embedRaw = env("NEXT_PUBLIC_CLINIC_MAPS_EMBED");
  const externalRaw = env("NEXT_PUBLIC_CLINIC_MAPS_URL");
  const lat = env("NEXT_PUBLIC_CLINIC_MAPS_LAT");
  const lng = env("NEXT_PUBLIC_CLINIC_MAPS_LNG");

  const googleMapsEmbedUrl = buildMapsEmbedUrl({
    embed: embedRaw,
    external: externalRaw,
    address,
    city,
    state,
    lat,
    lng,
  });

  const googleMapsExternalUrl = resolveMapsExternalUrl(embedRaw, externalRaw);

  return {
    clinicName,
    address,
    city,
    state,
    postalCode,
    fullAddress: buildFullAddress(address, city, state, postalCode),
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

/** Quebra horários separados por | ou quebra de linha. */
export function formatOpeningHoursLines(hours: string): string[] {
  if (!hours) return [];
  return hours
    .split(/\||\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Quebra endereço longo em linhas legíveis. */
export function formatAddressLines(address: string): string[] {
  if (!address) return [];
  if (address.includes(" · ")) {
    return address.split(" · ").map((p) => p.trim()).filter(Boolean);
  }
  return [address];
}
