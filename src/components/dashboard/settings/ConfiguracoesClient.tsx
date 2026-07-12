"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageModule } from "@/components/dashboard/PageModule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { upsertSettingsBulk } from "@/actions/settings";
import {
  SETTINGS_UI_SECTIONS,
  getSettingFieldByKey,
  settingsMapFromRows,
  settingsUiValuesSnapshot,
  type SettingFieldDef,
} from "@/lib/settings-schema";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SettingRow = { key: string; value: string };

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

  const dirty = useMemo(
    () =>
      !snapshotsEqual(
        settingsUiValuesSnapshot(values),
        settingsUiValuesSnapshot(saved)
      ),
    [values, saved]
  );

  const setValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  async function saveAll() {
    const payload = settingsUiValuesSnapshot(values);
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
        {field.description ? (
          <p className="config-field-hint">{field.description}</p>
        ) : null}
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
            Dados da clínica, operação e portal empresarial.
          </p>
        </div>
        {dirty ? (
          <p className="config-unsaved" role="status">
            Alterações não salvas
          </p>
        ) : null}
      </header>

      <div className="config-page">
        {SETTINGS_UI_SECTIONS.map((section, index) => {
          const fields = section.fieldKeys
            .map((key) => getSettingFieldByKey(key))
            .filter((field): field is SettingFieldDef => Boolean(field));

          if (fields.length === 0) return null;

          return (
            <section
              key={section.id}
              className={cn("config-block", index > 0 && "config-block--divided")}
            >
              <h2 className="config-block-title">{section.label}</h2>
              <div className="config-form-grid">{fields.map(renderField)}</div>
            </section>
          );
        })}

        <div className="config-page-footer">
          <Button
            variant="brand"
            size="sm"
            className="rounded-lg"
            onClick={() => void saveAll()}
            disabled={pending || !dirty}
          >
            Salvar alterações
          </Button>
          {dirty ? (
            <span className="config-footer-hint">Há alterações pendentes nesta página.</span>
          ) : null}
        </div>
      </div>
    </PageModule>
  );
}
