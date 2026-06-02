import { registerAssetHandlers } from './assets';
import { registerChampionHandlers } from './champions';
import { registerOBSHandlers } from './obs';
import { registerUtilHandlers } from './util';
import { registerDBHandlers } from './db';
import { registerSyncHandlers } from './sync';

export function registerAllHandlers() {
  registerAssetHandlers();
  registerChampionHandlers();
  registerOBSHandlers();
  registerUtilHandlers();
  registerDBHandlers();
  registerSyncHandlers();
}
