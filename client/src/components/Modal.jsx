export function Modal({ titulo, onCerrar, children }) {
  return (
    <div className="fondo" onClick={onCerrar}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>{titulo}</h2>
          <button className="cerrar" onClick={onCerrar} aria-label="Cerrar">×</button>
        </header>
        {children}
      </div>
    </div>
  )
}
