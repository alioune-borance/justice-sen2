// pages/transferts/SortieFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, LogOut } from 'lucide-react';
import { useCreateSortie, useGetSortieById, useUpdateSortie } from '../../features/sorties/api/useGetSortie';
import { useGetDetenus } from '../../features/detenus/api/useGetDetenu';
import { Detenu, isMovable } from '../../features/detenus/types/detenu';
import { usePermissions } from '../../features/auth/hooks/usePermissions';

export const SortieFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const sortieId = id ? parseInt(id) : undefined;

  const { data: sortie, isLoading: isLoadingSortie } = useGetSortieById(sortieId || 0);
  const { data: detenusList = [], isLoading: isLoadingDetenus } = useGetDetenus();
  // Seuls les détenus actuellement dans la prison de l'utilisateur (pas l'historique ni les transferts entrants)
  const { isMyPrison } = usePermissions();

  const createMutation = useCreateSortie();
  const updateMutation = useUpdateSortie();

  const [formData, setFormData] = useState({
    prisoner: '',
    destination: '',
    date: '',
    due_return_date: '',
    purpose: '',
    notes: '',
  });

  useEffect(() => {
    if (isEditMode && sortie) {
      setFormData({
        prisoner: sortie.prisoner?.toString() || '',
        destination: sortie.destination || '',
        date: sortie.date ? sortie.date.split('T')[0] : '',
        due_return_date: sortie.due_return_date ? sortie.due_return_date.split('T')[0] : '',
        purpose: sortie.purpose || '',
        notes: sortie.notes || '',
      });
    }
  }, [isEditMode, sortie]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      prisoner: parseInt(formData.prisoner),
      destination: formData.destination,
      date: new Date(formData.date).toISOString(),
      due_return_date: new Date(formData.due_return_date).toISOString(),
      actual_return_date: new Date(formData.due_return_date).toISOString(),
      purpose: formData.purpose,
      notes: formData.notes,
      is_returned: false,
      // status / authorized_by / prison : gérés par le serveur (validation SUPERVISEUR / ADMIN)
    };

    try {
      if (isEditMode && sortieId) {
        await updateMutation.mutateAsync({ ...payload, id: sortieId });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate('/transfers');
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  const handleCancel = () => navigate(-1);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingSortie) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des informations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={handleCancel} className="text-gray-600 hover:text-gray-800 flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </button>
        <h1 className="text-2xl font-bold text-slate-800">
          {isEditMode ? 'Modifier la sortie' : 'Programmer une sortie'}
        </h1>
        <div className="w-24" />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md border border-gray-200">

          {/* Card header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <LogOut className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {isEditMode ? 'Modification de la sortie' : 'Nouvelle sortie de détenu'}
                </h2>
                <p className="text-gray-600 mt-1 text-sm">
                  {isEditMode
                    ? 'Modifiez les informations de la sortie ci-dessous'
                    : "Remplissez tous les champs obligatoires marqués d'un astérisque (*)"}
                </p>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Left */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Informations du détenu</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Détenu concerné *</label>
                    <select
                      name="prisoner"
                      value={formData.prisoner}
                      onChange={handleChange}
                      required
                      disabled={isLoadingDetenus}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Sélectionner un détenu</option>
                      {/* Prévenus et condamnés seulement (le détenu déjà choisi reste affiché en modification) */}
                      {detenusList
                        .filter((d: Detenu) => (isMovable(d) && isMyPrison(d.prison)) || String(d.id) === String(formData.prisoner))
                        .map((d: Detenu) => (
                          <option key={d.id} value={d.id}>{d.first_name} {d.last_name} ({d.status})</option>
                        ))}
                    </select>
                    {isLoadingDetenus && <p className="text-xs text-gray-500 mt-1">Chargement des détenus...</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                    <input
                      type="text"
                      name="destination"
                      value={formData.destination}
                      onChange={handleChange}
                      required
                      placeholder="Lieu de destination"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motif de la sortie *</label>
                    <textarea
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="Raison de la sortie"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Planification</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de sortie *</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de retour prévue *</label>
                    <input
                      type="date"
                      name="due_return_date"
                      value={formData.due_return_date}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    La sortie sera soumise à la validation d'un superviseur ou d'un administrateur
                    de l'établissement.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Remarques éventuelles"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <span className="font-medium">Note :</span> La sortie sera enregistrée avec le statut «&nbsp;En attente&nbsp;»
                jusqu'à validation par un responsable. Le retour effectif devra être confirmé séparément.
              </p>
            </div>
          </div>

          {/* Actions */}
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
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{isEditMode ? 'Enregistrer les modifications' : 'Programmer la sortie'}</span>
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
