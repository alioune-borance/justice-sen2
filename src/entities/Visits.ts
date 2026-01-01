export class Visits {
    id: number;
    date: string;
    time: string;
    inmate: string;
    visitor: string;
    relation: string;
    status: string;
    duration: string;
    
    constructor(
        id: number,
        date: string,
        time: string,
        inmate: string,
        visitor: string,
        relation: string,
        status: string,
        duration: string
    ) {
        this.id = id;
        this.date = date;
        this.time = time;
        this.inmate = inmate;
        this.visitor = visitor;
        this.relation = relation;
        this.status = status;
        this.duration = duration;
    }
}