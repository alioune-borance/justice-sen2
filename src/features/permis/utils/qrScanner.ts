// Lecture du QR code des permis avec l'API native BarcodeDetector (Chrome, Edge, Android).
// Pas de dépendance : sur un navigateur sans BarcodeDetector, la saisie manuelle (ou une douchette
// USB, qui « tape » le contenu du QR) reste disponible.

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorInstance {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

const getDetectorClass = (): BarcodeDetectorConstructor | undefined =>
  (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;

export const isQrScanSupported = (): boolean =>
  !!getDetectorClass() && !!navigator.mediaDevices?.getUserMedia;

export const createQrDetector = (): BarcodeDetectorInstance | null => {
  const Detector = getDetectorClass();
  return Detector ? new Detector({ formats: ["qr_code"] }) : null;
};

// Contenu du QR d'un permis : « SIGEP-PV|<numéro>|<code> » (aucune donnée personnelle).
// Renvoie le code de vérification (plus sûr que le numéro), sinon la saisie telle quelle.
export const parsePermitInput = (raw: string): string => {
  const value = raw.trim();
  const parts = value.split("|");
  if (parts.length === 3 && parts[0].toUpperCase() === "SIGEP-PV") {
    return parts[2].trim() || parts[1].trim();
  }
  return value;
};
