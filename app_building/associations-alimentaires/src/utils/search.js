export function normalizeSearch(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’.,()[\]{}]/g, "")
    .replace(/[-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function searchFoods(aliments, query, limit = 8) {
  const q = normalizeSearch(query)

  if (!q) return []

  return aliments
    .filter((food) => {
      const values = [
        food.label,
        ...(food.aliases || []),
        ...(food.search_terms || []),
      ]

      return values.some((value) =>
        normalizeSearch(value).includes(q),
      )
    })
    .slice(0, limit)
}

export function getFoodsByCategory(aliments, category) {
  return aliments.filter(
    (food) => food.category === category,
  )
}
