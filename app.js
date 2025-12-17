// 0FluffText App - UI & State Management

// --- STATE ---
let apiKey = localStorage.getItem('gemini_key') || '';
// Load Array of Styles
let customStyles = JSON.parse(localStorage.getItem('custom_styles') || '[]');

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    if(apiKey) document.getElementById('apiKeyInput').value = apiKey;
    
    renderStyleList(); // Draw the list on load
    document.getElementById('coachBox').classList.add('hidden');
});

// --- UI ACTIONS ---
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

function saveApiKey() {
    apiKey = document.getElementById('apiKeyInput').value.trim();
    localStorage.setItem('gemini_key', apiKey);
}

// --- STYLE LIBRARY LOGIC ---

function addStyle() {
    const nameInput = document.getElementById('newStyleName');
    const promptInput = document.getElementById('newStylePrompt');
    const name = nameInput.value.trim();
    const prompt = promptInput.value.trim();

    if (!name || !prompt) {
        return showToast("Name and Prompt are required! ⚠️");
    }
    
    if (customStyles.length >= 5) {
        return showToast("Max 5 styles allowed. Delete one first. 🛑");
    }

    // Add to array
    customStyles.push({ name, prompt });
    
    // Save to LocalStorage
    localStorage.setItem('custom_styles', JSON.stringify(customStyles));

    // Clear Inputs
    nameInput.value = '';
    promptInput.value = '';

    // Re-render
    renderStyleList();
    showToast("Style Added! ✅");
}

function deleteStyle(index) {
    customStyles.splice(index, 1);
    localStorage.setItem('custom_styles', JSON.stringify(customStyles));
    renderStyleList();
    showToast("Style Deleted. 🗑️");
}

function renderStyleList() {
    const listContainer = document.getElementById('styleListContainer');
    listContainer.innerHTML = '';

    if (customStyles.length === 0) {
        listContainer.innerHTML = '<p style="font-size:0.8rem; color:var(--dim); font-style:italic;">No custom styles yet.</p>';
        return;
    }

    customStyles.forEach((style, index) => {
        const item = document.createElement('div');
        item.style.cssText = `
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        item.innerHTML = `
            <div style="overflow: hidden;">
                <div style="color: var(--accent); font-weight: bold; font-size: 0.9rem;">${style.name}</div>
                <div style="color: var(--dim); font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${style.prompt}</div>
            </div>
            <button onclick="deleteStyle(${index})" style="background:none; border:none; cursor:pointer; font-size: 1rem; padding: 5px;">🗑️</button>
        `;
        listContainer.appendChild(item);
    });
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
        // 1. Get Prompt from Engine (PASSING THE ARRAY NOW)
        const prompt = window.Engine.getSystemPrompt(input, customStyles);
        
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

// Expose globals
window.toggleSettings = toggleSettings;
window.saveApiKey = saveApiKey;
window.addStyle = addStyle;
window.deleteStyle = deleteStyle;
window.enhanceText = enhanceText;
window.copyToClipboard = copyToClipboard;
window.shareText = shareText;
window.clearInput = clearInput;
