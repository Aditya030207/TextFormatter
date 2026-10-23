import { Readable } from 'node:stream';
import { createApiHandler } from '../../server/api.mjs';

// Reuse the same API validation and error handling as local development.
export default async function translation(request) {
    const req = request.body ? Readable.fromWeb(request.body) : Readable.from([]);
    req.url = request.url;
    req.method = request.method;
    let status = 200;
    let headers = {};
    let body;
    await createApiHandler()(req, {
        writeHead(code, values) { status = code; headers = values; },
        end(value) { body = value; },
    });
    return new Response(body, { status, headers });
}

export const config = { path: ['/api/languages', '/api/translate'] };
