async function request(path, options) {
    let response;
    try {
        response = await fetch(`/api/${path}`, options);
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new Error('Cannot reach translation service. Please try again.', { cause: error });
    }
    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error('Translation service is unavailable. Please try again later.');
    }
    if (!response.ok) throw new Error(data.error || 'Translation failed. Please try again.');
    return data;
}

export async function getLanguages(signal) {
    const data = await request('languages', { signal });
    if (!Array.isArray(data) || !data.length || data.some(item =>
        typeof item.code !== 'string' || typeof item.name !== 'string')) {
        throw new Error('Translation service returned an invalid language list.');
    }
    return data;
}

export async function translateText(text, target, signal) {
    const data = await request('translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target }),
        signal,
    });
    if (typeof data.translatedText !== 'string') {
        throw new Error('Translation service returned an invalid translation.');
    }
    return data.translatedText;
}
