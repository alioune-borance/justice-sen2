export class Reports {
  id: number;
  title: string;
  type: 'statistique' | 'operationnel' | 'securite' | 'reinsertion' | 'financier';
  category: string;
  description: string;
  frequency: 'Ponctuel' | 'Quotidien' | 'Hebdomadaire' | 'Mensuel' | 'Trimestriel' | 'Annuel';
  status: 'Brouillon' | 'Programmé' | 'En cours' | 'Terminé' | 'Erreur';
  createdBy: string;
  createdDate: string;
  lastGenerated?: string;
  nextGeneration?: string;
  recipients: string[];
  format: 'PDF' | 'Excel' | 'CSV' | 'Word';
  size?: string;

  constructor(
    id: number,
    title: string,
    type: 'statistique' | 'operationnel' | 'securite' | 'reinsertion' | 'financier',
    category: string,
    description: string,  
    frequency: 'Ponctuel' | 'Quotidien' | 'Hebdomadaire' | 'Mensuel' | 'Trimestriel' | 'Annuel',
    status: 'Brouillon' | 'Programmé' | 'En cours' | 'Terminé' | 'Erreur',
    createdBy: string,
    createdDate: string,
    recipients: string[],
    format: 'PDF' | 'Excel' | 'CSV' | 'Word',
    size?: string
  ) {
    this.id = id;
    this.title = title;
    this.type = type;
    this.category = category;
    this.description = description;
    this.frequency = frequency;
    this.status = status;
    this.createdBy = createdBy;
    this.createdDate = createdDate;
    this.recipients = recipients;
    this.format = format;
    this.size = size;
  } 
}