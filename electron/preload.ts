/**
 * Electron preload — re-exposes the node-usb IPC channels as
 * `window.nordNativeUsb`, the exact shape `ElectronUsbTransport` (and its
 * `NordNativeUsb` interface in src/lib/device/electron-usb.ts) expects.
 *
 * contextIsolation is on and nodeIntegration is off, so the renderer only ever
 * sees this narrow, typed surface — never `require`, `usb`, or the ipcRenderer.
 */
import { contextBridge, ipcRenderer } from 'electron';
import { cleanIpcError } from './shell-policy';

/** `ipcRenderer.invoke`, with the main process's own error message instead of Electron's wrapper around it. */
async function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  try {
    return await ipcRenderer.invoke(channel, ...args) as T;
  } catch (error) {
    throw new Error(cleanIpcError(error instanceof Error ? error.message : String(error)));
  }
}

contextBridge.exposeInMainWorld('nordNativeUsb', {
  backend: () => invoke('nord-usb:backend'),
  list: () => invoke('nord-usb:list'),
  open: (productId?: number) => invoke('nord-usb:open', productId),
  bulkOut: (dataB64: string) => invoke('nord-usb:bulkOut', dataB64),
  bulkIn: (maxLength: number, timeoutMs?: number) => invoke('nord-usb:bulkIn', maxLength, timeoutMs),
  close: () => invoke('nord-usb:close'),
});
