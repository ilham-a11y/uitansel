import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react'
import { CATEGORY_COLOR, type Category } from '../lib/types'
import { initials } from '../lib/format'

/* ---------- Tombol ---------- */

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'light' | 'glass'
const variantClass: Record<Variant, string> = {
  primary: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700',
  secondary: 'bg-white text-emerald-800 ring-1 ring-slate-200 hover:bg-emerald-50 hover:ring-emerald-200',
  danger: 'bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700',
  ghost: 'text-emerald-700 hover:bg-emerald-50',
  light: 'bg-white text-emerald-800 shadow-xl shadow-black/10 hover:bg-emerald-50',
  glass: 'bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20',
}

export function Button({
  variant = 'primary',
  icon,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: ReactNode }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

/* ---------- Badge kategori ---------- */

const badgeStyle: Record<Category, { cls: string; dot: string }> = {
  Normal: { cls: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  'Risiko Sedang': { cls: 'bg-amber-100 text-amber-900', dot: 'bg-amber-500' },
  'Risiko Berat': { cls: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
}

export function Badge({ category, size = 'md' }: { category?: Category | null; size?: 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'px-4 py-2 text-base' : 'px-3 py-1.5 text-sm'
  if (!category) {
    return (
      <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-slate-100 font-semibold text-slate-500 ${sz}`}>
        Belum diklasifikasi
      </span>
    )
  }
  const s = badgeStyle[category]
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full font-bold ${s.cls} ${sz}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
      {category}
    </span>
  )
}

/* ---------- Kartu & judul ---------- */

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <section className={`rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70 ${className}`}>{children}</section>
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-emerald-600">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900 md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-lg leading-relaxed text-slate-500">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}

/* ---------- Form ---------- */

export const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 disabled:bg-slate-50'

export function Field({
  label,
  error,
  hint,
  required,
  children,
  className = '',
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-base font-bold text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-2 block text-sm font-semibold text-rose-600">{error}</span>
      ) : hint ? (
        <span className="mt-2 block text-sm text-slate-500">{hint}</span>
      ) : null}
    </label>
  )
}

/* ---------- Modal ---------- */

export function Modal({
  title,
  eyebrow,
  description,
  onClose,
  children,
  size = 'md',
  footer,
}: {
  title: string
  eyebrow?: string
  description?: string
  onClose: () => void
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  footer?: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const width = size === 'lg' ? 'max-w-4xl' : size === 'sm' ? 'max-w-md' : 'max-w-2xl'
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-fade-up sm:rounded-3xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-8">
          <div>
            {eyebrow && <p className="text-sm font-extrabold uppercase tracking-wider text-emerald-600">{eyebrow}</p>}
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-base text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X size={22} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-6 sm:px-8">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-6 py-5 sm:px-8">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  busy,
}: {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={busy}
            icon={busy ? <Loader2 className="animate-spin" size={18} /> : undefined}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-lg leading-relaxed text-slate-600">{message}</p>
    </Modal>
  )
}

/* ---------- Pendukung ---------- */

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">{icon}</div>
      <h3 className="mt-5 text-xl font-extrabold text-slate-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-base text-slate-500">{text}</p>
    </div>
  )
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'lg' ? 'h-16 w-16 text-xl' : size === 'sm' ? 'h-11 w-11 text-sm' : 'h-12 w-12 text-base'
  return (
    <div className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 font-extrabold text-white ${s}`}>
      {initials(name)}
    </div>
  )
}

export function Toast({ message, tone }: { message: string; tone: 'success' | 'error' }) {
  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-[70] flex max-w-md items-center gap-3 rounded-2xl px-5 py-4 text-base font-semibold text-white shadow-2xl animate-fade-up ${
        tone === 'error' ? 'bg-rose-600' : 'bg-slate-900'
      }`}
    >
      {tone === 'error' ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} className="text-emerald-400" />}
      {message}
    </div>
  )
}

export function Donut({
  segments,
  total,
  label,
}: {
  segments: { name: string; value: number; color: string }[]
  total: number
  label: string
}) {
  const r = 72
  const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="relative h-56 w-56 shrink-0">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" role="img" aria-label={`${label}: ${total}`}>
        <circle cx="90" cy="90" r={r} fill="none" stroke="#e2e8f0" strokeWidth="20" />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * circ
            const el = (
              <circle
                key={s.name}
                cx="90"
                cy="90"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="20"
                strokeDasharray={`${Math.max(len - 2, 0)} ${circ}`}
                strokeDashoffset={-offset}
              />
            )
            offset += len
            return el
          })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-4xl font-extrabold text-slate-900">{total}</p>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

export const categoryColor = (c: Category) => CATEGORY_COLOR[c]
