"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function acceptFriendshipAction(formData: FormData) {
  const id = String(formData.get("friendship_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  await supabase
    .from("friendships")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", id)
    .eq("addressee_id", user.id);

  revalidatePath("/amigos");
  redirect("/amigos");
}

export async function removeFriendshipAction(formData: FormData) {
  const id = String(formData.get("friendship_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  await supabase
    .from("friendships")
    .delete()
    .eq("id", id)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  revalidatePath("/amigos");
  redirect("/amigos");
}
