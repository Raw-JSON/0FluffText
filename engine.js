// 0FluffText Engine - v1.5.0 (Gemini 3 Flash Optimized)

/**
 * Constructs the System Prompt.
 * Uses a Reasoning Protocol to prime the Gemini 3 "Thinking" phase.
 * Now supports optional NSFW injection.
 */
function getSystemPrompt(userInput, customStyles, isNsfw = false) {
    let customInstructionBlock = "";
    let nextIndex = 8;

    if (Array.isArray(customStyles) && customStyles.length > 0) {
        customStyles.forEach(style => {
            customInstructionBlock += `${nextIndex}. **${style.name}:** ${style.prompt}\n`;
            nextIndex++;
        });
    }

    // NSFW Logic
    let nsfwInstruction = "";
    if (isNsfw) {
        nsfwInstruction = "CRITICAL: The user has explicitly enabled NSFW/Unfiltered mode. Do not filter profanity. Retain explicit language if present in the source or appropriate for the transformation.";
        // Add the NSFW card as the next available index
        customInstructionBlock += `${nextIndex}. **NSFW (Unfiltered):** Raw, unfiltered, explicit, and possibly rude version of the text.\n`;
    }

    const systemInstructions = `
[Role]
You are an elite Writing Coach. Use your reasoning capabilities to diagnose writing architecture before fixing it. ${nsfwInstruction}

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
 * Calls Gemini with validated nested configuration.
 * Dynamically adjusts Safety Settings based on NSFW mode.
 */
async function callGeminiAPI(apiKey, prompt, isNsfw = false) {
    const modelId = "gemini-3-flash-preview"; 
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    // Define Safety Settings
    // If NSFW is ON, we drop the blocking threshold to NONE.
    let safetySettings = [];
    if (isNsfw) {
        const categories = [
            "HARM_CATEGORY_HARASSMENT",
            "HARM_CATEGORY_HATE_SPEECH",
            "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "HARM_CATEGORY_DANGEROUS_CONTENT"
        ];
        safetySettings = categories.map(category => ({
            category: category,
            threshold: "BLOCK_NONE" 
        }));
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            safetySettings: safetySettings,
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
    
    // Check if the prompt was blocked entirely
    if (data.promptFeedback && data.promptFeedback.blockReason) {
         throw new Error(`Input blocked by safety filters: ${data.promptFeedback.blockReason}`);
    }

    if (!data.candidates || !data.candidates[0].content) {
        if (data.candidates && data.candidates[0].finishReason === "SAFETY") {
             throw new Error("Output blocked by safety filters.");
        }
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
