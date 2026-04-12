// features/detenus/pages/InmateFormPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save, X, Camera, RefreshCw, Fingerprint, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import countries from 'i18n-iso-countries';
import fr from 'i18n-iso-countries/langs/fr.json';
import { useGetDetenuById } from '../../features/detenus/api/useGetDetenu';
import { useGetPrisons } from '../../features/prisons/api/useGetPrison';

countries.registerLocale(fr);
const countryOptions = Object.entries(countries.getNames('fr', { select: 'official' }))
  .sort(([, a], [, b]) => a.localeCompare(b, 'fr'));

interface Prison {
  id: number;
  name: string;
  location?: string;
}

export const DetenuFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const detenuId = id ? parseInt(id) : undefined;

  const { data: detenu, isLoading: isLoadingDetenu } = useGetDetenuById(detenuId || 0, {
    enabled: isEditMode
  });
  const { data: prisons = [], isLoading: isLoadingPrisons } = useGetPrisons();

  const [photo, setPhoto] = useState<string | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setWebcamActive(true);
    } catch {
      alert("Impossible d'accéder à la webcam.");
    }
  }, []);

  const stopWebcam = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setWebcamActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL('image/jpeg'));
    stopWebcam();
  }, [stopWebcam]);

  const retakePhoto = useCallback(() => {
    setPhoto(null);
    startWebcam();
  }, [startWebcam]);

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  type FpStatus = 'idle' | 'connecting' | 'waiting' | 'captured' | 'error';
  const [fpStatus, setFpStatus] = useState<FpStatus>('idle');
  const [fpImage, setFpImage] = useState<string | null>(null);
  const [fpError, setFpError] = useState<string>('');
  const fpSocketRef = useRef<WebSocket | null>(null);

  const startFingerprint = useCallback(() => {
    setFpStatus('connecting');
    setFpError('');
    setFpImage(null);
    try {
      // Le driver/agent du lecteur expose un WS local (port standard 9000)
      const ws = new WebSocket('ws://localhost:9000');
      fpSocketRef.current = ws;

      ws.onopen = () => {
        setFpStatus('waiting');
        ws.send(JSON.stringify({ action: 'capture' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.image) {
            setFpImage(data.image); // base64 PNG/BMP
            setFpStatus('captured');
            ws.close();
          } else if (data.error) {
            setFpError(data.error);
            setFpStatus('error');
            ws.close();
          }
        } catch {
          setFpError('Réponse invalide du lecteur.');
          setFpStatus('error');
        }
      };

      ws.onerror = () => {
        setFpError("Impossible de contacter le lecteur d'empreinte. Vérifiez que le dispositif est branché et que son agent est démarré.");
        setFpStatus('error');
      };

      ws.onclose = (e) => {
        if (fpStatus === 'waiting' && e.code !== 1000) {
          setFpError('Connexion fermée inattenduement.');
          setFpStatus('error');
        }
      };
    } catch {
      setFpError("Erreur lors de la connexion au lecteur.");
      setFpStatus('error');
    }
  }, [fpStatus]);

  const resetFingerprint = useCallback(() => {
    fpSocketRef.current?.close();
    setFpStatus('idle');
    setFpImage(null);
    setFpError('');
  }, []);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    incarceration_date: '',
    release_date: '',
    prison: '',
    status: '',
    nationality: '',
    national_id: '',
    height: '',
    weight: '',
    matricule_number: '',
    sex: ''
  });

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && detenu) {
      setFormData({
        first_name: detenu.first_name || '',
        last_name: detenu.last_name || '',
        date_of_birth: detenu.date_of_birth || '',
        incarceration_date: detenu.incarceration_date || '',
        release_date: detenu.release_date || '',
        prison: detenu.prison?.toString() || '',
        status: detenu.status?.toString() || '',
        nationality: detenu.nationality || '',
        national_id: detenu.national_id || '',
        height: detenu.height?.toString() || '',
        weight: detenu.weight?.toString() || '',
        matricule_number: detenu.matricule_number || '',
        sex: detenu.sex || ''
      });
    }
  }, [isEditMode, detenu]);

  const statusDetenu = [
    'Condamné',
    'Prévenu'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement submit logic with mutation
    console.log('Form submitted:', formData);
    navigate('/detenus');
  };

  const openFormDetenu = () => {
    navigate('/detenus/new');
  }

  const handleCancel = () => {
    navigate(-1);
  };

  if (isEditMode && isLoadingDetenu) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des informations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </button>
        <h1 className="text-2xl font-bold text-slate-800">
          {isEditMode ? 'Modifier le détenu' : 'Ajouter un détenu'}
        </h1>
        <div className="w-24"></div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          {/* Header with icon */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start space-x-4">
              {/* Photo / Webcam */}
              <div className="flex flex-col items-center space-y-2">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-200 bg-blue-50 flex items-center justify-center relative">
                  {photo ? (
                    <img src={photo} alt="Photo détenu" className="w-full h-full object-cover" />
                  ) : webcamActive ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-blue-400" />
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
                {!webcamActive && !photo && (
                  <button type="button" onClick={startWebcam}
                    className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium">
                    <Camera className="h-3 w-3 mr-1" /> Prendre une photo
                  </button>
                )}
                {webcamActive && (
                  <div className="flex space-x-2">
                    <button type="button" onClick={capturePhoto}
                      className="flex items-center text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                      <Camera className="h-3 w-3 mr-1" /> Capturer
                    </button>
                    <button type="button" onClick={stopWebcam}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border rounded">
                      Annuler
                    </button>
                  </div>
                )}
                {photo && (
                  <button type="button" onClick={retakePhoto}
                    className="flex items-center text-xs text-gray-500 hover:text-gray-700 font-medium">
                    <RefreshCw className="h-3 w-3 mr-1" /> Reprendre
                  </button>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800">
                  {isEditMode ? 'Modification de la fiche détenu' : 'Nouvelle fiche détenu'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {isEditMode
                    ? 'Modifiez les informations du détenu ci-dessous'
                    : "Remplissez tous les champs obligatoires marqués d'un astérisque (*)"}
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Informations du détenu</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Informations personnelles</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom *
                      </label>
                      <input 
                        type="text" 
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="Entrez le prénom"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom *
                      </label>
                      <input 
                        type="text" 
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="Entrez le nom"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date de naissance *
                      </label>
                      <input 
                        type="date" 
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nationalité *
                      </label>
                      <select
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        required
                      >
                        <option value="">Sélectionner une nationalité</option>
                        {countryOptions.map(([code, name]) => (
                          <option key={code} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro d'identification national *
                      </label>
                      <input 
                        type="text" 
                        name="national_id"
                        value={formData.national_id}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="Entrez le numéro d'identification national"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sexe *
                      </label>
                      <select
                        name="sex"
                        value={formData.sex}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        required
                      >
                        <option value="">Sélectionner le sexe</option>
                        <option value="Mâle">Mâle</option>
                        <option value="Femelle">Femelle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Taille (en cm)*
                      </label>
                      <input 
                        type="text" 
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="Entrez la taille du détenu"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Poids (en kg)*
                      </label>
                      <input 
                        type="text" 
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="Entrez le poids du détenu"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Informations de détention</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Statut du détenu *
                      </label>
                      <select 
                        name="status" 
                        value={formData.status}
                        onChange={handleChange}
                        disabled={isLoadingPrisons}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      >
                        <option value="">Statut du détenu</option>
                        {isLoadingPrisons ? (
                          <option value="" disabled>Chargement des statuts...</option>
                        ) : (
                          statusDetenu.map((s: string) => (
                            <option key={s} value={s}>
                              { s }
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Matricule du détenu *
                      </label>
                      <input 
                        type="text" 
                        name="matricule_number"
                        value={formData.matricule_number}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="Entrez le matricule du détenu"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date d'incarcération *
                      </label>
                      <input 
                        type="date" 
                        name="incarceration_date"
                        value={formData.incarceration_date}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date de libération prévue (si inculpé)
                      </label>
                      <input 
                        type="date" 
                        name="release_date"
                        value={formData.release_date}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Établissement *
                      </label>
                      <select 
                        name="prison" 
                        value={formData.prison}
                        onChange={handleChange}
                        disabled={isLoadingPrisons}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      >
                        <option value="">Sélectionner un établissement</option>
                        {isLoadingPrisons ? (
                          <option value="" disabled>Chargement des prisons...</option>
                        ) : (
                          prisons.map((prison: Prison) => (
                            <option key={prison.id} value={prison.id}>
                              {prison.name} {prison.location ? `- ${prison.location}` : ''}
                            </option>
                          ))
                        )}
                      </select>
                      {isLoadingPrisons && (
                        <p className="text-xs text-gray-500 mt-1">Chargement des établissements...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Empreinte digitale */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Empreinte digitale</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <div className="flex items-start space-x-6">
                  {/* Aperçu empreinte */}
                  <div className="flex-shrink-0 w-32 h-40 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                    {fpImage ? (
                      <img src={`data:image/png;base64,${fpImage}`} alt="Empreinte" className="w-full h-full object-contain" />
                    ) : (
                      <Fingerprint className={`h-16 w-16 ${fpStatus === 'waiting' ? 'text-blue-400 animate-pulse' : 'text-gray-300'}`} />
                    )}
                  </div>

                  {/* Contrôles */}
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-gray-600">
                      Branchez le lecteur d'empreinte USB puis cliquez sur le bouton pour lancer la capture. Posez le doigt du détenu sur le capteur lorsque demandé.
                    </p>

                    {/* Statut */}
                    {fpStatus === 'idle' && (
                      <button type="button" onClick={startFingerprint}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">
                        <Fingerprint className="h-4 w-4" />
                        <span>Lancer la capture</span>
                      </button>
                    )}
                    {fpStatus === 'connecting' && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm font-medium">Connexion au lecteur…</span>
                      </div>
                    )}
                    {fpStatus === 'waiting' && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm font-medium">En attente de l'empreinte — posez le doigt sur le capteur</span>
                        </div>
                        <button type="button" onClick={resetFingerprint}
                          className="text-xs text-gray-500 hover:text-gray-700 underline">
                          Annuler
                        </button>
                      </div>
                    )}
                    {fpStatus === 'captured' && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Empreinte capturée avec succès</span>
                        </div>
                        <button type="button" onClick={startFingerprint}
                          className="flex items-center space-x-2 text-xs text-gray-500 hover:text-gray-700">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Recommencer
                        </button>
                      </div>
                    )}
                    {fpStatus === 'error' && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-red-600">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">{fpError}</span>
                        </div>
                        <button type="button" onClick={resetFingerprint}
                          className="flex items-center text-xs text-gray-500 hover:text-gray-700">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Réessayer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Information Note */}
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-1200">
                <span className="font-medium">Note :</span> Tous les champs marqués d'un astérisque (*) sont obligatoires. 
                Assurez-vous que toutes les informations sont correctes avant de soumettre le formulaire.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center space-x-2 text-gray-700"
              >
                <X className="h-4 w-4" />
                <span>Annuler</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isEditMode ? 'Enregistrer les modifications' : 'Ajouter le détenu'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};