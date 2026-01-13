export class Detenu2 {
  id?: number;
  first_name?: string;
  last_name?: string;
  date_of_birth?: Date;
  release_date?: Date;
  incarceration_date?: Date;
  prison?: string;

    constructor(id: number,
        first_name: string,
        last_name: string,
        date_of_birth: Date,
        release_date: Date,
        incarceration_date: Date,
        prison: string

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

