"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setTopFriendAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const friendId = String(formData.get("friend_id") ?? "");
  const position = parseInt(String(formData.get("position") ?? "0"), 10);

  if (!friendId || position < 1 || position > 8) return;

  // Si ya existe en esa posición, reemplazar o actualizar
  await supabase
    .from("top_friends")
    .delete()
    .eq("user_id", user.id)
    .eq("position", position);

  // Asegurar que no esté duplicado en otra posición
  await supabase
    .from("top_friends")
    .delete()
    .eq("user_id", user.id)
    .eq("friend_id", friendId);

  await supabase.from("top_friends").insert({
    user_id: user.id,
    friend_id: friendId,
    position,
  });

  revalidatePath("/perfil");
  revalidatePath("/amigos/top");
}

export async function removeTopFriendAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const position = parseInt(String(formData.get("position") ?? "0"), 10);
  if (position < 1 || position > 8) return;

  await supabase
    .from("top_friends")
    .delete()
    .eq("user_id", user.id)
    .eq("position", position);

  revalidatePath("/perfil");
  revalidatePath("/amigos/top");
}

export async function addFriendToTopAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const friendId = String(formData.get("friend_id") ?? "");
  const returnPath = String(formData.get("return_path") ?? "/amigos");
  if (!friendId) return;

  // Ver si ya está en el top
  const { data: existing } = await supabase
    .from("top_friends")
    .select("position")
    .eq("user_id", user.id)
    .eq("friend_id", friendId)
    .maybeSingle();

  if (existing) {
    // Si ya está, lo quitamos
    await supabase
      .from("top_friends")
      .delete()
      .eq("user_id", user.id)
      .eq("friend_id", friendId);
  } else {
    // Buscar la primera posición disponible de 1 a 8
    const { data: currentTop } = await supabase
      .from("top_friends")
      .select("position")
      .eq("user_id", user.id);

    const usedPositions = new Set((currentTop || []).map((t) => t.position));
    let nextPos = 1;
    while (nextPos <= 8 && usedPositions.has(nextPos)) {
      nextPos++;
    }

    if (nextPos <= 8) {
      await supabase.from("top_friends").insert({
        user_id: user.id,
        friend_id: friendId,
        position: nextPos,
      });
    }
  }

  revalidatePath("/perfil");
  revalidatePath("/amigos");
  revalidatePath("/amigos/top");
  revalidatePath(returnPath);
}

