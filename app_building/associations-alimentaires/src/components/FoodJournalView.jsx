import { useEffect, useMemo, useState } from "react"

const APP_ENV = import.meta.env.MODE === "production" ? "prod" : import.meta.env.MODE
const LEGACY_STORAGE_KEY = "assocAlim.foodJournal.v1"
const STORAGE_KEY = `${LEGACY_STORAGE_KEY}.${APP_ENV}`

const symptomTags = [
  "Ballonnement",
  "Douleur ventre",
  "Fatigue",
  "Nausée",
  "Transit",
  "Peau",
  "Maux de tête",
  "Humeur",
  "Sommeil",
  "Autre",
]

const symptomDelays = ["Immédiat", "1-3h", "3-12h", "Lendemain", "Autre"]

const defaultSuspects = ["Gluten", "Lactose", "Café"].map((name, index) => ({
  id: `default-${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`,
  name,
  color: ["#2563eb", "#16a34a", "#ca8a04"][index],
  createdAt: new Date(0).toISOString(),
}))

const emptyEntry = {
  consumedAt: "",
  suspectId: "",
  foods: [],
  note: "",
  symptoms: [],
}

const emptySymptom = {
  tag: "Ballonnement",
  intensity: 3,
  delay: "1-3h",
  note: "",
}

function createId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toDatetimeLocalValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

function fromDatetimeLocalValue(value) {
  return value ? new Date(value).toISOString() : new Date().toISOString()
}

function formatDate(value) {
  if (!value) return ""

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function readStoredJournal() {
  if (typeof window === "undefined") {
    return { suspects: defaultSuspects, entries: [] }
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)
      || (APP_ENV === "preprod" ? null : window.localStorage.getItem(LEGACY_STORAGE_KEY))
    const stored = JSON.parse(storedValue || "null")
    if (!stored || !Array.isArray(stored.suspects) || !Array.isArray(stored.entries)) {
      return { suspects: defaultSuspects, entries: [] }
    }

    return {
      suspects: stored.suspects.length ? stored.suspects : defaultSuspects,
      entries: stored.entries,
    }
  } catch {
    return { suspects: defaultSuspects, entries: [] }
  }
}

function getSuspectName(suspects, suspectId) {
  return suspects.find((suspect) => suspect.id === suspectId)?.name || "Suspect supprimé"
}

function getFilteredEntries(entries, filters) {
  const now = Date.now()
  const periodDays = filters.period === "7" ? 7 : filters.period === "30" ? 30 : null
  const text = filters.text.trim().toLowerCase()

  return entries.filter((entry) => {
    if (filters.suspectId && entry.suspectId !== filters.suspectId) return false
    if (filters.symptomTag && !entry.symptoms.some((symptom) => symptom.tag === filters.symptomTag)) return false

    if (periodDays) {
      const entryTime = new Date(entry.consumedAt).getTime()
      if (!Number.isFinite(entryTime) || now - entryTime > periodDays * 24 * 60 * 60 * 1000) return false
    }

    if (text) {
      const searchable = [
        entry.note,
        ...entry.foods.map((food) => food.label),
        ...entry.symptoms.map((symptom) => `${symptom.tag} ${symptom.note}`),
      ]
        .join(" ")
        .toLowerCase()

      if (!searchable.includes(text)) return false
    }

    return true
  })
}

function FieldLabel({ children, htmlFor }) {
  return (
    <label className="text-sm font-medium text-gray-800" htmlFor={htmlFor}>
      {children}
    </label>
  )
}

function EditIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function PlusIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 18H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <section
        className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border bg-slate-50 shadow-2xl sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-white px-5 py-4">
          <h2 className="font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-2xl leading-none text-gray-500 hover:text-gray-950"
            aria-label="Fermer la fenêtre"
          >
            ×
          </button>
        </div>

        <div className="p-4 sm:p-5">{children}</div>
      </section>
    </div>
  )
}

