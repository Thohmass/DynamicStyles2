// Gemini API Service
const APIService = {
    async generateCSS(prompt) {
        const API_KEY = 'AIzaSyDSZSsCuptDOMePz2icGMHtk2bxmN7a1TQ'; // Replace with your actual API key
        const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

        try {
            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Convert this design prompt to valid CSS code only. Follow these rules:
1. Only respond with CSS code, no explanations
2. Use existing HTML structure (body, .demo-box, etc)
3. Target element classes from the original styles.css
4. Make changes additive to existing styles
5. Never use !important

Prompt: ${prompt}`
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return this.parseGeminiResponse(data);

        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    },

    parseGeminiResponse(response) {
        try {
            const cssText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Basic security sanitization
            const sanitizedCSS = cssText
                .replace(/<script.*?>.*?<\/script>/gis, '')
                .replace(/@import/i, '')
                .replace(/url\(.*?\)/gi, '');

            // Validate CSS structure
            if (!sanitizedCSS.includes('{') || !sanitizedCSS.includes('}')) {
                throw new Error('Invalid CSS format from API');
            }

            return {
                status: 'success',
                css: sanitizedCSS,
                rawResponse: response
            };
        } catch (error) {
            console.error('Response parsing error:', error);
            throw new Error('Failed to parse API response');
        }
    }
};

// Keep the APIService and other core logic the same

// Modified UI Handling
let isProcessing = false;

async function handlePrompt() {
    if (isProcessing) return;

    const promptInput = document.getElementById('promptInput');
    const statusElement = document.getElementById('status');
    const button = document.querySelector('button');

    // Validate input
    if (!promptInput.value.trim()) {
        statusElement.textContent = 'Please enter a style prompt';
        statusElement.style.color = '#ff4444';
        return;
    }

    try {
        isProcessing = true;
        button.disabled = true;
        statusElement.textContent = 'Processing...';
        statusElement.style.color = '#666';

        const response = await APIService.generateCSS(promptInput.value);

        if (response.status === 'success') {
            updateStylesheet(response.css);
            statusElement.textContent = 'Design updated!';
            statusElement.style.color = '#4CAF50';
        } else {
            throw new Error(response.message || 'Unknown error');
        }
    } catch (error) {
        statusElement.textContent = `Error: ${error.message}`;
        statusElement.style.color = '#ff4444';
        console.error('API Error:', error);
    } finally {
        isProcessing = false;
        button.disabled = false;
        promptInput.value = '';
    }
}

// Remove these lines from previous implementation:
// const debouncedHandlePrompt = debounce(handlePrompt, 500);
// document.getElementById('promptInput').addEventListener('input', debouncedHandlePrompt);

// Keep the rest of the code (APIService, updateStylesheet, etc.) unchanged

// Keep the rest of the existing code (updateStylesheet, etc.)

function updateStylesheet(css) {
    const styleElement = document.getElementById('dynamic-styles');
    styleElement.textContent += '\n' + css;
}

// Optional: Add debounce to API calls
const debouncedHandlePrompt = debounce(handlePrompt, 500);
document.getElementById('promptInput').addEventListener('input', debouncedHandlePrompt);

function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}