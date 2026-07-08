"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createBlogPost, deleteBlogPost } from "@/actions/blog";
import { toast } from "sonner";

type Post = { id: string; title: string; category: string; published: boolean; publishedAt: Date };

export function ConteudoClient({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Atualizações");

  async function handleCreate() {
    const result = await createBlogPost({ title, excerpt, content, category });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Publicação criada");
    setOpen(false);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Conteúdo / Blog"
        description="Gerencie publicações do site"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Nova publicação</Button>} />
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nova publicação</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Input placeholder="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} />
                <Input placeholder="Resumo" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
                <Textarea placeholder="Conteúdo" rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
                <Button onClick={handleCreate}>Publicar</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{p.published ? "Publicado" : "Rascunho"}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={async () => {
                    await deleteBlogPost(p.id);
                    router.refresh();
                  }}>Excluir</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
