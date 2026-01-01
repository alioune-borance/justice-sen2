export class ReportTemplate {
    id: number;
    name: string;
    type: string;
    description: string;
    fields: string[];
    isActive: boolean;

    constructor(
        id: number,
        name: string,  
        type: string,
        description: string,
        fields: string[],
        isActive: boolean
    ) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.description = description;
        this.fields = fields;
        this.isActive = isActive;
    }
}
