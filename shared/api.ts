/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export interface MentorRequestBody {
  message: string;
  code?: string;
  language?: string;
  framework?: string;
}

export interface MentorResponse {
  answer: string;
}

export interface ExerciseRequestBody {
  topic: string; // ex: "variables", "boucles"
  language?: string; // default: JavaScript
  framework?: string; // ex: React, Django
}

export interface ExerciseItem {
  title: string;
  prompt: string;
  starter: string;
  solution: string;
}

export interface ExerciseResponse {
  exercise: ExerciseItem;
}

export interface QuizRequestBody {
  language: string;
  framework?: string;
  topic?: string;
  level?: number; // 1..5
}
export interface QuizQuestion {
  q: string;
  options: string[];
  answerIndex: number;
  explain?: string;
}
export interface QuizResponse {
  questions: QuizQuestion[];
}

export interface CourseRequestBody {
  language: string;
  framework?: string;
  topic?: string;
  steps?: number; // e.g. 5
}
export interface CourseStep {
  title: string;
  summary: string;
  objectives: string[];
  codeExample?: string;
}
export interface CourseResponse {
  steps: CourseStep[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
export type ChatProvider = "openai" | "gemini" | "huggingface" | "deepai" | "auto";

export interface ChatRequestBody {
  messages: ChatMessage[];
  provider?: ChatProvider; // optional; default: auto (OpenAI then Gemini)
  model?: string; // optional; e.g. "gpt-4o-mini" or "gemini-1.5-flash"
}
export interface ChatResponse {
  reply: string;
}

export type ImageProvider = "openai" | "gemini" | "huggingface" | "deepai" | "auto";
export interface ImageRequestBody {
  prompt: string;
  provider?: ImageProvider;
  model?: string; // optional override
  size?: "256x256" | "512x512" | "1024x1024";
  n?: number;
}
export interface ImageItem { url?: string; b64?: string; mime?: string }
export interface ImageResponse { images: ImageItem[] }

export interface GlossaryRequestBody {
  term: string;
  language?: string;
  framework?: string;
}
export interface GlossaryItem {
  key: string;
  title: string;
  desc: string;
  code: string;
}
export interface GlossaryResponse { item: GlossaryItem }
