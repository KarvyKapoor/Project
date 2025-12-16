import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Complaint } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function generateReport(complaints: Complaint[], filters: any): Promise<string> {
  if (!process.env.API_KEY) {
    return "API Key not configured. Please set up the environment variables.";
  }
  
  if (complaints.length === 0) {
    return "No complaint data available for the selected filters to generate a report.";
  }

  // Create a simplified version of the data for the prompt
  const simplifiedData = complaints.map(c => ({
      status: c.status,
      createdAt: c.createdAt.toISOString().split('T')[0], // just date
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString().split('T')[0] : null
  }));

  const prompt = `
    You are an AI assistant for a waste management system administrator.
    Analyze the following data representing complaints based on the filter criteria and provide a brief, insightful summary.
    
    Filter Criteria:
    - Year: ${filters.year}
    - Month: ${filters.month}
    
    Data (JSON format):
    ${JSON.stringify(simplifiedData, null, 2)}
    
    Based on this data, please summarize:
    1. The overall volume of complaints.
    2. The distribution of complaint statuses (Pending, In Progress, Resolved).
    3. Any noticeable trends or patterns (e.g., resolution times, frequent issues).
    
    Keep the summary concise and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate report summary from AI.");
  }
}

export async function generateChartAnalysis(chartType: 'status' | 'volume', data: any[], filters: any): Promise<string> {
  if (!process.env.API_KEY) {
    return "API Key not configured.";
  }
  if (data.length === 0) {
    return "No data available to analyze.";
  }

  const filterDescriptions = [
    filters.year !== 'all' ? `Year: ${filters.year}` : '',
    filters.month !== 'all' ? `Month: ${new Date(0, parseInt(filters.month)).toLocaleString('default', { month: 'long' })}` : '',
  ].filter(Boolean).join(', ');

  const basePrompt = `
    You are an expert data analyst for a waste management system.
    Generate a professional analysis of the provided chart data.
    The data has been filtered by: ${filterDescriptions || 'None'}.
    The output should be a well-structured report with a title, a summary paragraph, and key observations as bullet points.
    Do not include any introductory or concluding remarks outside of the report structure.

    **Data to Analyze:**
    ${JSON.stringify(data, null, 2)}
  `;
  
  let specificPrompt;

  if (chartType === 'status') {
    specificPrompt = `
      ${basePrompt}

      **Analysis Task:**
      The data represents the distribution of complaint statuses (Pending, In Progress, Resolved).
      Analyze the proportions of each status.
      - Highlight the percentage of resolved vs. unresolved (Pending + In Progress) complaints.
      - Comment on the efficiency of the complaint resolution process based on this snapshot.
      - Suggest potential areas for improvement if there is a high number of pending or in-progress issues.

      **Required Output Format:**
      Complaint Status Distribution Analysis
      
      This report summarizes the distribution of complaint statuses for the selected period. The data indicates [your summary here, e.g., a high level of efficiency with most complaints resolved...].

      - **Resolved Complaints:** XX% of complaints are resolved, showing...
      - **In-Progress Complaints:** XX% are currently being addressed...
      - **Pending Complaints:** XX% are awaiting assignment...
      - **Key Insight:** [Your main takeaway or suggestion].
    `;
  } else { // volume
     specificPrompt = `
      ${basePrompt}

      **Analysis Task:**
      The data represents the volume of complaints filed per month.
      Analyze the trends in complaint volume over the period shown.
      - Identify any months with peak or low complaint volumes.
      - Speculate on potential reasons for these trends (e.g., seasonal changes, campus events).
      - Comment on the overall workload trend for the sanitation staff.

       **Required Output Format:**
      Monthly Complaint Volume Analysis

      This report analyzes the trend of complaint volumes over the selected months. The data reveals [your summary here, e.g., a significant increase in complaints during the fall semester...].

      - **Peak Volume:** The highest number of complaints occurred in [Month] with [Number] issues. This may be due to...
      - **Lowest Volume:** The lowest activity was in [Month] with [Number] issues, likely because...
      - **Workload Trend:** The overall trend suggests [e.g., an increasing/decreasing/stable] workload for the staff.
      - **Key Insight:** [Your main takeaway or suggestion for resource planning].
    `;
  }

   try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: specificPrompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Error calling Gemini API for chart analysis:", error);
    throw new Error("Failed to generate chart analysis from AI.");
  }
}

export async function generateComprehensiveReport(
    metrics: any, 
    statusData: any[], 
    volumeData: any[], 
    filters: any
): Promise<string> {
    if (!process.env.API_KEY) {
        return "API Key not configured.";
    }

    const filterDescriptions = [
        filters.year !== 'all' ? `Year: ${filters.year}` : '',
        filters.month !== 'all' ? `Month: ${new Date(0, parseInt(filters.month)).toLocaleString('default', { month: 'long' })}` : '',
    ].filter(Boolean).join(', ');

    const prompt = `
        You are a senior administrator for a waste management system.
        Generate a comprehensive executive summary report based on the provided metrics and data.
        
        **Context:**
        - Filters Applied: ${filterDescriptions || 'None (All Time)'}
        
        **Key Metrics:**
        - Average Resolution Time: ${metrics.avgResolutionTimeDays} days
        - Resolution Rate: ${metrics.resolutionRate}%
        - Total Complaints: ${metrics.total}
        
        **Status Distribution Data:**
        ${JSON.stringify(statusData, null, 2)}
        
        **Volume Trends Data:**
        ${JSON.stringify(volumeData, null, 2)}
        
        **Requirements:**
        1. **Executive Summary:** A brief paragraph summarizing the overall health of the waste management operations.
        2. **Operational Efficiency:** Analyze the resolution time and rate. Is the team performing well?
        3. **Workload Analysis:** Discuss the volume trends and current status backlog.
        4. **Recommendations:** Provide actionable advice based on the data (e.g., "Allocate more staff during peak months", "Focus on resolving pending issues").
        
        Format the output in clean Markdown with headers and bullet points.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "No report generated.";
    } catch (error) {
        console.error("Error generating comprehensive report:", error);
        return "Failed to generate report due to an error.";
    }
}

