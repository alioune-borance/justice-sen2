import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, Clock, ScanLine, ShieldX } from "lucide-react";
import { useVerifyPermis } from "../../features/permis/api/usePermis";
import { ETAT_PERMIS_STYLES, VerificationResponse } from "../../features/permis/types/permis";
import { createQrDetector, isQrScanSupported, parsePermitInput } from "../../features/permis/utils/qrScanner";
import { formatDate, formatDateTime } from "../../shared/utils/dates";
import { getApiErrorMessage } from "../../shared/api/errorMessages";

interface CheckEntry {
  at: string;
  saisie: string;
  result: VerificationResponse;
}

const SCAN_INTERVAL_MS = 300;

// Agent pénitentiaire (et AP / SP) : contrôle d'un permis à l'entrée, par numéro, code ou QR code.
// Le backend ne cherche que parmi les permis de la prison de l'agent et trace chaque contrôle.
export const VerificationPermisPage: React.FC = () => {
  const verify = useVerifyPermis();
  const [saisie, setSaisie] = useState("");
  const [current, setCurrent] = useState<CheckEntry | null>(null);
  const [recent, setRecent] = useState<CheckEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scanSupported = isQrScanSupported();

  const check = useCallback(
    async (raw: string) => {
      const value = parsePermitInput(raw);
      if (!value) return;
      setError(null);
      try {
        const result = await verify.mutateAsync(value);
        const entry = { at: new Date().toISOString(), saisie: value, result };
        setCurrent(entry);
        setRecent((list) => [entry, ...list].slice(0, 10));
        setSaisie("");
      } catch (e) {
        setError(getApiErrorMessage(e));
      }
    },
    [verify]
  );

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setScanning(true);
    } catch {
      setCameraError("Caméra inaccessible. Autorisez la caméra ou saisissez le numéro du permis.");
    }
  };

  // Branche le flux vidéo puis lit le QR à intervalle régulier ; s'arrête à la première lecture
  useEffect(() => {
    if (!scanning || !videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play().catch(() => undefined);
    const detector = createQrDetector();
    if (!detector) return;

    let busy = false;
    const timer = setInterval(async () => {
      if (busy || video.readyState < 2) return;
      busy = true;
      try {
        const codes = await detector.detect(video);
        if (codes.length > 0) {
          stopCamera();
          await check(codes[0].rawValue);
        }
      } catch {
        // image illisible : on réessaie au prochain tour
      } finally {
        busy = false;
      }
    }, SCAN_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [scanning, check, stopCamera]);

  useEffect(() => stopCamera, [stopCamera]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    check(saisie).then(() => inputRef.current?.focus());
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 p-2"><ScanLine className="h-6 w-6 text-blue-600" /></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vérifier un permis de visite</h2>
          <p className="text-sm text-gray-500">Numéro (PV-AAAA-NNNNNN), code de vérification ou QR code du permis</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <input ref={inputRef} value={saisie} onChange={(e) => setSaisie(e.target.value)} autoFocus maxLength={60}
            placeholder="Numéro ou code du permis" aria-label="Numéro ou code du permis"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-mono text-lg uppercase tracking-wide" />
          <button type="submit" disabled={!saisie.trim() || verify.isPending}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50">
            {verify.isPending ? "Vérification…" : "Vérifier"}
          </button>
        </div>

        {scanSupported ? (
          scanning ? (
            <div className="space-y-2">
              <video ref={videoRef} muted playsInline className="w-full max-w-md rounded-lg bg-black" />
              <button type="button" onClick={stopCamera} className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                <CameraOff className="h-4 w-4" /> Arrêter la caméra
              </button>
            </div>
          ) : (
            <button type="button" onClick={startCamera} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
              <Camera className="h-4 w-4" /> Scanner le QR code avec la caméra
            </button>
          )
        ) : (
          <p className="text-xs text-gray-500">
            Lecture par caméra non disponible sur ce navigateur : utilisez une douchette ou saisissez le numéro.
          </p>
        )}
        {cameraError && <p className="text-sm text-red-600">{cameraError}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {current && <VerificationResult entry={current} />}

      {recent.length > 1 && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">Derniers contrôles (cette session)</h3>
          <ul className="divide-y divide-gray-100 text-sm">
            {recent.slice(1).map((entry) => (
              <li key={entry.at} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" /> {formatDateTime(entry.at)} — <span className="font-mono">{entry.saisie}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${ETAT_PERMIS_STYLES[entry.result.resultat]}`}>
                  {entry.result.resultat_label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

// Résultat en grand : vert si l'accès est possible, rouge sinon, avec les éléments à contrôler sur la pièce d'identité
const VerificationResult: React.FC<{ entry: CheckEntry }> = ({ entry }) => {
  const { resultat, resultat_label, permis } = entry.result;
  const ok = resultat === "VALIDE";
  return (
    <section
      role="status"
      className={`space-y-4 rounded-lg border-2 p-6 ${ok ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
    >
      <div className="flex items-center gap-3">
        {ok ? <CheckCircle2 className="h-10 w-10 text-green-600" /> : <ShieldX className="h-10 w-10 text-red-600" />}
        <div>
          <p className={`text-2xl font-bold ${ok ? "text-green-800" : "text-red-800"}`}>
            {ok ? "Permis valide" : `Accès refusé — ${resultat_label}`}
          </p>
          <p className="text-sm text-gray-600">Saisie : <span className="font-mono">{entry.saisie}</span> — {formatDateTime(entry.at)}</p>
        </div>
      </div>

      {resultat === "INTROUVABLE" && (
        <p className="text-sm text-red-800">
          Aucun permis de votre établissement ne correspond. Vérifiez la saisie ; un permis d'un autre établissement n'est pas valable ici.
        </p>
      )}

      {permis && (
        <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <Item label="Permis" value={permis.numero} />
          <Item label="Validité" value={`du ${formatDate(permis.valide_du)} au ${formatDate(permis.valide_au)}`} />
          <Item label="Détenu" value={`${permis.detenu_nom}${permis.detenu_matricule ? ` (${permis.detenu_matricule})` : ""}`} />
          <Item label="Établissement" value={permis.prison_nom} />
          <Item label="Titulaire (à contrôler sur sa pièce)" value={`${permis.titulaire_nom} — pièce ${permis.titulaire_piece}`} />
          <Item label="Autres visiteurs autorisés"
            value={permis.visiteurs_supplementaires.length
              ? permis.visiteurs_supplementaires.map((v) => `${v.nom} (${v.piece_identite})`).join(", ")
              : "Aucun"} />
          <Item label="Signataire" value={`${permis.signataire_nom}, ${permis.signataire_qualite}`} />
          {permis.revoque_le && <Item label="Révoqué le" value={`${formatDateTime(permis.revoque_le)} : ${permis.motif_revocation}`} />}
        </dl>
      )}
    </section>
  );
};

const Item: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt className="text-gray-500">{label}</dt>
    <dd className="font-medium text-gray-900">{value}</dd>
  </div>
);
