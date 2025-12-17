// 0FluffText App - UI & State Management

// --- STATE ---
let apiKey = localStorage.getItem('gemini_key') || '';
let customStyleName = localStorage.getItem('custom_style_name') || '';
let customStylePrompt = localStorage.getItem('custom_style_prompt') || '';

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    if(apiKey) document.getElementById('apiKeyInput').value = apiKey;
    if(customStyleName) document.getElementById('customStyleName').value = customStyleName;
    if(customStylePrompt) document.getElementById('customStylePrompt').value = customStylePrompt;
    
    document.getElementById('coachBox').classList.add('hidden');
});

// --- UI ACTIONS ---
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

function saveSettings() {
    apiKey = document.getElementById('apiKeyInput').value.trim();
    customStyleName = document.getElementById('customStyleName').value.trim();
    customStylePrompt = document.getElementById('customStylePrompt').value.trim();

    localStorage.setItem('gemini_key', apiKey);
    localStorage.setItem('custom_style_name', customStyleName);
    localStorage.setItem('custom_style_prompt', customStylePrompt);
}

function clearInput() {
    const input = document.getElementById('rawInput');
    input.value = '';
    input.focus();
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.remove('hidden');
    toast.classList.add('visible');
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 2000);
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => showToast("Copied! 📋"));
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast("Copied! 📋");
    }
}

function shareText(title, text) {
    if (navigator.share) {
        navigator.share({ title, text }).catch(console.error);
    } else {
        copyToClipboard(text);
        showToast("Copied (Share API unavailable)");
    }
}

// --- CORE WORKFLOW ---
async function enhanceText() {
    const inputEl = document.getElementById('rawInput');
    const input = inputEl.value.trim();
    
    if (!input) return showToast("Paste some text first! 📝");
    if (!apiKey) {
        showToast("API Key missing! ⚙️");
        toggleSettings();
        return;
    }

    const outputContainer = document.getElementById('cardGrid'); 
    const loadingEl = document.getElementById('loading');
    const coachBox = document.getElementById('coachBox');
    
    // Reset UI
    outputContainer.innerHTML = '';
    coachBox.classList.add('hidden'); 
    loadingEl.classList.remove('hidden');

    try {
        // 1. Get Prompt from Engine
        const prompt = window.Engine.getSystemPrompt(input, customStyleName, customStylePrompt);
        
        // 2. Call API via Engine
        const rawResult = await window.Engine.callGeminiAPI(apiKey, prompt);
        
        // 3. Parse via Engine
        const parsedData = window.Engine.parseMarkdownOutput(rawResult);

        // 4. Render UI
        renderResults(parsedData);

    } catch (e) {
        showToast("Error: " + e.message);
        console.error(e);
        document.getElementById('coachContent').innerText = "Error: " + e.message;
        coachBox.classList.remove('hidden');
    } finally {
        loadingEl.classList.add('hidden');
    }
}

function renderResults(data) {
    const cardGrid = document.getElementById('cardGrid');
    const coachContent = document.getElementById('coachContent');
    const coachBox = document.getElementById('coachBox');

    // Render Coach's Critique
    if (data.critique) {
        coachContent.innerText = data.critique;
        coachBox.classList.remove('hidden');
    }

    // Render Cards
    data.transformations.forEach(t => {
        const card = document.createElement('div');
        card.className = 'transformation-card';
        // Clean ID generation
        const safeId = 'content-' + t.title.replace(/[^a-zA-Z0-9]/g, '');

        card.innerHTML = `
            <div class="card-title">${t.title}</div>
            <div class="card-content" id="${safeId}">${t.content}</div>
            <div class="card-actions">
                <button onclick="copyToClipboard(document.getElementById('${safeId}').innerText)">📋 Copy</button>
                <button class="secondary" onclick="shareText('${t.title}', document.getElementById('${safeId}').innerText)">📤 Share</button>
            </div>
        `;
        cardGrid.appendChild(card);
    });
}

// Expose globals for HTML onclicks
window.toggleSettings = toggleSettings;
window.saveSettings = saveSettings;
window.enhanceText = enhanceText;
window.copyToClipboard = copyToClipboard;
window.shareText = shareText;
window.clearInput = clearInput;
