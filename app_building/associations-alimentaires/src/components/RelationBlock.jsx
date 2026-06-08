function groupKey(entry, index) {
  if (typeof entry === "string") return entry
  return entry.category ?? entry.key ?? entry.id ?? `g-${index}`
}

function groupLabel(entry, index) {
  if (typeof entry === "string") return entry
  return (
    entry.label ??
    entry.title ??
    entry.name ??
    groupKey(entry, index)
  )
}

const typeStyles = {
  compatible: "border-emerald-200 bg-emerald-50 text-emerald-900",
  neutre: "border-gray-200 bg-gray-50 text-gray-800",
  incompatible: "border-red-200 bg-red-50 text-red-900",
}

export default function RelationBlock({
  title,
  groups,
  type,
  onOpenCategory,
}) {
  if (!groups?.length) return null

  return (
    <div>
      <div className="text-xs uppercase text-gray-400">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {groups.map((entry, index) => {
          const key = groupKey(entry, index)
          const label = groupLabel(entry, index)
          return (
            <button
              key={`${key}-${index}`}
              type="button"
              onClick={() => onOpenCategory(key)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${typeStyles[type] ?? typeStyles.neutre}`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
