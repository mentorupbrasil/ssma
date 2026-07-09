import type { FilterChip } from "@/components/dashboard/FilterChips";

type ChipField = {
  key: string;
  value: string | undefined;
  label: (value: string) => string;
  skip?: (value: string) => boolean;
};

export function buildFilterChips(fields: ChipField[]): FilterChip[] {
  const chips: FilterChip[] = [];
  for (const field of fields) {
    const raw = field.value?.trim();
    if (!raw || raw === "ALL" || field.skip?.(raw)) continue;
    chips.push({ key: field.key, label: field.label(raw) });
  }
  return chips;
}

export function removeFilterKey(
  key: string,
  current: Record<string, string | undefined>
): Record<string, string | undefined> {
  const resetValues: Record<string, string | undefined> = {
    status: "ALL",
    card: undefined,
    queue: undefined,
  };
  return {
    ...current,
    [key]: resetValues[key] ?? undefined,
    page: undefined,
  };
}
