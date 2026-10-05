import type { AdoptionStatus } from '../../enums/AdoptionStatus';
import type { StoneSize } from '../../enums/StoneSize';
import type { StoneType } from '../../enums/StoneType';

export interface StoneSearchResponse {
  id: number;
  name: string;
  photo?: string;
  stoneType: StoneType;
  biography?: string;
  adoptionStatus: AdoptionStatus;
  admissionDate: string;
  stoneSize: StoneSize;
}
