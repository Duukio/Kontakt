"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function uploadPhotoAction(formData: FormData) {
  const url = String(formData.get("url") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();

  if (!url) {
    redirect("/fotos?error=" + encodeURIComponent("Debes indicar una URL de imagen o subir un archivo."));
  }
  if (caption.length > 200) {
    redirect("/fotos?error=" + encodeURIComponent("El pie de foto no puede superar los 200 caracteres."));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { error } = await supabase.from("photos").insert({
    owner_id: user.id,
    url,
    caption: caption || null,
  });

  if (error) {
    redirect("/fotos?error=" + encodeURIComponent(`No se pudo guardar la foto: ${error.message}`));
  }

  revalidatePath("/fotos");
  redirect("/fotos?ok=" + encodeURIComponent("¡Foto publicada en tu Fotolog!"));
}

export async function deletePhotoAction(formData: FormData) {
  const photoId = String(formData.get("photo_id") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  await supabase
    .from("photos")
    .delete()
    .eq("id", photoId)
    .eq("owner_id", user.id);

  revalidatePath("/fotos");
  redirect("/fotos?ok=" + encodeURIComponent("Foto eliminada."));
}
