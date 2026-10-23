import { useEffect, useRef, useState } from 'react';
import { getLanguages, translateText } from '../translation.js';

const Controls = ({ text, setText }) => {
    const [languages, setLanguages] = useState([]);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('Loading translation languages…');
    const request = useRef(null);

    useEffect(() => {
        const controller = new AbortController();
        getLanguages(controller.signal).then((items) => {
            setLanguages(items);
            setMessage('');
        }).catch((error) => {
            if (!controller.signal.aborted) setMessage(error.message);
        });
        return () => {
            controller.abort();
            request.current?.abort();
        };
    }, []);

    // Case Conversion Handlers
    const toUpperCase = () => setText(text.toUpperCase());
    
    const toLowerCase = () => setText(text.toLowerCase());
    
    const toTitleCase = () => {
        const titleCase = text.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, space, letter) => space + letter.toUpperCase());
        setText(titleCase);
    };
    
    const toSentenceCase = () => {
        const lowerText = text.toLowerCase();
        const sentenceCase = lowerText.replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, prefix, letter) => prefix + letter.toUpperCase());
        setText(sentenceCase);
    };
    
    const toPascalCase = () => {
        const pascalCase = text.toLowerCase().split(/[^\p{L}\p{N}]+/u)
            .filter(word => word.length > 0)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
        setText(pascalCase);
    };
    
    const toCamelCase = () => {
        const words = text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(word => word.length > 0);
        const camelCase = words.map((word, index) => {
            if (index === 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join('');
        setText(camelCase);
    };
    
    const toSnakeCase = () => {
        const snakeCase = text.toLowerCase().trim().split(/\s+/).join('_');
        setText(snakeCase);
    };

    // Tools & Actions Handlers
    const copyText = async () => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setMessage('Text copied to clipboard!');
        } catch {
            setMessage('Could not copy automatically. Select the text and use Ctrl+C or Cmd+C.');
        }
    };

    const clearText = () => {
        if (window.confirm("Are you sure you want to clear the text?")) {
            setText("");
        }
    };

    const translate = async (event) => {
        const target = event.target.value;
        event.target.value = '';
        if (!text.trim() || !target || busy) return;
        const original = text;
        const controller = new AbortController();
        request.current = controller;
        setBusy(true);
        setMessage('Translating…');
        try {
            const translated = await translateText(original, target, controller.signal);
            // Never overwrite edits, case conversions, or a clear made while waiting.
            setText(current => current === original ? translated : current);
            setMessage('Translation finished. If you edited the text while waiting, your edits were kept.');
        } catch (error) {
            if (!controller.signal.aborted) setMessage(error.message);
        } finally {
            if (!controller.signal.aborted) setBusy(false);
        }
    };

    return (
        <div className="controls-panel">
            <div className="control-group">
                <h3>Case Conversion</h3>
                <div className="button-grid">
                    <button className="btn" onClick={toUpperCase}>UPPERCASE</button>
                    <button className="btn" onClick={toLowerCase}>lowercase</button>
                    <button className="btn" onClick={toTitleCase}>Title Case</button>
                    <button className="btn" onClick={toSentenceCase}>Sentence case</button>
                    <button className="btn" onClick={toPascalCase}>PascalCase</button>
                    <button className="btn" onClick={toCamelCase}>camelCase</button>
                    <button className="btn" onClick={toSnakeCase}>snake_case</button>
                </div>
            </div>

            <div className="control-group">
                <h3>Tools & Actions</h3>
                <div className="actions-grid">
                    <div className="input-wrapper full-width">
                        <label htmlFor="translateTarget">Translate To</label>
                        <select id="translateTarget" onChange={translate} defaultValue=""
                            disabled={busy || !text.trim() || languages.length === 0}>
                            <option value="" disabled>{busy ? 'Translating…' : 'Choose a language'}</option>
                            {languages.map(language => (
                                <option key={language.code} value={language.code}>{language.name}</option>
                            ))}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={copyText}>Copy Text</button>
                    <button className="btn btn-danger" onClick={clearText}>Clear</button>
                </div>
            </div>
            <p role="status" aria-live="polite">{message}</p>
        </div>
    );
};

export default Controls;