function FoodPicker({ searchFoods, foods, onAddFood, onRemoveFood }) {
  const [query, setQuery] = useState("")
  const suggestions = useMemo(() => searchFoods(query, 6), [query, searchFoods])
  const trimmedQuery = query.trim()

  function addFood(food) {
    onAddFood(food)
    setQuery("")
  }

  return (
    <div className="space-y-2">
      <FieldLabel htmlFor="journal-food-search">Aliments consommés</FieldLabel>
      <input
        id="journal-food-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ex : pain, pâtes, seitan"
        className="w-full rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-gray-200"
      />

      {!!trimmedQuery && (
        <div className="rounded-2xl border bg-white p-2 text-sm shadow-sm">
          {suggestions.map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => addFood({ id: food.id, label: food.label, source: "database" })}
              className="block w-full rounded-xl px-3 py-2 text-left hover:bg-gray-50"
            >
              <span className="block font-medium">{food.label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => addFood({ id: createId("free-food"), label: trimmedQuery, source: "free-text" })}
            className="block w-full rounded-xl px-3 py-2 text-left font-medium text-gray-700 hover:bg-gray-50"
          >
            Ajouter "{trimmedQuery}"
          </button>
        </div>
      )}

      {!!foods.length && (
        <div className="flex flex-wrap gap-2">
          {foods.map((food) => (
            <span key={food.id} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm">
              {food.label}
              <button
                type="button"
                onClick={() => onRemoveFood(food.id)}
                className="text-gray-400 hover:text-gray-800"
                aria-label={`Retirer ${food.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function SymptomEditor({ symptoms, onChange }) {
  const [expandedIndexes, setExpandedIndexes] = useState(() => new Set())

  useEffect(() => {
    setExpandedIndexes((current) => (
      new Set([...current].filter((index) => index < symptoms.length))
    ))
  }, [symptoms.length])

  function addSymptom() {
    const nextIndex = symptoms.length
    onChange([...symptoms, { ...emptySymptom }])
    setExpandedIndexes((current) => new Set([...current, nextIndex]))
  }

  function expandSymptom(index) {
    setExpandedIndexes((current) => new Set([...current, index]))
  }

  function collapseSymptom(index) {
    setExpandedIndexes((current) => {
      const next = new Set(current)
      next.delete(index)
      return next
    })
  }

  function removeSymptom(index) {
    onChange(symptoms.filter((_, symptomIndex) => symptomIndex !== index))
    setExpandedIndexes((current) => {
      const next = new Set()
      current.forEach((expandedIndex) => {
        if (expandedIndex < index) next.add(expandedIndex)
        if (expandedIndex > index) next.add(expandedIndex - 1)
      })
      return next
    })
  }

  function updateSymptom(index, patch) {
    onChange(symptoms.map((symptom, symptomIndex) => (
      symptomIndex === index ? { ...symptom, ...patch } : symptom
    )))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <FieldLabel>Ressentis</FieldLabel>
        <button
          type="button"
          onClick={addSymptom}
          className="rounded-full border bg-white px-3 py-1 text-sm font-medium hover:bg-gray-50"
        >
          Ajouter
        </button>
      </div>

      {!symptoms.length && (
        <div className="rounded-2xl border border-dashed bg-white px-4 py-5 text-sm text-gray-500">
          Tu peux enregistrer la prise maintenant, puis ajouter un ressenti plus tard.
        </div>
      )}

      {symptoms.map((symptom, index) => (
        expandedIndexes.has(index) ? (
          <div key={`${symptom.tag}-${index}`} className="space-y-4 rounded-2xl border bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor={`symptom-tag-${index}`}>Type</FieldLabel>
                <select
                  id={`symptom-tag-${index}`}
                  value={symptom.tag}
                  onChange={(event) => updateSymptom(index, { tag: event.target.value })}
                  className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-200"
                >
                  {symptomTags.map((tag) => <option key={tag}>{tag}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor={`symptom-delay-${index}`}>Délai</FieldLabel>
                <select
                  id={`symptom-delay-${index}`}
                  value={symptom.delay}
                  onChange={(event) => updateSymptom(index, { delay: event.target.value })}
                  className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-200"
                >
                  {symptomDelays.map((delay) => <option key={delay}>{delay}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor={`symptom-intensity-${index}`}>Intensité</FieldLabel>
                <span className="text-sm font-semibold text-gray-700">{symptom.intensity}/5</span>
              </div>
              <input
                id={`symptom-intensity-${index}`}
                type="range"
                min="0"
                max="5"
                value={symptom.intensity}
                onChange={(event) => updateSymptom(index, { intensity: Number(event.target.value) })}
                className="w-full"
              />
            </div>

            <textarea
              value={symptom.note}
              onChange={(event) => updateSymptom(index, { note: event.target.value })}
              placeholder="Note sur ce ressenti"
              rows="2"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => collapseSymptom(index)}
                className="rounded-2xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Publier le ressenti
              </button>
              <button
                type="button"
                onClick={() => removeSymptom(index)}
                className="text-sm font-medium text-red-700 hover:text-red-900"
              >
                Retirer ce ressenti
              </button>
            </div>
          </div>
        ) : (
          <button
            key={`${symptom.tag}-${index}`}
            type="button"
            onClick={() => expandSymptom(index)}
            className="flex w-full items-start justify-between gap-3 rounded-2xl border bg-white p-4 text-left hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            aria-label={`Modifier le ressenti ${symptom.tag}`}
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-950">{symptom.tag} · {symptom.intensity}/5 · {symptom.delay}</span>
              {symptom.note && <span className="mt-1 block text-sm text-gray-500">{symptom.note}</span>}
            </span>
            <span className="mt-0.5 shrink-0 text-gray-400">
              <EditIcon className="h-4 w-4" />
            </span>
          </button>
        )
      ))}
    </div>
  )
}

function SuspectManager({ suspects, suspectCounts, onAddSuspect, onDeleteSuspect }) {
  const [name, setName] = useState("")

  function submit(event) {
    event.preventDefault()
    onAddSuspect(name)
    setName("")
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mt-1 text-sm text-gray-500">Ajoute une famille ou un aliment à observer dans le temps.</p>
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex : sucre, soja, alcool"
          className="min-w-0 flex-1 rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-gray-200"
        />
        <button type="submit" className="rounded-2xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
          Ajouter
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {suspects.map((suspect) => {
          const count = suspectCounts.get(suspect.id) || 0
          const canDelete = suspects.length > 1 && count === 0

          return (
            <span key={suspect.id} className="inline-flex w-fit items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-sm shadow-sm">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: suspect.color || "#64748b" }} />
              <span className="whitespace-nowrap font-medium">{suspect.name} ({count})</span>
              <button
                type="button"
                onClick={() => onDeleteSuspect(suspect.id)}
                disabled={!canDelete}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-base leading-none text-gray-400 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-200 disabled:hover:bg-transparent"
                aria-label={`Supprimer ${suspect.name}`}
              >
                ×
              </button>
            </span>
          )
        })}
      </div>

      <p className="text-xs text-gray-500">Le nombre entre parenthèses indique les prises liées au suspect. Une croix grisée indique un suspect déjà utilisé.</p>
    </div>
  )
}

function EntryForm({ suspects, editingEntry, searchFoods, onSave, onCancel, onOpenSuspects }) {
  const [entry, setEntry] = useState(() => {
    if (editingEntry) {
      return {
        ...editingEntry,
        consumedAt: toDatetimeLocalValue(new Date(editingEntry.consumedAt)),
      }
    }

    return {
      ...emptyEntry,
      consumedAt: toDatetimeLocalValue(),
      suspectId: suspects[0]?.id || "",
    }
  })

  function save(event) {
    event.preventDefault()
    if (!entry.suspectId) return

    onSave({
      ...entry,
      consumedAt: fromDatetimeLocalValue(entry.consumedAt),
      foods: entry.foods,
      symptoms: entry.symptoms,
    })

    if (!editingEntry) {
      setEntry({
        ...emptyEntry,
        consumedAt: toDatetimeLocalValue(),
        suspectId: suspects[0]?.id || "",
      })
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <p className="text-sm text-gray-500">Note ce que tu as consommé et les ressentis observés.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel htmlFor="journal-consumed-at">Date et heure</FieldLabel>
          <input
            id="journal-consumed-at"
            type="datetime-local"
            value={entry.consumedAt}
            onChange={(event) => setEntry({ ...entry, consumedAt: event.target.value })}
            className="w-full rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-gray-200"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor="journal-suspect">Suspect principal</FieldLabel>
            <button
              type="button"
              onClick={onOpenSuspects}
              className="text-sm font-medium text-gray-600 hover:text-gray-950"
            >
              Modifier la liste
            </button>
          </div>
          <select
            id="journal-suspect"
            value={entry.suspectId}
            onChange={(event) => setEntry({ ...entry, suspectId: event.target.value })}
            className="w-full rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-gray-200"
            required
          >
            {suspects.map((suspect) => <option key={suspect.id} value={suspect.id}>{suspect.name}</option>)}
          </select>
        </div>
      </div>

      <FoodPicker
        searchFoods={searchFoods}
        foods={entry.foods}
        onAddFood={(food) => setEntry((current) => (
          current.foods.some((item) => item.id === food.id)
            ? current
            : { ...current, foods: [...current.foods, food] }
        ))}
        onRemoveFood={(foodId) => setEntry((current) => ({
          ...current,
          foods: current.foods.filter((food) => food.id !== foodId),
        }))}
      />

      <div className="space-y-2">
        <FieldLabel htmlFor="journal-note">Quantité ou contexte</FieldLabel>
        <textarea
          id="journal-note"
          value={entry.note}
          onChange={(event) => setEntry({ ...entry, note: event.target.value })}
          placeholder="Ex : deux tranches de pain au déjeuner"
          rows="3"
          className="w-full rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      <SymptomEditor
        symptoms={entry.symptoms}
        onChange={(symptoms) => setEntry({ ...entry, symptoms })}
      />

      <div className="flex flex-wrap gap-3 pt-1">
        <button type="submit" disabled={!entry.suspectId} className="rounded-2xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300">
          {editingEntry ? "Enregistrer les changements" : "Enregistrer la prise"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-2xl border bg-white px-4 py-3 text-sm font-semibold hover:bg-gray-50">
          Annuler
        </button>
      </div>
    </form>
  )
}

function JournalFilters({ filters, suspects, onChange }) {
  return (
    <section className="space-y-3 rounded-3xl border bg-white p-5">
      <h2 className="font-semibold">Filtres</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={filters.suspectId}
          onChange={(event) => onChange({ ...filters, suspectId: event.target.value })}
          className="w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
          aria-label="Filtrer par suspect"
        >
          <option value="">Tous les suspects</option>
          {suspects.map((suspect) => <option key={suspect.id} value={suspect.id}>{suspect.name}</option>)}
        </select>

        <select
          value={filters.symptomTag}
          onChange={(event) => onChange({ ...filters, symptomTag: event.target.value })}
          className="w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
          aria-label="Filtrer par ressenti"
        >
          <option value="">Tous les ressentis</option>
          {symptomTags.map((tag) => <option key={tag}>{tag}</option>)}
        </select>

        <select
          value={filters.period}
          onChange={(event) => onChange({ ...filters, period: event.target.value })}
          className="w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
          aria-label="Filtrer par période"
        >
          <option value="all">Toute la période</option>
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
        </select>

        <input
          value={filters.text}
          onChange={(event) => onChange({ ...filters, text: event.target.value })}
          placeholder="Filtrer par aliment ou note"
          className="w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>
    </section>
  )
}

function EntryList({ entries, suspects, onEdit, onDelete }) {
  if (!entries.length) {
    return (
      <section className="rounded-3xl border border-dashed bg-white p-6 text-center text-sm text-gray-500">
        Aucune prise ne correspond aux filtres actuels.
      </section>
    )
  }

  return (
    <section className="space-y-3">
      {entries.map((entry) => (
        <article key={entry.id} className="space-y-3 rounded-3xl border bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase text-gray-400">{formatDate(entry.consumedAt)}</div>
              <h3 className="mt-1 text-lg font-semibold">{getSuspectName(suspects, entry.suspectId)}</h3>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => onEdit(entry)}
                className="flex h-9 w-9 items-center justify-center rounded-full border text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                aria-label="Modifier la prise"
                title="Modifier"
              >
                <EditIcon />
              </button>
              <button
                type="button"
                onClick={() => onDelete(entry.id)}
                className="flex h-9 w-9 items-center justify-center rounded-full border text-red-700 hover:bg-red-50"
                aria-label="Supprimer la prise"
                title="Supprimer"
              >
                <TrashIcon />
              </button>
            </div>
          </div>

          {entry.foods.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.foods.map((food) => (
                <span key={food.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{food.label}</span>
              ))}
            </div>
          )}

          {entry.note && <p className="text-sm text-gray-600">{entry.note}</p>}

          {entry.symptoms.length > 0 ? (
            <div className="space-y-2">
              {entry.symptoms.map((symptom, index) => (
                <button
                  key={`${entry.id}-${symptom.tag}-${index}`}
                  type="button"
                  onClick={() => onEdit(entry)}
                  className="flex w-full items-start justify-between gap-3 rounded-2xl bg-slate-50 p-3 text-left text-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                  aria-label={`Modifier le ressenti ${symptom.tag}`}
                  title="Modifier le ressenti"
                >
                  <span className="min-w-0">
                    <div className="font-medium">{symptom.tag} · {symptom.intensity}/5 · {symptom.delay}</div>
                    {symptom.note && <div className="mt-1 text-gray-600">{symptom.note}</div>}
                  </span>
                  <span className="mt-0.5 shrink-0 text-gray-400">
                    <EditIcon className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-3 text-sm text-gray-500">Aucun ressenti noté pour le moment.</div>
          )}
        </article>
      ))}
    </section>
  )
}

export default function FoodJournalView({ searchFoods }) {
  const [journal, setJournal] = useState(readStoredJournal)
  const [filters, setFilters] = useState({ suspectId: "", symptomTag: "", period: "all", text: "" })
  const [editingEntry, setEditingEntry] = useState(null)
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [isSuspectsModalOpen, setIsSuspectsModalOpen] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(journal))
  }, [journal])

  const suspectCounts = useMemo(() => (
    journal.entries.reduce((counts, entry) => {
      counts.set(entry.suspectId, (counts.get(entry.suspectId) || 0) + 1)
      return counts
    }, new Map())
  ), [journal.entries])

  const filteredEntries = useMemo(() => (
    getFilteredEntries(journal.entries, filters)
      .sort((a, b) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime())
  ), [journal.entries, filters])

  function addSuspect(name) {
    const cleanName = name.trim()
    if (!cleanName) return

    setJournal((current) => {
      const alreadyExists = current.suspects.some((suspect) => suspect.name.toLowerCase() === cleanName.toLowerCase())
      if (alreadyExists) return current

      return {
        ...current,
        suspects: [
          ...current.suspects,
          {
            id: createId("suspect"),
            name: cleanName,
            color: "#64748b",
            createdAt: new Date().toISOString(),
          },
        ],
      }
    })
  }

  function deleteSuspect(suspectId) {
    const isUsed = journal.entries.some((entry) => entry.suspectId === suspectId)
    if (isUsed || journal.suspects.length <= 1) return

    setJournal((current) => ({
      ...current,
      suspects: current.suspects.filter((suspect) => suspect.id !== suspectId),
    }))
  }

  function saveEntry(entry) {
    const now = new Date().toISOString()

    setJournal((current) => {
      if (entry.id) {
        return {
          ...current,
          entries: current.entries.map((item) => (
            item.id === entry.id
              ? { ...entry, updatedAt: now }
              : item
          )),
        }
      }

      return {
        ...current,
        entries: [
          {
            ...entry,
            id: createId("entry"),
            createdAt: now,
            updatedAt: now,
          },
          ...current.entries,
        ],
      }
    })

    setEditingEntry(null)
    setIsEntryModalOpen(false)
  }

  function deleteEntry(entryId) {
    setJournal((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.id !== entryId),
    }))

    if (editingEntry?.id === entryId) {
      setEditingEntry(null)
      setIsEntryModalOpen(false)
    }
  }

  function openNewEntry() {
    setEditingEntry(null)
    setIsEntryModalOpen(true)
  }

  function openEditEntry(entry) {
    setEditingEntry(entry)
    setIsEntryModalOpen(true)
  }

  function closeEntryModal() {
    setEditingEntry(null)
    setIsEntryModalOpen(false)
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Journal de tolérance</h1>
          <p className="mt-1 text-sm text-gray-500">Observe les prises alimentaires suspectes et les ressentis associés, sans diagnostic automatique.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsSuspectsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            <EditIcon className="h-4 w-4" />
            Suspects
          </button>
          <button
            type="button"
            onClick={openNewEntry}
            className="inline-flex items-center gap-2 rounded-2xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvelle prise
          </button>
        </div>
      </header>

      <div className="hidden">
        <JournalFilters filters={filters} suspects={journal.suspects} onChange={setFilters} />
      </div>
      <EntryList entries={filteredEntries} suspects={journal.suspects} onEdit={openEditEntry} onDelete={deleteEntry} />

      {isEntryModalOpen && (
        <Modal title={editingEntry ? "Modifier la prise" : "Nouvelle prise"} onClose={closeEntryModal}>
          <EntryForm
            key={editingEntry?.id || "new-entry"}
            suspects={journal.suspects}
            editingEntry={editingEntry}
            searchFoods={searchFoods}
            onSave={saveEntry}
            onCancel={closeEntryModal}
            onOpenSuspects={() => setIsSuspectsModalOpen(true)}
          />
        </Modal>
      )}

      {isSuspectsModalOpen && (
        <Modal title="Suspects" onClose={() => setIsSuspectsModalOpen(false)}>
          <SuspectManager
            suspects={journal.suspects}
            suspectCounts={suspectCounts}
            onAddSuspect={addSuspect}
            onDeleteSuspect={deleteSuspect}
          />
        </Modal>
      )}
    </div>
  )
}
