import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createApiHandler } from './api.mjs';

async function call(options, path = '/api/translate', body = { q: 'Hello', target: 'ja' }, method = 'POST') {
    const req = Readable.from([typeof body === 'string' ? body : JSON.stringify(body)]);
    req.url = path;
    req.method = method;
    let status, data;
    await createApiHandler(options)(req, {
        writeHead(code) { status = code; },
        end(value) { data = JSON.parse(value); },
    });
    return { status, data };
}

test('sends auto-detected plain text and server key; returns only translation', async () => {
    const result = await call({ apiKey: 'server-secret', fetchImpl: async (url, options) => {
        assert.equal(url, 'https://libretranslate.com/translate');
        assert.deepEqual(JSON.parse(options.body), { q: 'Hello', source: 'auto', target: 'ja', format: 'text', api_key: 'server-secret' });
        return Response.json({ translatedText: 'こんにちは', other: 'private' });
    } });
    assert.deepEqual(result, { status: 200, data: { translatedText: 'こんにちは' } });
});

test('missing hosted key is actionable and makes no upstream request', async () => {
    const result = await call({ apiKey: '', fetchImpl: () => assert.fail('Must not fetch') });
    assert.equal(result.status, 503);
    assert.match(result.data.error, /API key/);
});

test('self-hosting permits no key and languages come from the instance', async () => {
    const result = await call({ baseUrl: 'http://localhost:5000', fetchImpl: async () =>
        Response.json([{ code: 'ja', name: 'Japanese', targets: ['en'] }]) }, '/api/languages', '', 'GET');
    assert.deepEqual(result.data, [{ code: 'ja', name: 'Japanese' }]);
});

test('upstream failures are safe and actionable', async () => {
    for (const [status, expected] of [[403, /API key/], [429, /limit/], [500, /unavailable/]]) {
        const result = await call({ apiKey: 'secret', fetchImpl: async () => new Response('secret internal error', { status }) });
        assert.match(result.data.error, expected);
        assert.doesNotMatch(JSON.stringify(result.data), /secret/);
    }
});

test('rejects malformed, blank, oversized input and wrong methods', async () => {
    const options = { apiKey: 'secret', fetchImpl: () => assert.fail('Must not fetch') };
    for (const body of ['{', null, { q: ' ', target: 'en' }, { q: 'x'.repeat(10001), target: 'en' }, { q: 'hi', target: '../../secret' }]) {
        assert.equal((await call(options, '/api/translate', body)).status, 400);
    }
    assert.equal((await call(options, '/api/translate', {}, 'GET')).status, 405);
});

test('handles timeout, network failures and invalid upstream responses', async () => {
    for (const [fetchImpl, status] of [
        [async () => { throw new DOMException('timeout', 'TimeoutError'); }, 504],
        [async () => { throw new Error('network'); }, 502],
        [async () => Response.json({}), 502],
        [async () => new Response('<html>failure</html>'), 502],
    ]) assert.equal((await call({ apiKey: 'secret', fetchImpl })).status, status);
});
