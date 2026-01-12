// export class Detenu {
//     id: number;
//     nom: string;
//     prenom: string;
//     dateNaissance: Date;
//     numeroMatricule: string;
//     dateIncarceration: Date;
//     motifIncarceration: string;
//     etablissement: string;
//     niveauSecurite: 'minimum' | 'moyen' | 'maximum';
//     cellule: string;
//     etatSanté: string;
//     comportement: string;
//     peines: { description: string; dateDebut: Date; dateFin: Date }[];
//     visites: { visiteur: string; date: Date; relation: string }[]
//     reinsertion: { programme: string; statut: 'en cours' | 'termine' | 'non commence' }[];
//     pardons: { date: Date; raison: string; approuvePar: string }[];

//     constructor(    id: number,
//         nom: string,
//         prenom: string,
//         dateNaissance: Date,
//         numeroMatricule: string,
//         dateIncarceration: Date,
//         motifIncarceration: string,
//         etablissement: string,
//         niveauSecurite: 'minimum' | 'moyen' | 'maximum',
//         cellule: string,
//         etatSanté: string,
//         comportement: string) { 
//         this.id = id;
//         this.nom = nom;
//         this.prenom = prenom;
//         this.dateNaissance = dateNaissance; 
//         this.numeroMatricule = numeroMatricule;
//         this.dateIncarceration = dateIncarceration;
//         this.motifIncarceration = motifIncarceration;
//         this.etablissement = etablissement;
//         this.niveauSecurite = niveauSecurite;
//         this.cellule = cellule;
//         this.etatSanté = etatSanté;
//         this.comportement = comportement;
//         this.peines = [];
//         this.visites = [];
//         this.reinsertion = [];
//         this.pardons = [];
//     }
// }
export class Detenu {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  release_date: Date;
  incarceration_date: Date;
  prison: number;

    constructor(id: number,
        first_name: string,
        last_name: string,
        date_of_birth: Date,
        release_date: Date,
        incarceration_date: Date,
        prison: number

            ) {
        this.id = id;
        this.first_name = first_name;
        this.last_name = last_name;
        this.date_of_birth = date_of_birth;
        this.release_date = release_date;
        this.incarceration_date = incarceration_date;
        this.prison = prison;  

    }
}

