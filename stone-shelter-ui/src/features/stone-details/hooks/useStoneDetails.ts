import { getStone } from '../../../api/stonesApi';

export function useStoneDetails(id?: number) {
  return id === undefined ? undefined : getStone(id);
}
