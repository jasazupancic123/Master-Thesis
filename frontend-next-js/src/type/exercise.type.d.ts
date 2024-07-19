export interface Exercise {
  id: string;
  name: string;
  componentIds: string[];
  global: boolean;
  coefficient1?: number;
  coefficient2?: number;
  coefficient3?: number;
  imageUrl?: string;
  videoUrl?: string;
  prescription?: string;
  priority?: string;
  method?: string;
  loadingSide?: string;
  bodyRegion?: string;
  movementDirection?: string;
  diagnosis?: string;
  muscle?: string;
  sportTask?: string;
  location?: string;
}