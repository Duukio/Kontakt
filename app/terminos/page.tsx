import Link from "next/link";

export const metadata = { title: "Términos y Condiciones - Kontakt" };

export default function TerminosPage() {
  return (
    <div className="box">
      <h2>Términos y Condiciones de Uso</h2>
      <div className="box-body">
        <h1>Términos de servicio</h1>
        <p>Al utilizar Kontakt, aceptás las siguientes condiciones de convivencia:</p>
        <ul>
          <li>Tratá a todos los usuarios con respeto y buena onda.</li>
          <li>No subas contenido ofensivo, spam ni material protegido por derechos de autor de terceros.</li>
          <li>Sé responsable con la información y fotos que decidís compartir públicamente en tu perfil.</li>
        </ul>
        <p style={{ marginTop: 14 }}>
          <Link className="btn" href="/">Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
