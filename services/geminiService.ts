import { GoogleGenAI, Type } from "@google/genai";
import { SpeedResult, NetworkInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getNetworkInsights = async (history: SpeedResult[]): Promise<NetworkInsight> => {
  if (history.length === 0) {
    return {
      status: 'fair',
      summary: 'Insufficient data to analyze.',
      recommendations: ['Keep monitoring to gather trends.']
    };
  }

  const prompt = `Analyze the following internet speed history and provide insights. 
  History: ${JSON.stringify(history.slice(-20))}
  Current speed: ${history[history.length - 1].download} Mbps Download, ${history[history.length - 1].upload} Mbps Upload.
  
  Please evaluate the stability, consistency, and potential issues. 
  Consider time of day patterns if multiple timestamps are present.`;

  try {
    // Using gemini-3-pro-preview for advanced reasoning and analysis task
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ['excellent', 'good', 'fair', 'poor'] },
            summary: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['status', 'summary', 'recommendations']
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text response received from AI service");
    }
    
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("AI Insight Error:", error);
    return {
      status: 'good',
      summary: 'Unable to connect to AI analyzer at the moment.',
      recommendations: ['Verify your ISP plan if speeds seem low.']
    };
  }
};