import { useEffect, useMemo, useRef, useState } from "react"

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
}

const emptySymptom = {
  occurredAt: "",
  tag: "Ballonnement",
  intensity: 3,
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

function formatDay(value) {
  if (!value) return ""

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value))
}

function getDayKey(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return "unknown"

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

function readStoredJournal() {
  if (typeof window === "undefined") {
    return { suspects: defaultSuspects, entries: [], symptoms: [] }
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)
      || (APP_ENV === "preprod" ? null : window.localStorage.getItem(LEGACY_STORAGE_KEY))
    const stored = JSON.parse(storedValue || "null")
    if (!stored || !Array.isArray(stored.suspects) || !Array.isArray(stored.entries)) {
      return { suspects: defaultSuspects, entries: [], symptoms: [] }
    }

    return {
      suspects: stored.suspects.length ? stored.suspects : defaultSuspects,
      entries: stored.entries,
      symptoms: Array.isArray(stored.symptoms) ? stored.symptoms : [],
    }
  } catch {
    return { suspects: defaultSuspects, entries: [], symptoms: [] }
  }
}

function normalizeJournal(value) {
  if (!value || !Array.isArray(value.suspects) || !Array.isArray(value.entries)) {
    return { suspects: defaultSuspects, entries: [], symptoms: [] }
  }

  return {
    suspects: value.suspects.length ? value.suspects : defaultSuspects,
    entries: value.entries,
    symptoms: Array.isArray(value.symptoms) ? value.symptoms : [],
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

    if (periodDays) {
      const entryTime = new Date(entry.consumedAt).getTime()
      if (!Number.isFinite(entryTime) || now - entryTime > periodDays * 24 * 60 * 60 * 1000) return false
    }

    if (text) {
      const searchable = [
        entry.note,
        ...entry.foods.map((food) => food.label),
      ]
        .join(" ")
        .toLowerCase()

      if (!searchable.includes(text)) return false
    }

    return true
  })
}

function getFilteredSymptoms(symptoms, filters) {
  const now = Date.now()
  const periodDays = filters.period === "7" ? 7 : filters.period === "30" ? 30 : null
  const text = filters.text.trim().toLowerCase()

  return symptoms.filter((symptom) => {
    if (filters.suspectId) return false
    if (filters.symptomTag && symptom.tag !== filters.symptomTag) return false

    if (periodDays) {
      const symptomTime = new Date(symptom.occurredAt).getTime()
      if (!Number.isFinite(symptomTime) || now - symptomTime > periodDays * 24 * 60 * 60 * 1000) return false
    }

    if (text) {
      const searchable = [symptom.tag, symptom.note].join(" ").toLowerCase()
      if (!searchable.includes(text)) return false
    }

    return true
  })
}

function groupJournalItemsByDay(entries, symptoms) {
  const items = [
    ...entries.map((entry) => ({ type: "entry", id: entry.id, date: entry.consumedAt, data: entry })),
    ...symptoms.map((symptom) => ({ type: "symptom", id: symptom.id, date: symptom.occurredAt, data: symptom })),
  ]
    .filter((item) => item.id && item.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return items.reduce((days, item) => {
    const key = getDayKey(item.date)
    const existingDay = days.find((day) => day.key === key)
    if (existingDay) {
      existingDay.items.push(item)
      return days
    }

    days.push({ key, label: formatDay(item.date), items: [item] })
    return days
  }, [])
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

function ForkIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v7" />
      <path d="M10 3v7" />
      <path d="M6 7h4" />
      <path d="M8 10v11" />
      <path d="M18 3v18" />
    </svg>
  )
}

function FeelingIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 8.6c0 5.3-8.8 10.4-8.8 10.4S3.2 13.9 3.2 8.6A4.6 4.6 0 0 1 12 6.5a4.6 4.6 0 0 1 8.8 2.1Z" />
      <path d="M9 12h6" />
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
        className="relative z-10 max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border bg-slate-50 shadow-2xl sm:max-h-[92vh] sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-white px-4 py-3.5 sm:px-5 sm:py-4">
          <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center text-5xl leading-none text-gray-500 hover:text-gray-950"
            aria-label="Fermer la fenêtre"
          >
            ×
          </button>
        </div>

        <div className="p-3.5 sm:p-5">{children}</div>
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
        className="min-h-12 w-full rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-gray-200"
      />

      {!!trimmedQuery && (
        <div className="rounded-2xl border bg-white p-1.5 text-sm shadow-sm sm:p-2">
          {suggestions.map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => addFood({ id: food.id, label: food.label, source: "database" })}
              className="block min-h-11 w-full rounded-xl px-3 py-2.5 text-left hover:bg-gray-50 active:bg-gray-100"
            >
              <span className="block font-medium">{food.label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => addFood({ id: createId("free-food"), label: trimmedQuery, source: "free-text" })}
            className="block min-h-11 w-full rounded-xl px-3 py-2.5 text-left font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
          >
            Ajouter "{trimmedQuery}"
          </button>
        </div>
      )}

      {!!foods.length && (
        <div className="flex flex-wrap gap-2">
          {foods.map((food) => (
            <span key={food.id} className="inline-flex min-h-8 items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm">
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

function SymptomForm({ editingSymptom, onSave, onCancel }) {
  const [symptom, setSymptom] = useState(() => {
    if (editingSymptom) {
      return {
        ...editingSymptom,
        occurredAt: toDatetimeLocalValue(new Date(editingSymptom.occurredAt)),
      }
    }

    return {
      ...emptySymptom,
      occurredAt: toDatetimeLocalValue(),
    }
  })

  function save(event) {
    event.preventDefault()

    onSave({
      ...symptom,
      occurredAt: fromDatetimeLocalValue(symptom.occurredAt),
      intensity: Number(symptom.intensity),
    })
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <p className="text-sm text-gray-500">Note un ressenti indépendamment des prises. Son heure permettra de le rapprocher des prises plus tard.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel htmlFor="symptom-occurred-at">Date et heure</FieldLabel>
          <input
            id="symptom-occurred-at"
            type="datetime-local"
            value={symptom.occurredAt}
            onChange={(event) => setSymptom({ ...symptom, occurredAt: event.target.value })}
            className="min-h-12 w-full rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-gray-200"
            required
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="symptom-tag">Type</FieldLabel>
          <select
            id="symptom-tag"
            value={symptom.tag}
            onChange={(event) => setSymptom({ ...symptom, tag: event.target.value })}
            className="min-h-12 w-full rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-gray-200"
          >
            {symptomTags.map((tag) => <option key={tag}>{tag}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <FieldLabel htmlFor="symptom-intensity">Intensité</FieldLabel>
          <span className="text-sm font-semibold text-gray-700">{symptom.intensity}/5</span>
        </div>
        <input
          id="symptom-intensity"
          type="range"
          min="0"
          max="5"
          value={symptom.intensity}
          onChange={(event) => setSymptom({ ...symptom, intensity: Number(event.target.value) })}
          className="w-full accent-gray-950"
        />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="symptom-note">Note</FieldLabel>
        <textarea
          id="symptom-note"
          value={symptom.note}
          onChange={(event) => setSymptom({ ...symptom, note: event.target.value })}
          placeholder="Ex : ballonnement léger en fin d'après-midi"
          rows="3"
          className="w-full rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      <div className="grid gap-2 pt-1 sm:flex sm:flex-wrap sm:gap-3">
        <button type="submit" className="min-h-12 rounded-2xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800">
          {editingSymptom ? "Enregistrer les changements" : "Enregistrer le ressenti"}
        </button>
        <button type="button" onClick={onCancel} className="min-h-12 rounded-2xl border bg-white px-4 py-3 text-sm font-semibold hover:bg-gray-50">
          Annuler
        </button>
      </div>
    </form>
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

      <form onSubmit={submit} className="grid gap-2 sm:flex">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex : sucre, soja, alcool"
          className="min-h-12 min-w-0 flex-1 rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-gray-200"
        />
        <button type="submit" className="min-h-12 rounded-2xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
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
      <p className="text-sm text-gray-500">Note ce que tu as consommé. Les ressentis se créent séparément avec leur propre heure.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel htmlFor="journal-consumed-at">Date et heure</FieldLabel>
          <input
            id="journal-consumed-at"
            type="datetime-local"
            value={entry.consumedAt}
            onChange={(event) => setEntry({ ...entry, consumedAt: event.target.value })}
            className="min-h-12 w-full rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-gray-200"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor="journal-suspect">Suspect principal</FieldLabel>
            <button
              type="button"
              onClick={onOpenSuspects}
              className="shrink-0 text-sm font-medium text-gray-600 hover:text-gray-950"
            >
              Modifier la liste
            </button>
          </div>
          <select
            id="journal-suspect"
            value={entry.suspectId}
            onChange={(event) => setEntry({ ...entry, suspectId: event.target.value })}
            className="min-h-12 w-full rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-gray-200"
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

      <div className="grid gap-2 pt-1 sm:flex sm:flex-wrap sm:gap-3">
        <button type="submit" disabled={!entry.suspectId} className="min-h-12 rounded-2xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300">
          {editingEntry ? "Enregistrer les changements" : "Enregistrer la prise"}
        </button>
        <button type="button" onClick={onCancel} className="min-h-12 rounded-2xl border bg-white px-4 py-3 text-sm font-semibold hover:bg-gray-50">
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

function EntryCard({ entry, suspects, onEdit, onDelete }) {
  return (
    <article className="space-y-3 rounded-2xl border bg-white p-4 sm:rounded-3xl sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase text-gray-400">Prise · {formatDate(entry.consumedAt)}</div>
          <h3 className="mt-1 text-base font-semibold sm:text-lg">{getSuspectName(suspects, entry.suspectId)}</h3>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="flex h-10 w-10 items-center justify-center rounded-full border text-gray-600 hover:bg-gray-50 hover:text-gray-950"
            aria-label="Modifier la prise"
            title="Modifier"
          >
            <EditIcon />
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="flex h-10 w-10 items-center justify-center rounded-full border text-red-700 hover:bg-red-50"
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
    </article>
  )
}

function SymptomCard({ symptom, onEdit, onDelete }) {
  return (
    <article className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:rounded-3xl sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase text-amber-700/70">Ressenti · {formatDate(symptom.occurredAt)}</div>
          <h3 className="mt-1 text-base font-semibold text-amber-950 sm:text-lg">{symptom.tag}</h3>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onEdit(symptom)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white/70 text-amber-900 hover:bg-white"
            aria-label="Modifier le ressenti"
            title="Modifier"
          >
            <EditIcon />
          </button>
          <button
            type="button"
            onClick={() => onDelete(symptom.id)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white/70 text-red-700 hover:bg-red-50"
            aria-label="Supprimer le ressenti"
            title="Supprimer"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="inline-flex rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-amber-950">
        Intensité {symptom.intensity}/5
      </div>

      {symptom.note && <p className="text-sm text-amber-950/80">{symptom.note}</p>}
    </article>
  )
}

function JournalTimeline({ dayGroups, suspects, onEditEntry, onDeleteEntry, onEditSymptom, onDeleteSymptom }) {
  if (!dayGroups.length) {
    return (
      <section className="rounded-2xl border border-dashed bg-white p-5 text-center text-sm text-gray-500 sm:rounded-3xl sm:p-6">
        Aucun élément ne correspond aux filtres actuels.
      </section>
    )
  }

  return (
    <section className="space-y-5">
      {dayGroups.map((day) => (
        <section key={day.key} className="space-y-3">
          <h2 className="px-1 text-sm font-semibold capitalize text-gray-600">{day.label}</h2>
          <div className="space-y-3">
            {day.items.map((item) => (
              item.type === "entry" ? (
                <EntryCard
                  key={`entry-${item.id}`}
                  entry={item.data}
                  suspects={suspects}
                  onEdit={onEditEntry}
                  onDelete={onDeleteEntry}
                />
              ) : (
                <SymptomCard
                  key={`symptom-${item.id}`}
                  symptom={item.data}
                  onEdit={onEditSymptom}
                  onDelete={onDeleteSymptom}
                />
              )
            ))}
          </div>
        </section>
      ))}
    </section>
  )
}

export default function FoodJournalView({
  searchFoods,
  session = null,
  supabaseClient = null,
  authConfigured = false,
}) {
  const user = session?.user
  const remoteEnabled = Boolean(authConfigured && supabaseClient && user?.id)
  const [journal, setJournal] = useState(readStoredJournal)
  const [loadedUserId, setLoadedUserId] = useState("")
  const [syncError, setSyncError] = useState("")
  const [filters, setFilters] = useState({ suspectId: "", symptomTag: "", period: "all", text: "" })
  const [editingEntry, setEditingEntry] = useState(null)
  const [editingSymptom, setEditingSymptom] = useState(null)
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false)
  const [isSuspectsModalOpen, setIsSuspectsModalOpen] = useState(false)
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
  const hasLoadedRemoteJournal = useRef(false)
  const isJournalReady = !remoteEnabled || loadedUserId === user?.id
  useEffect(() => {
    if (!remoteEnabled) {
      hasLoadedRemoteJournal.current = false
      return undefined
    }

    let isCancelled = false

    async function loadJournal() {
      hasLoadedRemoteJournal.current = false

      const { data, error } = await supabaseClient
        .from("user_journals")
        .select("journal_data")
        .eq("user_id", user.id)
        .maybeSingle()

      if (isCancelled) return

      if (error) {
        setSyncError(error.message)
        setLoadedUserId(user.id)
        return
      }

      const nextJournal = normalizeJournal(data?.journal_data || { suspects: defaultSuspects, entries: [], symptoms: [] })
      setJournal(nextJournal)
      hasLoadedRemoteJournal.current = true
      setLoadedUserId(user.id)
    }

    loadJournal()

    return () => {
      isCancelled = true
    }
  }, [authConfigured, remoteEnabled, supabaseClient, user?.id])

  useEffect(() => {
    if (remoteEnabled || authConfigured) return

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(journal))
  }, [authConfigured, journal, remoteEnabled])

  useEffect(() => {
    if (!remoteEnabled || !isJournalReady || !hasLoadedRemoteJournal.current) return undefined

    const timeoutId = window.setTimeout(async () => {
      setSyncError("")

      const { error } = await supabaseClient
        .from("user_journals")
        .upsert({
          user_id: user.id,
          journal_data: journal,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        setSyncError(error.message)
      }
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [isJournalReady, journal, remoteEnabled, supabaseClient, user?.id])

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

  const filteredSymptoms = useMemo(() => (
    getFilteredSymptoms(journal.symptoms, filters)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
  ), [journal.symptoms, filters])

  const dayGroups = useMemo(() => (
    groupJournalItemsByDay(filteredEntries, filteredSymptoms)
  ), [filteredEntries, filteredSymptoms])

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
    const nextEntry = { ...entry }

    setJournal((current) => {
      if (entry.id) {
        return {
          ...current,
          entries: current.entries.map((item) => (
            item.id === entry.id
              ? { ...nextEntry, updatedAt: now }
              : item
          )),
        }
      }

      return {
        ...current,
        entries: [
          {
            ...nextEntry,
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

  function saveSymptom(symptom) {
    const now = new Date().toISOString()

    setJournal((current) => {
      if (symptom.id) {
        return {
          ...current,
          symptoms: current.symptoms.map((item) => (
            item.id === symptom.id
              ? { ...symptom, updatedAt: now }
              : item
          )),
        }
      }

      return {
        ...current,
        symptoms: [
          {
            ...symptom,
            id: createId("symptom"),
            createdAt: now,
            updatedAt: now,
          },
          ...current.symptoms,
        ],
      }
    })

    setEditingSymptom(null)
    setIsSymptomModalOpen(false)
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

  function deleteSymptom(symptomId) {
    setJournal((current) => ({
      ...current,
      symptoms: current.symptoms.filter((symptom) => symptom.id !== symptomId),
    }))

    if (editingSymptom?.id === symptomId) {
      setEditingSymptom(null)
      setIsSymptomModalOpen(false)
    }
  }

  function openNewEntry() {
    setEditingEntry(null)
    setIsEntryModalOpen(true)
    setIsActionMenuOpen(false)
  }

  function openNewSymptom() {
    setEditingSymptom(null)
    setIsSymptomModalOpen(true)
    setIsActionMenuOpen(false)
  }

  function openSuspectsModal() {
    setIsSuspectsModalOpen(true)
    setIsActionMenuOpen(false)
  }

  function openEditEntry(entry) {
    setEditingEntry(entry)
    setIsEntryModalOpen(true)
  }

  function openEditSymptom(symptom) {
    setEditingSymptom(symptom)
    setIsSymptomModalOpen(true)
  }

  function closeEntryModal() {
    setEditingEntry(null)
    setIsEntryModalOpen(false)
  }

  function closeSymptomModal() {
    setEditingSymptom(null)
    setIsSymptomModalOpen(false)
  }

  return (
    <div className="space-y-4 pb-24 sm:space-y-5">
      <header className="pt-1">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Journal de tolérance</h1>
          <p className="mt-1 text-sm text-gray-500">Observe les prises alimentaires suspectes et les ressentis associés, sans diagnostic automatique.</p>
        </div>
      </header>

      {syncError && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          Synchronisation impossible: {syncError}
        </div>
      )}

      {!isJournalReady ? (
        <section className="rounded-2xl border bg-white p-5 text-sm text-gray-500 shadow-sm sm:rounded-3xl">
          Chargement du journal...
        </section>
      ) : (
        <>

          <div className="hidden">
            <JournalFilters filters={filters} suspects={journal.suspects} onChange={setFilters} />
          </div>
          <JournalTimeline
            dayGroups={dayGroups}
            suspects={journal.suspects}
            onEditEntry={openEditEntry}
            onDeleteEntry={deleteEntry}
            onEditSymptom={openEditSymptom}
            onDeleteSymptom={deleteSymptom}
          />
        </>
      )}

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

      {isSymptomModalOpen && (
        <Modal title={editingSymptom ? "Modifier le ressenti" : "Nouveau ressenti"} onClose={closeSymptomModal}>
          <SymptomForm
            key={editingSymptom?.id || "new-symptom"}
            editingSymptom={editingSymptom}
            onSave={saveSymptom}
            onCancel={closeSymptomModal}
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

      {isActionMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 cursor-default"
          aria-label="Fermer le menu de création"
          onClick={() => setIsActionMenuOpen(false)}
        />
      )}

      <div className="fixed bottom-5 right-4 z-40 sm:bottom-6 sm:right-6">
        {isActionMenuOpen && (
          <div className="mb-3 w-56 rounded-2xl border bg-white p-2 shadow-2xl">
            <button
              type="button"
              onClick={openNewEntry}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-gray-50"
            >
              <ForkIcon className="h-4 w-4" />
              Food
            </button>
            <button
              type="button"
              onClick={openNewSymptom}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-gray-50"
            >
              <FeelingIcon className="h-4 w-4" />
              Ressenti
            </button>
            <button
              type="button"
              onClick={openSuspectsModal}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-gray-50"
            >
              <EditIcon className="h-4 w-4" />
              Suspect
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsActionMenuOpen((current) => !current)}
          className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-950 text-white shadow-2xl hover:bg-gray-800"
          aria-expanded={isActionMenuOpen}
          aria-label="Créer un élément du journal"
          title="Créer"
        >
          <PlusIcon className={`h-6 w-6 transition-transform ${isActionMenuOpen ? "rotate-45" : ""}`} />
        </button>
      </div>
    </div>
  )
}
