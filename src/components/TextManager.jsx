import React, { useState } from 'react';
import Editor from './Editor';
import Controls from './Controls';

const TextManager = () => {
    const [text, setText] = useState('');
    const [fontFamily, setFontFamily] = useState("'Inter', sans-serif");
    const [fontSize, setFontSize] = useState("16");
    const [color, setColor] = useState("#e0e0e0");

    return (
        <section className="editor-section">
            <Editor 
                text={text} 
                setText={setText}
                fontFamily={fontFamily}
                fontSize={fontSize}
                color={color}
            />
            <Controls 
                text={text} 
                setText={setText}
                fontFamily={fontFamily}
                setFontFamily={setFontFamily}
                fontSize={fontSize}
                setFontSize={setFontSize}
                color={color}
                setColor={setColor}
            />
        </section>
    );
};

export default TextManager;
