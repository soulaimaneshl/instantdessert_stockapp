export type Unite = 'G' | 'KG' | 'L' | 'ML' | 'UNITE'
export type Canal = 'LIVRAISON' | 'SUR_PLACE' | 'EMPORTER' | 'DRIVE' | 'MARKETPLACE'
export type TypeMouvement = 'ACHAT_MP' | 'CORRECTION_MP' | 'PRODUCTION' | 'VENTE'
export type EntiteType = 'MATIERE_PREMIERE' | 'PRODUIT_FINI'

export interface MatierePremiere {
  id: string; nom: string; unite: Unite; categorie: string
  stockActuel: number; seuilTampon: number; prixAchat: number; createdAt: number
}
export interface ProduitFini {
  id: string; nom: string; categorie: string; prixVente: number; stockActuel: number; coutDeRevient: number
}
export interface RecetteIngredient { matierePremiereId: string; quantite: number }
export interface Recette { produitFiniId: string; ingredients: RecetteIngredient[] }
export interface Production { id: string; produitFiniId: string; quantite: number; createdAt: number }
export interface CommandeLigne { produitFiniId: string; quantite: number; prixUnitaireSnapshot: number }
export interface Commande {
  id: string; canal: Canal; nomClient: string
  total: number; lignes: CommandeLigne[]; createdAt: number
}
// Commandes provenant du site web (B2C / B2B) — lecture seule
export interface CommandeSiteLigne {
  nom: string
  quantite: number
  prix: number
}
export interface CommandeSite {
  id: string
  source: 'B2C' | 'B2B'
  nomClient: string
  statut: string
  total: number
  lignes: CommandeSiteLigne[]
  createdAt: number
}

export interface MouvementStock {
  id: string; type: TypeMouvement; entiteId: string
  entiteType: EntiteType; delta: number; raison?: string; createdAt: number
}
