"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function traducir(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("already registered")) return "Ese email ya está registrado.";
  if (m.includes("database error")) return "Ese nombre de usuario ya está en uso.";
  if (m.includes("invalid login")) return "Email o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Todavía no confirmaste tu email.";
  if (m.includes("rate limit")) return "Demasiados intentos. Probá de nuevo en unos minutos.";
  return "Ocurrió un error. Probá de nuevo.";
}

function volver(ruta: string, tipo: "error" | "ok", mensaje: string): never {
  redirect(`${ruta}?${tipo}=${encodeURIComponent(mensaje)}`);
}

export async function signup(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    volver("/registro", "error", "El usuario debe tener entre 3 y 20 caracteres: letras, números o guion bajo.");
  }
  if (password.length < 8) {
    volver("/registro", "error", "La contraseña debe tener al menos 8 caracteres.");
  }
  if (password !== password2) {
    volver("/registro", "error", "Las contraseñas no coinciden.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) volver("/registro", "error", traducir(error.message));

  // Si la confirmación por email está activada, todavía no hay sesión
  if (!data.session) {
    volver("/ingresar", "ok", "Cuenta creada. Revisá tu email para confirmarla.");
  }

  redirect("/");
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) volver("/ingresar", "error", traducir(error.message));

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
