// src/services/ai-copilot.js
import { fetchGeminiApiKey, getGeminiApiKey } from './rtdb.js';
import { bus } from '../core/bus.js';
import { registry } from '../engine/registry.js';

let isAvailable = false;

export async function initAICopilot() {
  const key = await fetchGeminiApiKey();
  if (key) {
    isAvailable = true;
    bus.emit('ai:status', { available: true });
  } else {
    isAvailable = false;
    bus.emit('ai:status', { available: false });
  }
}

export function isCopilotAvailable() {
  return isAvailable;
}

export async function askCopilot(userPrompt) {
  const tools = registry.getAllTools();
  const lower = userPrompt.toLowerCase().trim();

  // Local deterministic keyword matching (works 100% offline or online)
  const matchedTools = registry.matchToolByKeyword(lower);

  // If Gemini API is not configured or offline, use smart local engine
  if (!isAvailable) {
    // Check if user is asking to perform a file operation
    if (matchedTools.length > 0) {
      const topTool = matchedTools[0];
      setTimeout(() => {
        bus.emit('ai:message', {
          role: 'ai',
          text: `Sure! I found the right tool for you: "${topTool.title}". Navigating now...`,
          intent: { type: 'INTENT_ACTION', toolId: topTool.id }
        });
      }, 400);
      return;
    }

    // General offline assistance
    setTimeout(() => {
      bus.emit('ai:message', {
        role: 'ai',
        text: `I am your OmniTools Local Copilot. You can ask me to compress images, merge PDFs, convert to WebP/PNG/JPG, resize pictures, or rasterize SVGs!`
      });
    }, 400);
    return;
  }

  const key = getGeminiApiKey();
  const toolsSummary = tools.map(t => ({ id: t.id, title: t.title, description: t.description }));
  
  const systemInstruction = `
    You are OmniTools AI Copilot, a friendly and concise assistant.
    You help the user manage files and use the local web tools.
    The current available tools are:
    ${JSON.stringify(toolsSummary)}
    
    If the user's prompt indicates they want to use one of these tools (e.g., "compress image", "merge pdfs"), you MUST return ONLY a JSON response in the exact format:
    {"type": "INTENT_ACTION", "toolId": "matched-tool-id", "message": "Short friendly message"}
    
    If it's just a general question, return a regular helpful text response. No markdown JSON block if returning JSON.
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ parts: [{ text: userPrompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const textResp = data.candidates[0].content.parts[0].text.trim();
    
    // Check if response is JSON intent
    try {
      const parsed = JSON.parse(textResp);
      if (parsed.type === 'INTENT_ACTION') {
        bus.emit('ai:message', { role: 'ai', text: parsed.message, intent: parsed });
        return;
      }
    } catch (e) {
      // Not JSON, regular text
    }

    bus.emit('ai:message', { role: 'ai', text: textResp });

  } catch (error) {
    console.warn('[AI Copilot] Remote API failed, falling back to local matching:', error);
    if (matchedTools.length > 0) {
      const topTool = matchedTools[0];
      bus.emit('ai:message', {
        role: 'ai',
        text: `Opening "${topTool.title}" for you...`,
        intent: { type: 'INTENT_ACTION', toolId: topTool.id }
      });
    } else {
      bus.emit('ai:message', { role: 'ai', text: 'I can help you convert, compress, and edit Images, PDFs, and Vectors locally.' });
    }
  }
}
