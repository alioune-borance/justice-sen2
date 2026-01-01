export class Transfer {
  id: number;
  inmateId: string;
  inmateName: string;
  fromPrison: string;
  toPrison: string;
  reason: string;
  requestDate: string;
  scheduledDate: string;
  status: 'En attente' | 'Approuvé' | 'En cours' | 'Terminé' | 'Refusé';
  priority: 'Normale' | 'Urgente' | 'Critique';
  requestedBy: string;
  transportType: 'Fourgon' | 'Escorte' | 'Ambulance';

    constructor(
        id: number,
        inmateId: string,
        inmateName: string,
        fromPrison: string,
        toPrison: string,
        reason: string,
        requestDate: string,
        scheduledDate: string,
        status: 'En attente' | 'Approuvé' | 'En cours' | 'Terminé' | 'Refusé',
        priority: 'Normale' | 'Urgente' | 'Critique',
        requestedBy: string,
        transportType: 'Fourgon' | 'Escorte' | 'Ambulance'
    ) {
        this.id = id;   
        this.inmateId = inmateId;
        this.inmateName = inmateName;
        this.fromPrison = fromPrison;
        this.toPrison = toPrison;
        this.reason = reason;
        this.requestDate = requestDate;
        this.scheduledDate = scheduledDate;
        this.status = status;
        this.priority = priority;
        this.requestedBy = requestedBy;
        this.transportType = transportType;
    }
}