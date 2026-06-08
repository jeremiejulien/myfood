/**
 * Règles d'association complètes par catégorie d'aliment.
 * Chaque entrée : compatible / neutre / incompatible = listes de catégories
 */
export const compatibility = {
  fruits_acides: {
    compatible: ['fruits_acides', 'fruits_mi_acides'],
    neutre: ['fruits_doux', 'fruits_seches', 'fruits_neutres', 'miel', 'proteines_maigres', 'legumes_amidon_faible', 'eau'],
    incompatible: ['sucreries', 'amidons', 'legumes_secs', 'proteines_grasses', 'lait', 'lipides', 'legumes_amidon_moyen', 'sel']
  },
  fruits_mi_acides: {
    compatible: ['fruits_acides', 'fruits_mi_acides', 'fruits_doux', 'fruits_seches', 'miel', 'proteines_maigres'],
    neutre: ['fruits_neutres', 'legumes_amidon_faible', 'eau'],
    incompatible: ['sucreries', 'amidons', 'legumes_secs', 'proteines_grasses', 'lait', 'lipides', 'legumes_amidon_moyen', 'sel']
  },
  fruits_doux: {
    compatible: ['fruits_mi_acides', 'fruits_doux', 'fruits_seches', 'miel', 'proteines_maigres'],
    neutre: ['fruits_acides', 'fruits_neutres', 'sucreries', 'lipides', 'legumes_amidon_faible', 'eau'],
    incompatible: ['amidons', 'legumes_secs', 'proteines_grasses', 'lait', 'legumes_amidon_moyen', 'sel']
  },
  fruits_seches: {
    compatible: ['fruits_mi_acides', 'fruits_doux', 'fruits_seches', 'proteines_maigres', 'eau'],
    neutre: ['fruits_acides', 'fruits_neutres', 'miel', 'sucreries', 'lipides', 'legumes_amidon_faible'],
    incompatible: ['amidons', 'legumes_secs', 'proteines_grasses', 'lait', 'legumes_amidon_moyen', 'sel']
  },
  fruits_neutres: {
    compatible: ['fruits_neutres'],
    neutre: ['fruits_acides', 'fruits_mi_acides', 'fruits_doux', 'fruits_seches', 'miel', 'sucreries', 'proteines_maigres', 'legumes_amidon_faible', 'eau'],
    incompatible: ['amidons', 'legumes_secs', 'proteines_grasses', 'lait', 'lipides', 'legumes_amidon_moyen', 'sel']
  },
  miel: {
    compatible: ['fruits_mi_acides', 'fruits_doux', 'miel'],
    neutre: ['fruits_acides', 'fruits_seches', 'fruits_neutres', 'sucreries', 'proteines_maigres', 'lipides', 'legumes_amidon_faible', 'eau'],
    incompatible: ['amidons', 'legumes_secs', 'proteines_grasses', 'lait', 'legumes_amidon_moyen', 'sel']
  },
  sucreries: {
    compatible: ['sucreries', 'eau'],
    neutre: ['fruits_doux', 'fruits_seches', 'fruits_neutres', 'miel', 'proteines_maigres', 'lipides', 'legumes_amidon_faible'],
    incompatible: ['fruits_acides', 'fruits_mi_acides', 'amidons', 'legumes_secs', 'proteines_grasses', 'lait', 'legumes_amidon_moyen', 'sel']
  },
  amidons: {
    compatible: ['amidons', 'legumes_amidon_faible', 'legumes_amidon_moyen', 'eau', 'sel'],
    neutre: ['legumes_secs', 'proteines_grasses', 'lipides'],
    incompatible: ['fruits_acides', 'fruits_mi_acides', 'fruits_doux', 'fruits_seches', 'fruits_neutres', 'miel', 'sucreries', 'proteines_maigres', 'lait']
  },
  legumes_secs: {
    compatible: ['legumes_secs', 'legumes_amidon_faible'],
    neutre: ['amidons', 'proteines_maigres', 'proteines_grasses', 'lipides', 'legumes_amidon_moyen', 'eau', 'sel'],
    incompatible: ['fruits_acides', 'fruits_mi_acides', 'fruits_doux', 'fruits_seches', 'fruits_neutres', 'miel', 'sucreries', 'lait']
  },
  proteines_maigres: {
    compatible: ['fruits_mi_acides', 'fruits_doux', 'fruits_seches', 'proteines_maigres', 'legumes_amidon_faible'],
    neutre: ['fruits_acides', 'fruits_neutres', 'miel', 'sucreries', 'legumes_secs', 'proteines_grasses', 'lipides', 'legumes_amidon_moyen', 'eau'],
    incompatible: ['amidons', 'lait', 'sel']
  },
  proteines_grasses: {
    compatible: ['legumes_amidon_faible', 'legumes_amidon_moyen'],
    neutre: ['amidons', 'legumes_secs', 'proteines_maigres', 'proteines_grasses', 'lipides', 'eau'],
    incompatible: ['fruits_acides', 'fruits_mi_acides', 'fruits_doux', 'fruits_seches', 'fruits_neutres', 'miel', 'sucreries', 'lait', 'sel']
  },
  lait: {
    compatible: ['lait', 'eau'],
    neutre: [],
    incompatible: ['fruits_acides', 'fruits_mi_acides', 'fruits_doux', 'fruits_seches', 'fruits_neutres', 'miel', 'sucreries', 'amidons', 'legumes_secs', 'proteines_maigres', 'proteines_grasses', 'lipides', 'legumes_amidon_faible', 'legumes_amidon_moyen', 'sel']
  },
  lipides: {
    compatible: ['legumes_amidon_faible', 'legumes_amidon_moyen'],
    neutre: ['fruits_doux', 'fruits_seches', 'miel', 'sucreries', 'amidons', 'legumes_secs', 'proteines_maigres', 'proteines_grasses', 'lipides', 'eau'],
    incompatible: ['fruits_acides', 'fruits_mi_acides', 'fruits_neutres', 'lait', 'sel']
  },
  legumes_amidon_faible: {
    compatible: ['amidons', 'legumes_secs', 'proteines_maigres', 'proteines_grasses', 'lipides', 'legumes_amidon_faible', 'legumes_amidon_moyen', 'eau'],
    neutre: ['fruits_acides', 'fruits_mi_acides', 'fruits_doux', 'fruits_seches', 'fruits_neutres', 'miel', 'sucreries', 'sel'],
    incompatible: ['lait']
  },
  legumes_amidon_moyen: {
    compatible: ['amidons', 'proteines_grasses', 'lipides', 'legumes_amidon_faible', 'legumes_amidon_moyen', 'eau'],
    neutre: ['legumes_secs', 'proteines_maigres', 'sel'],
    incompatible: ['fruits_acides', 'fruits_mi_acides', 'fruits_doux', 'fruits_seches', 'fruits_neutres', 'miel', 'sucreries', 'lait']
  },
  eau: {
    compatible: ['fruits_seches', 'sucreries', 'lait', 'legumes_amidon_faible', 'legumes_amidon_moyen', 'eau'],
    neutre: ['amidons', 'fruits_acides', 'fruits_mi_acides', 'fruits_doux', 'fruits_neutres', 'miel', 'legumes_secs', 'proteines_maigres', 'proteines_grasses', 'lipides'],
    incompatible: ['sel']
  },
  sel: {
    compatible: [],
    neutre: ['legumes_secs', 'legumes_amidon_faible', 'legumes_amidon_moyen', 'sel'],
    incompatible: ['amidons', 'fruits_acides', 'fruits_mi_acides', 'fruits_doux', 'fruits_seches', 'fruits_neutres', 'miel', 'sucreries', 'proteines_maigres', 'proteines_grasses', 'lait', 'lipides', 'eau']
  }
}
