"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function toggleLikeAction(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const path = String(formData.get("path") ?? "/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  // Verificar si ya le dio like
  const { data: existing } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
  } else {
    await supabase.from("likes").insert({
      post_id: postId,
      user_id: user.id,
    });

    // Notificar al autor del post si es otro usuario
    const { data: post } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (post && post.author_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: post.author_id,
        actor_id: user.id,
        type: "like",
        post_id: postId,
      });
    }
  }

  revalidatePath(path);
  redirect(path);
}

export async function createCommentAction(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const path = String(formData.get("path") ?? "/");

  if (body.length < 1 || body.length > 300) {
    redirect(path);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    body,
  });

  if (!error) {
    // Notificar al autor del post si no es él mismo
    const { data: post } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (post && post.author_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: post.author_id,
        actor_id: user.id,
        type: "comment",
        post_id: postId,
      });
    }
  }

  revalidatePath(path);
  redirect(path);
}

export async function deleteCommentAction(formData: FormData) {
  const commentId = String(formData.get("comment_id") ?? "");
  const path = String(formData.get("path") ?? "/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id);

  revalidatePath(path);
  redirect(path);
}

export async function sendPokeAction(formData: FormData) {
  const toId = String(formData.get("to_id") ?? "");
  const path = String(formData.get("path") ?? "/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");
  if (toId === user.id) redirect(path);

  // Registrar el poke / toque
  await supabase.from("pokes").insert({
    from_id: user.id,
    to_id: toId,
  });

  // Notificar al usuario destinatario
  await supabase.from("notifications").insert({
    user_id: toId,
    actor_id: user.id,
    type: "poke",
  });

  revalidatePath(path);
  redirect(path + "?ok=" + encodeURIComponent("¡Le diste un zumbido/toque!"));
}
