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
  facebook: string;
  openingHours: string;
  googleMapsEmbedUrl: string;
  openStreetMapEmbedUrl: string;
  /** Mapa embutido preferido (OSM com ruas reais; fallback Google). */
  mapEmbedUrl: string;
  googleMapsExternalUrl: string;
  hasAddress: boolean;
  hasWhatsApp: boolean;
  hasMapEmbed: boolean;
  hasMapLink: boolean;
  mapsLat: string;
  mapsLng: string;
};

/** Dados institucionais da clínica — editar aqui quando necessário. */
const CLINIC_SITE = {
  clinicName: "Unimetra",
  address: "Rua João Lisboa, nº 779, Centro (entre as ruas Ceará e Rio Grande do Norte)",
  city: "Imperatriz",
  state: "MA",
  postalCode: "65900-630",
  phone: "",
  whatsapp: "5599992033813",
  email: "contato@unimetra.com.br",
  instagram: "https://www.instagram.com/clinica__unimetra/",
  facebook: "https://www.facebook.com/unimetraclinica/?locale=pt_BR",
  openingHours:
    "Segunda a Sexta-feira: 07:00 – 11:30 · 14:00 – 17:30 | Sábado e Domingo: Fechado",
  googleMapsExternalUrl: "https://maps.app.goo.gl/XDip6f7qFYn7L9JR8",
  googleMapsEmbedUrl: "",
  mapsLat: "-5.524725",
  mapsLng: "-47.479393",
} as const;

function buildFullAddress(
  address: string,
  city: string,
  state: string,
  postalCode: string
): string {
  const street = normalizeStreetAddress(address, city, state, postalCode);
  const locality = formatLocalityLine(city, state, postalCode);
  return [street, locality].filter(Boolean).join(" · ");
}

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function includesNormalized(haystack: string, needle: string): boolean {
  if (!needle) return false;
  return stripAccents(haystack.toLowerCase()).includes(stripAccents(needle.toLowerCase()));
}

