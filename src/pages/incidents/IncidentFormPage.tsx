// pages/incidents/IncidentFormPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, AlertTriangle } from 'lucide-react';
import { useAddDisciplinaryRecord } from '../../features/incidents/api/useGetIncident';
import { useDetenusPresents } from '../../features/detenus/hooks/useDetenusPresents';
import { Detenu, prisonerStatusLabel } from '../../features/detenus/types/detenu';
import { DisciplinaryRecord } from '../../features/incidents/types/incident';
import { getApiErrorMessage } from '../../shared/api/errorMessages';

export const IncidentFormPage: React.FC = () => {
  const navigate = useNavigate();
  // Seulement les détenus présents dans sa prison (prévenus, accusés ou condamnés ; backend cloisonné même
  // en mode observation) : un incident notifie les gestionnaires de la prison du détenu
  const { data: selectableDetenus, isLoading: isLoadingDetenus } = useDetenusPresents();
  const addRecordMutation = useAddDisciplinaryRecord();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [prisonerId, setPrisonerId] = useState<string>('');
  const [record, setRecord] = useState<DisciplinaryRecord>({
    infraction: '',
    description: '',
    date_of_infraction: new Date().toISOString().slice(0, 10),
    sanction: '',
  });
  const [errors, setErrors] = useState<{ prisoner?: string } & Partial<DisciplinaryRecord>>({});

  const handleRecordChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setRecord((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!prisonerId) next.prisoner = 'Veuillez sélectionner un détenu.';
    if (!record.infraction.trim()) next.infraction = "Le type d'infraction est obligatoire.";
    if (!record.description.trim()) next.description = 'La description est obligatoire.';
    if (!record.date_of_infraction) next.date_of_infraction = "La date est obligatoire.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitError(null);
    try {
      await addRecordMutation.mutateAsync({
        prisonerId: parseInt(prisonerId),
        record: {
          infraction: record.infraction.trim(),
          description: record.description.trim(),
          date_of_infraction: record.date_of_infraction,
          // Une sanction proposée part en validation (superviseur / administrateur)
          sanction: record.sanction?.trim() || '',
        },
      });
      navigate('/incidents');
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  };

  const selectedDetenu = selectableDetenus.find((d: Detenu) => d.id === parseInt(prisonerId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800 flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Signaler un incident disciplinaire</h1>
        <div className="w-24" />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md border border-gray-200">

          {/* Card header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Nouveau dossier disciplinaire</h2>
                <p className="text-gray-600 mt-1 text-sm">
                  Sélectionnez un détenu existant puis renseignez les détails de l'infraction.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Gauche : sélection détenu + infraction + date */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Détenu <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={prisonerId}
                    onChange={(e) => {
                      setPrisonerId(e.target.value);
                      setErrors((prev) => ({ ...prev, prisoner: '' }));
                    }}
                    disabled={isLoadingDetenus}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">-- Sélectionner un détenu --</option>
                    {selectableDetenus.map((d: Detenu) => (
                      <option key={d.id} value={d.id}>
                        {d.first_name} {d.last_name}{d.matricule_number ? ` — ${d.matricule_number}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.prisoner && <p className="text-red-500 text-xs mt-1">{errors.prisoner}</p>}
                </div>

                {/* Récapitulatif détenu */}
                {selectedDetenu && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-gray-500">Matricule</span>
                    <span className="font-medium">{selectedDetenu.matricule_number}</span>
                    <span className="text-gray-500">Statut</span>
                    <span className="font-medium">{prisonerStatusLabel(selectedDetenu.status)}</span>
                    <span className="text-gray-500">Incarcéré le</span>
                    <span className="font-medium">
                      {new Date(selectedDetenu.incarceration_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type d'infraction <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="infraction"
                    value={record.infraction}
                    onChange={handleRecordChange}
                    placeholder="Ex : Bagarre, Refus d'obtempérer…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  {errors.infraction && <p className="text-red-500 text-xs mt-1">{errors.infraction}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de l'infraction <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_of_infraction"
                    value={record.date_of_infraction}
                    onChange={handleRecordChange}
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  {errors.date_of_infraction && (
                    <p className="text-red-500 text-xs mt-1">{errors.date_of_infraction}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sanction proposée
                  </label>
                  <textarea
                    name="sanction"
                    value={record.sanction}
                    onChange={handleRecordChange}
                    rows={2}
                    placeholder="Ex : 7 jours de cellule disciplinaire (facultatif)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La sanction sera soumise à la validation d'un superviseur ou d'un administrateur.
                  </p>
                </div>
              </div>

              {/* Droite : description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={record.description}
                  onChange={handleRecordChange}
                  rows={12}
                  placeholder="Faits constatés, circonstances, témoins éventuels…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {submitError && (
              <p role="alert" className="mb-3 text-sm text-red-600">{submitError}</p>
            )}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-gray-700"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
              <button
                type="submit"
                disabled={addRecordMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {addRecordMutation.isPending ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Signaler l'incident
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};