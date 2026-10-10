import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "./actions";
import AvatarUploader from "./AvatarUploader";
import BannerUploader from "./BannerUploader";

export const metadata = { title: "Editar perfil - Kontakt" };

export default async function EditarPerfil({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/");

  return (
    <div className="cols">
      <div className="col-side">
        <div className="box">
          <h2>Foto de perfil</h2>
          <div className="box-body">
            <AvatarUploader
              userId={user.id}
              avatarUrl={profile.avatar_url}
              inicial={profile.display_name.charAt(0)}
            />
          </div>
        </div>
      </div>

      <div className="col-main">
        {/* Banner de perfil */}
        <div className="box">
          <h2>Banner de perfil</h2>
          <div className="box-body">
            <BannerUploader
              userId={user.id}
              bannerUrl={profile.banner_url ?? null}
            />
          </div>
        </div>

        <div className="box">
          <h2>Editar datos personales</h2>
          <div className="box-body">
            {error && <div className="msg-error">{error}</div>}

            <form action={updateProfile}>
              <label htmlFor="display_name">Nombre:</label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                required
                maxLength={40}
                defaultValue={profile.display_name}
              />

              <label htmlFor="bio">Sobre mí:</label>
              <textarea id="bio" name="bio" rows={4} maxLength={500} defaultValue={profile.bio ?? ""} />

              <label htmlFor="location">Vivo en:</label>
              <input
                type="text"
                id="location"
                name="location"
                maxLength={60}
                defaultValue={profile.location ?? ""}
              />

              <label htmlFor="relationship_status">Relación:</label>
              <select
                id="relationship_status"
                name="relationship_status"
                defaultValue={profile.relationship_status ?? ""}
              >
                <option value="">(sin especificar)</option>
                <option value="soltero">Soltero/a</option>
                <option value="en_pareja">En pareja</option>
                <option value="casado">Casado/a</option>
                <option value="complicado">Es complicado</option>
              </select>

              <label htmlFor="interests">Intereses:</label>
              <textarea
                id="interests"
                name="interests"
                rows={3}
                maxLength={500}
                defaultValue={profile.interests ?? ""}
              />

              <label htmlFor="custom_css">CSS personalizado:</label>
              <textarea
                id="custom_css"
                name="custom_css"
                rows={8}
                maxLength={5000}
                defaultValue={profile.custom_css ?? ""}
                style={{ fontFamily: "Courier New, monospace" }}
              />
              <p className="ayuda">
                Se aplica solo dentro de tu perfil. Ejemplo: <code>.box &gt; h2 {"{ background: #c0392b; }"}</code>.
                No se permite url(), @import, comentarios, comillas sin cerrar, &amp; ni los símbolos &lt; &gt;.
              </p>

              <p style={{ marginTop: 10 }}>
                <button type="submit">Guardar cambios</button>{" "}
                <Link href={`/u/${profile.username}`}>Cancelar</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
