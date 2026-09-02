import { GoogleGenAI } from '@google/genai';

// Lazy getter for GoogleGenAI instance with appropriate headers
let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export const VARDAAN_SYSTEM_INSTRUCTION = `You are Vardaan AI (वरदान एआई) — an advanced, intelligent, friendly, and highly capable AI assistant.
Your qualities and core capabilities:
- You excel at logical reasoning, mathematics, science, software development & coding in all languages, academics, creative writing, analysis, and problem-solving.
- Multilingual expertise: You have full native fluency in English, Hindi (हिंदी), and Hinglish (Hindi written in English alphabets like "mujhe yeh explain karo"). Automatically understand the user's language and respond naturally in the same language or dialect.
- Tone and Depth: Provide clear, concise, and direct answers for simple questions. For in-depth queries, complex coding problems, or scientific explanations, provide comprehensive, beautifully organized Markdown responses with headings, bullet points, code blocks with syntax tags, and step-by-step reasoning.
- Multimodal & Data: You can analyze uploaded documents (PDFs, text files, CSVs, JSON, Markdown) and images (diagrams, photos, charts, screenshots, handwriting) with exceptional accuracy.
- Personality: Always polite, encouraging, constructive, and ethical.`;

export interface ChatMessageParam {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Array<{
    mimeType: string;
    base64?: string;
    name?: string;
  }>;
}

export async function generateChatResponseStream(
  messages: ChatMessageParam[],
  options?: {
    useSearch?: boolean;
    tone?: 'balanced' | 'concise' | 'detailed';
    customSystemPrompt?: string;
    onChunk?: (text: string) => void;
    onGrounding?: (sources: Array<{ title: string; uri: string }>) => void;
  }
) {
  const ai = getGeminiClient();

  let systemInstruction = VARDAAN_SYSTEM_INSTRUCTION;
  if (options?.tone === 'concise') {
    systemInstruction += '\nKeep your answers concise, direct, and brief unless the user asks for more detail.';
  } else if (options?.tone === 'detailed') {
    systemInstruction += '\nProvide in-depth, comprehensive, and exhaustive explanations with examples.';
  }
  if (options?.customSystemPrompt) {
    systemInstruction += `\nAdditional instructions: ${options.customSystemPrompt}`;
  }

  // Format history for Gemini generateContent / generateContentStream
  // Gemini expects contents to have role 'user' or 'model'
  const contents = messages.map(msg => {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    const parts: any[] = [];

    // Add attachments if user role
    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.base64 && att.mimeType) {
          // Clean base64 string if data URL prefix exists
          const cleanBase64 = att.base64.includes(';base64,')
            ? att.base64.split(';base64,')[1]
            : att.base64;

          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: cleanBase64,
            },
          });
        }
      }
    }

    if (msg.content) {
      parts.push({ text: msg.content });
    } else if (parts.length === 0) {
      parts.push({ text: ' ' });
    }

    return { role, parts };
  });

  const tools: any[] = [];
  if (options?.useSearch) {
    tools.push({ googleSearch: {} });
  }

  const streamResponse = await ai.models.generateContentStream({
    model: 'gemini-3.7-flash',
    contents,
    config: {
      systemInstruction,
      tools: tools.length > 0 ? tools : undefined,
    },
  });

  let fullText = '';
  const sources: Array<{ title: string; uri: string }> = [];

  for await (const chunk of streamResponse) {
    const text = chunk.text;
    if (text) {
      fullText += text;
      options?.onChunk?.(text);
    }

    // Extract search grounding metadata if available
    const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      for (const gChunk of groundingMetadata.groundingChunks) {
        if (gChunk.web?.uri) {
          sources.push({
            title: gChunk.web.title || gChunk.web.uri,
            uri: gChunk.web.uri,
          });
        }
      }
    }
  }

  if (sources.length > 0 && options?.onGrounding) {
    // Unique sources
    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());
    options.onGrounding(uniqueSources);
  }

  return { text: fullText, sources };
}

export async function generateChatTitle(userMessage: string): Promise<string> {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `Generate a short, creative, concise 3 to 5 words title for a chat conversation that begins with this user message: "${userMessage}". Do not use quotation marks, punctuation at the end, or markdown. Return only the title text.`,
    });
    const title = response.text?.trim() || 'New Chat';
    return title.replace(/["'*#]/g, '').slice(0, 40);
  } catch (err) {
    return userMessage.slice(0, 30).trim() || 'New Chat';
  }
}

export async function generateImage(prompt: string, aspectRatio: string = '1:1'): Promise<{ imageUrl: string; prompt: string }> {
  const ai = getGeminiClient();

  // Validate supported aspect ratio
  const validAspectRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
  const ar = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: ar as any,
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        return {
          imageUrl: `data:${mime};base64,${part.inlineData.data}`,
          prompt,
        };
      }
    }
  } catch (primaryErr: any) {
    console.warn('Primary image model returned:', primaryErr?.message);
    // Fallback attempt with gemini-3.1-flash-image
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: ar as any,
          },
        },
      });
      for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return {
            imageUrl: `data:${mime};base64,${part.inlineData.data}`,
            prompt,
          };
        }
      }
    } catch (fallbackErr: any) {
      throw new Error(`Image generation error: ${fallbackErr?.message || primaryErr?.message || 'Failed to generate image.'}`);
    }
  }

  throw new Error('No image was returned from the AI model.');
}
