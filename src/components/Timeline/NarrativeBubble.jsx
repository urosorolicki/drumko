export default function NarrativeBubble({ narrative }) {
  if (!narrative) return null
  return (
    <div className="mx-3 mb-3 px-4 py-2.5 rounded-2xl bg-primary/8 border border-primary/20">
      <p className="text-sm font-semibold text-primary leading-snug">{narrative}</p>
    </div>
  )
}
