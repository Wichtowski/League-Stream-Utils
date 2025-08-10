// Utility for handling file uploads in Electron environment
export const isElectronEnvironment = (): boolean => {
  return typeof window !== "undefined" && !!window.electronAPI;
};

export const uploadCameraFileElectron = async (
  file: File,
  type: string,
  teamId: string,
  playerId: string
): Promise<{ path: string; filename: string; size: number; type: string }> => {
  if (!isElectronEnvironment() || !window.electronAPI) {
    throw new Error("Not in Electron environment");
  }

  const timestamp = Date.now();
  const extension = file.name.split(".").pop();
  const filename = `${type}_${teamId}_${playerId}_${timestamp}.${extension}`;

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Use Electron's file system
  const result = await window.electronAPI.saveCameraUpload(buffer, filename);

  if (!result.success) {
    throw new Error(result.error || "Failed to save file in Electron");
  }

  return {
    path: result.publicPath || result.localPath || "",
    filename,
    size: buffer.length,
    type: file.type
  };
};
