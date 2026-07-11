"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { FilterChips, type FilterChip } from "@/components/dashboard/FilterChips";
import { cn } from "@/lib/utils";

type CollaboratorFilterPanelProps = {
  q: string;
  onQChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  jobTitle: string;
  onJobTitleChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
  clinicalExamType: string;
  onClinicalExamTypeChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateRangeChange: (from?: string, to?: string) => void;
  periodicDue: string;
  onPeriodicDueChange: (value: string) => void;
  docsPending: string;
  onDocsPendingChange: (value: string) => void;
  companyId?: string;
  onCompanyIdChange?: (value: string) => void;
  companies?: { id: string; name: string }[];
  jobTitles: string[];
  departments: string[];
  isEmpresaPortal?: boolean;
  isPending?: boolean;
  onSearch: () => void;
  onClear: () => void;
  activeChips?: FilterChip[];
  onRemoveChip?: (key: string) => void;
  onClearChips?: () => void;
};

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="collaborator-filter-select"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function CollaboratorFilterPanel({
  q,
  onQChange,
  status,
  onStatusChange,
  jobTitle,
  onJobTitleChange,
  department,
  onDepartmentChange,
  clinicalExamType,
  onClinicalExamTypeChange,
  dateFrom,
  dateTo,
  onDateRangeChange,
  periodicDue,
  onPeriodicDueChange,
  docsPending,
  onDocsPendingChange,
  companyId,
  onCompanyIdChange,
  companies = [],
  jobTitles,
  departments,
  isEmpresaPortal = false,
  isPending,
  onSearch,
  onClear,
  activeChips,
  onRemoveChip,
  onClearChips,
}: CollaboratorFilterPanelProps) {
  return (
    <div className={cn("collaborator-filter-panel", isEmpresaPortal && "collaborator-filter-panel--empresa")}>
      <div className="collaborator-filter-grid">
        <div className="collaborator-filter-search">
          <Search className="collaborator-filter-search-icon h-4 w-4" />
          <Input
            placeholder={
              isEmpresaPortal
                ? "Buscar por nome, CPF, função ou protocolo"
                : "Buscar por nome, CPF, empresa, função ou protocolo"
            }
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="h-9 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
          />
        </div>

        <FilterSelect
          value={status}
          onChange={onStatusChange}
          placeholder="Status"
          options={[
            { value: "ATIVO", label: "Ativo" },
            { value: "INATIVO", label: "Inativo" },
            { value: "AFASTADO", label: "Afastado" },
            { value: "DESLIGADO", label: "Desligado" },
            { value: "PENDENTE", label: "Pendente" },
            { value: "SCHEDULED", label: "Com exame agendado" },
            { value: "DOCS_PENDING", label: "Com documentos pendentes" },
            { value: "PERIODIC_DUE", label: "Periódico a vencer" },
          ]}
        />

        <FilterSelect
          value={jobTitle}
          onChange={onJobTitleChange}
          placeholder="Função"
          options={jobTitles.map((title) => ({ value: title, label: title }))}
        />

        <FilterSelect
          value={department}
          onChange={onDepartmentChange}
          placeholder="Setor"
          options={departments.map((name) => ({ value: name, label: name }))}
        />

        {!isEmpresaPortal && companies.length > 0 && onCompanyIdChange && (
          <FilterSelect
            value={companyId ?? ""}
            onChange={onCompanyIdChange}
            placeholder="Empresa"
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
          />
        )}

        <FilterSelect
          value={clinicalExamType}
          onChange={onClinicalExamTypeChange}
          placeholder="Tipo de exame"
          options={[
            { value: "ADMISSIONAL", label: "Admissional" },
            { value: "PERIODICO", label: "Periódico" },
            { value: "DEMISSIONAL", label: "Demissional" },
            { value: "RETORNO_TRABALHO", label: "Retorno ao trabalho" },
            { value: "MUDANCA_FUNCAO", label: "Mudança de função" },
          ]}
        />

        <DateRangePicker
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={onDateRangeChange}
          placeholder="Período de cadastro"
        />

        <FilterSelect
          value={periodicDue}
          onChange={onPeriodicDueChange}
          placeholder="Próximo periódico"
          options={[{ value: "true", label: "A vencer (30 dias)" }]}
        />

        <FilterSelect
          value={docsPending}
          onChange={onDocsPendingChange}
          placeholder="Documento pendente"
          options={[{ value: "true", label: "Com pendência" }]}
        />
      </div>

      <div className="collaborator-filter-footer">
        {activeChips && activeChips.length > 0 && (
          <FilterChips chips={activeChips} onRemove={onRemoveChip} onClearAll={onClearChips} />
        )}
        <div className="collaborator-filter-actions">
            <Button variant="brand" size="sm" onClick={onSearch} disabled={isPending}>
              Filtrar
            </Button>
            <Button variant="outline" size="sm" onClick={onClear} disabled={isPending}>
              Limpar filtros
            </Button>
          </div>
        </div>
    </div>
  );
}
