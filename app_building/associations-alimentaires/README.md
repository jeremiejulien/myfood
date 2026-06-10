# Associations alimentaires

Application React/Vite pour consulter les associations alimentaires et tenir un journal personnel.

## Environnements

- `main` correspond a la production.
- `preprod` correspond a la preproduction et sert aux tests avant mise en production.

Sans Supabase configure, le journal personnel est stocke dans le navigateur avec une cle differente par environnement:

- prod: `assocAlim.foodJournal.v1.prod`
- preprod: `assocAlim.foodJournal.v1.preprod`
- local dev: `assocAlim.foodJournal.v1.development`

La preproduction ne relit pas l'ancienne cle de stockage, afin d'eviter de melanger les donnees de test avec les donnees utilisees en production.

## Comptes utilisateurs

L'authentification et la synchronisation du journal utilisent Supabase:

- connexion par lien magique envoye par email
- une ligne `user_journals` par utilisateur
- Row Level Security pour isoler les donnees de chaque compte

Configuration:

1. Creer un projet Supabase.
2. Executer le SQL dans `supabase/schema.sql`.
3. Ajouter les variables dans `.env.local` et dans Vercel:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Tant que ces variables ne sont pas renseignees, l'app reste en mode local.

## Commandes

```bash
npm run dev
npm run dev:preprod
npm run build:prod
npm run build:preprod
```

Si `npm` n'est pas installe globalement sur la machine, utiliser les scripts locaux:

```bash
npm run local-dev
npm run local-dev:preprod
```

## Workflow recommande

Travailler et tester sur `preprod`:

```bash
git checkout preprod
```

Quand les changements sont valides:

```bash
git checkout main
git merge preprod
git push
```
