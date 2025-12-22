
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const enhanceJobDescription = async (details: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert SCM logistics coordinator. Enhance the following heavy transport job details to be more professional and technically clear for operations. Keep it concise. Original details: "${details}"`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 200,
      },
    });

    return response.text || details;
  } catch (error) {
    console.error("Gemini Error:", error);
    return details;
  }
};
