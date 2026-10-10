import * as Comlink from 'comlink';
import { createBackupCheckWorkerApi } from './backup-check';

// Started by runBackupCheck (backup-check-host.ts); never imported directly.
Comlink.expose(createBackupCheckWorkerApi());
