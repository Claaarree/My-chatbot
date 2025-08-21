export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
};

export interface MockAIResponse {
  response: string;
  delay: number;
}
