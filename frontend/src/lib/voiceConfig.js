/**
 * Configure the voice assistant with health-specific settings
 * @param {string} userContext - Personalized context about the user (profile, meals, past conversations)
 * @returns {Object} VAPI assistant configuration
 */
export const configureHealthAssistant = (userContext = '') => {
    return {
        name: "Health Companion",
        firstMessage: "Hi! I'm your personal health companion. How can I help you today with your nutrition and wellness goals?",

        // Speech-to-Text configuration (Deepgram)
        transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en",
        },

        // Text-to-Speech configuration (Deepgram Aura - Built-in VAPI support)
        voice: {
            provider: "deepgram",
            voiceId: "athena", // Natural, warm female voice
        },

        // LLM configuration (OpenAI)
        model: {
            provider: "openai",
            model: "gpt-4o-mini",
            temperature: 0.7,
            messages: [{
                role: "system",
                content: `You are Dr. Sarah, a knowledgeable and empathetic health and nutrition advisor.

${userContext ? `Here's what I know about this user:\n${userContext}\n` : ''}

Your Guidelines:
✅ Provide evidence-based nutrition and health advice
✅ Ask clarifying questions about goals, allergies, medical conditions
✅ Help with meal planning, healthy eating habits, and fitness
✅ Reference their logged meals and previous conversations when relevant
✅ Be warm, empathetic, supportive, and non-judgmental
✅ Keep responses concise - under 3 sentences for voice conversations
✅ Use simple language, avoid medical jargon

Important Restrictions:
⚠️ NEVER diagnose medical conditions - you're not a doctor
⚠️ For symptoms or health concerns, always advise consulting a healthcare professional
⚠️ Avoid special characters that might cause TTS pronunciation issues
⚠️ Don't provide specific medical treatment advice

Your Personality:
- Warm and encouraging, like a supportive friend
- Professional but approachable
- Celebrate their progress and wins
- Gently guide them toward healthier choices
- Remember details they've shared

Examples of good responses:
- "That's a great start! How do you feel after eating that breakfast?"
- "I notice you've been consistent with protein. Let's work on adding more vegetables."
- "Based on what you told me last time about your weight loss goal, how's it going?"

Tone: Warm, professional, supportive, conversational.`
            }],
            emotionRecognitionEnabled: true,
        },

        // Client messages configuration
        clientMessages: ["transcript", "hang", "function-call", "speech-update"],
        serverMessages: [],

        // End of call behavior
        endCallMessage: "Thank you for chatting with me today! Keep up the great work on your health journey.",
        endCallPhrases: ["goodbye", "bye", "that's all", "end call", "stop"],

        // Silence timeout (30 seconds of silence ends call)
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 600, // 10 minutes max
    };
};
