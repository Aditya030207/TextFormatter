
const Editor = ({ text, setText }) => {
    const charCount = text.length;
    const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

    return (
        <div className="main-column">
            <div className="input-container">
                <label htmlFor="textInput" className="section-label">Input Text</label>
                <textarea
                    id="textInput"
                    placeholder="Type or paste your text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                ></textarea>

                <div className="stats-bar">
                    <span>{charCount} Characters</span>
                    <span>{wordCount} Words</span>
                </div>
            </div>

            <section className="preview-section">
                <h2 className="section-label">Live Preview</h2>
                <div
                    id="livePreview"
                    className="preview-box"

                >
                    {text || "Start typing to see the preview..."}
                </div>
            </section>
        </div>
    );
};

export default Editor;