function normalizeStreetAddress(
  address: string,
  city: string,
  state: string,
  postalCode: string
): string {
  if (!address) return "";

  let street = address.split("|")[0]?.trim() ?? address.trim();
  street = street.replace(/\bCEP\s*:?\s*\d{5}-?\d{3}\b/gi, "").trim();

  if (city && state) {
    const cityStateSuffix = new RegExp(
      `[,\\s·]*${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[–-]\\s*${state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
      "i"
    );
    street = street.replace(cityStateSuffix, "").trim();
  }

  if (city) {
    const citySuffix = new RegExp(
      `[,\\s·]*${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*(?:[–-]\\s*${state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*)?$`,
      "i"
    );
    street = street.replace(citySuffix, "").trim();
  }

  if (postalCode) {
    const digits = postalCode.replace(/\D/g, "");
    if (digits.length === 8 && includesNormalized(street, digits)) {
      street = street.replace(new RegExp(`\\b${digits.slice(0, 5)}-?${digits.slice(5)}\\b`, "g"), "").trim();
    }
  }

  return street.replace(/[,·\s]+$/g, "").trim();
}

function formatLocalityLine(city: string, state: string, postalCode: string): string {
  const cityState = [city, state].filter(Boolean).join(" – ");
  const cep = postalCode ? `CEP ${postalCode.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2")}` : "";
  return [cityState, cep].filter(Boolean).join(" · ");
}

/** Endereço em linhas legíveis — evita repetição de cidade, estado e CEP. */
export function formatClinicAddressLines(
  config: Pick<ClinicSiteConfig, "address" | "city" | "state" | "postalCode">
): string[] {
  const street = normalizeStreetAddress(
    config.address,
    config.city,
    config.state,
    config.postalCode
  );
  const locality = formatLocalityLine(config.city, config.state, config.postalCode);
  const lines = [street, locality].filter(Boolean);
  return lines.length > 0 ? lines : ["Endereço em atualização"];
}

function isEmbeddableMapsUrl(url: string): boolean {
  if (!url) return false;
  return url.includes("output=embed") || url.includes("/maps/embed");
}

function buildOpenStreetMapEmbedUrl(lat: string, lng: string): string {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return "";

  const pad = 0.014;
  const bbox = [
    (lngNum - pad).toFixed(6),
    (latNum - pad).toFixed(6),
    (lngNum + pad).toFixed(6),
    (latNum + pad).toFixed(6),
  ].join(",");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latNum}%2C${lngNum}`;
}

function buildMapsEmbedUrl(options: {
  embed: string;
  lat: string;
  lng: string;
  address: string;
  city: string;
  state: string;
}): string {
  const { embed, lat, lng, address, city, state } = options;

  if (lat && lng) {
    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&hl=pt-BR&z=16&output=embed`;
  }

  if (embed && isEmbeddableMapsUrl(embed)) {
    return embed;
  }

  const query = [address, city, state].filter(Boolean).join(", ");
  if (query) {
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=pt-BR&z=16&output=embed`;
  }

  return "";
}

/** Dados institucionais e de localização da clínica. */
export function getClinicSiteConfig(): ClinicSiteConfig {
  const {
    clinicName,
    address,
    city,
    state,
    postalCode,
    phone,
    whatsapp,
    email,
    instagram,
    facebook,
    openingHours,
    googleMapsExternalUrl,
    googleMapsEmbedUrl: embedRaw,
    mapsLat,
    mapsLng,
  } = CLINIC_SITE;

  const googleMapsEmbedUrl = buildMapsEmbedUrl({
    embed: embedRaw,
    lat: mapsLat,
    lng: mapsLng,
    address,
    city,
    state,
  });

  const openStreetMapEmbedUrl = buildOpenStreetMapEmbedUrl(mapsLat, mapsLng);
  // Google Maps embed tem visual mais premium (sem marca d'água do OSM) e é
  // consistente com o botão "Abrir no Google Maps" exibido ao lado do mapa.
  const mapEmbedUrl = googleMapsEmbedUrl || openStreetMapEmbedUrl;

  return {
    clinicName,
    address,
    city,
    state,
    postalCode,
    fullAddress: buildFullAddress(address, city, state, postalCode),
    phone,
    whatsapp,
    email,
    instagram,
    facebook,
    openingHours,
    googleMapsEmbedUrl,
    openStreetMapEmbedUrl,
    mapEmbedUrl,
    googleMapsExternalUrl,
    hasAddress: Boolean(address),
    hasWhatsApp: Boolean(whatsapp),
    hasMapEmbed: Boolean(mapEmbedUrl),
    hasMapLink: Boolean(googleMapsExternalUrl),
    mapsLat,
    mapsLng,
  };
}

/** Coordenadas legíveis para exibição no mapa interativo. */
export function formatClinicCoordinates(lat: string, lng: string): string {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return "";

  const latHem = latNum >= 0 ? "N" : "S";
  const lngHem = lngNum >= 0 ? "E" : "W";
  return `${Math.abs(latNum).toFixed(4)}° ${latHem}, ${Math.abs(lngNum).toFixed(4)}° ${lngHem}`;
}

/** Quebra horários separados por |, quebra de linha ou blocos de dias. */
export function formatOpeningHoursLines(hours: string): string[] {
  if (!hours) return [];

  const normalized = hours.replace(/\s+/g, " ").trim();
  const segments = normalized.includes("|")
    ? normalized.split("|")
    : normalized.split(/(?=(?:Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)\b)/i);

  return segments
    .map((segment) => formatOpeningHoursSegment(segment.trim()))
    .filter(Boolean);
}

function formatOpeningHoursSegment(segment: string): string {
  if (!segment) return "";

  const withColon = segment.match(/^([^:]+:\s*)(.+)$/);
  if (!withColon) return segment;

  const prefix = withColon[1];
  let times = withColon[2].trim();

  times = times.replace(
    /(\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})/g,
    "$1 · $2"
  );

  return `${prefix}${times}`;
}

/** Quebra endereço longo em linhas legíveis. */
export function formatAddressLines(address: string): string[] {
  if (!address) return [];
  if (address.includes(" · ")) {
    return address
      .split(" · ")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [address];
}
