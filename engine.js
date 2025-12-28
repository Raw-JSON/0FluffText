// 0FluffText Engine - Logic & AI Interface - v1.4.0

/**
 * Constructs the System Prompt for Gemini 3 Flash reasoning.
 */
function getSystemPrompt(userInput, customStyles) {
    let customInstructionBlock = "";
    let nextIndex = 8;

    if (Array.isArray(customStyles) && customStyles.length > 0) {
        customStyles.forEach(style => {
            customInstructionBlock += `${nextIndex}. **${style.name}:** ${style.prompt}\n`;
            nextIndex++;
        });
    }

    const systemInstructions = `
[Role]
You are an elite Writing Coach and Editor. Your goal is to transform user text while educating them on professional communication standards.

[Reasoning Protocol]
Before generating content, use your internal thinking space to:
1. Identify the logical "anchor" of the user's text.
2. Diagnose structural weaknesses (e.g., circular logic, poor information hierarchy).
3. Determine the optimal tone shift required for professional impact.

[Output Structure]
Strictly follow this Markdown structure:

**Coach's Critique:** [Provide a high-signal analysis of the writing's architecture. Focus on ONE major improvement area like "Active Impact" or "Logical Density".]

### [Category Name]
\`\`\`
[Transformed Text]
\`\`\`

[Transformation Categories]
1.  **Proofread:** Zero-error version.
2.  **Rephrase for Clarity:** Remove mental friction for the reader.
3.  **Shorten:** Maximal information density.
4.  **Simplify:** Clear, jargon-free communication.
5.  **Modernize:** Confident and authoritative.
6.  **Friendly:** Collaborative and warm.
7.  **Emojify:** Visual communication for social contexts.
${customInstructionBlock}

[Constraints]
* No introductory filler.
* Every category must use a code block for easy copying.

---

USER TEXT: "${userInput}"
    `;
    return systemInstructions;
}

/**
 * Calls the Gemini 3 Flash API with Thinking Mode enabled.
 */
async function callGeminiAPI(apiKey, prompt) {
    // Targetting the Gemini 3 Flash model for Pro-level reasoning at Flash speeds
    const modelId = "gemini-3-flash-preview"; 
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            // NEW: Using 'MEDIUM' thinking for the perfect balance of coach insight and speed
            generationConfig: {
                thinking_level: "MEDIUM" 
            }
        })
    });

    const data = await response.json();
    
    if (data.error) {
        throw new Error(`Gemini API Error: ${data.error.message}`);
    }
    if (!data.candidates || !data.candidates[0].content) {
        throw new Error("AI returned an empty response.");
    }

    return data.candidates[0].content.parts[0].text;
}

/**
 * Parses the raw Markdown into a usable object.
 */
function parseMarkdownOutput(text) {
    const data = {
        critique: '',
        transformations: []
    };

    const critiqueMatch = text.match(/\*\*Coach's Critique:\*\*([\s\S]*?)(?=###)/i);
    if (critiqueMatch) {
        data.critique = critiqueMatch[1].trim();
    } else {
        const altMatch = text.match(/Critique:([\s\S]*?)(?=###)/i);
        if(altMatch) data.critique = altMatch[1].trim();
    }

    const categoryRegex = /###\s*([^\n]+)[\s\S]*?\n```\s*([\s\S]*?)\n```/g;
    let match;

    while ((match = categoryRegex.exec(text)) !== null) {
        data.transformations.push({
            title: match[1].trim(),
            content: match[2].trim()
        });
    }

    return data;
}

window.Engine = {
    getSystemPrompt,
    callGeminiAPI,
    parseMarkdownOutput
};
