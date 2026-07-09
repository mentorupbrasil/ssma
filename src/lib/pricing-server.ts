import "server-only";

import { prisma } from "@/lib/prisma";
import { buildPriceSearchTerms, effectivePrice } from "@/lib/pricing";

export async function lookupPriceInternal(input: {
  serviceName: string;
  companyId?: string | null;
  examType?: string | null;
  clinicId?: string | null;
}) {
  const terms = buildPriceSearchTerms(input);
  const clinicFilter = input.clinicId ? { clinicId: input.clinicId } : {};

  for (const term of terms) {
    if (input.companyId) {
      const companyItem = await prisma.priceListItem.findFirst({
        where: {
          ...clinicFilter,
          status: "ATIVA",
          companyId: input.companyId,
          name: { contains: term, mode: "insensitive" },
        },
        orderBy: { updatedAt: "desc" },
      });
      if (companyItem) {
        return { price: effectivePrice(companyItem), itemId: companyItem.id, source: "company" as const };
      }
    }

    const defaultItem = await prisma.priceListItem.findFirst({
      where: {
        ...clinicFilter,
        status: "ATIVA",
        companyId: null,
        name: { contains: term, mode: "insensitive" },
      },
      orderBy: { updatedAt: "desc" },
    });
    if (defaultItem) {
      return { price: defaultItem.defaultPrice, itemId: defaultItem.id, source: "default" as const };
    }
  }

  return { price: null, itemId: null, source: null };
}
