import React from 'react';

const Controls = ({
    text,
    setText,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    color,
    setColor,
}) => {
    // Case Conversion Handlers
    const toUpperCase = () => setText(text.toUpperCase());
    
    const toLowerCase = () => setText(text.toLowerCase());
    
    const toTitleCase = () => {
        const titleCase = text.toLowerCase().split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        setText(titleCase);
    };
    
    const toSentenceCase = () => {
        const lowerText = text.toLowerCase();
        const sentenceCase = lowerText.charAt(0).toUpperCase() + lowerText.slice(1);
        setText(sentenceCase);
    };
    
    const toPascalCase = () => {
        const pascalCase = text.toLowerCase().split(/[^a-zA-Z0-9]/)
            .filter(word => word.length > 0)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
        setText(pascalCase);
    };
    
    const toCamelCase = () => {
        const words = text.toLowerCase().split(/[^a-zA-Z0-9]/).filter(word => word.length > 0);
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
    const copyText = () => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            alert("Text copied to clipboard!");
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    const clearText = () => {
        if (window.confirm("Are you sure you want to clear the text?")) {
            setText("");
        }
    };

    const mockTranslate = (e) => {
        const lang = e.target.value;
        if (!text || lang === 'en') return;

        const suffixMap = {
            'es': ' [Translated to Spanish]',
            'fr': ' [Translated to French]',
            'de': ' [Translated to German]',
            'jp': ' [Translated to Japanese]'
        };

        setText("Translating...");

        setTimeout(() => {
            setText(text + suffixMap[lang]);
            alert(`Mock Translation to ${lang.toUpperCase()} completed!\n(Note: This is a demo feature without a real backend)`);
            e.target.value = 'en'; // reset select
        }, 500);
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
                <h3>Typography & Style</h3>
                <div className="style-inputs">
                    <div className="input-wrapper">
                        <label>Font Family</label>
                        <select 
                            value={fontFamily} 
                            onChange={(e) => setFontFamily(e.target.value)}
                        >
                            <option value="'Inter', sans-serif">Inter (Sans-serif)</option>
                            <option value="'Outfit', sans-serif">Outfit (Modern)</option>
                            <option value="'Courier New', monospace">Courier New (Monospace)</option>
                            <option value="'Georgia', serif">Georgia (Serif)</option>
                            <option value="'Cursive', fantasy">Cursive (Handwritten)</option>
                        </select>
                    </div>

                    <div className="input-wrapper">
                        <label>Font Size (px)</label>
                        <input 
                            type="number" 
                            value={fontSize} 
                            min="10" 
                            max="60"
                            onChange={(e) => setFontSize(e.target.value)}
                        />
                    </div>

                    <div className="input-wrapper">
                        <label>Color</label>
                        <input 
                            type="color" 
                            value={color} 
                            onChange={(e) => setColor(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="control-group">
                <h3>Tools & Actions</h3>
                <div className="actions-grid">
                    <div className="input-wrapper full-width">
                        <label>Translate To (Mock)</label>
                        <select onChange={mockTranslate} defaultValue="en">
                            <option value="en">English (Original)</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="jp">Japanese</option>
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={copyText}>Copy Text</button>
                    <button className="btn btn-danger" onClick={clearText}>Clear</button>
                </div>
            </div>
        </div>
    );
};

export default Controls;
