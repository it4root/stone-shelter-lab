export interface StoneSearchResponse {
  id: number;
  name: string;
  photo?: string;
  stoneType: 'BASALT' | 'GRANITE' | 'OBSIDIAN' | 'PUMICE' | 'LIMESTONE'
    | 'SANDSTONE' | 'SHALE' | 'MARBLE' | 'GNEISS' | 'SLATE';
  biography?: string;
  adoptionStatus: 'AVAILABLE' | 'RESERVED' | 'ADOPTED';
  admissionDate: string;
  stoneSize: 'SMALL' | 'MEDIUM' | 'LARGE';
}

export interface StonesSearchResponse {
  content: StoneSearchResponse[];
  page: number;
  size: number;
  totalElements: number;
}
