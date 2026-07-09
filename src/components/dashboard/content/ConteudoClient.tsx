"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, ExternalLink, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createBlogPost, updateBlogPost, deleteBlogPost } from "@/actions/blog";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Atualizações", "Saúde ocupacional", "Normas e legislação", "Dicas", "Institucional"];

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
  const [category, setCategory] = useState("Atualizações");
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
    setCategory("Atualizações");
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

  const formFields = (
    <div className="space-y-3">
      <Input placeholder="Título *" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Select value={category} onValueChange={(v) => setCategory(v ?? "Atualizações")}>
        <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input placeholder="Resumo (SEO)" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      <Textarea placeholder="Conteúdo" rows={8} value={content} onChange={(e) => setContent(e.target.value)} />
      <Select value={published ? "true" : "false"} onValueChange={(v) => setPublished(v === "true")}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Publicado</SelectItem>
          <SelectItem value="false">Rascunho</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="referrals-module">
      <PageHeader
        title="Conteúdo / Blog"
        description="Gerencie publicações do site"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Nova publicação</Button>} />
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nova publicação</DialogTitle></DialogHeader>
              {formFields}
              <Button onClick={handleCreate} disabled={pending || !title.trim()}>Salvar</Button>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="referral-stat-grid referral-stat-grid-3 mb-6">
        <div className="referral-stat-card">
          <span className="referral-stat-count">{posts.length}</span>
          <span className="referral-stat-label">Total</span>
        </div>
        <div className="referral-stat-card">
          <span className="referral-stat-count">{posts.filter((p) => p.published).length}</span>
          <span className="referral-stat-label">Publicados</span>
        </div>
        <div className="referral-stat-card">
          <span className="referral-stat-count">{posts.filter((p) => !p.published).length}</span>
          <span className="referral-stat-label">Rascunhos</span>
        </div>
      </div>

      <FilterBar className="mb-4">
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
          description="Crie conteúdo para o blog e página de atualizações do site."
          action={{ label: "Nova publicação", onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="rounded-xl border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Publicado em</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>{p.published ? "Publicado" : "Rascunho"}</TableCell>
                  <TableCell>{format(p.publishedAt, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell className="space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Link
                      href={`/atualizacoes/${p.slug}`}
                      target="_blank"
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => startTransition(async () => {
                      await updateBlogPost({ id: p.id, published: !p.published });
                      router.refresh();
                    })}>
                      {p.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => startTransition(async () => {
                      await deleteBlogPost(p.id);
                      router.refresh();
                    })}>Excluir</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editPost} onOpenChange={(o) => !o && setEditPost(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar publicação</DialogTitle></DialogHeader>
          {formFields}
          <Button onClick={handleUpdate} disabled={pending}>Salvar alterações</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
