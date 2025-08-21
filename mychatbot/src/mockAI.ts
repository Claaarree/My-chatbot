import { MockAIResponse } from './types';

// Mock AI responses with various patterns
const responses = [
  "That's a great question! Based on my analysis, I think the answer involves considering multiple factors and perspectives.",
  "I understand what you're asking. Let me break this down for you in a simple way...",
  "Interesting! This reminds me of a similar concept. Here's how I see it:",
  "That's a complex topic! From my perspective, there are several key points to consider:",
  "Great question! I'd be happy to help you understand this better.",
  "I can see why you'd ask that. Let me share some insights that might be helpful:",
  "That's actually a fascinating area to explore! Here's what I think:",
  "I appreciate you bringing this up. Based on common patterns, I'd suggest:",
  "Excellent question! This is something that comes up often, and here's my take:",
  "I'm glad you asked! This is an important topic, and I'd like to share some thoughts:"
];

// Topic-specific responses
const topicResponses: { [key: string]: string[] } = {
  weather: [
    "I'm a mock AI, so I can't check real weather data, but I imagine it's either sunny, cloudy, or somewhere in between! ☀️🌤️",
    "Weather is fascinating! Unfortunately, I don't have access to real weather APIs, but I hope it's nice where you are! 🌈"
  ],
  hello: [
    "Hello there! 👋 I'm your friendly chatbot assistant. How can I help you today?",
    "Hi! Great to meet you! I'm here to chat and help with any questions you might have. 😊",
    "Hello! Welcome to our chat! I'm excited to assist you today. What's on your mind?"
  ],
  help: [
    "I'm here to help! You can ask me anything, and I'll do my best to provide a thoughtful response. Try asking about technology, life advice, or just chat with me! 💡",
    "Need assistance? I can help with various topics! Feel free to ask questions, seek advice, or just have a friendly conversation. What would you like to know? 🤝"
  ],
  technology: [
    "Technology is amazing! It's constantly evolving and shaping our world in incredible ways. From AI to mobile apps, there's always something new to discover! 🚀",
    "I love talking about tech! Whether it's programming, gadgets, or the latest innovations, technology continues to transform how we live and work. What specific area interests you? 💻"
  ],
  time: [
    "I don't have access to real-time data, but time is such an interesting concept! It's always 'now' from my perspective. What time-related question did you have in mind? ⏰",
    "Time flies when you're having fun chatting! Though I can't tell you the exact time, I'm always here whenever you need me. 🕐"
  ]
};

// Generate contextual responses based on keywords
function generateContextualResponse(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  // Check for specific topics
  for (const [topic, topicResponseList] of Object.entries(topicResponses)) {
    if (lowerQuestion.includes(topic) || 
        (topic === 'hello' && (lowerQuestion.includes('hi') || lowerQuestion.includes('hey'))) ||
        (topic === 'help' && lowerQuestion.includes('help')) ||
        (topic === 'time' && (lowerQuestion.includes('time') || lowerQuestion.includes('clock'))) ||
        (topic === 'weather' && (lowerQuestion.includes('weather') || lowerQuestion.includes('rain') || lowerQuestion.includes('sunny'))) ||
        (topic === 'technology' && (lowerQuestion.includes('tech') || lowerQuestion.includes('computer') || lowerQuestion.includes('software')))) {
      return topicResponseList[Math.floor(Math.random() * topicResponseList.length)];
    }
  }
  
  // Check question type and add appropriate response
  if (lowerQuestion.includes('?')) {
    if (lowerQuestion.includes('what') || lowerQuestion.includes('how') || lowerQuestion.includes('why')) {
      return responses[Math.floor(Math.random() * responses.length)] + " " + generateDetailedResponse();
    }
  }
  
  // Default response with some personality
  const baseResponse = responses[Math.floor(Math.random() * responses.length)];
  return baseResponse + " " + addPersonalityToResponse();
}

function generateDetailedResponse(): string {
  const detailResponses = [
    "This involves understanding the underlying principles and considering various factors that might influence the outcome.",
    "There are multiple approaches to this, each with their own benefits and considerations.",
    "The key is to look at this from different angles and consider both the immediate and long-term implications.",
    "This is a multi-faceted topic that benefits from careful analysis and consideration of context.",
    "The answer often depends on specific circumstances, but I can share some general insights that might help."
  ];
  
  return detailResponses[Math.floor(Math.random() * detailResponses.length)];
}

function addPersonalityToResponse(): string {
  const personalityAddons = [
    "I hope this helps! Feel free to ask if you'd like me to elaborate on any part. 😊",
    "What do you think about this perspective? I'd love to hear your thoughts! 🤔",
    "Is there a particular aspect of this you'd like to explore further? 🔍",
    "I'm curious to know if this aligns with what you were thinking! 💭",
    "Let me know if you'd like me to dive deeper into any specific area! 📚"
  ];
  
  return personalityAddons[Math.floor(Math.random() * personalityAddons.length)];
}

export class MockAIService {
  /**
   * Simulates an AI response with realistic delay and contextual content
   */
  static async getResponse(question: string): Promise<MockAIResponse> {
    // Simulate processing time (1-3 seconds)
    const delay = Math.random() * 2000 + 1000;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const response = generateContextualResponse(question);
        resolve({
          response,
          delay
        });
      }, delay);
    });
  }

  /**
   * Get suggested starter questions
   */
  static getSuggestedQuestions(): string[] {
    return [
      "Hello! How are you today?",
      "What can you help me with?",
      "Tell me about technology trends",
      "How does artificial intelligence work?",
      "What's the weather like?",
      "Can you give me some life advice?"
    ];
  }
}
