"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, ExternalLink, Eye, EyeOff, Trash2 } from "lucide-react";
import { PageModule } from "@/components/dashboard/PageModule";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getMetricMeta } from "@/lib/metric-cards";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterBar } from "@/components/dashboard/FilterBar";
import {
  SystemActionMenu,
  type SystemActionItem,
} from "@/components/dashboard/SystemActionMenu";
import {
  SystemModalField,
  SystemModalShell,
} from "@/components/dashboard/SystemModalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createBlogPost, updateBlogPost, deleteBlogPost } from "@/actions/blog";
import { toast } from "sonner";

const CATEGORIES = [
  "Saúde ocupacional",
  "Exames ocupacionais",
  "Segurança do trabalho",
  "Medicina do trabalho",
  "Normas e legislação",
  "Dicas",
  "Institucional",
];

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  published: boolean;
  publishedAt: Date;
};

export function ConteudoClient({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Saúde ocupacional");
  const [published, setPublished] = useState(true);

  const filtered = posts.filter((p) => {
    const q = search.toLowerCase();
    const matchQ = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
    const matchCat = categoryFilter === "ALL" || p.category === categoryFilter;
    return matchQ && matchCat;
  });

  function resetForm() {
    setTitle("");
    setExcerpt("");
    setContent("");
    setCategory("Saúde ocupacional");
    setPublished(true);
  }

  function openEdit(p: Post) {
    setEditPost(p);
    setTitle(p.title);
    setExcerpt(p.excerpt);
    setContent(p.content);
    setCategory(p.category);
    setPublished(p.published);
  }

  async function handleCreate() {
    const result = await createBlogPost({ title, excerpt, content, category, published });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Publicação criada");
    setOpen(false);
    resetForm();
    router.refresh();
  }

  async function handleUpdate() {
    if (!editPost) return;
    const result = await updateBlogPost({
      id: editPost.id,
      title,
      excerpt,
      content,
      category,
      published,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Publicação atualizada");
    setEditPost(null);
    resetForm();
    router.refresh();
  }

  function buildPostActions(p: Post): SystemActionItem[] {
    return [
      {
        label: "Editar",
        hint: "Alterar conteúdo",
        icon: Pencil,
        iconTone: "view",
        onClick: () => openEdit(p),
      },
      {
        label: "Ver no site",
        hint: "Abrir publicação pública",
        icon: ExternalLink,
        iconTone: "portal",
        onClick: () => window.open(`/blog/${p.slug}`, "_blank"),
      },
      {
        label: p.published ? "Despublicar" : "Publicar",
        hint: p.published ? "Tornar rascunho" : "Publicar no site",
        icon: p.published ? EyeOff : Eye,
        iconTone: p.published ? "cancel" : "done",
        onClick: () =>
          startTransition(async () => {
            await updateBlogPost({ id: p.id, published: !p.published });
            router.refresh();
          }),
      },
      {
        label: "Excluir",
        hint: "Remover publicação",
        icon: Trash2,
        iconTone: "cancel",
        onClick: () =>
          startTransition(async () => {
            await deleteBlogPost(p.id);
            router.refresh();
          }),
      },
    ];
  }

  const formFields = (
    <>
      <SystemModalField label="Título" required wide>
        <input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Categoria" wide>
        <Select value={category} onValueChange={(v) => setCategory(v ?? "Atualizações")}>
          <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SystemModalField>
      <SystemModalField label="Resumo (SEO)" wide>
        <input placeholder="Resumo (SEO)" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Conteúdo" wide>
        <Textarea placeholder="Conteúdo" rows={8} value={content} onChange={(e) => setContent(e.target.value)} />
      </SystemModalField>
      <SystemModalField label="Status">
        <Select value={published ? "true" : "false"} onValueChange={(v) => setPublished(v === "true")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Publicado</SelectItem>
            <SelectItem value="false">Rascunho</SelectItem>
          </SelectContent>
        </Select>
      </SystemModalField>
    </>
  );

  return (
    <PageModule>
      <header className="colaboradores-empresa-header">
        <div className="colaboradores-empresa-header-copy">
          <h1 className="colaboradores-empresa-title">Conteúdo / Blog</h1>
          <p className="colaboradores-empresa-subtitle">Gerencie publicações do site</p>
        </div>
        <div className="colaboradores-empresa-header-actions">
          <Button variant="brand" size="sm" className="rounded-lg" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova publicação
          </Button>
        </div>
      </header>

      <MetricGrid>
        {(
          [
            { key: "total", label: "Total de publicações", value: posts.length },
            { key: "published", label: "Publicados", value: posts.filter((p) => p.published).length },
            { key: "drafts", label: "Rascunhos", value: posts.filter((p) => !p.published).length },
          ] as const
        ).map((item) => {
          const meta = getMetricMeta(`content:${item.key}`);
          return (
            <MetricCard
              key={item.key}
              label={item.label}
              value={item.value}
              icon={meta.icon}
              description={meta.description}
              variant={meta.tone}
            />
          );
        })}
      </MetricGrid>

      <FilterBar>
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "ALL")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma publicação"
          description="Crie conteúdo para o blog público do site."
          action={{ label: "Nova publicação", onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="colaboradores-empresa-table-wrap">
          <div className="colaboradores-empresa-table-scroll">
            <Table className="colaboradores-empresa-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Publicado em</TableHead>
                  <TableHead className="colaboradores-empresa-th-actions">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>{p.published ? "Publicado" : "Rascunho"}</TableCell>
                    <TableCell>{format(p.publishedAt, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>
                      <SystemActionMenu items={buildPostActions(p)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <SystemModalShell
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) resetForm();
        }}
        title="Nova publicação"
        description="Crie conteúdo para o blog público."
        badges={[
          { label: "Conteúdo", variant: "category" },
          { label: "Nova", variant: "status" },
        ]}
        className="max-w-lg"
        footer={
          <div className="collaborator-modal-actions">
            <Button
              variant="outline"
              className="collaborator-modal-btn"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={handleCreate}
              disabled={pending || !title.trim()}
            >
              Salvar
            </Button>
          </div>
        }
      >
        {formFields}
      </SystemModalShell>

      <SystemModalShell
        open={!!editPost}
        onOpenChange={(o) => {
          if (!o) {
            setEditPost(null);
            resetForm();
          }
        }}
        title="Editar publicação"
        description="Atualize título, conteúdo e status."
        badges={[
          { label: "Conteúdo", variant: "category" },
          { label: "Edição", variant: "status" },
        ]}
        className="max-w-lg"
        footer={
          <div className="collaborator-modal-actions">
            <Button
              variant="outline"
              className="collaborator-modal-btn"
              onClick={() => {
                setEditPost(null);
                resetForm();
              }}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              variant="brand"
              className="collaborator-modal-btn"
              onClick={handleUpdate}
              disabled={pending}
            >
              Salvar alterações
            </Button>
          </div>
        }
      >
        {formFields}
      </SystemModalShell>
    </PageModule>
  );
}
