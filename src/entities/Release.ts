export class Release {
  id: number;
  inmateId: string;
  inmateName: string;
  prison: string;
  releaseType: 'Fin de peine' | 'Libération conditionnelle' | 'Grâce présidentielle' | 'Acquittement';
  scheduledDate: string;
  status: 'Programmée' | 'En cours' | 'Terminée' | 'Reportée';
  conditions?: string[];
  followUpRequired: boolean;
  contactPerson?: string;
  documents: string[];

    constructor(
        id: number,
        inmateId: string,
        inmateName: string,
        prison: string,
        releaseType: 'Fin de peine' | 'Libération conditionnelle' | 'Grâce présidentielle' | 'Acquittement',
        scheduledDate: string,
        status: 'Programmée' | 'En cours' | 'Terminée' | 'Reportée',
        conditions: string[] = [],
        followUpRequired: boolean,
        contactPerson: string = '',
        documents: string[] = []
    ) {
        this.id = id;
        this.inmateId = inmateId;
        this.inmateName = inmateName;
        this.prison = prison;
        this.releaseType = releaseType;
        this.scheduledDate = scheduledDate;
        this.status = status;
        this.conditions = conditions;
        this.followUpRequired = followUpRequired;
        this.contactPerson = contactPerson;
        this.documents = documents;
    }
}