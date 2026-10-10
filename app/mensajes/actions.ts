"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendMessageAction(formData: FormData) {
  const recipientUsername = String(formData.get("para") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!recipientUsername) {
    redirect("/mensajes?carpeta=redactar&error=" + encodeURIComponent("Debes indicar a quién enviar el mensaje."));
  }
  if (!body) {
    redirect(
      `/mensajes?carpeta=redactar&para=${encodeURIComponent(recipientUsername)}&error=` +
        encodeURIComponent("El cuerpo del mensaje no puede estar vacío.")
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  // Buscar destinatario por nombre de usuario
  const { data: recipient } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", recipientUsername)
    .single();

  if (!recipient) {
    redirect(
      `/mensajes?carpeta=redactar&error=` +
        encodeURIComponent(`El usuario @${recipientUsername} no existe.`)
    );
  }

  if (recipient.id === user.id) {
    redirect(
      "/mensajes?carpeta=redactar&error=" +
        encodeURIComponent("No podés enviarte mensajes privados a vos mismo.")
    );
  }

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    recipient_id: recipient.id,
    subject: subject || "(Sin asunto)",
    body,
  });

  if (error) {
    redirect(
      "/mensajes?carpeta=redactar&error=" +
        encodeURIComponent("No se pudo enviar el mensaje. Probá de nuevo.")
    );
  }

  revalidatePath("/mensajes");
  redirect("/mensajes?carpeta=enviados&ok=" + encodeURIComponent("¡Mensaje enviado con éxito!"));
}

export async function deleteMessageAction(formData: FormData) {
  const messageId = String(formData.get("message_id") ?? "");
  const carpeta = String(formData.get("carpeta") ?? "entrada");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { data: msg } = await supabase
    .from("messages")
    .select("sender_id, recipient_id")
    .eq("id", messageId)
    .single();

  if (msg) {
    if (msg.recipient_id === user.id) {
      await supabase
        .from("messages")
        .update({ deleted_by_recipient: true })
        .eq("id", messageId);
    } else if (msg.sender_id === user.id) {
      await supabase
        .from("messages")
        .update({ deleted_by_sender: true })
        .eq("id", messageId);
    }
  }

  revalidatePath("/mensajes");
  redirect(`/mensajes?carpeta=${carpeta}&ok=` + encodeURIComponent("Mensaje eliminado."));
}
