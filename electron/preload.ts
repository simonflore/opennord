/**
 * Electron preload — re-exposes the node-usb IPC channels as
 * `window.nordNativeUsb`, the exact shape `ElectronUsbTransport` (and its
 * `NordNativeUsb` interface in src/lib/device/electron-usb.ts) expects.
 *
 * contextIsolation is on and nodeIntegration is off, so the renderer only ever
 * sees this narrow, typed surface — never `require`, `usb`, or the ipcRenderer.
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('nordNativeUsb', {
  list: () => ipcRenderer.invoke('nord-usb:list'),
  open: (productId?: number) => ipcRenderer.invoke('nord-usb:open', productId),
  bulkOut: (dataB64: string) => ipcRenderer.invoke('nord-usb:bulkOut', dataB64),
  bulkIn: (maxLength: number) => ipcRenderer.invoke('nord-usb:bulkIn', maxLength),
  close: () => ipcRenderer.invoke('nord-usb:close'),
});
