'use client'
import { X } from 'lucide-react'

/**
 * Modal genérico reutilizável para formulários de adição em todas as abas.
 * Props:
 *   title      – título do modal
 *   onClose    – função para fechar
 *   onSubmit   – função chamada ao confirmar
 *   children   – campos do formulário
 */
export default function AddModal({ title, onClose, onSubmit, children }) {
  const handleBackdropClick = e => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div
        className="modal-box glass-strong rounded-2xl w-full max-w-lg mx-4"
        style={{ border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/8">
          <h3 className="font-syne font-700 text-lg text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {children}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={onSubmit} className="btn-primary">Adicionar</button>
        </div>
      </div>
    </div>
  )
}

/**
 * Campo de formulário com label e input glassmorphism.
 */
export function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
