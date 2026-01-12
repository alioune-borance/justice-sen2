// features/prisons/components/PrisonSelect.tsx
import React from 'react';
import { useGetPrisons } from '../../features/prisons/api/useGetPrison';
import { Prison } from '../../features/prisons/types/prison'; // Import the Prison type

interface PrisonSelectProps {
  value: number | string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  className?: string;
}

export const PrisonSelect: React.FC<PrisonSelectProps> = ({
  value,
  onChange,
  required = true,
  disabled = false,
  name = 'prison',
  className = '',
}) => {
  const { data: prisons = [], isLoading: isLoadingPrisons } = useGetPrisons();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Établissement {required && '*'}
      </label>
      <select 
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled || isLoadingPrisons}
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        required={required}
      >
        <option value="">Sélectionner un établissement</option>
        {isLoadingPrisons ? (
          <option value="" disabled>Chargement des prisons...</option>
        ) : (
          prisons.map((prison: Prison) => ( // Add type annotation here
            <option key={prison.id} value={prison.id}>
              {prison.name} - {prison.location}
            </option>
          ))
        )}
      </select>
      {isLoadingPrisons && (
        <p className="text-xs text-gray-500 mt-1">Chargement des prisons...</p>
      )}
    </div>
  );
};