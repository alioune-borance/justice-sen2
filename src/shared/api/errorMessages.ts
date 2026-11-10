import { AxiosError } from 'axios';

// Libellés FR des champs les plus courants renvoyés par l'API (formulaires visites, détenus, etc.)
const FIELD_LABELS: Record<string, string> = {
  visitor_name: 'Nom du visiteur',
  visitor_email: 'Email du visiteur',
  visitor_phone_number: 'Téléphone du visiteur',
  visitor_national_id: 'Numéro CNI',
  visitor_id: 'Visiteur',
  name: 'Nom',
  email: 'Email',
  phone_number: 'Téléphone',
  national_id: 'Numéro CNI',
  prisoner: 'Détenu',
  visit_date: 'Date de visite',
  start_time: 'Heure de début',
  end_time: 'Heure de fin',
  purpose: 'Motif de la visite',
  status: 'Statut',
  prison: 'Prison',
};

// Traductions des noms de modèle / champs tels qu'ils apparaissent dans les phrases du backend (ex: "visitor with this email already exists.")
const MODEL_LABELS: Record<string, string> = {
  visitor: 'visiteur',
  visit: 'visite',
  prisoner: 'détenu',
  detenu: 'détenu',
  user: 'utilisateur',
};

const WORD_LABELS: Record<string, string> = {
  email: 'email',
  'national id': 'numéro de CNI',
  'phone number': 'numéro de téléphone',
  name: 'nom',
};

function translateModelName(raw: string): string {
  return MODEL_LABELS[raw.toLowerCase()] ?? raw.toLowerCase();
}

function translateWordLabel(raw: string): string {
  return WORD_LABELS[raw.toLowerCase()] ?? raw.toLowerCase();
}

// Champs dont le libellé ne doit pas être préfixé au message
const UNPREFIXED_KEYS = new Set(['detail', 'non_field_errors', 'message', 'error']);

type TranslationRule = { pattern: RegExp; translate: (match: RegExpMatchArray) => string };

// Traductions des messages de validation les plus fréquemment renvoyés par le backend (Django REST Framework)
const RULES: TranslationRule[] = [
  { pattern: /^visit duration must not exceed (\d+) minutes?\.?$/i, translate: (m) => `La durée de la visite ne doit pas dépasser ${m[1]} minutes.` },
  { pattern: /^this field is required\.?$/i, translate: () => 'Ce champ est obligatoire.' },
  { pattern: /^this field may not be blank\.?$/i, translate: () => 'Ce champ ne peut pas être vide.' },
  { pattern: /^this field may not be null\.?$/i, translate: () => 'Ce champ ne peut pas être vide.' },
  { pattern: /^enter a valid email address\.?$/i, translate: () => 'Veuillez saisir une adresse email valide.' },
  { pattern: /^a valid integer is required\.?$/i, translate: () => 'Un nombre entier valide est requis.' },
  { pattern: /^a valid number is required\.?$/i, translate: () => 'Un nombre valide est requis.' },
  { pattern: /^date has wrong format.*$/i, translate: () => 'Le format de la date est incorrect (attendu : AAAA-MM-JJ).' },
  { pattern: /^datetime has wrong format.*$/i, translate: () => "Le format de l'heure est incorrect." },
  { pattern: /^ensure this field has no more than (\d+) characters?\.?$/i, translate: (m) => `Ce champ ne doit pas dépasser ${m[1]} caractères.` },
  { pattern: /^ensure this field has at least (\d+) characters?\.?$/i, translate: (m) => `Ce champ doit contenir au moins ${m[1]} caractères.` },
  { pattern: /^ensure this value is greater than or equal to (\d+)\.?$/i, translate: (m) => `La valeur doit être supérieure ou égale à ${m[1]}.` },
  { pattern: /^ensure this value is less than or equal to (\d+)\.?$/i, translate: (m) => `La valeur doit être inférieure ou égale à ${m[1]}.` },
  { pattern: /^invalid pk "?(.+?)"? - object does not exist\.?$/i, translate: (m) => `La valeur sélectionnée (${m[1]}) n'existe pas.` },
  { pattern: /^object with (.+) = (.+) does not exist\.?$/i, translate: (m) => `Aucun élément trouvé avec ${m[1]} = ${m[2]}.` },
  { pattern: /^end time must be after start time\.?$/i, translate: () => "L'heure de fin doit être postérieure à l'heure de début." },
  { pattern: /^start time must be before end time\.?$/i, translate: () => "L'heure de début doit être antérieure à l'heure de fin." },
  { pattern: /^the fields? (.+) must make a unique set\.?$/i, translate: (m) => `Les champs ${m[1]} doivent former un ensemble unique.` },
  { pattern: /^this field must be unique\.?$/i, translate: () => 'Cette valeur doit être unique.' },
  { pattern: /^visitor with this email already exists\.?$/i, translate: () => 'Un visiteur avec cet email existe déjà.' },
  { pattern: /^visitor with this national id already exists\.?$/i, translate: () => 'Un visiteur avec ce numéro de CNI existe déjà.' },
  { pattern: /^(\w+) with this (.+) already exists\.?$/i, translate: (m) => `Un ${translateModelName(m[1])} avec ce ${translateWordLabel(m[2])} existe déjà.` },
  { pattern: /^unable to log in with provided credentials\.?$/i, translate: () => 'Identifiants incorrects.' },
  { pattern: /^not found\.?$/i, translate: () => 'Élément introuvable.' },
  { pattern: /^authentication credentials were not provided\.?$/i, translate: () => 'Authentification requise. Veuillez vous reconnecter.' },
  { pattern: /^you do not have permission to perform this action\.?$/i, translate: () => "Vous n'avez pas la permission d'effectuer cette action." },
];

