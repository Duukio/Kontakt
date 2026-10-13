import Link from "next/link";
import { login } from "@/app/auth/actions";

export const metadata = { title: "Ingresar - Kontakt" };

export default async function Ingresar({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;

  return (
    <div className="cols">
      <div className="col-main">
        <div className="box">
          <h2>Ingresar a Kontakt</h2>
          <div className="box-body">
            {error && <div className="msg-error">{error}</div>}
            {ok && <div className="msg-ok">{ok}</div>}
            <form action={login}>
              <label htmlFor="email">Email:</label>
              <input type="email" id="email" name="email" required />

              <label htmlFor="password">Contraseña:</label>
              <input type="password" id="password" name="password" required />

              <div style={{ marginTop: 6, fontSize: 10 }}>
                <Link href="/recuperar">¿Olvidaste tu contraseña?</Link>
              </div>

              <p style={{ marginTop: 10 }}>
                <button type="submit">Ingresar</button>
              </p>
            </form>
          </div>
        </div>
      </div>

      <div className="col-side">
        <div className="box">
          <h2>¿Primera vez?</h2>
          <div className="box-body">
            <p>
              <Link className="btn" href="/registro">¡Registrate gratis!</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
