
import { GoogleGenAI } from "@google/genai";

export const enhanceJobDescription = async (details: string): Promise<string> => {
  try {
    let apiKey = '';
    try {
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        apiKey = process.env.API_KEY;
      }
    } catch (e) {}

    if (!apiKey) {
      console.warn("API_KEY not found.");
      return details;
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert SCM logistics coordinator. Enhance the following heavy transport job details to be more professional and technically clear for operations. Keep it concise. Original details: "${details}"`,
      config: {
        temperature: 0.7,
      },
    });

    return response.text || details;
  } catch (error) {
    console.error("Gemini Error:", error);
    return details;
  }
};