function translateMessage(message: string): string {
  const trimmed = message.trim();
  for (const rule of RULES) {
    const match = trimmed.match(rule.pattern);
    if (match) return rule.translate(match);
  }
  return trimmed;
}

function formatEntry(key: string, rawMessage: string): string {
  const translated = translateMessage(rawMessage);
  if (UNPREFIXED_KEYS.has(key)) return translated;
  const label = FIELD_LABELS[key] ?? key;
  return `${label} : ${translated}`;
}

/**
 * Extrait et traduit en français les messages d'erreur renvoyés par l'API
 * (ex: { "detail": "Visit duration must not exceed 40 minutes." } ou
 * { "start_time": ["This field is required."] }).
 */
// Messages selon le code HTTP, quand la réponse ne porte pas de message de champ exploitable
const STATUS_MESSAGES: Record<number, string> = {
  403: "Vous n'avez pas les droits pour cette action.",
  404: 'Élément introuvable ou hors de votre périmètre.',
  429: 'Trop de tentatives. Réessayez dans une minute.',
};

export function getApiErrorMessages(error: unknown): string[] {
  const axiosError = error as AxiosError;

  if (!axiosError?.response) {
    return ['Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.'];
  }

  const status = axiosError.response.status;
  if (status in STATUS_MESSAGES) {
    // Les erreurs de droits / périmètre ont un libellé stable, indépendant du message backend
    return [STATUS_MESSAGES[status]];
  }

  const data = axiosError.response.data;

  if (typeof data === 'string' && data.trim()) {
    return [translateMessage(data)];
  }

  if (Array.isArray(data)) {
    const messages = data.map((m) => translateMessage(String(m)));
    return messages.length ? messages : ['Une erreur est survenue. Veuillez réessayer.'];
  }

  if (data && typeof data === 'object') {
    const messages: string[] = [];
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (key === 'code') continue; // code technique ({"detail", "code"}) : pas un message
      const rawList = Array.isArray(value) ? value : [value];
      for (const raw of rawList) {
        if (raw == null) continue;
        messages.push(formatEntry(key, String(raw)));
      }
    }
    if (messages.length) return messages;
  }

  return ['Une erreur est survenue. Veuillez réessayer.'];
}

export function getApiErrorMessage(error: unknown): string {
  return getApiErrorMessages(error).join(' ');
}
