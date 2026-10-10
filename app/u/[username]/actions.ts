"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function ruta(username: string) {
  return `/u/${encodeURIComponent(username)}`;
}

function conError(username: string, mensaje: string): never {
  redirect(`${ruta(username)}?error=${encodeURIComponent(mensaje)}`);
}

async function usuarioActual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");
  return { supabase, user };
}

export async function createPost(formData: FormData) {
  const wallOwnerId = String(formData.get("wall_owner_id") ?? "");
  const username = String(formData.get("username") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (body.length < 1 || body.length > 1000) {
    conError(username, "El mensaje debe tener entre 1 y 1000 caracteres.");
  }

  const { supabase, user } = await usuarioActual();
  const { error } = await supabase
    .from("posts")
    .insert({ author_id: user.id, wall_owner_id: wallOwnerId, body });

  if (error) conError(username, "No se pudo publicar el mensaje.");

  revalidatePath(ruta(username));
  redirect(ruta(username));
}

export async function deletePost(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const username = String(formData.get("username") ?? "");

  const { supabase } = await usuarioActual();
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) conError(username, "No se pudo borrar el mensaje.");

  revalidatePath(ruta(username));
  redirect(ruta(username));
}

export async function sendFriendRequest(formData: FormData) {
  const to = String(formData.get("to") ?? "");
  const username = String(formData.get("username") ?? "");

  const { supabase, user } = await usuarioActual();
  const { error } = await supabase
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id: to });

  if (error) conError(username, "No se pudo enviar la solicitud.");

  revalidatePath(ruta(username));
  redirect(ruta(username));
}

export async function acceptFriendship(formData: FormData) {
  const id = String(formData.get("friendship_id") ?? "");
  const username = String(formData.get("username") ?? "");

  const { supabase } = await usuarioActual();
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", id);

  if (error) conError(username, "No se pudo aceptar la solicitud.");

  revalidatePath(ruta(username));
  redirect(ruta(username));
}

// Sirve para cancelar una solicitud, rechazarla o eliminar a un amigo
export async function removeFriendship(formData: FormData) {
  const id = String(formData.get("friendship_id") ?? "");
  const username = String(formData.get("username") ?? "");

  const { supabase } = await usuarioActual();
  const { error } = await supabase.from("friendships").delete().eq("id", id);

  if (error) conError(username, "No se pudo completar la acción.");

  revalidatePath(ruta(username));
  redirect(ruta(username));
}
