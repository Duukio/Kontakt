import Link from "next/link";

export const metadata = { title: "Privacidad - Kontakt" };

export default function PrivacidadPage() {
  return (
    <div className="box">
      <h2>Política de Privacidad</h2>
      <div className="box-body">
        <h1>Tu privacidad en Kontakt</h1>
        <p>En Kontakt nos tomamos la privacidad en serio:</p>
        <ul>
          <li>Tu contraseña se almacena de forma encriptada y segura utilizando la infraestructura de Supabase.</li>
          <li>No vendemos ni compartimos tus datos personales con terceros para publicidad.</li>
          <li>Las fotos que subas a tu perfil y los mensajes en los muros son visibles para los demás usuarios registrados.</li>
        </ul>
        <p style={{ marginTop: 14 }}>
          <Link className="btn" href="/">Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
