import { useState } from 'react';
import Editor from './Editor';
import Controls from './Controls';

const TextManager = () => {
    const [text, setText] = useState('');

    return (
        <section className="editor-section">
            <Editor 
                text={text} 
                setText={setText}
            />
            <Controls 
                text={text} 
                setText={setText}
            />
        </section>
    );
};

export default TextManager;
