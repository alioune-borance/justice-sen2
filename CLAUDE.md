# CLAUDE.md — SIGEP-SN (Gestion pénitentiaire, Sénégal)

Document de référence pour les sessions de travail. Rédigé à partir de l'état du code au 2026-11-05
(frontend : branche `V3`, backend : branche `feat-man`). Uniquement des constats ; les points incertains
sont regroupés dans « À clarifier ».

> Le projet est réparti sur **deux dépôts git distincts** :
> - **Frontend** : `C:\Users\ambaye\Desktop\justice-sen2` (ce dépôt, remote GitHub `justice-sen2`)
> - **Backend** : `C:\Users\ambaye\Desktop\PDSC` (dépôt git séparé, branches `main` / `feat-man`) — backend de référence confirmé
>
> Choix confirmé : front et back restent dans **deux dépôts séparés**. Toute modification touchant les deux
> (ex. contrat d'API) implique deux commits/branches distincts, un dans chaque dépôt.
>
> Le nom « SIGEP-SN » n'apparaît nulle part dans le code. Le backend s'appelle « SGP API »
> (drf-spectacular), le `package.json` front « vite-react-typescript-starter », et la sidebar affiche
> « Gestion prison - Saytou prison ».

---

## 1. Stack technique

### Frontend (`justice-sen2`)
| Élément | Version installée (`node_modules`) |
|---|---|
| React / React DOM | 19.2.4 |
| TypeScript | 5.9.3 (`strict: true`) |
| Vite (+ `@vitejs/plugin-react`) | 5.4.21 |
| React Router DOM (`createBrowserRouter`) | 7.13.0 |
| TanStack React Query | 5.90.20 |
| Zustand (état auth) | 5.0.10 |
| Axios | 1.13.4 |
| Tailwind CSS (+ PostCSS, autoprefixer) | 3.4.19 |
| lucide-react (icônes) | 1.8.0 |
| recharts (graphiques) | 3.7.0 |
| jspdf + jspdf-autotable (export PDF) | ^4.2.1 / ^5.0.7 |
| react-to-print, i18n-iso-countries | ^3.3.0 / ^7.14.0 |
| ESLint (flat config, typescript-eslint, react-hooks, react-refresh) | 9.39.2 |

- Projet initialisé via le template Bolt `bolt-vite-react-ts` (dossier `.bolt/`).
- Déploiement : **Vercel** (`vercel.json`) avec deux fonctions serverless dans `api/` (`hello.js`, `proxy.js`).
- Aucune librairie de tests installée.

### Backend (`PDSC`)
| Élément | Version |
|---|---|
| Python | 3.12 (image Docker `python:3.12-alpine`) ; le `venv/` local est en 3.14.4 |
| Django | 5.1.1 |
| Django REST Framework | 3.15.2 |
| drf-spectacular (OpenAPI/Swagger) | 0.27.2 |
| django-filter | non épinglé (25.1 dans le venv) |
| django-cors-headers | 4.9.0 |
| django-environ (lecture `.env`) | 0.12.0 |
| python-jose (décodage JWT Keycloak) | 3.5.0 |
| djangorestframework-simplejwt | non épinglé (5.5.1 dans le venv) — **installé mais non utilisé** |
| Pillow, Faker (seed), requests, psycopg2-binary | voir `requirements.txt` |
| Base de données | **PostgreSQL 15** (docker-compose) |
| IdP | **Keycloak** (`quay.io/keycloak/keycloak:latest`, `start-dev`, port 8080) |
| Stockage fichiers | `MEDIA_ROOT` local ; une classe `MinioStorage` existe mais n'est pas branchée (`minio` absent des requirements) |

---

## 2. Arborescence commentée

### Frontend
```
justice-sen2/
├── api/                      # Fonctions serverless Vercel
│   ├── hello.js              #   endpoint de test
│   └── proxy.js              #   proxy /api/* -> backend (IP:8090 codée en dur)
├── src/
│   ├── main.tsx              # Point d'entrée React (StrictMode)
│   ├── app/
│   │   ├── App.tsx           # QueryClientProvider + RouterProvider
│   │   ├── router/AppRouter.tsx   # Toutes les routes (createBrowserRouter)
│   │   └── providers/QueryProvider.tsx  # NON utilisé (doublon du QueryClient de App.tsx)
│   ├── features/             # Logique métier par domaine (API + hooks React Query + types)
│   │   ├── auth/             #   api/, components/ (AuthBootstrap, RequireAuth), hooks/useLogin,
│   │   │                     #   store/auth.store (zustand), types/, utils/decodeToken
│   │   ├── detenus/          #   /prisoners
│   │   ├── prisons/          #   /prison
│   │   ├── visites/          #   /visits, /visitors
│   │   ├── transferts/       #   /transfers
│   │   ├── sorties/          #   /exits
│   │   ├── incidents/        #   /prisoners/:id/disciplinary-records
│   │   ├── infirmerie/       #   /prisoners/:id/health-records
│   │   └── shared/deplacement.ts  # interface commune Transfert/Sortie
│   ├── pages/                # Pages routées branchées sur l'API (liste / détail / formulaire)
│   │   ├── inmates/  visites/  transferts/  incidents/  infirmerie/  login/
│   ├── components/           # Composants "historiques" : mélange de composants utilisés par les
│   │                         # pages, de pages à données statiques (mock) et de code mort (voir §9)
│   │   ├── inmates/  visite/  transfert/  prison/  auth/
│   ├── widgets/              # Layout (layout/Layout.tsx) + Sidebar (sidebar/Sidebar.tsx) réellement utilisés
│   ├── entities/             # Anciens types camelCase (Detenu, Transfer, Release, Report…) utilisés
│   │                         # uniquement par les composants mock / morts
│   ├── shared/api/
│   │   ├── axiosInstance.ts  # Instance axios + intercepteurs (Bearer, refresh sur 401)
│   │   └── errorMessages.ts  # Traduction FR des erreurs DRF (non suivi par git pour l'instant)
│   └── index.css             # Directives Tailwind
├── vite.config.ts            # Proxy dev /api -> http://127.0.0.1:8090
├── vercel.json               # Rewrites : /api/* -> /api/proxy, reste -> index.html (SPA)
├── .env / .env.production    # VITE_API_URL (baseURL axios)
└── dist/                     # Build (ignoré par git)
```

### Backend
```
PDSC/
├── manage.py
├── apicore/                  # Projet Django
│   ├── settings.py           # Config (DB, DRF, CORS, Keycloak, LOCAL_AUTH, règles métier)
│   ├── urls.py               # admin/, api/, api/auth/, api/schema/, api/docs/
│   └── api_router.py         # DefaultRouter DRF : enregistre tous les ViewSets
├── core/                     # Transverse (PAS dans INSTALLED_APPS)
│   ├── auth/keycloak.py      #   KeycloakAccessTokenAuthentication (JWT RS256 via JWKS)
│   ├── auth/spectacular.py   #   Schéma Bearer pour Swagger
│   ├── exceptions/generic_exceptions.py  # UnauthorizedException (401), BadRequestException (400)
│   └── storage/minio.py      #   Storage MinIO (non branché)
├── sgpauth/                  # Auth : login/logout/me/refresh/create-user/reset/change-password
│                             # (proxy vers Keycloak), permissions par rôle, modèle SGPUser
├── prison/                   # Prison, Quarter, Cell + commande seed_fake_data
├── prisoner/                 # Prisoner + dossiers liés (casier, santé, discipline, contacts, docs, photos, pécule)
├── visite/                   # Visit, Visitor + filters.py + validators.py
├── deplacement/              # Deplacement (abstrait) -> Transfer, Exit + validators.py
├── documents/                # App vide (aucun modèle, aucune vue)
├── media/                    # Uploads (ignoré par git)
├── generate_postman_from_schema.py, postman_collection.json
├── Dockerfile, docker-compose.yaml, entrypoint.sh
└── .env                      # Variables (voir §3)
```

---

## 3. Commandes

### Frontend
```bash
npm install
npm run dev        # Vite sur http://localhost:5173 ; /api proxifié vers http://127.0.0.1:8090
npm run build      # vite build -> dist/  (NB : pas de tsc dans le script build)
npm run preview
npm run lint       # eslint .
npx tsc -p tsconfig.app.json --noEmit   # vérification de types (aucun script npm dédié)
```
- Pas de commande de test (aucun framework de test).
- `VITE_API_URL` (dans `.env`) définit la `baseURL` axios ; doit pointer vers le préfixe `/api/`
  (les appels sont relatifs : `prisoners/`, `auth/login/`…).

### Backend
```bash
# Local (venv)
cd ../PDSC
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 0.0.0.0:8090      # port attendu par le front

# Données fictives
python manage.py seed_fake_data [--clear] [--prisons 3] [--prisoners 30] [--visitors 15] [--visits 40]

# Tests (aucun test écrit : tous les tests.py sont vides)
python manage.py test

# Docker
docker compose up --build    # services : db (postgres:15, 5432), web (8090), keycloak (8080)
```
- Variables `.env` attendues (noms uniquement) : `DJANGO_ALLOWED_HOSTS`, `POSTGRES_DB`, `POSTGRES_USER`,
  `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`,
  `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ISSUER`, `KEYCLOAK_JWKS_URL`, `LOCAL_AUTH`,
  `KEYCLOAK_ADMIN_USER`, `KEYCLOAK_ADMIN_PASSWORD`.
- `LOCAL_AUTH=true` : contourne Keycloak (auth sur la table `auth_user` Django, renvoie un token DRF opaque).
  Il faut alors créer un utilisateur Django (`python manage.py createsuperuser`).
- Documentation API : `/api/docs/` ou `/api/schema/swagger-ui/` ; schéma brut `/api/schema/`.
- Aucun linter/formatter Python configuré.

---

## 4. Architecture backend

### Couches
Architecture Django/DRF classique, **sans couche service ni repository** :
- **Model** (`models.py`) : ORM Django ; enums via `models.TextChoices`.
- **Serializer** (`serializers.py`) : `ModelSerializer` ; la validation métier est faite dans `validate()`
  en appelant des **mixins validateurs** (`VisitValidator`, `DeplacementValidator` dans `validators.py`)
  hérités par le serializer.
- **View** (`views.py`) : `viewsets.ModelViewSet` (CRUD complet) ; les vues d'auth sont des `APIView`.
- **Routing** : centralisé dans `apicore/api_router.py` (`DefaultRouter` si `DEBUG`, sinon `SimpleRouter`).
  Les `urls.py` des apps `prison`, `prisoner`, `visite` existent mais **ne sont pas inclus**.
- **Sous-ressources** : `PrisonerSubResourceViewSet` (prisoner/views.py) — base pour
  `/prisoners/<prisoner_pk>/<ressource>/` ; `perform_create` injecte le détenu.
- **Expansion** : `PrisonerSerializer.to_representation` lit `?expand=crime_records,health_records,...`.
- **Filtres** : `django-filter` activé globalement ; seul `VisiteFilter` existe (`prisoner`, `prison`, `status`, `date`).
- Règles métier paramétrées dans `settings.py` : `PRISON_DAILY_VISIT_LIMIT=50`,
  `VISIT_MAX_DURATION_MINUTES=40`, `PRISON_DAILY_DEPLACEMENT_LIMIT=15`.

### Endpoints (préfixe `/api/`)
| Ressource | URL |
|---|---|
| Prisons | `prison/` (singulier) |
| Détenus | `prisoners/` (+ `?expand=`) |
| Sous-ressources détenu | `prisoners/{id}/crime-records/`, `health-records/`, `disciplinary-records/`, `emergency-contacts/` |
| Visites / visiteurs | `visits/` (filtres `prisoner`, `prison`, `status`, `date`), `visitors/` |
| Transferts / sorties | `transfers/`, `exits/` |
| Auth | `auth/login/`, `auth/logout/`, `auth/me/`, `auth/refresh/`, `auth/create-user/`, `auth/reset-password/`, `auth/change-password/` |

`APPEND_SLASH = False` mais le router DRF génère des URLs **avec slash final** : toujours appeler avec `/` final.

### Conventions de nommage
- Code (modèles, champs, classes) en **anglais**, `snake_case` pour les champs, `PascalCase` pour les classes.
- Noms d'apps mixtes FR/EN (`visite`, `deplacement` vs `prison`, `prisoner`).
- Messages d'erreur métier en anglais (traduits côté front par `errorMessages.ts`) ; messages de `sgpauth` en français.
- Faute de frappe existante à conserver tant qu'elle n'est pas migrée : `PisonerStatus`.

### Gestion des erreurs
- Gestionnaire d'exceptions DRF par défaut (aucun `EXCEPTION_HANDLER` personnalisé).
- Erreurs métier : `raise BadRequestException("...")` → `400 {"detail": "..."}`.
- Erreurs de validation de champ : format DRF standard `{"champ": ["message"]}`.
- `sgpauth` renvoie parfois `{"error": ...}` ou `{"message": ...}` directement.

### Format des réponses
- Pas d'enveloppe : objets/listes JSON bruts du serializer.
- **Pas de pagination** configurée : les listes sont des tableaux complets (le front l'attend ainsi).
- Les FK sont sérialisées en **id** (ex. `prison: 1`), sauf `Visit.visitor_name` qui est l'objet `Visitor` imbriqué
  en lecture (écriture via `visitor_id`).

---

## 5. Architecture frontend

- **Organisation** : inspirée « feature-sliced » : `app/` (bootstrap, router) → `pages/` (écrans routés) →
  `widgets/` (layout) → `features/<domaine>/` (api, hooks, types) → `shared/` (axios, utilitaires).
  Le dossier `components/` et `entities/` sont des reliquats de la première version (voir §9).
- **Couche API** (par feature) :
  - `features/<x>/api/<x>.api.ts` : fonctions async (`getX`, `getXById`, `addNewX`, `updateX`) utilisant `axiosInstance`.
  - `features/<x>/api/useGet<X>.ts` : hooks React Query (`useGetXs`, `useGetXById`, `useCreateX`, `useUpdateX`)
    qui invalident les `queryKey` de liste/détail après mutation.
  - `features/<x>/types/<x>.ts` : interface en `snake_case` calquée sur le JSON du backend + `CreateXDto` / `UpdateXDto`.
- **Pages** : `XPage.tsx` (liste), `XDetailPage.tsx`, `XFormPage.tsx` (création et édition, mode déterminé par `:id`).
  État des formulaires via `useState` local, pas de librairie de formulaires ni de validation schéma.
- **Routing** (`app/router/AppRouter.tsx`) : `/login` public ; le reste sous `AuthBootstrap` → `RequireAuth` → `Layout`.
  Routes : `/`, `/detenus[/:id|/new|/update/:id]`, `/visits[...]`, `/transfers[...]` (+ `sorties/new`, `sorties/update/:id`),
  `/incidents[...]`, `/infirmerie[...]`, `/pardons`, `/reinsertion`, `/transfers-releases`, `/reports`, `/security`,
  `/users`, `/settings`, `/generic-dashboard`, 404 interne.
- **État** :
  - Serveur : React Query (`QueryClient` dans `App.tsx` : `staleTime` 30 min, `retry: 1`, pas de refetch au focus).
  - Client : un seul store Zustand `useAuthStore` (`accessToken`, `user`), **en mémoire uniquement** (non persisté).
- **UI** : Tailwind CSS en classes utilitaires directement dans le JSX, icônes `lucide-react`, graphiques `recharts`,
  exports PDF `jspdf`/`jspdf-autotable`. Pas de librairie de composants. Interface en **français**.
- **Erreurs** : `shared/api/errorMessages.ts` → `getApiErrorMessages(error)` traduit les erreurs DRF en FR
  (utilisé pour l'instant uniquement dans `VisiteFormPage`).

---

## 6. Modèle de données (backend)

```
Prison (name, location, capacity, type)
 ├─< Quarter (name)                          FK prison  CASCADE
 │    └─< Cell (name, capacity)              FK quarter CASCADE
 ├─< Prisoner                                FK prison  CASCADE ; FK cell SET_NULL (nullable)
 │    (first_name, last_name, date_of_birth, incarceration_date [DateTime], release_date,
 │     status [Condamné|Prévenu|Libéré|Évadé|Décédé], sentence, matricule_number [unique, nullable],
 │     national_id, nationality, height, weight)
 │    ├─< PrisonerPhoto (photo ImageField)
 │    ├─< PrisonerDocument (document_type [jugement|certificat_medical|autre], title, file)
 │    ├─< EmergencyContact (name, relationship, phone_number, email)
 │    ├─< CrimeRecord (crime_type, description, date_of_crime)
 │    ├─< HealthRecord (medical_condition, description, date_of_diagnosis)        ← « Infirmerie » côté front
 │    ├─< DisciplinaryRecord (infraction, description, date_of_infraction)        ← « Incidents » côté front
 │    └─1 MoneyAccount (balance) ─< MonetaryTransaction (amount, transaction_type, description, date)
 ├─< Visit  (FK prison, FK prisoner, FK visitor_name→Visitor ; purpose, visit_date [auto], start_time,
 │           end_time, status [scheduled|completed|cancelled])
 ├─< Transfer (from_prison, to_prison, priority [NORMAL|CRITICAL|URGENT])  ┐ héritent du modèle abstrait
 └   Exit (due_return_date, is_returned, actual_return_date)               ┘ Deplacement :
       Deplacement = prisoner FK, date, destination, purpose, authorized_by (CharField), notes,
                     status [PENDING|APPROVED|REJECTED|COMPLETED]
Visitor (name, email, phone_number, national_id)
SGPUser (username, email, first_name, last_name, is_active, date_joined)  — sans lien avec auth.User
```
- Pas d'API exposée pour : Quarter, Cell, PrisonerPhoto, PrisonerDocument, MoneyAccount, MonetaryTransaction, SGPUser
  (accessibles seulement via `?expand=` en lecture pour certains).
- Les pages front Grâces, Réinsertion, Rapports, Sécurité, Utilisateurs, Paramètres n'ont **aucun modèle backend**.

---

## 7. Authentification et rôles

### Backend
- **Mécanisme prévu** : Keycloak (OIDC). `POST /api/auth/login/` fait un *password grant* vers Keycloak et renvoie
  la réponse Keycloak (`access_token`, `refresh_token`, …) ; les tokens sont aussi stockés en session Django.
  `KeycloakAccessTokenAuthentication` valide un JWT RS256 via JWKS.
- **Mode dev** `LOCAL_AUTH=true` : authentification Django locale (username ou email), renvoie un `Token` DRF
  opaque dans `access_token` **et** `refresh_token`.
- **Configuration effective** (`settings.REST_FRAMEWORK`) :
  - `DEFAULT_AUTHENTICATION_CLASSES` = `TokenAuthentication`, `SessionAuthentication`
    (la classe Keycloak est **commentée**).
  - `DEFAULT_PERMISSION_CLASSES` = `AllowAny`.
  - Tous les `permission_classes` des ViewSets métier sont **commentés** → **les endpoints métier sont publics**.
- **Rôles Keycloak** référencés (`realm_access.roles`) dans `sgpauth/permissions.py` :
  `adminpen` (`IsPenAdmin`), `ministryagent` (`IsMinistryAgent`), `visitor` (`IsVisitor`),
  `is_authenticated` (`IsKcAuthenticated`). `agentpen` existe seulement comme choix à la création d'utilisateur.
  Seule `CreateSGPUserView` applique une permission (`IsPenAdmin`).
- `HasKeycloakRole` lit les claims via `jwt.get_unverified_claims` (sans vérification de signature).

### Frontend (plan RBAC phases 0 et 4, voir `../PDSC/docs/PLAN_RBAC.md`)
- **Session** :
  - access token **en mémoire** (store Zustand), refresh token en cookie HttpOnly posé par le backend, jamais de `localStorage` ;
  - jeton CSRF obtenu par `GET auth/csrf/` et envoyé en `X-CSRFToken` sur les requêtes d'écriture ;
  - `features/auth/session.ts` : refresh proactif avant expiration, refresh unique (Web Locks + `BroadcastChannel` entre onglets), déconnexion propagée à tous les onglets, `queryClient.clear()`.
- **Utilisateur** : `GET auth/me/` (`features/auth/types/user.types.ts`) fournit `role`, `prison`, `scope`, `permissions` (`"<ressource>:<read|create|update|delete|validate|complete>"`), `access` et `rbac_enforced`. Les rôles ne sont **plus** lus dans le JWT.
- **Configuration unique** : `features/auth/config/rbac.ts`. Ce fichier est un miroir d'affichage de `sgpauth/rbac/policy.py`. Il contient :
  - `ROLES`, `ROLE_LABELS`, et les familles `PRISON_ROLES`, `NATIONAL_READ_ONLY_ROLES`, `PRISONER_LINKED_ROLES` ;
  - `ROUTE_ACCESS` : règle `{perm | anyOf | roles}` par chemin, lue à la fois par le routeur et par le menu ;
  - `ACTIONS` : action nommée → permission ;
  - `HOME_REDIRECT`, les codes et messages de compte, `FORBIDDEN_MESSAGE` et `SESSION_EXPIRED_MESSAGE`.
- **Droits d'affichage** (le backend reste seul juge) :
  - `usePermissions()` → `can('transfers:validate')`, `canAny([...])`, `canDo('transfer.decide')`, `allows(règle)`, `isMyPrison(prisonId)` ;
  - `useRole()` → `role`, `label`, `is(...)`, `isPrisonStaff`, `isNationalReadOnly`, `isRelative`, `isJudicialActor` (affichage uniquement, jamais pour un droit) ;
  - `<Can perm=… | anyOf=… | action=… when=…>` masque un bouton ;
  - `ProtectedRoute` (via `guard('<chemin>', …)` dans `AppRouter.tsx`) applique `ROUTE_ACCESS[chemin]` et redirige vers `/403` (`pages/errors/ForbiddenPage.tsx`) ;
  - le menu (`Sidebar.tsx`) est filtré avec les mêmes règles ; les écrans maquettes sont réservés au SUPER_ADMIN.
- **Intercepteur** (`shared/api/axiosInstance.ts`) :
  - **401** : refresh puis nouvel essai une fois. Si le refresh échoue, ou si la requête rejouée reçoit encore 401, la session locale est effacée et `/login` affiche « session expirée » ;
  - **403 sur une action** : bandeau global `FORBIDDEN_MESSAGE` (`shared/notifications/`), sans déconnexion. L'option axios `silentForbidden: true` le désactive quand la page affiche elle-même l'erreur ;
  - **403 `account_*`** : redirection vers `/compte`.
- **Comptes bloqués** (`access` ≠ `granted`, ou 403 `account_*` d'axios) : `RequireAuth` redirige vers `/compte` (`pages/errors/AccountStatusPage.tsx`).
- **Accueil** (`pages/home/HomePage.tsx`) et menu, selon le rôle :
  - PERSONNEL_SANTE → `/infirmerie` (`HOME_REDIRECT`) ;
  - REP_MIN_JUSTICE et REP_MIN_INTERIEUR → `NationalDashboard`, vue nationale en lecture seule (indicateurs, détenus présents par établissement en graphique et en tableau) ;
  - PROCHE_REFERENT et ACTEUR_JUDICIAIRE → `WelcomePage`, qui affiche « Mes détenus » (détenus filtrés par le backend, avec lien de parenté ou fonction et dossier) et des raccourcis filtrés par `ROUTE_ACCESS` ;
  - autres rôles → `Dashboard` de l'établissement.
  Le libellé de l'accueil dans le menu suit le rôle ; `hideFor` retire les entrées qui feraient doublon avec l'accueil.
- **Comptes et proches (phase 5)** :
  - `/users` (`pages/users/UsersPage.tsx` + `UserForm.tsx`) : liste, création, modification et désactivation des comptes.
    - Rôles proposés : `assignable_roles` de `/me` ; boutons limités aux comptes dont le rôle est attribuable.
    - Établissement affiché et obligatoire si `roleRequiresPrison(rôle)` ; imposé (non modifiable) pour l'ADMIN_PRISON.
    - Proche : un ou plusieurs détenus (`links`) à la création ; ensuite, via `/proches`.
    - Acteur judiciaire : affectations créées après le compte par `judicial-assignments/` (si `judicial_assignments:create`).
  - `/proches` : file de validation des proches (pièces téléchargées via l'API, jamais par URL media) ;
  - `/affectations` : affectations judiciaires, gérées par le SA ;
  - `/inscription` (public) : inscription d'un proche ;
  - `features/proches/components/RelativeRequestsPanel.tsx` : demandes et dépôt de pièces du proche, aussi affiché sur `/compte` pendant l'attente de validation.
- **Mode observation** : tant que le backend a `RBAC_ENFORCED=False`, `/me` renvoie toutes les permissions sauf le médical. L'interface montre donc tout, sauf l'infirmerie (réservée à PERSONNEL_SANTE).

---

## 8. Conventions pour le nouveau code

Déduites des parties les plus récentes et cohérentes du code (`features/` + `pages/` côté front, ViewSets côté back) :

**Frontend**
- Nouveau domaine = `src/features/<domaine>/{api/<domaine>.api.ts, api/useGet<Domaine>.ts, types/<domaine>.ts}`
  + pages dans `src/pages/<domaine>/` + route dans `AppRouter.tsx` + entrée dans `widgets/sidebar/Sidebar.tsx`.
- Toujours passer par `shared/api/axiosInstance` (chemins relatifs avec slash final : `'visits/'`, `` `visits/${id}/` ``).
- Accès aux données via hooks React Query ; invalider les `queryKey` de liste et de détail après mutation.
- Types en `snake_case` identiques au JSON du backend ; DTO `Create…Dto` / `Update…Dto` via `Omit`/`Partial`.
- Composants fonctionnels `React.FC` en **export nommé** (`export const XPage`), Tailwind inline, icônes lucide.
- Libellés UI en français ; afficher les erreurs API via `getApiErrorMessages` (messages stables pour 403, 404 et 429).
- **Droits** :
  - toute nouvelle route déclare sa règle dans `ROUTE_ACCESS` (`features/auth/config/rbac.ts`) et est enveloppée de `guard('<chemin>', …)` dans `AppRouter.tsx` ; l'entrée de menu reprend le même chemin ;
  - tout bouton d'action est enveloppé de `<Can perm=… when=…>`, avec `when={isMyPrison(objet.prison)}` pour les objets d'une prison ;
  - les listes dont la lecture n'est pas accordée à tous passent `enabled: can('<ressource>:read')` à leur hook ;
  - les champs gérés par le serveur (`status`, `authorized_by`, `prison` imposée…) ne sont pas envoyés.
- Ne pas ajouter de code dans `components/`/`entities/` (anciens composants mock) ; ne pas ajouter de librairie UI
  (consigne `.bolt/prompt`).

**Backend**
- Une app Django par domaine ; `ModelSerializer` + `ModelViewSet` ; enregistrer le ViewSet dans `apicore/api_router.py`.
- Règles métier : mixin `XValidator` dans `validators.py`, appelé depuis `Serializer.validate()`, lever
  `core.exceptions.generic_exceptions.BadRequestException`.
- Constantes métier dans `settings.py`.
- Code en anglais, enums en `TextChoices`.
- Créer les migrations avec `makemigrations` et les committer.

**Tests** : aucun test n'existe (ni front ni back) ; aucune convention établie.
**Style** : ESLint côté front (config par défaut du template) ; aucun formatter (Prettier/Black) configuré.

---

## 9. Points faibles / dette technique (constatés, non corrigés)

### Sécurité
- **API métier publique** : `AllowAny` global + permissions commentées ; la classe d'auth Keycloak est désactivée.
- `TokenAuthentication` attend le préfixe `Token`, alors que le front envoie `Bearer` → les requêtes
  semblent traitées comme anonymes (à confirmer, cf. À clarifier).
- `SECRET_KEY` Django codée en dur dans `settings.py` ; `DEBUG = True` en dur.
- CORS ouvert à toutes les origines avec `CORS_ALLOW_CREDENTIALS = True` ; cookies non `Secure`.
- `HasKeycloakRole` lit les rôles sans vérifier la signature du token.
- `ResetPasswordView` sans authentification ; `ChangePasswordView` avec `IsAuthenticated` commenté
  (vérifie toutefois le token manuellement) ; `temporary_password` par défaut `"Temp1234"`.
- `api/proxy.js` : IP backend en dur, en HTTP clair, et logs des requêtes.
- Mode `LOCAL_AUTH` : le même token DRF sert d'access et de refresh token.

### Incohérences front ↔ back
- **Refresh token cassé** : le front envoie `{}` à `auth/refresh/` et attend `{ accessToken }` ; le backend exige
  `refresh_token` dans le body et renvoie `access_token`. Le token n'étant pas persisté, un rechargement de page
  renvoie vraisemblablement vers `/login`.
- `refresh_token` reçu au login n'est pas conservé côté front.
- Types front désynchronisés : `Detenu.sex` (inexistant au back), `Transfert.transfer_date` (supprimé par migration),
  `Deplacement.authorized_by` déclaré `StringRelatedField` sur un `CharField`.
- `VisiteFormPage` : `prison: 1` codé en dur ; crée un nouveau `Visitor` à chaque soumission (y compris en édition).
- `TransferSerializer` : `destination` (champ obligatoire du modèle) absent des `fields`.
- Validation de chevauchement des transferts : compare seulement la date du jour, pas d'intervalle.

### Qualité / maintenance
- Lint : `npm run lint` → **86 problèmes (78 erreurs, 8 warnings)** ; `tsc` → **70 erreurs** de type.
  Le build passe car `vite build` ne type-check pas.
- Code mort front : `components/{InmateList, Transfers, VisitManagement, LoadingSpinner, Layout, Header, Navigation}`,
  `components/inmates/InmateDetail`, `components/{prison/prisonSelect, transfert/SortieFormModal,
  transfert/TransfertFormModal, visite/VisiteFormModal}`, `app/providers/QueryProvider`, `entities/Detenus2`.
- Pages routées à **données statiques** (sans API) : `PresidentialPardons`, `ReinsertionManagement`,
  `TransfersReleases`, `ReportsManagement`, `SecurityDashboard`, `GenericDashboard`, `Users`, `Settings` ;
  `Dashboard` mélange données API et données en dur (`crimeData`).
- Deux couches de types parallèles (`entities/` camelCase vs `features/*/types` snake_case).
- `console.log` de données sensibles (détenus) dans les fonctions API ; `any` fréquents ; paramètre inutilisé
  `p0` dans `useGetDetenuById`.
- Aucun test (front et back) ; aucun CI.
- Backend : pas de couche service ; `print()` de debug dans `deplacement/validators.py` ; `from .models import *` ;
  app `documents` vide ; `prison/urls.py`, `prisoner/urls.py`, `visite/urls.py` non utilisés (et `prison/urls.py`
  invalide : `ViewSet.as_view()` sans actions).
- `core` absent de `INSTALLED_APPS` → `CoreConfig.ready()` (extension Swagger Bearer) jamais exécuté.
- `SGPUser` dupliqué avec Keycloak et sans lien avec `auth.User`.
- `Prisoner.prison` en `CASCADE` (supprimer une prison supprime ses détenus) ; `national_id` non unique (commentaire TODO).
- `Visit.visitor_name` est une FK vers `Visitor` (nom trompeur) ; `visit_date` en `auto_now_add`.
- `entrypoint.sh` lance `makemigrations` au démarrage du conteneur ; `docker-compose` surcharge la commande avec
  `runserver` sans `0.0.0.0:8090` (écoute sur 127.0.0.1:8000 dans le conteneur alors que 8090 est publié).
- `runserver` utilisé en production (gunicorn commenté) ; Keycloak en `start-dev` et tag `latest`.
- `requirements.txt` : paquets non épinglés (`cryptography`, `djangorestframework-simplejwt`, `django-filter`) ;
  `minio` manquant ; `simplejwt` inutilisé.
- Backend : 11 fichiers modifiés et 6 migrations **non commitées** (dont une modification de `deplacement/migrations/0001_initial.py`).
- `LANGUAGE_CODE = 'en-us'`, `TIME_ZONE = 'UTC'` pour une application sénégalaise francophone.

---

## À clarifier

1. **Nom et périmètre** : « SIGEP-SN » vs « SGP API » vs « Saytou prison » — quel est le nom officiel ?
2. **Authentification cible** : Keycloak en production, ou `LOCAL_AUTH` ? Quel `DEFAULT_AUTHENTICATION_CLASSES` est voulu
   (la classe Keycloak est commentée) ? Le préfixe `Bearer` est-il réellement rejeté/ignoré en pratique ?
3. **Rôles** : quelle matrice rôle → écrans/actions ? (`adminpen`, `agentpen`, `ministryagent`, `visitor` existent
   mais ne sont appliqués nulle part.)
4. **Refresh token** : stratégie voulue (cookie HttpOnly, comme le suggère le commentaire front, ou body) ?
5. **Valeur de `VITE_API_URL`** en dev vs prod (non lue lors de l'analyse) et rôle exact du proxy Vercel vs proxy Vite.
6. **Pages mock** (Grâces, Réinsertion, Rapports, Sécurité, Utilisateurs, Paramètres) : à brancher sur une API future ou maquettes ?
7. **Version de Python** cible (3.12 Docker vs 3.14 venv local).
8. **MinIO** : stockage des documents prévu pour quand ? (code présent mais désactivé).
9. **Multi-prisons** : l'utilisateur est-il rattaché à une prison ? (le front code `prison: 1` en dur).
10. Branches : `V3` (front) / `feat-man` (back) — quelle est la branche d'intégration ? (`main` existe sur les deux).
