import { test } from 'node:test';
import assert from 'node:assert/strict';
import translation, { config } from '../netlify/functions/translation.mjs';

test('Netlify routes work with no credentials or environment configuration', async (t) => {
    assert.deepEqual(config.path, ['/api/languages', '/api/translate']);
    t.mock.method(globalThis, 'fetch', async url => {
        assert.equal(url.searchParams.get('langpair'), 'en|es');
        assert.equal(url.searchParams.get('q'), 'Hello');
        return Response.json({ responseStatus: 200, responseData: { translatedText: 'Hola' } });
    });
    const languages = await translation(new Request('https://example.netlify.app/api/languages'));
    assert.equal(languages.status, 200);
    assert.equal(languages.headers.get('content-type'), 'application/json');
    assert.ok((await languages.json()).some(item => item.code === 'es'));
    const response = await translation(new Request('https://example.netlify.app/api/translate', {
        method: 'POST', body: JSON.stringify({ q: 'Hello', source: 'en', target: 'es' }),
    }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { translatedText: 'Hola' });
    assert.equal((await translation(new Request('https://example.netlify.app/api/translate'))).status, 405);
});
