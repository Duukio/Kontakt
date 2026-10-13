import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCommunityAction } from "@/app/actions/communities";

export const metadata = { title: "Crear Comunidad - Kontakt" };

export default async function CrearComunidadPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const { error } = (await searchParams) ?? {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div className="box">
        <h2>Crear una nueva Comunidad (Estilo Orkut)</h2>
        <div className="box-body">
          {error && <div className="msg-error">{error}</div>}

          <form action={createCommunityAction}>
            <label htmlFor="name">Nombre de la comunidad:</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={3}
              maxLength={60}
              placeholder="Ej: Amantes del Winamp y MSN"
            />

            <label htmlFor="category">Categoría:</label>
            <select id="category" name="category" defaultValue="General">
              <option value="General">General</option>
              <option value="Música">Música &amp; Bandas</option>
              <option value="Computación">Computación &amp; Software</option>
              <option value="Videojuegos">Videojuegos</option>
              <option value="Cine y TV">Cine y TV</option>
              <option value="Humor">Humor</option>
            </select>

            <label htmlFor="avatar_url">URL de imagen o logo (opcional):</label>
            <input
              id="avatar_url"
              name="avatar_url"
              type="url"
              placeholder="https://..."
            />

            <label htmlFor="description">Descripción:</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={1000}
              required
              placeholder="¿De qué trata este grupo o qué temas se debaten acá?"
            />

            <p style={{ marginTop: 12 }}>
              <button type="submit">Crear comunidad</button>{" "}
              <Link href="/comunidades">Cancelar</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
