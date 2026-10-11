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
    if (error.message.includes("posts_body_check")) {
      redirect(
        "/?error=" +
          encodeURIComponent(
            "Tu publicación supera los 140 caracteres permitidos por la base de datos. Para permitir hasta 1000 caracteres con links/fotos, ejecutá en Supabase SQL Editor: ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_body_check; ALTER TABLE posts ADD CONSTRAINT posts_body_check CHECK (char_length(body) >= 1 AND char_length(body) <= 1000);"
          )
      );
    }
    redirect("/?error=" + encodeURIComponent(`No se pudo publicar: ${error.message}`));
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
