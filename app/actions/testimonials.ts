"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitTestimonialAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const recipientId = String(formData.get("recipient_id") ?? "");
  const recipientUsername = String(formData.get("recipient_username") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!recipientId || body.length < 2 || body.length > 1500) return;

  await supabase.from("testimonials").insert({
    author_id: user.id,
    recipient_id: recipientId,
    body,
    status: "accepted", // Visible directamente o aceptado
  });

  // Notificar al dueño del perfil
  await supabase.from("notifications").insert({
    user_id: recipientId,
    actor_id: user.id,
    type: "wall_post",
  });

  revalidatePath(`/u/${recipientUsername}`);
}

export async function deleteTestimonialAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const testimonialId = String(formData.get("testimonial_id") ?? "");
  const username = String(formData.get("username") ?? "");

  await supabase
    .from("testimonials")
    .delete()
    .eq("id", testimonialId)
    .or(`author_id.eq.${user.id},recipient_id.eq.${user.id}`);

  revalidatePath(`/u/${username}`);
}
