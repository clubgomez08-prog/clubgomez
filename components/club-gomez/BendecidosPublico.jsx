import { NUMEROS_BENDECIDOS } from "@/lib/club-gomez/bendecidos";

export default function BendecidosPublico() {
  return (
    <section className="cg-bend" aria-label="Números bendecidos">
      <div className="cg-bend__inner">
        <p className="cg-bend__kicker">Premio adicional</p>
        <h2 className="cg-bend__title">Números bendecidos</h2>
        <p className="cg-bend__texto">
          Si al comprar te toca uno de estos números, ganas{" "}
          <strong>$1.000.000</strong> automáticamente.
        </p>
        <ul className="cg-bend__nums">
          {NUMEROS_BENDECIDOS.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
