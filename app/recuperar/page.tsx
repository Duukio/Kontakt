import Link from "next/link";
import { resetPasswordAction } from "./actions";

export const metadata = { title: "Recuperar contraseña - Kontakt" };

export default async function RecuperarPage({
  searchParams,
}: {
  searchParams?: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = (await searchParams) ?? {};

  return (
    <div className="cols">
      <div className="col-main">
        <div className="box">
          <h2>Recuperar contraseña</h2>
          <div className="box-body">
            {error && <div className="msg-error">{error}</div>}
            {ok && <div className="msg-ok">{ok}</div>}

            <p>
              Ingresá el correo electrónico con el que te registraste. Te enviaremos un enlace seguro para restablecer tu clave.
            </p>

            <form action={resetPasswordAction}>
              <label htmlFor="email">Tu email registrado:</label>
              <input type="email" id="email" name="email" required placeholder="tu@email.com" />

              <p style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                <button type="submit">Enviar enlace de recuperación</button>
                <Link href="/ingresar">Volver al ingreso</Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <div className="col-side">
        <div className="box">
          <h2>Ayuda</h2>
          <div className="box-body">
            <p className="ayuda">
              Revisá tu carpeta de correo no deseado (Spam) si no ves el mensaje en tu bandeja de entrada en los próximos minutos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
