import { Buffer } from 'node:buffer';

const languages = [
    ['en', 'English'], ['hi', 'Hindi'], ['es', 'Spanish'], ['fr', 'French'],
    ['de', 'German'], ['it', 'Italian'], ['pt', 'Portuguese'], ['ja', 'Japanese'],
    ['ko', 'Korean'], ['zh-CN', 'Chinese (Simplified)'], ['ar', 'Arabic'],
    ['bn', 'Bengali'], ['ru', 'Russian'], ['uk', 'Ukrainian'], ['nl', 'Dutch'],
    ['pl', 'Polish'], ['tr', 'Turkish'], ['ta', 'Tamil'], ['te', 'Telugu'], ['ur', 'Urdu'],
].map(([code, name]) => ({ code, name }));
const codes = new Set(languages.map(({ code }) => code));

export function createApiHandler({ fetchImpl = fetch } = {}) {
    return async function handleApi(req, res) {
        const path = new URL(req.url, 'http://localhost').pathname;
        const reply = (status, data) => {
            res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            res.end(JSON.stringify(data));
        };
        if (!['/api/languages', '/api/translate'].includes(path)) return reply(404, { error: 'Not found.' });
        const translating = path === '/api/translate';
        if (req.method !== (translating ? 'POST' : 'GET')) return reply(405, { error: 'Method not allowed.' });
        if (!translating) return reply(200, languages);
        try {
            const chunks = [];
            let size = 0;
            for await (const chunk of req) {
                const bytes = Buffer.from(chunk);
                size += bytes.length;
                if (size > 64000) return reply(413, { error: 'Text is too long. Please translate a shorter selection.' });
                chunks.push(bytes);
            }
            let data;
            try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
            catch { return reply(400, { error: 'Invalid request.' }); }
            if (!data || typeof data.q !== 'string' || !data.q.trim() ||
                !codes.has(data.source) || !codes.has(data.target)) {
                return reply(400, { error: 'Enter text and select its source and target languages.' });
            }
            if (data.source === data.target) return reply(200, { translatedText: data.q });
            if (Buffer.byteLength(data.q, 'utf8') > 500) {
                return reply(413, { error: 'Free translation supports up to 500 UTF-8 bytes at a time. Please translate a shorter selection (non-English characters may use several bytes).' });
            }
            if (/\r?\n\s*\r?\n/.test(data.q)) {
                return reply(400, { error: 'Please translate one paragraph at a time.' });
            }
            const url = new URL('https://api.mymemory.translated.net/get');
            url.searchParams.set('q', data.q);
            url.searchParams.set('langpair', `${data.source}|${data.target}`);
            const upstream = await fetchImpl(url, { signal: AbortSignal.timeout(30000) });
            const quotaMessage = 'Free translation quota reached (5,000 characters per day). Please try again later.';
            if (!upstream.ok) return reply(upstream.status === 429 ? 429 : 502, {
                error: upstream.status === 429 ? quotaMessage : 'Translation service is unavailable. Please try again later.',
            });
            const result = await upstream.json();
            if (result.quotaFinished || Number(result.responseStatus) === 429) return reply(429, { error: quotaMessage });
            if (Number(result.responseStatus) !== 200) return reply(502, {
                error: 'The translation service could not translate this text or language pair. Please try another language or try again later.',
            });
            if (typeof result.responseData?.translatedText !== 'string' || !result.responseData.translatedText.trim()) {
                throw new Error('Invalid response');
            }
            return reply(200, { translatedText: result.responseData.translatedText });
        } catch (error) {
            reply(error.name === 'TimeoutError' ? 504 : 502, {
                error: error.name === 'TimeoutError' ? 'Translation timed out. Please try again.' : 'Translation service is unavailable. Please try again later.',
            });
        }
    };
}
