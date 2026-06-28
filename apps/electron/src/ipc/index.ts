import { registerAssetHandlers } from "./assets";
import { registerChampionHandlers } from "./champions";
import { registerDBHandlers } from "./db";
import { registerOBSHandlers } from "./obs";
import { registerSyncHandlers } from "./sync";
import { registerUtilHandlers } from "./util";

export function registerAllHandlers() {
  registerAssetHandlers();
  registerChampionHandlers();
  registerOBSHandlers();
  registerUtilHandlers();
  registerDBHandlers();
  registerSyncHandlers();
}
