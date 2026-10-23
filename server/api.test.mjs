import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createApiHandler } from './api.mjs';

async function call(fetchImpl, body = { q: 'Hello', source: 'en', target: 'es' }, path = '/api/translate', method = 'POST') {
    const req = Readable.from([typeof body === 'string' ? body : JSON.stringify(body)]);
    req.url = path;
    req.method = method;
    let status, data;
    await createApiHandler({ fetchImpl })(req, {
        writeHead(code) { status = code; },
        end(value) { data = JSON.parse(value); },
    });
    return { status, data };
}
const success = () => Response.json({ responseStatus: 200, responseData: { translatedText: 'Hola' } });
const noFetch = () => assert.fail('Must not call provider');

test('uses documented anonymous endpoint with explicit languages and encoded text', async () => {
    const result = await call(async url => {
        assert.equal(url.origin, 'https://api.mymemory.translated.net');
        assert.equal(url.pathname, '/get');
        assert.equal(url.searchParams.get('q'), 'Hello & goodbye?');
        assert.equal(url.searchParams.get('langpair'), 'en|es');
        assert.equal(url.searchParams.size, 2);
        return success();
    }, { q: 'Hello & goodbye?', source: 'en', target: 'es' });
    assert.deepEqual(result, { status: 200, data: { translatedText: 'Hola' } });
});

test('returns language menu without network and accepts same-language text locally', async () => {
    const result = await call(noFetch, '', '/api/languages', 'GET');
    assert.ok(result.data.some(item => item.code === 'hi'));
    assert.equal((await call(noFetch, { q: 'Hello', source: 'en', target: 'en' })).data.translatedText, 'Hello');
});

test('enforces UTF-8 byte boundary without truncating', async () => {
    assert.equal((await call(success, { q: 'é'.repeat(250), source: 'fr', target: 'en' })).status, 200);
    assert.equal((await call(noFetch, { q: 'é'.repeat(251), source: 'fr', target: 'en' })).status, 413);
    assert.equal((await call(noFetch, { q: 'a'.repeat(501), source: 'en', target: 'es' })).status, 413);
});

test('validates source, target, input, paragraphs, methods and routes', async () => {
    for (const body of ['{', null, { q: ' ', source: 'en', target: 'es' }, { q: 'hello', source: 'auto', target: 'es' }, { q: 'hello', source: 'en', target: 'invalid' }, { q: 'One\n\nTwo', source: 'en', target: 'es' }]) {
        assert.equal((await call(noFetch, body)).status, 400);
    }
    assert.equal((await call(noFetch, {}, '/api/translate', 'GET')).status, 405);
    assert.equal((await call(noFetch, {}, '/api/unknown')).status, 404);
});

test('handles quota failures in HTTP and successful HTTP response bodies', async () => {
    for (const response of [new Response('', { status: 429 }), Response.json({ quotaFinished: true, responseStatus: 200, responseData: { translatedText: 'quota error' } }), Response.json({ responseStatus: '429' })]) {
        const result = await call(async () => response);
        assert.equal(result.status, 429);
        assert.equal(result.data.translatedText, undefined);
    }
});

test('never treats provider errors or malformed output as translated text', async () => {
    for (const fetchImpl of [
        async () => new Response('', { status: 500 }),
        async () => Response.json({ responseStatus: 403, responseData: { translatedText: 'INVALID LANGUAGE PAIR' } }),
        async () => Response.json({ responseStatus: 200, responseData: {} }),
        async () => new Response('<html>failure</html>'),
        async () => { throw new Error('network'); },
    ]) assert.equal((await call(fetchImpl)).status, 502);
    assert.equal((await call(async () => { throw new DOMException('timeout', 'TimeoutError'); })).status, 504);
});
