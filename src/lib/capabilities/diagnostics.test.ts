import { describe, it, expect, vi, afterEach } from 'vitest';
import { consoleDiagnostics, httpDiagnostics } from './defaults';

afterEach(() => vi.restoreAllMocks());

describe('consoleDiagnostics', () => {
  it('logs failures via console.error and successes via console.info', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleDiagnostics.record({ kind: 'device.error', ok: false, message: 'boom', detail: { a: 1 } });
    consoleDiagnostics.record({ kind: 'device.connect', ok: true, message: 'ok' });
    expect(err).toHaveBeenCalledWith('[diag] device.error: boom', { a: 1 });
    expect(info).toHaveBeenCalledWith('[diag] device.connect: ok', {});
  });

  it('never throws even if console does', () => {
    vi.spyOn(console, 'info').mockImplementation(() => { throw new Error('no console'); });
    expect(() => consoleDiagnostics.record({ kind: 'x', message: 'y' })).not.toThrow();
  });
});

describe('httpDiagnostics', () => {
  it('POSTs the event as JSON with keepalive and does not throw on network failure', () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', { userAgent: 'test-ua' });
    const sink = httpDiagnostics('https://logs.example/ingest');
    expect(() => sink.record({ kind: 'device.error', ok: false, message: 'boom' })).not.toThrow();
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://logs.example/ingest');
    expect(init.method).toBe('POST');
    expect(init.keepalive).toBe(true);
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ kind: 'device.error', ok: false, message: 'boom', ua: 'test-ua' });
    expect(body.at).toBeTypeOf('string');
  });
});
