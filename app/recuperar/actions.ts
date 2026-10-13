"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function resetPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/recuperar?error=" + encodeURIComponent("Por favor ingresá un email válido."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    redirect("/recuperar?error=" + encodeURIComponent(`No se pudo enviar el email: ${error.message}`));
  }

  redirect(
    "/recuperar?ok=" +
      encodeURIComponent("Te enviamos las instrucciones a tu correo para restablecer la contraseña.")
  );
}
