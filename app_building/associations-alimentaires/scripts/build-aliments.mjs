import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const sourcePath =
  process.argv[2] ||
  path.join(root, "src/data/ciqual_filtre_association.json")
const outPath = path.join(root, "src/data/aliments_ciqual.json")

/** Catégories par préfixe CIQUAL (2 premiers chiffres de l’id). */
const PREFIX_CATEGORY = {
  "10": "proteines_maigres", // poissons, crustacés
  "11": "autres", // algues, épices séchées — affiné par nom
  "12": "proteines_grasses", // fromages
  "13": null, // fruits — affiné par nom
  "14": "proteines_grasses", // gibier
  "15": "proteines_maigres", // fruits à coque
  "16": "lipides", // beurre
  "17": "lipides", // huiles
  "18": null, // boissons — affiné par nom
  "19": "lipides", // crèmes
  "20": null, // légumes — affiné par nom
  "21": "proteines_grasses", // agneau
  "22": "proteines_maigres", // œufs
  "23": "sucreries", // viennoiseries
  "24": "sucreries", // crêpes, cornets
  "25": "sucreries", // beignets
  "26": "proteines_maigres", // poissons
  "27": "proteines_maigres", // poissons
  "28": "proteines_grasses", // charcuterie italienne
  "30": "proteines_grasses", // saucisses
  "31": "sucreries", // chocolats, confiseries
  "32": "amidons", // céréales soufflées
  "34": "proteines_maigres", // lapin, grenouille
  "36": "proteines_maigres", // volailles, autruche
  "38": "sucreries", // biscuits apéritifs
  "39": "sucreries", // glaces, sorbets
  "40": "proteines_maigres", // abats
  "41": "amidons", // patate douce
  "42": "autres", // poudres, substituts
  "50": "autres", // bière
  "51": "amidons", // frik, céréales
  "52": "autres", // vin
  "53": "amidons", // banane plantain, igname
  "54": "amidons", // manioc, féculents tropicaux
  "58": "legumes_amidon_faible", // gombo
  "60": "proteines_grasses",
  "61": "proteines_grasses",
  "62": "proteines_grasses",
  "63": "proteines_grasses",
  "65": "proteines_grasses", // veau
  "69": "proteines_grasses", // cheval
  "70": "amidons", // pains
  "71": "amidons",
  "72": "amidons",
  "73": "amidons", // biscottes
  "74": "amidons",
  "75": "amidons", // chapelure
  "76": "eau",
  "77": "sucreries", // pains sucrés
  "78": "autres", // cakes salés
  "80": "proteines_maigres", // rillettes poisson
  "81": "proteines_grasses", // canard confit
  "82": "proteines_grasses", // pâtés
  "83": "proteines_grasses", // foie gras
  "84": "proteines_grasses", // fromage de tête, gelées
  "85": "proteines_grasses", // andouille
  "87": "proteines_grasses", // boudin
  "88": "proteines_grasses",
  "89": "proteines_maigres", // quenelles
  "90": "amidons",
  "91": "amidons", // riz
  "92": "amidons", // popcorn
  "93": "amidons", // avoine, amarante
  "94": "amidons", // farines
  "95": "amidons", // fécules
  "96": "amidons", // boulgour, amidon riz
  "98": "amidons", // pâtes
  "99": "amidons", // vermicelles
}

