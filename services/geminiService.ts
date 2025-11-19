import { GoogleGenAI, Type } from "@google/genai";
import { DaySchedule } from "../types";

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (aiClient) return aiClient;
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key is missing. Please set VITE_API_KEY or API_KEY in your environment.");
    throw new Error("API Key is not configured.");
  }
  
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
};

export const parseTimetableFromImage = async (base64Image: string): Promise<DaySchedule[]> => {
  try {
    const ai = getAiClient();
    
    // Extract mime type if available
    let mimeType = 'image/jpeg';
    const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }

    // Remove header if present (e.g., "data:image/png;base64,")
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: "Extract the class timetable from this image. Ignore lunch breaks or recesses if possible, or label them clearly. Return a clean JSON structure.",
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING, description: "Day of the week (e.g., Monday)" },
              periods: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING, description: "Time range (e.g., 9:00-10:00)" },
                    subject: { type: Type.STRING, description: "Subject name or code" },
                    location: { type: Type.STRING, description: "Room number or Hall name" }
                  },
                  required: ["time", "subject"]
                }
              }
            },
            required: ["day", "periods"]
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text) as DaySchedule[];
      return data;
    }
    throw new Error("No data returned from Gemini");
  } catch (error) {
    console.error("Error parsing timetable:", error);
    throw error;
  }
};

export const getStudyTip = async (subject: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Give me a short, punchy, one-sentence study tip for a college student studying "${subject}".`,
        });
        return response.text || "Stay consistent and practice daily!";
    } catch (e) {
        console.error("Failed to get study tip", e);
        return "Focus on understanding the concepts.";
    }
}