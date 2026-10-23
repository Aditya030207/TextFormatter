# TextFormatter

React/Vite plain-text formatter with live preview, case conversion, clipboard copy,
and LibreTranslate translation. All transformations change the actual text and
survive plain-text copying. Font, size, and color controls have been removed;
the existing CSS is unchanged.

## Run locally

Use Node.js 22.12 or newer.

```sh
npm ci
cp .env.example .env
npm run dev
```

Set `LIBRETRANSLATE_API_KEY` in `.env` to your LibreTranslate key. The default
`https://libretranslate.com` service requires a key. Alternatively, set
`LIBRETRANSLATE_URL` to your own LibreTranslate instance (which may not require a key).
Restart the development server after changing configuration. Never prefix the key
with `VITE_`: only the server should receive it.

Open the URL printed by Vite. Enter text, then choose a target language. The service
automatically detects the source language. Supported languages load from the configured
instance. Failed requests preserve the original text; edits made during a pending
request take precedence over its result. Requests time out after 30 seconds and
accept up to 10,000 characters (your provider may impose a lower limit).

## Production

```sh
npm run build
npm start
```

The Node server serves `dist` and `/api/languages` and `/api/translate` on port 3001
(or `PORT`). Configure the same environment variables on your hosting service.
Use HTTPS so browser clipboard access works. Static-only hosting such as GitHub
Pages cannot run the server: it needs a Node-capable host or equivalent backend
routes. The API key is never included in the browser build.

## Validation

```sh
npm test
npm run build
npm run lint
```

API tests use mocked upstream responses; a valid key or running self-hosted instance
is needed for a real translation smoke test.

[LibreTranslate API documentation](https://docs.libretranslate.com/guides/api_usage/)
