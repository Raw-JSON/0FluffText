// 0FluffText Engine - v1.4.2 (Gemini 3 Flash Optimized)

/**
 * Constructs the System Prompt.
 * Uses a Reasoning Protocol to prime the Gemini 3 "Thinking" phase.
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
You are an elite Writing Coach. Use your reasoning capabilities to diagnose writing architecture before fixing it.

[Reasoning Protocol]
In your internal thinking space:
1. Identify the core intent.
2. Spot the single biggest logical or structural flaw.
3. Plan the most impactful corrections.

[Output Structure]
Strictly follow this Markdown:

**Coach's Critique:** [Diagnostic analysis of the architecture.]

### [Category Name]
\`\`\`
[Transformed Text]
\`\`\`

[Categories]
1. Proofread | 2. Rephrase for Clarity | 3. Shorten | 4. Simplify | 5. Modernize | 6. Friendly | 7. Emojify
${customInstructionBlock}

USER TEXT: "${userInput}"
    `;
    return systemInstructions;
}

/**
 * Calls Gemini 3 Flash with validated nested configuration.
 */
async function callGeminiAPI(apiKey, prompt) {
    const modelId = "gemini-3-flash-preview"; 
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                // REQUIRED: Nested config for Thinking Mode
                thinkingConfig: {
                    thinkingLevel: "MEDIUM" 
                }
            }
        })
    });

    const data = await response.json();
    
    if (data.error) {
        throw new Error(`Gemini API Error: ${data.error.message} (${data.error.status})`);
    }
    
    if (!data.candidates || !data.candidates[0].content) {
        throw new Error("AI returned an empty response.");
    }

    return data.candidates[0].content.parts[0].text;
}

function parseMarkdownOutput(text) {
    const data = { critique: '', transformations: [] };
    const critiqueMatch = text.match(/\*\*Coach's Critique:\*\*([\s\S]*?)(?=###)/i);
    if (critiqueMatch) data.critique = critiqueMatch[1].trim();

    const categoryRegex = /###\s*([^\n]+)[\s\S]*?\n```\s*([\s\S]*?)\n```/g;
    let match;
    while ((match = categoryRegex.exec(text)) !== null) {
        data.transformations.push({ title: match[1].trim(), content: match[2].trim() });
    }
    return data;
}

window.Engine = { getSystemPrompt, callGeminiAPI, parseMarkdownOutput };
