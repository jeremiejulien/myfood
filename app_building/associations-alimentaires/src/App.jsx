import { useMemo, useState } from "react"
import FoodJournalView from "./components/FoodJournalView.jsx"
import { alimentsBruts } from "./data/alimentsBruts.js"

const compatibility = {
  fruits_acides: { compatible: ["fruits_acides", "fruits_mi_acides"], neutre: ["fruits_seches", "fruits_neutres", "miel", "proteines_maigres", "legumes_amidon_moyen", "eau"], incompatible: ["sucreries", "amidons", "legumes_secs", "proteines_grasses", "lait", "lipides", "legumes_amidon_faible", "sel"] },
  fruits_mi_acides: { compatible: ["fruits_acides", "fruits_mi_acides", "fruits_doux"], neutre: ["fruits_seches", "fruits_neutres", "miel", "proteines_maigres", "legumes_amidon_moyen", "eau"], incompatible: ["sucreries", "amidons", "legumes_secs", "proteines_grasses", "lait", "lipides", "legumes_amidon_faible", "sel"] },
  fruits_doux: { compatible: ["fruits_mi_acides", "fruits_doux"], neutre: ["fruits_seches", "fruits_neutres", "miel", "sucreries", "proteines_maigres", "lipides", "legumes_amidon_faible", "eau"], incompatible: ["amidons", "legumes_secs", "proteines_grasses", "lait", "legumes_amidon_moyen", "sel"] },
  fruits_seches: { compatible: ["fruits_seches", "fruits_doux"], neutre: ["fruits_acides", "fruits_mi_acides", "fruits_neutres", "miel", "sucreries", "proteines_maigres", "lipides", "legumes_amidon_faible", "eau"], incompatible: ["amidons", "legumes_secs", "proteines_grasses", "lait", "legumes_amidon_moyen", "sel"] },
  fruits_neutres: { compatible: ["fruits_neutres"], neutre: ["fruits_acides", "fruits_mi_acides", "fruits_doux", "fruits_seches", "miel", "sucreries", "proteines_maigres", "lipides", "legumes_amidon_faible", "eau"], incompatible: ["amidons", "legumes_secs", "proteines_grasses", "lait", "legumes_amidon_moyen", "sel"] },
  miel: { compatible: ["fruits_doux", "fruits_mi_acides"], neutre: ["fruits_acides", "fruits_seches", "fruits_neutres", "sucreries", "proteines_maigres", "lipides", "legumes_amidon_faible", "eau"], incompatible: ["amidons", "legumes_secs", "proteines_grasses", "lait", "legumes_amidon_moyen", "sel"] },
  sucreries: { compatible: ["sucreries"], neutre: ["fruits_doux", "fruits_seches", "fruits_neutres", "miel"], incompatible: ["fruits_acides", "fruits_mi_acides", "amidons", "legumes_secs", "proteines_maigres", "proteines_grasses", "lait", "lipides", "legumes_amidon_faible", "legumes_amidon_moyen", "eau", "sel"] },
  amidons: { compatible: ["amidons", "legumes_amidon_faible", "legumes_amidon_moyen"], neutre: ["legumes_secs", "eau"], incompatible: ["fruits_acides", "fruits_mi_acides", "fruits_doux", "fruits_seches", "fruits_neutres", "miel", "sucreries", "proteines_maigres", "proteines_grasses", "lait", "lipides", "sel"] },
  legumes_secs: { compatible: ["legumes_secs", "legumes_amidon_faible"], neutre: ["amidons", "proteines_maigres"], incompatible: ["fruits_acides", "fruits_mi_acides", "fruits_doux", "fruits_seches", "fruits_neutres", "miel", "sucreries", "proteines_grasses", "lait", "lipides", "sel"] },
  proteines_maigres: { compatible: ["proteines_maigres", "legumes_amidon_faible"], neutre: ["fruits_acides", "fruits_mi_acides", "fruits_doux", "fruits_seches", "fruits_neutres", "miel", "legumes_secs"], incompatible: ["sucreries", "amidons", "proteines_grasses", "lait", "lipides", "legumes_amidon_moyen", "sel"] },
  proteines_grasses: { compatible: ["proteines_grasses", "legumes_amidon_faible"], neutre: ["eau"], incompatible: ["fruits_acides", "fruits_mi_acides", "fruits_doux", "fruits_seches", "fruits_neutres", "miel", "sucreries", "amidons", "legumes_secs", "proteines_maigres", "lait", "lipides", "legumes_amidon_moyen", "sel"] },
  lait: { compatible: ["lait"], neutre: ["eau"], incompatible: ["fruits_acides", "fruits_mi_acides", "fruits_doux", "fruits_seches", "fruits_neutres", "miel", "sucreries", "amidons", "legumes_secs", "proteines_maigres", "proteines_grasses", "lipides", "legumes_amidon_faible", "legumes_amidon_moyen", "sel"] },
  lipides: { compatible: ["lipides", "legumes_amidon_faible"], neutre: ["fruits_doux", "fruits_seches", "fruits_neutres", "miel", "eau"], incompatible: ["fruits_acides", "fruits_mi_acides", "sucreries", "amidons", "legumes_secs", "proteines_maigres", "proteines_grasses", "lait", "legumes_amidon_moyen", "sel"] },
  legumes_amidon_faible: { compatible: ["amidons", "legumes_secs", "proteines_maigres", "proteines_grasses", "lipides", "legumes_amidon_faible"], neutre: ["fruits_doux", "fruits_seches", "fruits_neutres", "miel", "eau"], incompatible: ["fruits_acides", "fruits_mi_acides", "sucreries", "sel"] },
  legumes_amidon_moyen: { compatible: ["amidons", "legumes_amidon_moyen"], neutre: ["fruits_acides", "fruits_mi_acides", "eau"], incompatible: ["fruits_doux", "fruits_seches", "fruits_neutres", "miel", "sucreries", "legumes_secs", "proteines_maigres", "proteines_grasses", "lait", "lipides", "legumes_amidon_faible", "sel"] },
  eau: { compatible: ["eau"], neutre: ["fruits_acides", "fruits_mi_acides", "fruits_doux", "fruits_seches", "fruits_neutres", "miel", "amidons", "proteines_grasses", "lait", "lipides", "legumes_amidon_faible", "legumes_amidon_moyen"], incompatible: ["sucreries", "legumes_secs", "sel"] },
  sel: { compatible: ["sel"], neutre: [], incompatible: ["fruits_acides", "fruits_mi_acides", "fruits_doux", "fruits_seches", "fruits_neutres", "miel", "sucreries", "amidons", "legumes_secs", "proteines_maigres", "proteines_grasses", "lait", "lipides", "legumes_amidon_faible", "legumes_amidon_moyen", "eau"] },
}

