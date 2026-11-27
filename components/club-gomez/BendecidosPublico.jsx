import { NUMEROS_BENDECIDOS } from "@/lib/club-gomez/bendecidos";

export default function BendecidosPublico({ vendidos = [] }) {
  const salidos = new Set((vendidos || []).map(String));
  return (
    <section className="cg-bend" aria-label="Números bendecidos">
      <div className="cg-bend__inner">
        <p className="cg-bend__kicker">Premio adicional</p>
        <h2 className="cg-bend__title">Números bendecidos</h2>
        <p className="cg-bend__texto">
          Si al comprar te toca uno de estos números, ganas{" "}
          <strong>$1.000.000</strong> automáticamente.
          {salidos.size ? " Los tachados ya salieron." : ""}
        </p>
        <ul className="cg-bend__nums">
          {NUMEROS_BENDECIDOS.map((n) => {
            const fuera = salidos.has(n);
            return (
              <li key={n} className={fuera ? "is-tachado" : undefined} title={fuera ? "Ya salió" : undefined}>
                {n}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
