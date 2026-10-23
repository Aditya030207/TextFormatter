import { Buffer } from 'node:buffer';
import process from 'node:process';

export function createApiHandler({
    baseUrl = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com',
    apiKey = process.env.LIBRETRANSLATE_API_KEY || '',
    fetchImpl = fetch,
} = {}) {
    const base = baseUrl.replace(/\/$/, '');
    return async function handleApi(req, res) {
        const path = new URL(req.url, 'http://localhost').pathname;
        const reply = (status, data) => {
            res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            res.end(JSON.stringify(data));
        };
        if (!['/api/languages', '/api/translate'].includes(path)) return reply(404, { error: 'Not found.' });
        const translating = path === '/api/translate';
        if (req.method !== (translating ? 'POST' : 'GET')) return reply(405, { error: 'Method not allowed.' });
        try {
            let options = { signal: AbortSignal.timeout(30000) };
            if (translating) {
                if (new URL(base).hostname === 'libretranslate.com' && !apiKey) {
                    return reply(503, { error: 'Translation is not configured. Set the server’s LibreTranslate API key.' });
                }
                let body = '';
                for await (const chunk of req) {
                    body += chunk;
                    if (Buffer.byteLength(body) > 64000) return reply(413, { error: 'Text is too long. Please translate a shorter selection.' });
                }
                let data;
                try { data = JSON.parse(body); } catch { return reply(400, { error: 'Invalid request.' }); }
                if (!data || typeof data.q !== 'string' || !data.q.trim() || data.q.length > 10000 ||
                    typeof data.target !== 'string' || !/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(data.target)) {
                    return reply(400, { error: 'Enter text (up to 10,000 characters) and select a language.' });
                }
                options = {
                    ...options, method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ q: data.q, source: 'auto', target: data.target, format: 'text', ...(apiKey ? { api_key: apiKey } : {}) }),
                };
            }
            const upstream = await fetchImpl(`${base}/${translating ? 'translate' : 'languages'}`, options);
            if (!upstream.ok) {
                const error = upstream.status === 429 ? 'Translation limit reached. Please try again later.'
                    : [401, 403].includes(upstream.status) ? 'Translation service rejected its API key. Please check the server configuration.'
                    : upstream.status === 400 ? 'This text or language pair is not supported by the translation service.'
                    : 'Translation service is unavailable. Please try again later.';
                return reply(upstream.status === 429 ? 429 : 502, { error });
            }
            const result = await upstream.json();
            if (translating) {
                if (typeof result.translatedText !== 'string') throw new Error('Invalid response');
                return reply(200, { translatedText: result.translatedText });
            }
            if (!Array.isArray(result) || !result.length || result.some(item =>
                typeof item.code !== 'string' || typeof item.name !== 'string')) throw new Error('Invalid languages');
            reply(200, result.map(({ code, name }) => ({ code, name })));
        } catch (error) {
            reply(error.name === 'TimeoutError' ? 504 : 502, {
                error: error.name === 'TimeoutError' ? 'Translation timed out. Please try again.' : 'Translation service is unavailable. Please try again later.',
            });
        }
    };
}
