import Link from "next/link";
import { signup } from "@/app/auth/actions";

export const metadata = { title: "Registrate - Kontakt" };

export default async function Registro({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="cols">
      <div className="col-main">
        <div className="box">
          <h2>Crear una cuenta</h2>
          <div className="box-body">
            {error && <div className="msg-error">{error}</div>}
            <form action={signup}>
              <label htmlFor="username">Nombre de usuario:</label>
              <input type="text" id="username" name="username" required maxLength={20} />

              <label htmlFor="email">Email:</label>
              <input type="email" id="email" name="email" required />

              <label htmlFor="password">Contraseña:</label>
              <input type="password" id="password" name="password" required minLength={8} />

              <label htmlFor="password2">Repetí la contraseña:</label>
              <input type="password" id="password2" name="password2" required minLength={8} />

              <p style={{ marginTop: 10 }}>
                <button type="submit">Registrarme</button>
              </p>
            </form>
          </div>
        </div>
      </div>

      <div className="col-side">
        <div className="box">
          <h2>¿Ya tenés cuenta?</h2>
          <div className="box-body">
            <p>
              <Link href="/ingresar">Ingresá acá</Link> para ver a tus amigos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
