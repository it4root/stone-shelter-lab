import { useReducer } from 'react';
import { getStone } from '../../../api/stonesApi';

export function useStoneDetails(id?: number) {
  const [, refreshStone] = useReducer((revision: number) => revision + 1, 0);
  return { stone: id === undefined ? undefined : getStone(id), refreshStone };
}
