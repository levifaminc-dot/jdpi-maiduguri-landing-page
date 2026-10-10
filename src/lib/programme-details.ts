export interface ProgrammeDetails {
  interventions:string[]; source:string;
  locations:{label:string;detail:string;source:string}[];
  locationNote?:string; projectSlugs?:string[];
  projectReach?:{value:string;label:string;description:string;source:string;project:string};
}
