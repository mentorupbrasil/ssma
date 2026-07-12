"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission, actionError, isPrismaUniqueError } from "@/lib/authz";
import { createAuditLog } from "@/lib/server";
import { resolveClinicId, withClinicId } from "@/lib/scoped-db";

type Result = { success: true; id: string } | { success: false; error: string };

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createBlogPost(input: {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  published?: boolean;
}): Promise<Result> {
  try {
    const session = await requirePermission("settings.manage");
    const clinicId = await resolveClinicId(session);
    const slug = slugify(input.title);
    const post = await prisma.blogPost.create({
      data: withClinicId(
        {
          title: input.title.trim(),
          slug,
          excerpt: input.excerpt.trim(),
          content: input.content.trim(),
          category: input.category.trim(),
          published: input.published ?? true,
        },
        clinicId
      ),
    });
    await createAuditLog({ action: "CREATE", entity: "BlogPost", entityId: post.id });
    revalidatePath("/blog");
    return { success: true, id: post.id };
  } catch (e) {
    if (isPrismaUniqueError(e)) return { success: false, error: "Slug já existe." };
    return { success: false, error: actionError(e, "Erro ao publicar conteúdo.") };
  }
}

export async function updateBlogPost(input: {
  id: string;
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  published?: boolean;
}): Promise<Result> {
  try {
    const session = await requirePermission("settings.manage");
    const data: Record<string, unknown> = {};
    if (input.title) {
      data.title = input.title.trim();
      data.slug = slugify(input.title);
    }
    if (input.excerpt) data.excerpt = input.excerpt.trim();
    if (input.content) data.content = input.content.trim();
    if (input.category) data.category = input.category.trim();
    if (input.published !== undefined) data.published = input.published;
    await prisma.blogPost.update({ where: { id: input.id }, data });
    revalidatePath("/blog");
    return { success: true, id: input.id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao atualizar conteúdo.") };
  }
}

export async function deleteBlogPost(id: string): Promise<Result> {
  try {
    await requirePermission("settings.manage");
    await prisma.blogPost.delete({ where: { id } });
    revalidatePath("/blog");
    return { success: true, id };
  } catch (e) {
    return { success: false, error: actionError(e, "Erro ao excluir conteúdo.") };
  }
}
