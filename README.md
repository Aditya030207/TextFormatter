# TextFormatter

React/Vite plain-text formatter with case conversion, live preview, clipboard copy,
and free MyMemory translation. Font, size, and color controls were removed because
they did not survive plain-text copying. Existing CSS is unchanged.

## Local development

Use Node.js 22.12 or newer:

```sh
npm ci
npm run dev
```

No API key, account, or environment variables are required. Enter text, select its
language in **Translate From**, then select **Translate To**. The source language
must be selected explicitly; automatic detection is not supported by this integration.

## Translation limits

MyMemory allows anonymous use up to **5,000 characters per day** and **500 UTF-8
bytes per request**. Non-ASCII characters can occupy several bytes. Translate one
short paragraph at a time. Longer input is rejected with a clear message, never
truncated. These limits apply only to translation; editing, case conversion and
copying still work on longer text. The free quota may be shared by requests using
the same Netlify outbound IP, so availability is not guaranteed per visitor.

Text is sent to MyMemory only when translation is requested. This integration uses
its `/get` endpoint, not the contribution endpoints. It sends no email, key, or
visitor IP parameter. Provider failures, timeouts and quota errors preserve the
original text. Edits made during an in-flight request take precedence over results.

- [MyMemory API specification](https://mymemory.translated.net/doc/spec.php)
- [Usage limits](https://mymemory.translated.net/doc/usagelimits.php)
- [Service terms](https://mymemory.translated.net/terms-and-conditions)

## Netlify deployment

Deploy this repository with the included `netlify.toml`. It runs `npm run build`,
publishes `dist`, and deploys the Netlify Function handling `/api/languages` and
`/api/translate`. No translation secrets or separate backend setup are needed.
The language endpoint returns the application's curated language menu.

Merge the PR into your production branch to trigger a Git-connected Netlify deploy,
or deploy this branch as a preview. Old LibreTranslate environment variables are
unused and can be removed from Netlify if you added them.

## Optional standalone Node hosting

```sh
npm run build
npm start
```

The server serves the frontend and API on port 3001 (or `PORT`). Use HTTPS for
clipboard access outside localhost.

## Validation

```sh
npm test
npm run build
npm run lint
```

Automated API tests mock the provider, including UTF-8 limits, errors and quotas.
