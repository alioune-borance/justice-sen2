// pages/infirmerie/InfirmerieFormPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Stethoscope } from 'lucide-react';
import { useAddHealthRecord } from '../../features/infirmerie/api/useGetInfirmerie';
import { useGetDetenus } from '../../features/detenus/api/useGetDetenu';
import { Detenu, isInCustody, prisonerStatusLabel } from '../../features/detenus/types/detenu';
import { HealthRecord } from '../../features/infirmerie/types/infirmerie';
import { usePermissions } from '../../features/auth/hooks/usePermissions';
import { getApiErrorMessage } from '../../shared/api/errorMessages';

export const InfirmerieFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: detenusList = [], isLoading: isLoadingDetenus } = useGetDetenus();
  const addRecordMutation = useAddHealthRecord();
  const { isMyPrison } = usePermissions();
  // Seuls les détenus présents dans l'établissement : prévenus ou condamnés, actuellement dans sa prison
  // (la liste reçue contient aussi, en lecture seule, les anciens détenus et les transferts entrants)
  const patients = detenusList.filter((d: Detenu) => isInCustody(d) && isMyPrison(d.prison));

  const [prisonerId, setPrisonerId] = useState<string>('');
  const [record, setRecord] = useState<HealthRecord>({
    medical_condition: '',
    description: '',
    date_of_diagnosis: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<{ prisoner?: string } & Partial<HealthRecord>>({});

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
    if (!record.medical_condition.trim()) next.medical_condition = 'La condition médicale est obligatoire.';
    if (!record.description.trim()) next.description = 'La description est obligatoire.';
    if (!record.date_of_diagnosis) next.date_of_diagnosis = 'La date de diagnostic est obligatoire.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await addRecordMutation.mutateAsync({
        prisonerId: parseInt(prisonerId),
        record: {
          medical_condition: record.medical_condition.trim(),
          description: record.description.trim(),
          date_of_diagnosis: record.date_of_diagnosis,
        },
      });
      navigate('/infirmerie');
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  const selectedDetenu = patients.find((d: Detenu) => d.id === parseInt(prisonerId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800 flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Nouveau dossier médical</h1>
        <div className="w-24" />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md border border-gray-200">

          {/* Card header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                <Stethoscope className="h-8 w-8 text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Enregistrement médical</h2>
                <p className="text-gray-600 mt-1 text-sm">
                  Sélectionnez un détenu existant puis renseignez les informations médicales.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Gauche : sélection détenu + condition + date */}
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">-- Sélectionner un détenu --</option>
                    {patients.map((d: Detenu) => (
                      <option key={d.id} value={d.id}>
                        {d.first_name} {d.last_name}{d.matricule_number ? ` — ${d.matricule_number}` : ''} ({prisonerStatusLabel(d.status)})
                      </option>
                    ))}
                  </select>
                  {errors.prisoner && <p className="text-red-500 text-xs mt-1">{errors.prisoner}</p>}
                  {!isLoadingDetenus && patients.length === 0 && (
                    <p className="text-gray-500 text-xs mt-1">Aucun détenu prévenu ou condamné dans votre établissement.</p>
                  )}
                  {addRecordMutation.isError && (
                    <p className="text-red-600 text-sm mt-2">{getApiErrorMessage(addRecordMutation.error)}</p>
                  )}
                </div>

                {/* Récapitulatif détenu */}
                {selectedDetenu && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-gray-500">Matricule</span>
                    <span className="font-medium">{selectedDetenu.matricule_number}</span>
                    <span className="text-gray-500">Statut</span>
                    <span className="font-medium">{prisonerStatusLabel(selectedDetenu.status)}</span>
                    {selectedDetenu.incarceration_date && (
                      <>
                        <span className="text-gray-500">Incarcéré le</span>
                        <span className="font-medium">
                          {new Date(selectedDetenu.incarceration_date).toLocaleDateString('fr-FR')}
                        </span>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition médicale <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="medical_condition"
                    value={record.medical_condition}
                    onChange={handleRecordChange}
                    placeholder="Ex : Hypertension, Fracture, Grippe…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  {errors.medical_condition && <p className="text-red-500 text-xs mt-1">{errors.medical_condition}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date du diagnostic <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_of_diagnosis"
                    value={record.date_of_diagnosis}
                    onChange={handleRecordChange}
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  {errors.date_of_diagnosis && (
                    <p className="text-red-500 text-xs mt-1">{errors.date_of_diagnosis}</p>
                  )}
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
                  placeholder="Symptômes observés, traitement prescrit, remarques médicales…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
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
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {addRecordMutation.isPending ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Enregistrer le dossier
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
