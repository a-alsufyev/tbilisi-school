export interface School {
  id: number;
  slug?: string;
  name: string;
  address: string;
  coordinates: string;
  languages: string;
  cost?: string;
  program?: string;
  comment?: string;
}

export interface Config {
  yandexMapsApiKey: string;
}
