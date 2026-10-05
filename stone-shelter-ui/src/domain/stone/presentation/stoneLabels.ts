import type { StoneSize } from '../../../enums/StoneSize';
import type { StoneType } from '../../../enums/StoneType';

export const stoneTypeLabels: Record<StoneType, string> = {
  BASALT: 'Basalt', GRANITE: 'Granite', OBSIDIAN: 'Obsidian', PUMICE: 'Pumice',
  LIMESTONE: 'Limestone', SANDSTONE: 'Sandstone', SHALE: 'Shale', MARBLE: 'Marble',
  GNEISS: 'Gneiss', SLATE: 'Slate',
};
export const stoneSizeLabels: Record<StoneSize, string> = {
  SMALL: 'Small', MEDIUM: 'Medium', LARGE: 'Large',
};
