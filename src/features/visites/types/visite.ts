export interface visitorName {
  id: number,
  name: string,
  email: string,
  phone_number: string,
  national_id: string
}

// features/visites/types/visite.ts
export interface Visite {
  id: number
  //detenu: number;
  visitor_id: number;
  visit_date: string;
  purpose: string;
  start_time: string;
  end_time: string;
  status: string;
}

// For creating (without id)
export type CreateVisiteDto = Omit<Visite, 'id'>;

// For updating (partial without id)
export type UpdateVisiteDto = Partial<Omit<Visite, 'id'>>;

// For table display
export interface VisiteTableRow extends Visite {
  detenu_name: string;
}