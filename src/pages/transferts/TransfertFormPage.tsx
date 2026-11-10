// pages/transferts/TransfertFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, ArrowRightLeft } from 'lucide-react';
import { useCreateTransfert, useGetTransfertById, useUpdateTransfert } from '../../features/transferts/api/useGetTransfert';
import { useGetDetenus } from '../../features/detenus/api/useGetDetenu';
import { useGetPrisons } from '../../features/prisons/api/useGetPrison';
import { Detenu, isMovable } from '../../features/detenus/types/detenu';
import { Prison } from '../../features/prisons/types/prison';

export const TransfertFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const transfertId = id ? parseInt(id) : undefined;

  const { data: transfert, isLoading: isLoadingTransfert } = useGetTransfertById(transfertId || 0);
  const { data: detenusList = [], isLoading: isLoadingDetenus } = useGetDetenus();
  const { data: prisons = [], isLoading: isLoadingPrisons } = useGetPrisons();

  const createMutation = useCreateTransfert();
  const updateMutation = useUpdateTransfert();

  const [formData, setFormData] = useState({
    prisoner: '',
    from_prison: '',
    to_prison: '',
    transfer_date: '',
    purpose: '',
    notes: '',
    priority: 'NORMAL',
  });

  useEffect(() => {
    if (isEditMode && transfert) {
      setFormData({
        prisoner: transfert.prisoner?.toString() || '',
        from_prison: transfert.from_prison?.toString() || '',
        to_prison: transfert.to_prison?.toString() || '',
        transfer_date: transfert.transfer_date ? transfert.transfer_date.split('T')[0] : '',
        purpose: transfert.purpose || '',
        notes: transfert.notes || '',
        priority: transfert.priority || 'NORMAL',
      });
    }
  }, [isEditMode, transfert]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePrisonerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const selectedDetenu = detenusList.find((d: Detenu) => d.id === Number(value));
    setFormData(prev => ({
      ...prev,
      prisoner: value,
      from_prison: selectedDetenu ? (selectedDetenu.prison?.toString() ?? '') : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      prisoner: parseInt(formData.prisoner),
      from_prison: parseInt(formData.from_prison),
      to_prison: parseInt(formData.to_prison),
      transfer_date: new Date(formData.transfer_date).toISOString(),
      date: new Date(formData.transfer_date).toISOString(),
      purpose: formData.purpose,
      notes: formData.notes,
      priority: formData.priority,
      // status / authorized_by : gérés par le serveur (validation par la prison source)
    };

    try {
      if (isEditMode && transfertId) {
        await updateMutation.mutateAsync({ ...payload, id: transfertId });
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

  if (isEditMode && isLoadingTransfert) {
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
        <button onClick={handleCancel} className="text-gray-600 hover:text-gray-800 flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </button>
        <h1 className="text-2xl font-bold text-slate-800">
          {isEditMode ? 'Modifier le transfert' : 'Nouveau transfert'}
        </h1>
        <div className="w-24" />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md border border-gray-200">

          {/* Card header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <ArrowRightLeft className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {isEditMode ? 'Modification du transfert' : 'Nouveau transfert de détenu'}
                </h2>
                <p className="text-gray-600 mt-1 text-sm">
                  {isEditMode
                    ? 'Modifiez les informations du transfert ci-dessous'
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
                <h4 className="text-sm font-medium text-gray-700 mb-3">Établissements</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Détenu concerné *</label>
                    <select
                      name="prisoner"
                      value={formData.prisoner}
                      onChange={handlePrisonerChange}
                      required
                      disabled={isLoadingDetenus}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Sélectionner un détenu</option>
                      {/* Prévenus et condamnés seulement (le détenu déjà choisi reste affiché en modification) */}
                      {detenusList
                        .filter((d: Detenu) => isMovable(d) || String(d.id) === String(formData.prisoner))
                        .map((d: Detenu) => (
                          <option key={d.id} value={d.id}>{d.first_name} {d.last_name} ({d.status})</option>
                        ))}
                    </select>
                    {isLoadingDetenus && <p className="text-xs text-gray-500 mt-1">Chargement des détenus...</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Établissement de départ *</label>
                    <select
                      name="from_prison"
                      value={formData.from_prison}
                      onChange={handleChange}
                      required
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 disabled:opacity-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {formData.prisoner ? "Prison actuelle introuvable" : "Sélectionnez d'abord un détenu"}
                      </option>
                      {prisons.map((p: Prison) => (
                        <option key={p.id} value={p.id}>{p.name}{p.location ? ` - ${p.location}` : ''}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Défini automatiquement selon la prison actuelle du détenu.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Établissement d'arrivée *</label>
                    <select
                      name="to_prison"
                      value={formData.to_prison}
                      onChange={handleChange}
                      required
                      disabled={isLoadingPrisons}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Sélectionner un établissement</option>
                      {prisons.filter((p: Prison) => String(p.id) !== formData.from_prison).map((p: Prison) => (
                        <option key={p.id} value={p.id}>{p.name}{p.location ? ` - ${p.location}` : ''}</option>
                      ))}
                    </select>
                    {isLoadingPrisons && <p className="text-xs text-gray-500 mt-1">Chargement des établissements...</p>}
                  </div>
                </div>
              </div>

              {/* Right */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Détails du transfert</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de transfert *</label>
                    <input
                      type="date"
                      name="transfer_date"
                      value={formData.transfer_date}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priorité *</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="NORMAL">Normale</option>
                      <option value="URGENT">Urgente</option>
                      <option value="CRITICAL">Critique</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motif *</label>
                    <textarea
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      required
                      rows={2}
                      placeholder="Motif du transfert"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    Le transfert sera soumis à la validation d'un superviseur ou d'un administrateur
                    de l'établissement de départ.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Remarques éventuelles"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Note :</span> Le statut sera automatiquement défini à «&nbsp;En attente&nbsp;»
                et devra être approuvé par un responsable.
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{isEditMode ? 'Enregistrer les modifications' : 'Créer le transfert'}</span>
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
