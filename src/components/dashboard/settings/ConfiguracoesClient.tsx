"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageModule } from "@/components/dashboard/PageModule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { upsertSettingsBulk } from "@/actions/settings";
import {
  SETTINGS_SECTIONS,
  sectionValuesSnapshot,
  settingsMapFromRows,
  type SettingFieldDef,
} from "@/lib/settings-schema";
import {
  isCommercialModuleEnabled,
  isFinanceModuleEnabled,
} from "@/lib/modules";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SettingRow = { key: string; value: string };

function getVisibleSettingsSections() {
  return SETTINGS_SECTIONS.map((section) => {
    if (section.id === "financeiro" && !isFinanceModuleEnabled()) {
      return null;
    }
    const fields = section.fields.filter((field) => {
      if (field.key.startsWith("fin.") && !isFinanceModuleEnabled()) return false;
      if (field.key === "ops.quote_validity_days" && !isCommercialModuleEnabled()) {
        return false;
      }
      return true;
    });
    if (fields.length === 0) return null;
    return { ...section, fields };
  }).filter((section): section is (typeof SETTINGS_SECTIONS)[number] => Boolean(section));
}

function snapshotsEqual(a: Record<string, string>, b: Record<string, string>) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] ?? "") !== (b[key] ?? "")) return false;
  }
  return true;
}

export function ConfiguracoesClient({
  defaults,
  settings,
}: {
  defaults: Record<string, string>;
  settings: SettingRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const visibleSections = useMemo(() => getVisibleSettingsSections(), []);
  const [activeTab, setActiveTab] = useState(visibleSections[0]?.id ?? "clinica");
  const [values, setValues] = useState<Record<string, string>>(() =>
    settingsMapFromRows(settings, defaults)
  );
  const [saved, setSaved] = useState<Record<string, string>>(() =>
    settingsMapFromRows(settings, defaults)
  );

  useEffect(() => {
    const next = settingsMapFromRows(settings, defaults);
    setValues(next);
    setSaved(next);
  }, [settings, defaults]);

  useEffect(() => {
    if (!visibleSections.some((s) => s.id === activeTab) && visibleSections[0]) {
      setActiveTab(visibleSections[0].id);
    }
  }, [activeTab, visibleSections]);

  const dirtyBySection = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const section of visibleSections) {
      map[section.id] = !snapshotsEqual(
        sectionValuesSnapshot(section.id, values),
        sectionValuesSnapshot(section.id, saved)
      );
    }
    return map;
  }, [values, saved, visibleSections]);

  const sectionDirty = dirtyBySection[activeTab] ?? false;

  const setValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  async function saveSection(sectionId: string) {
    const section = visibleSections.find((s) => s.id === sectionId);
    if (!section) return;
    const payload = sectionValuesSnapshot(sectionId, values);
    const result = await upsertSettingsBulk(payload);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setSaved((prev) => ({ ...prev, ...payload }));
    toast.success("Alterações salvas com sucesso.");
    startTransition(() => router.refresh());
  }

  function renderField(field: SettingFieldDef) {
    const id = field.key;
    const value = values[field.key] ?? "";

    return (
      <div
        key={field.key}
        className={cn("config-field", field.wide && "config-field--wide")}
      >
        <Label htmlFor={id} className="config-field-label">
          {field.label}
        </Label>
        {field.description && <p className="config-field-hint">{field.description}</p>}
        {field.type === "textarea" ? (
          <Textarea
            id={id}
            value={value}
            onChange={(e) => setValue(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="config-control"
          />
        ) : field.type === "boolean" ? (
          <select
            id={id}
            className="config-select"
            value={value || field.defaultValue || "false"}
            onChange={(e) => setValue(field.key, e.target.value)}
          >
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        ) : (
          <Input
            id={id}
            type={
              field.type === "number"
                ? "number"
                : field.type === "email"
                  ? "email"
                  : field.type === "url"
                    ? "url"
                    : "text"
            }
            value={value}
            onChange={(e) => setValue(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="config-control"
          />
        )}
      </div>
    );
  }

  return (
    <PageModule className="configuracoes-clinica">
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Configurações</h1>
          <p className="colaboradores-empresa-subtitle">
            Dados da clínica, operação, documentos, portal e privacidade.
          </p>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          if (v) setActiveTab(v);
        }}
      >
        <TabsList className="config-tabs mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
          {visibleSections.map((s) => (
            <TabsTrigger key={s.id} value={s.id} className="config-tab">
              {s.label}
              {dirtyBySection[s.id] ? <span className="config-tab-dot" aria-hidden /> : null}
            </TabsTrigger>
          ))}
        </TabsList>

        {visibleSections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="mt-0">
            <section className="config-section">
              <header className="config-section-head">
                <div>
                  <h2 className="config-section-title">{section.label}</h2>
                  <p className="config-section-desc">{section.description}</p>
                </div>
                {dirtyBySection[section.id] && (
                  <p className="config-unsaved" role="status">
                    Alterações não salvas
                  </p>
                )}
              </header>

              <div className="config-form-grid">{section.fields.map(renderField)}</div>

              <div className="config-section-footer">
                <Button
                  variant="brand"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => void saveSection(section.id)}
                  disabled={pending || !dirtyBySection[section.id]}
                >
                  Salvar alterações
                </Button>
                {sectionDirty && activeTab === section.id && (
                  <span className="config-footer-hint">Há alterações pendentes nesta seção.</span>
                )}
              </div>
            </section>
          </TabsContent>
        ))}
      </Tabs>
    </PageModule>
  );
}
