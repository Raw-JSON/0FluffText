// 0FluffText Engine - Logic & AI Interface

/**
 * Constructs the System Prompt with the new "Teacher" persona integration.
 */
function getSystemPrompt(userInput, customName, customPrompt) {
    
    // Dynamic Custom Category Injection
    const hasCustom = customName && customPrompt;
    let customInstructionBlock = "";
    let customPriorityLogic = "";
    let totalCategories = 7;
    
    if (hasCustom) {
        totalCategories = 8;
        customInstructionBlock = `* **${customName}:** ${customPrompt}`;
        customPriorityLogic = `, ${customName}`; 
    }

    const systemInstructions = `
[Role]
You are an elite Writing Coach and Editor. Your goal is not just to fix the user's text, but to teach them *why* it needed fixing.

[Process]
1.  **Analyze & Teach:** Identify the single biggest weakness in the user's text (e.g., passive voice, hedging, redundancy, weak verbs). Formulate a specific "Coach's Critique" that explains this concept briefly.
2.  **Transform:** Generate distinct versions of the text based on the categories below.

[Output Structure]
You must strictly follow this Markdown structure:

**Coach's Critique:** [Insert your educational lesson here. Be direct and helpful.]

### [Category Name]
\`\`\`
[Transformed Text]
\`\`\`

[Transformation Categories]
1.  **Proofread:** Fix grammar/spelling. If perfect, say "Original text is correct."
2.  **Rephrase for Clarity:** Improve flow.
3.  **Shorten:** Condense without losing meaning.
4.  **Simplify:** Make accessible to a general audience.
5.  **Modernize:** Professional, confident tone.
6.  **Friendly:** Warm and approachable.
7.  **Emojify:** Add relevant emojis.
${customInstructionBlock}

[Constraints]
* Do not include introductory filler.
* Ensure every category has a code block.
    
---
    
USER TEXT: "${userInput}"
    `;
    return systemInstructions;
}

/**
 * Calls the Gemini API.
 */
async function callGeminiAPI(apiKey, prompt) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
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
 * Updated to extract the "Coach's Critique".
 */
function parseMarkdownOutput(text) {
    const data = {
        critique: '',
        transformations: []
    };

    // 1. Extract Coach's Critique
    // Looks for "**Coach's Critique:** ... text ... ###"
    const critiqueMatch = text.match(/\*\*Coach's Critique:\*\*([\s\S]*?)(?=###)/i);
    if (critiqueMatch) {
        data.critique = critiqueMatch[1].trim();
    } else {
        // Fallback if AI messes up the header format
        const altMatch = text.match(/Critique:([\s\S]*?)(?=###)/i);
        if(altMatch) data.critique = altMatch[1].trim();
    }

    // 2. Extract Transformations
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

// Export for usage in app.js (simulated module pattern)
window.Engine = {
    getSystemPrompt,
    callGeminiAPI,
    parseMarkdownOutput
};
