// src/services/rtdb.js
// Firebase RTDB REST Client (API Key Handshake)

// TODO: Replace with your actual Firebase Realtime Database Project ID
const FIREBASE_PROJECT = 'YOUR_FIREBASE_PROJECT';
let geminiApiKey = null;
let fetchAttempted = false;

export async function fetchGeminiApiKey() {
  if (fetchAttempted) return geminiApiKey;
  
  fetchAttempted = true;
  try {
    const response = await fetch(`https://${FIREBASE_PROJECT}.firebaseio.com/config/gemini_api_key.json`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    geminiApiKey = data;
    console.log('[RTDB] Successfully fetched API Key configuration.');
    return geminiApiKey;
  } catch (error) {
    console.warn('[RTDB] Failed to fetch Gemini API Key. AI Copilot will be disabled.', error);
    return null;
  }
}

export function getGeminiApiKey() {
  return geminiApiKey;
}