export async function analyzeWasteImage(imageDataUrl: string): Promise<string> {
  if (!process.env.API_KEY) {
    return "API Key not configured.";
  }

  const match = imageDataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    return "Invalid image format.";
  }
  const mimeType = match[1];
  const base64Data = match[2];

  const prompt = "Analyze this image. Identify the waste item or issue shown (e.g., overflowing bin, litter, specific item). Describe it concisely and suggest whether it belongs in Recycling, Compost, or Landfill. If it is a hazard, please note that.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt }
        ]
      },
    });
    return response.text || "Could not analyze image.";
  } catch (error) {
    console.error("Error calling Gemini API for image analysis:", error);
    return "Failed to analyze image. Please try again.";
  }
}

export async function verifyComplaintAuthenticity(description: string, imageUrl?: string): Promise<'Likely Authentic' | 'Potential Spam'> {
  if (!process.env.API_KEY) {
    console.warn("API Key missing");
    return 'Likely Authentic'; // Default if no API
  }

  const prompt = `
    Analyze the following complaint description and image (if available) for a waste management system.
    Determine if this seems like a legitimate report about waste, litter, or facility issues, or if it appears to be spam, nonsensical, or abusive.
    
    Description: "${description}"
    
    Respond with EXACTLY one of these two strings: "Likely Authentic" or "Potential Spam".
  `;

  try {
    const parts: any[] = [{ text: prompt }];
    
    if (imageUrl) {
        const match = imageUrl.match(/^data:(.+);base64,(.+)$/);
        if (match) {
            parts.push({
                inlineData: {
                    mimeType: match[1],
                    data: match[2]
                }
            });
        }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    });
    
    const text = response.text?.trim();
    if (text === 'Likely Authentic' || text === 'Potential Spam') {
        return text;
    }
    return 'Likely Authentic';
  } catch (error) {
    console.error("Error verifying authenticity:", error);
    return 'Likely Authentic'; // Fallback
  }
}

export async function getLocationFromCoordinates(lat: number, lng: number): Promise<{ address: string; mapLink?: string }> {
  if (!process.env.API_KEY) {
    return { address: "" };
  }

  const prompt = "What is the precise address, building name, or place name for this location? Return only the name/address.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      } as any
    });

    const address = response.text?.trim() || "";
    
    let mapLink: string | undefined;
    const chunks = (response.candidates?.[0] as any)?.groundingMetadata?.groundingChunks;
    
    if (chunks && Array.isArray(chunks)) {
        for (const chunk of chunks) {
             if (chunk.maps?.uri) {
                 mapLink = chunk.maps.uri;
                 break;
             }
        }
    }

    return { address, mapLink };
  } catch (error) {
    console.error("Map grounding error:", error);
    return { address: "" };
  }
}

const createComplaintTool: FunctionDeclaration = {
    name: 'create_complaint',
    description: 'Register a new waste complaint or report.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            location: {
                type: Type.STRING,
                description: 'The location where the waste issue is present.'
            },
            description: {
                type: Type.STRING,
                description: 'A detailed description of the waste issue.'
            }
        },
        required: ['location', 'description']
    }
};

export async function getChatResponse(
    history: { role: 'user' | 'model'; parts: { text: string }[] }[], 
    message: string, 
    language: string,
    userComplaints: Complaint[],
    onToolCall?: (toolName: string, args: any) => Promise<string>
): Promise<string> {
    if (!process.env.API_KEY) return "Chat unavailable (API Key missing).";

    const simplifiedComplaints = userComplaints.map(c => ({
        id: c.id,
        location: c.location,
        description: c.description,
        status: c.status,
        date: c.createdAt.toDateString()
    }));

    const systemInstruction = `
        You are "ZeroBot", a smart AI assistant for the "ZeroKachra" waste management system.
        
        Current Language: ${language}. Respond in ${language}.
        
        Capabilities:
        1. Answer questions about recycling and sustainability.
        2. CHECK STATUS: You have access to the user's current complaints below. If they ask about "my complaints" or "status", check this list.
           Current User Complaints: ${JSON.stringify(simplifiedComplaints)}
        3. FILE COMPLAINT: If the user explicitly asks to file a complaint (e.g., "report full bin at library"), use the 'create_complaint' tool.
        
        Be concise, friendly, and helpful.
    `;

    try {
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { 
                systemInstruction,
                tools: [{ functionDeclarations: [createComplaintTool] }]
            },
            history: history,
        });

        const result = await chat.sendMessage({ message });
        
        if (!result) {
            console.error("Result from chat.sendMessage is undefined");
            return "I'm sorry, I'm having trouble connecting to the AI service right now.";
        }

        // Handle Tool Calls (Function Calling)
        const call = result.functionCalls?.[0];
        if (call && onToolCall) {
            const toolResult = await onToolCall(call.name, call.args);
            
            // Send tool result back to model to generate natural language confirmation
            const followUp = await chat.sendMessage({
                message: [{
                    functionResponse: {
                        name: call.name,
                        response: { result: toolResult }
                    }
                }]
            });
            return followUp.text || "Action completed.";
        }

        return result.text || "I'm sorry, I didn't catch that.";
    } catch (error) {
        console.error("Chat error:", error);
        return "Sorry, I'm having trouble connecting right now.";
    }
}
