export interface Prison {
    id: number,
    name: string,
    location: string,
    capacity: number,
    type: string
}
// Les autres établissements ne sont renvoyés qu'en annuaire (id, nom, localisation) : capacity et type absents.

export type CreatePrisonDto = Omit<Prison, 'id'>;
export type UpdatePrisonDto = Partial<CreatePrisonDto>;