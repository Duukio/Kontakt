"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validarCss } from "@/lib/css";

const RELACIONES = ["soltero", "en_pareja", "casado", "complicado"];

function volver(mensaje: string): never {
  redirect(`/editar-perfil?error=${encodeURIComponent(mensaje)}`);
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const interests = String(formData.get("interests") ?? "").trim();
  const relacion = String(formData.get("relationship_status") ?? "");
  const customCss = String(formData.get("custom_css") ?? "").trim();

  if (displayName.length < 1 || displayName.length > 40) {
    volver("El nombre debe tener entre 1 y 40 caracteres.");
  }
  if (bio.length > 500) volver("La bio no puede superar los 500 caracteres.");
  if (location.length > 60) volver("La ubicación no puede superar los 60 caracteres.");
  if (interests.length > 500) volver("Los intereses no pueden superar los 500 caracteres.");
  if (relacion && !RELACIONES.includes(relacion)) volver("Estado de relación inválido.");

  if (customCss) {
    const errorCss = validarCss(customCss);
    if (errorCss) volver(errorCss);
  }

  const { data: perfil, error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      bio: bio || null,
      location: location || null,
      interests: interests || null,
      relationship_status: relacion || null,
      custom_css: customCss || null,
    })
    .eq("id", user.id)
    .select("username")
    .single();

  if (error || !perfil) volver("No se pudo guardar el perfil.");

  redirect(`/u/${perfil.username}`);
}
