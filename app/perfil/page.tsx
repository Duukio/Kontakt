import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MiPerfil() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/");

  redirect(`/u/${profile.username}`);
}
