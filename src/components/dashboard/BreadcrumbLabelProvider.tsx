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

type BreadcrumbActions = {
  registerLabel: (key: string, label: string) => void;
  unregisterLabel: (key: string) => void;
};

const BreadcrumbLabelsContext = createContext<Record<string, string>>({});
const BreadcrumbActionsContext = createContext<BreadcrumbActions | null>(null);

export function BreadcrumbLabelProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  const registerLabel = useCallback((key: string, label: string) => {
    setLabels((prev) => {
      if (prev[key] === label) return prev;
      return { ...prev, [key]: label };
    });
  }, []);

  const unregisterLabel = useCallback((key: string) => {
    setLabels((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // Actions must stay stable — putting `labels` in the same context
  // re-triggered register effects and froze the dashboard.
  const actions = useMemo(
    () => ({ registerLabel, unregisterLabel }),
    [registerLabel, unregisterLabel]
  );

  return (
    <BreadcrumbActionsContext.Provider value={actions}>
      <BreadcrumbLabelsContext.Provider value={labels}>
        {children}
      </BreadcrumbLabelsContext.Provider>
    </BreadcrumbActionsContext.Provider>
  );
}

export function useBreadcrumbSegmentLabel(segment: string, label: string) {
  const actions = useContext(BreadcrumbActionsContext);

  useEffect(() => {
    if (!actions || !label) return;
    actions.registerLabel(segment, label);
    return () => actions.unregisterLabel(segment);
  }, [actions, segment, label]);
}

export function useBreadcrumbLabels() {
  return useContext(BreadcrumbLabelsContext);
}
