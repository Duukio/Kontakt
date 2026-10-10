"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createFeedPost(formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();

  if (body.length < 1 || body.length > 1000) {
    redirect("/?error=" + encodeURIComponent("La publicación debe tener entre 1 y 1000 caracteres."));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/ingresar");
  }

  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    wall_owner_id: user.id,
    body,
  });

  if (error) {
    redirect("/?error=" + encodeURIComponent("No se pudo publicar tu estado."));
  }

  revalidatePath("/");
  redirect("/");
}

export async function deleteFeedPost(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/ingresar");
  }

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) {
    redirect("/?error=" + encodeURIComponent("No se pudo eliminar la publicación."));
  }

  revalidatePath("/");
  redirect("/");
}
