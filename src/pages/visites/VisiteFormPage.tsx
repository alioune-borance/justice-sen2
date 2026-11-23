// pages/visites/VisiteFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, CalendarDays, AlertTriangle } from 'lucide-react';
import { useGetVisiteById, useCreateVisite, useUpdateVisite, useCreateVisitor } from '../../features/visites/api/useGetVisite';
import { useGetDetenus } from '../../features/detenus/api/useGetDetenu';
import { useDetenusPresents } from '../../features/detenus/hooks/useDetenusPresents';
import { Detenu } from '../../features/detenus/types/detenu';
import { getApiErrorMessages } from '../../shared/api/errorMessages';

export const VisiteFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const visiteId = id ? parseInt(id) : undefined;

  const { data: visite, isLoading: isLoadingVisite } = useGetVisiteById(visiteId || 0);
  // Seuls les détenus présents dans la prison (prévenus, accusés ou condamnés) ; en modification, le détenu
  // de la visite reste affiché même s'il a quitté la prison depuis (le backend accepte de garder le même)
  const { data: presents, isLoading: isLoadingDetenus } = useDetenusPresents();
  const { data: allDetenus = [] } = useGetDetenus();
  const visitPrisoner = isEditMode ? allDetenus.find((d: Detenu) => d.id === visite?.prisoner) : undefined;
  const detenusList = visitPrisoner && !presents.some((d: Detenu) => d.id === visitPrisoner.id)
    ? [visitPrisoner, ...presents]
    : presents;

  const createMutation = useCreateVisite();
  const updateMutation = useUpdateVisite();
  const createVisitor = useCreateVisitor();

  const [formData, setFormData] = useState({
    // Visitor fields
    visitor_name: '',
    visitor_email: '',
    visitor_phone_number: '',
    visitor_national_id: '',
    // Visit fields
    prisoner: '',
    visit_date: '',
    purpose: '',
    start_time: '',
    end_time: '',
    prison: '',
  });

  const [submitErrors, setSubmitErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isEditMode && visite) {
      setFormData({
        visitor_name: visite.visitor_name?.name || '',
        visitor_email: visite.visitor_name?.email || '',
        visitor_phone_number: visite.visitor_name?.phone_number || '',
        visitor_national_id: visite.visitor_name?.national_id || '',
        prisoner: visite.prisoner?.toString() || '',
        visit_date: visite.visit_date ? visite.visit_date.split('T')[0] : '',
        purpose: visite.purpose || '',
        start_time: visite.start_time ? visite.start_time.slice(0, 16) : '',
        end_time: visite.end_time ? visite.end_time.slice(0, 16) : '',
        prison: '1'
      });
    }
  }, [isEditMode, visite]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitErrors([]);

    try {
      const visitorPayload = {
        name: formData.visitor_name,
        email: formData.visitor_email,
        phone_number: formData.visitor_phone_number,
        national_id: formData.visitor_national_id,
      };

      const createdVisitor = await createVisitor.mutateAsync(visitorPayload);

      const visitePayload = {
        visitor_id: createdVisitor.id,
        visit_date: new Date(formData.visit_date).toISOString(),
        purpose: formData.purpose,
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : new Date(formData.visit_date).toISOString(),
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : new Date(formData.visit_date).toISOString(),
        status: 'scheduled',
        // prison : déduite du détenu par le serveur (plus de valeur codée en dur)
        prisoner: Number(formData.prisoner)
      };

      if (isEditMode && visiteId) {
        await updateMutation.mutateAsync({ ...visitePayload, id: visiteId });
      } else {
        await createMutation.mutateAsync(visitePayload as any);
      }

      navigate('/visits');
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setSubmitErrors(getApiErrorMessages(error));
    }
  };

  const handleCancel = () => navigate(-1);

  const isSubmitting = createMutation.isPending || updateMutation.isPending || createVisitor.isPending;

  if (isEditMode && isLoadingVisite) {
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
          {isEditMode ? 'Modifier la visite' : 'Ajouter une visite'}
        </h1>
        <div className="w-24" />
      </div>

      {/* Erreurs de validation renvoyées par le serveur */}
      {submitErrors.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              {isEditMode
                ? 'La modification de la visite a échoué :'
                : "L'ajout de la visite a échoué :"}
            </p>
            <ul className="mt-1 text-sm text-red-700 list-disc list-inside space-y-0.5">
              {submitErrors.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md border border-gray-200">

          {/* Card header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <CalendarDays className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {isEditMode ? 'Modification de la visite' : 'Nouvelle visite'}
                </h2>
                <p className="text-gray-600 mt-1 text-sm">
                  {isEditMode
                    ? 'Modifiez les informations de la visite ci-dessous'
                    : "Remplissez tous les champs obligatoires marqués d'un astérisque (*)"}
                </p>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Left — Visitor */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Informations du visiteur</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du visiteur *</label>
                    <input
                      type="text"
                      name="visitor_name"
                      value={formData.visitor_name}
                      onChange={handleChange}
                      required
                      placeholder="Entrez le nom du visiteur"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="visitor_email"
                      value={formData.visitor_email}
                      onChange={handleChange}
                      required
                      placeholder="Entrez l'email du visiteur"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                    <input
                      type="tel"
                      name="visitor_phone_number"
                      value={formData.visitor_phone_number}
                      onChange={handleChange}
                      required
                      placeholder="Entrez le numéro de téléphone"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro CNI *</label>
                    <input
                      type="text"
                      name="visitor_national_id"
                      value={formData.visitor_national_id}
                      onChange={handleChange}
                      required
                      placeholder="Entrez le numéro de la CNI"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Right — Visit details */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Informations de la visite</h4>
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
                      {detenusList.map((d: Detenu) => (
                        <option key={d.id} value={d.id}>
                          {d.first_name} {d.last_name}
                        </option>
                      ))}
                    </select>
                    {isLoadingDetenus && (
                      <p className="text-xs text-gray-500 mt-1">Chargement des détenus...</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de visite *</label>
                    <input
                      type="date"
                      name="visit_date"
                      value={formData.visit_date}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début</label>
                    <input
                      type="datetime-local"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin</label>
                    <input
                      type="datetime-local"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motif de la visite *</label>
                    <textarea
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="Décrivez le motif de la visite"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Note :</span> Tous les champs marqués d'un astérisque (*) sont obligatoires.
                Assurez-vous que toutes les informations sont correctes avant de soumettre le formulaire.
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
                    <span>{isEditMode ? 'Enregistrer les modifications' : 'Ajouter la visite'}</span>
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
