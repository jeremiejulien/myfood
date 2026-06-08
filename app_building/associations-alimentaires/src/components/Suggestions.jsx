export default function Suggestions({ suggestions, onSelect }) {
  if (!suggestions.length) {
    return (
      <div className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-gray-500">
        Aucun aliment ne correspond à votre recherche.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border divide-y divide-gray-100">
      {suggestions.map((item, index) => (
        <button
          key={`${item.category}-${item.label}-${index}`}
          type="button"
          onClick={() => onSelect(item)}
          className="block w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