function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’.,()\[\]{}]/g, " ")
    .replace(/[-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function categorizeByName(nom) {
  const n = normalize(nom)

  if (
    /\b(eau minerale|eau de source|eau du robinet|eau de table)\b/.test(n) ||
    (/\beau\b/.test(n) && /\bminerale|embouteill/.test(n))
  ) {
    return "eau"
  }
  if (
    /^sel\b/.test(n) ||
    /\b(sel marin|sel fin|sel raffine|sel de table|sel alimentaire)\b/.test(n)
  ) {
    return "sel"
  }

  if (/\b(cafe |cafe,|the |the,|the vert|the noir|matcha|tisane|infusion|cacao)\b/.test(n)) {
    return "autres"
  }
  if (/\b(vinaigre|moutarde en grain|gingembre|curcuma poudre|epice)\b/.test(n)) return "autres"
  if (/\b(biere|vin |vin,|champagne|cider|cidre)\b/.test(n)) return "autres"

  if (/\bmiel\b/.test(n)) {
    if (/boules|biscuit|gateau|cereale|barre/.test(n)) return "sucreries"
    return "miel"
  }
  if (/\b(sucre|chocolat|bonbon|confiserie|glace |sorbet|sirop|fructose|glucose|patisserie|viennoiserie|biscuit|cracker|gateau|tarte |flan |clafoutis|baba |beignet|donut|brioche|croissant|pain au chocolat)\b/.test(n)) {
    return "sucreries"
  }

  if (/\b(huile |huile d|beurre|margarine|creme fraiche|creme liquide|creme 12|creme 15|creme 20|creme 30|creme 35)\b/.test(n) && !/fromage/.test(n)) {
    return "lipides"
  }
  if (/\bavocat\b/.test(n)) return "lipides"

  if (
    /\b(lait |lait,|lait de|lait entier|lait demi|lait ecreme|boisson lactee)\b/.test(n) &&
    !/fromage|chocolat|gateau|biscuit|dessert|pain/.test(n)
  ) {
    return "lait"
  }
  if (/\b(yaourt nature|yaourt,|yaourt aux fruits)\b/.test(n) && !/gateau/.test(n)) return "lait"

  if (/\b(jus de|jus )\b/.test(n) && !/lait/.test(n)) return "fruits_mi_acides"
  if (/\b(boisson gazeuse|boisson plate|soda|cola|boisson pour le sport)\b/.test(n)) return "sucreries"
  if (/\b(aneth|basilic|persil|thym|romarin|coriandre|cerfeuil|ciboulette|estragon|laurier|menthe|origan|sauge)\b/.test(n)) {
    return "legumes_amidon_moyen"
  }

  if (
    /\b(porc|agneau|mouton|veau|boeuf|charcut|saucisse|jambon|lard|bacon|canard|oie|foie gras|saindoux|andouille|boudin|cervelas|corned|bresaola|coppa|confit de canard|magret fume)\b/.test(n)
  ) {
    return "proteines_grasses"
  }
  if (/\b(fromage|camembert|brie|comte|gruyere|emmental|roquefort|reblochon|munster|maroilles|abondance|asiago|beaufort|chevre,|feta|mozzarella)\b/.test(n)) {
    return "proteines_grasses"
  }

  if (
    /\b(poulet|dinde|lapin|poisson|saumon|thon|cabillaud|sardine|maquereau|crevette|homard|crabe|moule|huitre|coquille|anchois|anguille|merlu|colin|lieu|truite|bar |daurade|sole |turbot|calamar|seiche|palourde|bigorneau|araignee de mer)\b/.test(n)
  ) {
    return "proteines_maigres"
  }
  if (/\b(oeuf|tofu|soja textur)\b/.test(n)) return "proteines_maigres"
  if (/\b(abat|cervelle|rognon|foie,|langue|tripes|gesier)\b/.test(n)) return "proteines_maigres"

  if (/\b(amande|noisette|noix |noix,|cacahuete|pistache|noix de cajou|noix de pecan|noix du bresil|sesame|graine de tournesol|graine de courge)\b/.test(n)) {
    return "proteines_maigres"
  }

  if (
    /\b(lentille|pois chiche|pois casse|legumineuse|graine germee)\b/.test(n) ||
    /\b(haricot sec|haricot rouge|haricot blanc|haricot azuki|feve sec|feve seiche)\b/.test(n) ||
    (/\bharicot\b/.test(n) && /\b(sec|secs|seche)\b/.test(n))
  ) {
    return "legumes_secs"
  }

  if (
    /\b(riz|ble|avoine|orge|mais|quinoa|sarrasin|millet|epeautre|kamut|teff|fonio|pate |pates |pain |semoule|fecule|amidon|pomme de terre|patate|polenta|tapioca|couscous|boulgour|flocon|farine|vermicelle|nouille|blini|galette de cereale|manioc|igname|plantain|pop corn|pop-corn|mais eclate)\b/.test(n)
  ) {
    return "amidons"
  }

  if (
    /\b(brocoli|courgette|aubergine|poivron|tomate|salade|laitue|epinard|chou fleur|chou-fleur|concombre|fenouil|artichaut|asperge|haricot vert|courge spaghetti|champignon|endive|scarole|roquette|cresson|mesclun|potiron|citrouille|courge,|courge |haricot french|pois gourmand)\b/.test(n)
  ) {
    return "legumes_amidon_faible"
  }
  if (/\b(carotte|oignon|ail|echalote|poireau|betterave|navet|celeri|panais|rutabaga|topinambour|radis|bettrave|poireau|shallot)\b/.test(n)) {
    return "legumes_amidon_moyen"
  }
  if (/\b(legume|chou |navet|gombo)\b/.test(n)) return "legumes_amidon_faible"

  if (/\b(sec|seche|deshydrat|moelleux)\b/.test(n) && /\b(abricot|raisin|figue|pruneau|datte|banane|pomme|poire|cerise)\b/.test(n)) {
    return "fruits_seches"
  }
  if (/\b(citron|pamplemousse|ananas|kiwi|lime|citron vert|orange,|orange |mandarine|clementine)\b/.test(n)) {
    return "fruits_acides"
  }
  if (/\b(pomme|poire|raisin|peche|nectarine|abricot|prune|cerise|fraise|framboise|myrtille|cassis|mure|groseille|rhubarbe)\b/.test(n) && !/jus|boisson|gateau|confiture|compote/.test(n)) {
    return "fruits_mi_acides"
  }
  if (/\b(banane|datte|figue|mangue|litchi|papaye|fruit de la passion|goyave)\b/.test(n) && !/jus|boisson|plantain/.test(n)) {
    return "fruits_doux"
  }
  if (/\b(melon|pasteque)\b/.test(n)) return "fruits_neutres"

  if (/\b(algue|agar|nori|wakame|kombu)\b/.test(n)) return "autres"
  if (/\b(viande|volaille|filet|escalope|grill|poele|brais|roti|cuit|crue|cru)\b/.test(n)) {
    return "proteines_grasses"
  }

  return "autres"
}

function categorizeFruit(nom) {
  const n = normalize(nom)
  if (/\b(sec|seche|deshydrat|moelleux)\b/.test(n)) return "fruits_seches"
  if (/\b(citron|pamplemousse|ananas|kiwi|lime|citron vert)\b/.test(n)) return "fruits_acides"
  if (/\b(orange|mandarine|clementine)\b/.test(n)) return "fruits_acides"
  if (/\b(banane|datte|figue|mangue|litchi|papaye|goyave)\b/.test(n) && !/plantain/.test(n)) return "fruits_doux"
  if (/\b(melon|pasteque)\b/.test(n)) return "fruits_neutres"
  return "fruits_mi_acides"
}

function categorizeLegume(nom) {
  const n = normalize(nom)
  if (
    /\b(lentille|pois chiche|pois casse|legumineuse|graine germee)\b/.test(n) ||
    /\b(haricot sec|haricot rouge|haricot blanc|feve sec)\b/.test(n) ||
    (/\bharicot\b/.test(n) && /\b(sec|secs|seche)\b/.test(n))
  ) {
    return "legumes_secs"
  }
  if (/\b(carotte|oignon|ail|echalote|poireau|betterave|navet|celeri|panais|rutabaga|topinambour|radis)\b/.test(n)) {
    return "legumes_amidon_moyen"
  }
  return "legumes_amidon_faible"
}

function categorizeBoisson(nom) {
  const n = normalize(nom)
  if (/\b(eau minerale|eau de source|eau de table)\b/.test(n) || (/\beau\b/.test(n) && /\bminerale|embouteill/.test(n))) {
    return "eau"
  }
  if (/\b(lait|lactee)\b/.test(n)) return "lait"
  if (/\b(jus )\b/.test(n)) return "fruits_mi_acides"
  if (/\b(gazeuse|plate|soda|sucre|sirop|sport)\b/.test(n)) return "sucreries"
  return "autres"
}

export function categorizeAliment({ ciqual_id, nom }) {
  const prefix = String(ciqual_id).slice(0, 2)
  const fromPrefix = PREFIX_CATEGORY[prefix]

  if (fromPrefix === null) {
    if (prefix === "13") return categorizeFruit(nom)
    if (prefix === "20") return categorizeLegume(nom)
    if (prefix === "18") return categorizeBoisson(nom)
  }

  if (fromPrefix) {
    if (fromPrefix === "autres" || fromPrefix === "amidons" || fromPrefix === "proteines_grasses") {
      const byName = categorizeByName(nom)
      if (byName !== "autres") return byName
    }
    return fromPrefix
  }

  return categorizeByName(nom)
}

function buildSearchTerms(nom) {
  const base = normalize(nom)
  const terms = new Set([base])
  if (base.length > 3) terms.add(base.replace(/\s*\([^)]*\)/g, "").trim())
  return [...terms].filter(Boolean)
}

function toAliment(entry) {
  const category = categorizeAliment(entry)
  return {
    id: `ciqual-${entry.ciqual_id}`,
    label: entry.nom,
    category,
    ciqual_id: entry.ciqual_id,
    niveau: entry.niveau,
    transformation: entry.transformation,
    aliases: [],
    search_terms: buildSearchTerms(entry.nom),
    ...(category === "autres" ? { requires_manual_review: true } : {}),
  }
}

const raw = JSON.parse(fs.readFileSync(sourcePath, "utf8"))
const aliments = raw.map(toAliment)

const counts = {}
for (const a of aliments) counts[a.category] = (counts[a.category] || 0) + 1

fs.writeFileSync(outPath, JSON.stringify(aliments, null, 2) + "\n")
console.log(`Écrit ${aliments.length} aliments → ${outPath}`)
console.log("Répartition:", counts)
