"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCommunityAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "General").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim() || null;

  if (name.length < 3 || name.length > 60) {
    redirect("/comunidades/crear?error=" + encodeURIComponent("El nombre debe tener entre 3 y 60 caracteres."));
  }

  const { data: com, error } = await supabase
    .from("communities")
    .insert({
      name,
      description,
      category,
      avatar_url: avatarUrl,
      creator_id: user.id,
    })
    .select("id")
    .single();

  if (error || !com) {
    redirect("/comunidades/crear?error=" + encodeURIComponent("Error al crear comunidad."));
  }

  // El creador se une automáticamente
  await supabase.from("community_members").insert({
    community_id: com.id,
    user_id: user.id,
  });

  redirect(`/comunidades/${com.id}`);
}

export async function joinCommunityAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const communityId = String(formData.get("community_id") ?? "");
  if (!communityId) return;

  await supabase.from("community_members").insert({
    community_id: communityId,
    user_id: user.id,
  });

  revalidatePath(`/comunidades/${communityId}`);
}

export async function leaveCommunityAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const communityId = String(formData.get("community_id") ?? "");
  if (!communityId) return;

  await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", user.id);

  revalidatePath(`/comunidades/${communityId}`);
}

export async function createTopicAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const communityId = String(formData.get("community_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!communityId || title.length < 3 || body.length < 1) return;

  const { data: topic } = await supabase
    .from("community_topics")
    .insert({
      community_id: communityId,
      author_id: user.id,
      title,
    })
    .select("id")
    .single();

  if (topic) {
    await supabase.from("community_posts").insert({
      topic_id: topic.id,
      author_id: user.id,
      body,
    });
  }

  redirect(`/comunidades/${communityId}/tema/${topic?.id}`);
}

export async function replyTopicAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const communityId = String(formData.get("community_id") ?? "");
  const topicId = String(formData.get("topic_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!topicId || body.length < 1) return;

  await supabase.from("community_posts").insert({
    topic_id: topicId,
    author_id: user.id,
    body,
  });

  revalidatePath(`/comunidades/${communityId}/tema/${topicId}`);
}
