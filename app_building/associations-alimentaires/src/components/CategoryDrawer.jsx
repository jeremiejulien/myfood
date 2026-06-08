import { getFoodsByCategory } from "../utils/search"

export default function CategoryDrawer({
  category,
  aliments,
  onClose,
  onSelectFood,
}) {
  if (!category) return null

  const foods = getFoodsByCategory(aliments, category)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fermer"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[min(70vh,520px)] w-full max-w-md flex-col rounded-t-3xl border bg-white shadow-lg sm:rounded-3xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="text-sm font-semibold capitalize">{category}</div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-2 py-2">
          {!foods.length ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              Aucun aliment dans cette catégorie.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {foods.map((f, index) => (
                <li key={`${f.label}-${index}`}>
                  <button
                    type="button"
                    onClick={() => onSelectFood(f)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
                  >
                    {f.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
