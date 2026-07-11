"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type BreadcrumbLabelContextValue = {
  labels: Record<string, string>;
  registerLabel: (key: string, label: string) => void;
  unregisterLabel: (key: string) => void;
};

const BreadcrumbLabelContext = createContext<BreadcrumbLabelContextValue | null>(null);

export function BreadcrumbLabelProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  const registerLabel = useCallback((key: string, label: string) => {
    setLabels((prev) => ({ ...prev, [key]: label }));
  }, []);

  const unregisterLabel = useCallback((key: string) => {
    setLabels((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ labels, registerLabel, unregisterLabel }),
    [labels, registerLabel, unregisterLabel]
  );

  return (
    <BreadcrumbLabelContext.Provider value={value}>{children}</BreadcrumbLabelContext.Provider>
  );
}

export function useBreadcrumbSegmentLabel(segment: string, label: string) {
  const ctx = useContext(BreadcrumbLabelContext);

  useEffect(() => {
    if (!ctx || !label) return;
    ctx.registerLabel(segment, label);
    return () => ctx.unregisterLabel(segment);
  }, [ctx, segment, label]);
}

export function useBreadcrumbLabels() {
  return useContext(BreadcrumbLabelContext)?.labels ?? {};
}
