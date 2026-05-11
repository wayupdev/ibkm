# IBKM Web

Plateforme web pour une association de jeunesse : annonces, documents,
photos, messagerie et gestion des familles.

Trois rôles : **admin**, **parent**, **child** (jeune).

## Stack

- **Next.js 15** (App Router, Server Actions, React 19)
- **Supabase** : Auth, Postgres, Storage, Realtime
- **Tailwind CSS**, **lucide-react**
- **Resend** (notifications email — optionnel)
- Déploiement : **Vercel** + projet **Supabase**

## Fonctionnalités

- Authentification par email / mot de passe (créés par les admins).
- Fil d'actualités (annonces ciblées par audience, épinglage).
- Documents (PDF, images…) avec audience publique ou famille privée.
- Galerie photo avec consentement parental.
- Messagerie 1-à-1 en temps réel ; les jeunes ne peuvent contacter que les
  admins (mesure de protection des mineurs).
- Gestion des familles : un parent peut être rattaché à plusieurs familles,
  plusieurs jeunes peuvent appartenir à une même famille.
- Console admin pour créer comptes, réinitialiser mots de passe, gérer familles.
- Pages RGPD / mentions légales.
- Notifications email pour les nouvelles annonces (clé Resend optionnelle).

## Mise en route

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL editor**, exécuter le fichier
   [supabase/migrations/20260511000000_init.sql](supabase/migrations/20260511000000_init.sql).
3. Récupérer dans **Settings → API** :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (côté serveur uniquement)

### 3. Variables d'environnement

Copier le fichier d'exemple :

```bash
cp .env.example .env.local
```

Renseigner les valeurs dans `.env.local`.

### 4. Créer le premier admin

1. Dashboard Supabase → **Authentication → Users → Add user**
   (cocher "Email confirmed").
2. Copier l'UUID du compte créé.
3. Dans **SQL editor**, exécuter :

   ```sql
   insert into profiles (id, role, first_name, last_name)
   values ('<UUID>', 'admin', 'Prénom', 'Nom');
   ```

### 5. Lancer en local

```bash
npm run dev
```

Aller sur http://localhost:3000 — vous serez redirigé vers `/login`.

## Déploiement

### Vercel

1. Pousser le code sur un dépôt Git.
2. Importer le projet dans [Vercel](https://vercel.com).
3. Renseigner les variables d'environnement (mêmes valeurs que `.env.local`,
   `NEXT_PUBLIC_SITE_URL` = URL de production).
4. Déployer.

### Supabase Storage

Les buckets `documents` et `photos` sont créés automatiquement par la migration.
Les fichiers ne sont accessibles que via URL signée (1 h).

## Sécurité / RGPD

- **RLS activée** sur toutes les tables (voir migration). Les jeunes ne voient
  que leur famille et les contenus destinés aux jeunes ; les parents voient leur
  famille et les contenus destinés aux parents.
- **Messagerie** : un jeune ne peut envoyer un message qu'à un admin
  (enforce dans la policy `msg members write`).
- **Photos** : case de consentement parental obligatoire (page profil).
- Pages [/rgpd](src/app/rgpd/page.tsx) et [/legal](src/app/legal/page.tsx)
  à compléter avec vos informations.

## Notifications email

Les emails sont envoyés via [Resend](https://resend.com). Sans `RESEND_API_KEY`,
les annonces sont publiées sans envoi d'email. Vérifier votre domaine d'envoi
avant la production.

## Structure du projet

```
src/
  app/
    (dashboard)/        # Pages authentifiées (sidebar)
      feed/             # Fil d'actualités
      documents/
      photos/
      messages/[id]/    # Conversation
      profile/
      admin/families/   # Gestion des familles
      admin/users/      # Gestion des comptes
    login/              # Page de connexion
    rgpd/               # Politique de confidentialité
    legal/              # Mentions légales
    auth/signout/       # Route POST de déconnexion
  components/           # Nav, header, etc.
  lib/
    supabase/           # Clients (browser, server, middleware)
    auth.ts             # Helpers requireUser/requireRole
    notifications.ts    # Envoi email Resend
    types.ts            # Types TypeScript
supabase/
  migrations/           # Schéma SQL initial + RLS + buckets
```
