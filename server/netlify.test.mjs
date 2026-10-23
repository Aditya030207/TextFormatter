import { test } from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';
import translation, { config } from '../netlify/functions/translation.mjs';

test('Netlify routes serve languages and translations using server-only configuration', async (t) => {
    const previous = process.env.LIBRETRANSLATE_API_KEY;
    const previousUrl = process.env.LIBRETRANSLATE_URL;
    process.env.LIBRETRANSLATE_API_KEY = 'test-server-key';
    process.env.LIBRETRANSLATE_URL = 'https://libretranslate.com';
    t.after(() => {
        if (previous === undefined) delete process.env.LIBRETRANSLATE_API_KEY;
        else process.env.LIBRETRANSLATE_API_KEY = previous;
        if (previousUrl === undefined) delete process.env.LIBRETRANSLATE_URL;
        else process.env.LIBRETRANSLATE_URL = previousUrl;
    });
    assert.deepEqual(config.path, ['/api/languages', '/api/translate']);
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        if (url.endsWith('/languages')) return Response.json([{ code: 'es', name: 'Spanish' }]);
        const payload = JSON.parse(options.body);
        assert.equal(payload.api_key, 'test-server-key');
        assert.equal(payload.q, 'Hello');
        assert.equal(payload.source, 'auto');
        return Response.json({ translatedText: 'Hola' });
    });
    const languages = await translation(new Request('https://example.netlify.app/api/languages'));
    assert.equal(languages.status, 200);
    assert.equal(languages.headers.get('content-type'), 'application/json');
    assert.deepEqual(await languages.json(), [{ code: 'es', name: 'Spanish' }]);
    const response = await translation(new Request('https://example.netlify.app/api/translate', {
        method: 'POST', body: JSON.stringify({ q: 'Hello', target: 'es' }),
    }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { translatedText: 'Hola' });
    const invalid = await translation(new Request('https://example.netlify.app/api/translate'));
    assert.equal(invalid.status, 405);
    delete process.env.LIBRETRANSLATE_API_KEY;
    const missing = await translation(new Request('https://example.netlify.app/api/translate', {
        method: 'POST', body: JSON.stringify({ q: 'Hello', target: 'es' }),
    }));
    assert.equal(missing.status, 503);
});
