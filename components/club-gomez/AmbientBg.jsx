/** Fondo ambient Club Gómez — capa fija detrás del contenido */
export default function AmbientBg() {
  return (
    <div className="cg-ambient" aria-hidden="true">
      <div className="cg-ambient__base" />
      <div className="cg-ambient__aurora" />
      <div className="cg-ambient__orb cg-ambient__orb--a" />
      <div className="cg-ambient__orb cg-ambient__orb--b" />
      <div className="cg-ambient__orb cg-ambient__orb--c" />
      <div className="cg-ambient__beams">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="cg-ambient__grid" />
      <div className="cg-ambient__smoke" />
      <div className="cg-ambient__grain" />
    </div>
  );
}