const labels = {
  fruits_acides: "Fruits acides",
  fruits_mi_acides: "Fruits mi-acides",
  fruits_doux: "Fruits doux",
  fruits_seches: "Fruits séchés",
  fruits_neutres: "Fruits neutres",
  miel: "Miel",
  sucreries: "Sucreries",
  amidons: "Amidons",
  legumes_secs: "Légumes secs",
  proteines_maigres: "Protéines maigres",
  proteines_grasses: "Protéines grasses",
  lait: "Lait",
  lipides: "Lipides",
  legumes_amidon_faible: "Légumes amidon faible",
  legumes_amidon_moyen: "Légumes amidon moyen",
  eau: "Eau",
  sel: "Sel",
  autres: "À classer / à vérifier",
}

const relationStyles = {
  compatible: "bg-green-50 border-green-200 text-green-900",
  neutre: "bg-amber-50 border-amber-200 text-amber-900",
  incompatible: "bg-red-50 border-red-200 text-red-900",
  unknown: "bg-gray-50 border-gray-200 text-gray-700",
}

function normalizeSearch(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’.,()[\]{}]/g, "")
    .replace(/[-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeCompact(str) {
  return normalizeSearch(str).replace(/\s+/g, "_")
}

function scoreFood(food, query) {
  const q = normalizeSearch(query)
  if (!q) return 0

  const compactQuery = normalizeCompact(q)
  const candidates = [food.label, food.id, ...(food.aliases || []), ...(food.search_terms || [])]
    .filter(Boolean)
    .map(normalizeSearch)

  let best = 0

  for (const value of candidates) {
    if (value === q) best = Math.max(best, 100)
    else if (value.startsWith(q)) best = Math.max(best, 80)
    else if (value.includes(q)) best = Math.max(best, 55)

    const compactValue = normalizeCompact(value)
    if (compactValue === compactQuery) best = Math.max(best, 100)
    else if (compactValue.startsWith(compactQuery)) best = Math.max(best, 82)
    else if (compactValue.includes(compactQuery)) best = Math.max(best, 60)
  }

  return best
}

function searchFoods(query, limit = 8) {
  if (!String(query || "").trim()) return []

  return alimentsBruts
    .map((food) => ({ food, score: scoreFood(food, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.food.label.localeCompare(b.food.label))
    .slice(0, limit)
    .map((item) => item.food)
}

function searchFoodsAndCategories(query, limit = 8) {
  if (!String(query || "").trim()) return []

  const q = normalizeSearch(query)
  const results = []

  // Search categories
  const categoryMatches = Object.entries(labels)
    .map(([id, label]) => {
      const labelNorm = normalizeSearch(label)
      let score = 0
      if (labelNorm === q) score = 150
      else if (labelNorm.startsWith(q)) score = 120
      else if (labelNorm.includes(q)) score = 80
      return { type: 'category', id, label, score }
    })
    .filter((item) => item.score > 0)

  categoryMatches.forEach((item) => results.push(item))

  // Search foods
  alimentsBruts
    .forEach((food) => {
      const score = scoreFood(food, query)
      if (score > 0) results.push({ type: 'food', id: food.id, label: food.label, category: food.category, score, requires_manual_review: food.requires_manual_review })
    })

  // Sort by score, then by label
  results.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))

  return results.slice(0, limit)
}

function getFoodsByCategory(category) {
  return alimentsBruts
    .filter((food) => food.category === category)
    .sort((a, b) => a.label.localeCompare(b.label))
}

function getRelationBetweenCategories(sourceCategory, targetCategory) {
  const rules = compatibility[sourceCategory]
  if (!rules || !targetCategory) return "unknown"
  if (rules.compatible.includes(targetCategory)) return "compatible"
  if ((rules.neutre || []).includes(targetCategory)) return "neutre"
  if (rules.incompatible.includes(targetCategory)) return "incompatible"
  return "unknown"
}

function runSelfTests() {
  const tests = [
    { name: "normalise les accents", actual: normalizeSearch("Fécule de maïs"), expected: "fecule de mais" },
    { name: "base CIQUAL chargée", actual: alimentsBruts.length > 2000, expected: true },
    { name: "trouve banane", actual: searchFoods("banane", 1)[0]?.label.toLowerCase().includes("banane"), expected: true },
    { name: "trouve riz", actual: searchFoods("riz basmati", 1).length > 0, expected: true },
    { name: "trouve lentille", actual: searchFoods("lentille verte", 1)[0]?.category, expected: "legumes_secs" },
    { name: "trouve huile d'olive", actual: searchFoods("huile olive", 1)[0]?.category, expected: "lipides" },
    { name: "trouve fromage", actual: searchFoods("camembert", 1)[0]?.category, expected: "proteines_grasses" },
    { name: "trouve poulet", actual: searchFoods("poulet", 1)[0]?.category, expected: "proteines_maigres" },
    { name: "catégorie amidons non vide", actual: getFoodsByCategory("amidons").length > 0, expected: true },
    { name: "catégorie légumes secs non vide", actual: getFoodsByCategory("legumes_secs").length > 0, expected: true },
    { name: "relation miel -> fruits acides neutre", actual: getRelationBetweenCategories("miel", "fruits_acides"), expected: "neutre" },
    { name: "relation amidons -> fruits doux incompatible", actual: getRelationBetweenCategories("amidons", "fruits_doux"), expected: "incompatible" },
  ]

  for (const test of tests) {
    console.assert(test.actual === test.expected, `[test failed] ${test.name}: expected ${test.expected}, got ${test.actual}`)
  }
}

runSelfTests()

function CategoryDrawer({ category, onClose, onSelectFood }) {
  const foods = category ? getFoodsByCategory(category) : []
  const title = category ? labels[category] || category : ""

  return (
    <div className={`fixed inset-0 z-50 ${category ? "pointer-events-auto" : "pointer-events-none"}`}>
      <button
        type="button"
        aria-label="Fermer la liste"
        onClick={onClose}
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${category ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        className={`absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out ${category ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Aliments de la catégorie ${title}`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase text-gray-400">Catégorie</div>
                <h2 className="mt-1 text-xl font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-gray-500">{foods.length} aliment{foods.length > 1 ? "s" : ""}</p>
              </div>
              <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center text-xl leading-none text-gray-500 hover:text-gray-950" aria-label="Fermer la liste">✕</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {foods.length ? (
              <div className="space-y-2">
                {foods.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectFood(item)
                      onClose()
                    }}
                    className="w-full rounded-2xl border p-3 text-left hover:bg-gray-50"
                  >
                    <span className="block font-medium">{item.label}</span>
                    {item.requires_manual_review && <span className="mt-1 block text-xs text-gray-500">À vérifier</span>}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">Aucun aliment renseigné dans cette catégorie pour le moment.</div>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}

function RelationBlock({ title, groups = [], type, onOpenCategory }) {
  const icons = { compatible: "✅", neutre: "🟡", incompatible: "❌" }

  return (
    <div className={`rounded-2xl border p-4 ${relationStyles[type] || relationStyles.unknown}`}>
      <div className="flex items-center gap-2 font-medium">
        <span className="text-base">{icons[type]}</span>
        <span>{title}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {groups.length ? (
          groups.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => onOpenCategory(group)}
              className="rounded-full border bg-white/70 px-3 py-1 text-xs font-medium shadow-sm hover:bg-white"
            >
              {labels[group] || group}
            </button>
          ))
        ) : (
          <span className="text-sm">Aucune donnée</span>
        )}
      </div>
    </div>
  )
}

function Suggestions({ suggestions, onSelect }) {
  if (!suggestions.length) return null

  return (
    <div className="rounded-2xl border bg-white p-2 text-sm shadow-sm">
      {suggestions.map((item) => (
        <button
          key={`${item.type}-${item.id}`}
          type="button"
          onClick={() => {
            if (item.type === 'category') {
              onSelect({ type: 'category', id: item.id, label: item.label, category: item.id })
            } else {
              onSelect(item)
            }
          }}
          className={`block w-full rounded-xl px-3 py-2 text-left hover:bg-gray-50 ${item.type === 'category' ? 'border-l-4 border-blue-400' : ''}`}
        >
          <div className="flex items-center gap-2">
            {item.type === 'category' && <span className="text-lg">📂</span>}
            <span className="block font-medium">{item.label}</span>
          </div>
          {item.type === 'food' && <span className="block text-xs text-gray-500">{labels[item.category] || item.category}</span>}
          {item.type === 'category' && <span className="block text-xs text-blue-600">Catégorie</span>}
        </button>
      ))}
    </div>
  )
}

export default function FoodPairingApp() {
  const [activeView, setActiveView] = useState("associations")
  const [query, setQuery] = useState("")
  const [selectedFood, setSelectedFood] = useState(null)
  const [compareQuery, setCompareQuery] = useState("")
  const [selectedComparisonFood, setSelectedComparisonFood] = useState(null)
  const [openCategory, setOpenCategory] = useState(null)

  const suggestions = useMemo(() => searchFoodsAndCategories(query), [query])
  const comparisonSuggestions = useMemo(() => searchFoodsAndCategories(compareQuery), [compareQuery])

  // Get first food/category from suggestions (prefer food, fallback to category)
  const firstFoodFromSuggestions = suggestions.find((item) => item.type === 'food')
  const firstCategoryFromSuggestions = suggestions.find((item) => item.type === 'category')
  const food = selectedFood || firstFoodFromSuggestions || (firstCategoryFromSuggestions ? { type: 'category', id: firstCategoryFromSuggestions.id, label: firstCategoryFromSuggestions.label, category: firstCategoryFromSuggestions.id } : null)
  const rules = food ? compatibility[food.category || food.id] : null
  
  const firstComparisonFood = comparisonSuggestions.find((item) => item.type === 'food')
  const firstComparisonCategory = comparisonSuggestions.find((item) => item.type === 'category')
  const comparisonFood = selectedComparisonFood || firstComparisonFood || (firstComparisonCategory ? { type: 'category', id: firstComparisonCategory.id, label: firstComparisonCategory.label, category: firstComparisonCategory.id } : null)
  const comparisonRelation = food && comparisonFood ? getRelationBetweenCategories(food.category || food.id, comparisonFood.category || comparisonFood.id) : null

  function selectMainFood(item) {
    setSelectedFood(item)
    setQuery(item.label)
  }

  function clearMainFood() {
    setQuery("")
    setSelectedFood(null)
    setCompareQuery("")
    setSelectedComparisonFood(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-12 text-gray-950 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="space-y-4 pt-4">
          <h1 className="text-2xl font-semibold tracking-tight">Associations alimentaires</h1>
          <p className="text-sm text-gray-500">
            Recherche les associations entre aliments ou tiens un journal personnel de tolérance.
          </p>
          <nav className="grid grid-cols-2 rounded-2xl border bg-white p-1 text-sm font-medium shadow-sm">
            <button
              type="button"
              onClick={() => setActiveView("associations")}
              className={`rounded-xl px-3 py-2 ${activeView === "associations" ? "bg-gray-950 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Associations
            </button>
            <button
              type="button"
              onClick={() => setActiveView("journal")}
              className={`rounded-xl px-3 py-2 ${activeView === "journal" ? "bg-gray-950 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Journal
            </button>
          </nav>
        </header>

        {activeView === "associations" ? (
          <div className="mx-auto max-w-lg space-y-5">
            <section className="space-y-2">
              <label className="text-sm font-medium" htmlFor="food-search">Aliment principal</label>
              <div className="relative mt-2">
                <input
                  id="food-search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setSelectedFood(null)
                  }}
                  placeholder="Ex : banane, riz complet, fromage blanc, amidons"
                  className="w-full rounded-2xl border px-4 py-3 pr-11 text-base outline-none focus:ring-2 focus:ring-gray-200"
                />
                {!!query && (
                  <button
                    type="button"
                    aria-label="Effacer l’aliment principal"
                    onClick={clearMainFood}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                  >
                    ✕
                  </button>
                )}
              </div>
              {!!query.trim() && !selectedFood && <Suggestions suggestions={suggestions} onSelect={selectMainFood} />}
              {!!query.trim() && suggestions.length === 0 && <div className="text-sm text-gray-500">Aucun aliment ou catégorie trouvé.</div>}
            </section>

            {food && rules && (
              <section className="space-y-5 rounded-3xl border p-5 shadow-sm">
                <div>
                  <div className="text-xs uppercase text-gray-400">{food.type === 'category' ? '📂 Catégorie' : 'Aliment'}</div>
                  <div className="mt-1 font-semibold">{food.label}</div>
                  {food.type === 'food' && <div className="mt-1 text-sm text-gray-500">{labels[food.category] || food.category}</div>}
                </div>

                {food.requires_manual_review && (
                  <div className="rounded-2xl bg-gray-50 p-3 text-sm text-gray-600">Cet aliment est marqué comme “à vérifier”. Sa catégorie doit être validée avant de donner une association fiable.</div>
                )}

                <div className="space-y-3">
                  <RelationBlock title="Compatible avec" groups={rules.compatible} type="compatible" onOpenCategory={setOpenCategory} />
                  <RelationBlock title="Neutre avec" groups={rules.neutre} type="neutre" onOpenCategory={setOpenCategory} />
                  <RelationBlock title="À éviter avec" groups={rules.incompatible} type="incompatible" onOpenCategory={setOpenCategory} />
                </div>
              </section>
            )}

            {food && (
              <section className="space-y-4 rounded-3xl border p-5">
                <div>
                  <h2 className="font-semibold">Tester une association</h2>
                  <p className="mt-1 text-sm text-gray-500">Compare {food.label} avec un deuxième aliment.</p>
                </div>

                <input
                  value={compareQuery}
                  onChange={(event) => {
                    setCompareQuery(event.target.value)
                    setSelectedComparisonFood(null)
                  }}
                  placeholder="Ex : miel, pomme de terre, lait"
                  className="w-full rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-gray-200"
                />

                {!!compareQuery.trim() && !selectedComparisonFood && <Suggestions suggestions={comparisonSuggestions} onSelect={(item) => {
                  setSelectedComparisonFood(item)
                  setCompareQuery(item.label)
                }} />}

                {comparisonFood && comparisonRelation && (
                  <div className={`rounded-2xl border p-4 text-sm ${relationStyles[comparisonRelation] || relationStyles.unknown}`}>
                    <div className="font-medium">{food.label} + {comparisonFood.label}</div>
                    <div className="mt-1">Relation : {comparisonRelation === "compatible" ? "compatible" : comparisonRelation === "neutre" ? "neutre" : comparisonRelation === "incompatible" ? "à éviter" : "inconnue"}</div>
                  </div>
                )}
              </section>
            )}
          </div>
        ) : (
          <FoodJournalView searchFoods={searchFoods} />
        )}
      </div>

      <CategoryDrawer category={openCategory} onClose={() => setOpenCategory(null)} onSelectFood={selectMainFood} />
    </div>
  )
}
