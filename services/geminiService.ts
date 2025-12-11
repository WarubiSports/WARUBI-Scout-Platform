import { GoogleGenAI, Type } from "@google/genai";
import { PlayerEvaluation, ScoutingEvent, UserProfile, Player } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to strip Markdown code blocks and find JSON structure
const cleanJson = (text: string) => {
  let clean = text.trim();
  // Remove markdown code blocks markers
  clean = clean.replace(/```json/gi, '').replace(/```/g, '').trim();

  // Try to find the start and end of JSON structure
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  
  // Determine if it's likely an object or array and extract it
  let startIdx = -1;
  let endIdx = -1;

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      // It's an array
      startIdx = firstBracket;
      endIdx = clean.lastIndexOf(']');
  } else if (firstBrace !== -1) {
      // It's an object
      startIdx = firstBrace;
      endIdx = clean.lastIndexOf('}');
  }

  if (startIdx !== -1 && endIdx !== -1) {
      clean = clean.substring(startIdx, endIdx + 1);
  }

  return clean;
};

// 0. Parse Player Details (Auto-Fill Form)
export const parsePlayerDetails = async (text: string): Promise<any> => {
    const ai = getAiClient();
    const prompt = `
        You are a data extraction assistant for a soccer scout.
        I will provide a block of raw text that might contain a player's bio, contact info, parents' info, and stats.

        Task: Extract specific fields to populate a submission form.
        
        Raw Text: "${text}"

        Extract these fields (use empty string if not found):
        - firstName
        - lastName
        - email (Player email)
        - phone (Player phone)
        - parentEmail (Any parent/guardian email found)
        - position (e.g. CM, ST)
        - dob (YYYY-MM-DD format if possible, otherwise string)
        - gradYear (Year only)
        - club (Club team name)
        - region (City/State)
        - heightFt (Number)
        - heightIn (Number)
        - gpa (Number or String)
        
        Return strict JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        firstName: { type: Type.STRING },
                        lastName: { type: Type.STRING },
                        email: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        parentEmail: { type: Type.STRING },
                        position: { type: Type.STRING },
                        dob: { type: Type.STRING },
                        gradYear: { type: Type.STRING },
                        club: { type: Type.STRING },
                        region: { type: Type.STRING },
                        heightFt: { type: Type.STRING },
                        heightIn: { type: Type.STRING },
                        gpa: { type: Type.STRING },
                    }
                }
            }
        });
        const text = response.text || "{}";
        const cleaned = cleanJson(text);
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Parse Error", e);
        return {};
    }
};

// 1. Evaluate Player (From Text or Image)
export const evaluatePlayer = async (
  inputData: string,
  isImage: boolean = false,
  mimeType: string = 'image/jpeg'
): Promise<PlayerEvaluation> => {
  const ai = getAiClient();
  
  const prompt = `
    You are a professional expert soccer scout for WARUBI. 
    Analyze the provided player information (which might be raw text notes, a stats list, or an image of a profile).
    
    Extract or infer the player's potential. If specific stats are missing, estimate based on the context or give a general assessment.
    
    Determine the 'scholarshipTier' based on this logic:
    - Tier 1: Top Academy, National Team youth, extremely high stats.
    - Tier 2: High level Regional, State Selection, solid stats.
    - Tier 3: Local Club, Developmental, raw talent.

    Determine the 'recommendedPathways' (can select multiple):
    - "College Pathway": Good GPA, decent level, interested in education.
    - "Development in Europe": High technical ability, elite potential, or looking for pro experience.
    - "Exposure Events": Needs visibility, unproven stats, or Tier 3/2 borderline.
    - "UEFA & German FA Coaching": If they express interest in coaching or leadership (rare).

    Return a strict JSON object with the following schema:
    {
      "score": number (0-100),
      "collegeLevel": string (e.g., "NCAA D1", "NCAA D2", "NAIA", "NCAA D3"),
      "scholarshipTier": string (Expected: "Tier 1", "Tier 2", or "Tier 3"),
      "recommendedPathways": string[] (Array of strings from the list above),
      "strengths": string[] (max 3),
      "weaknesses": string[] (max 3),
      "nextAction": string (short recommendation),
      "summary": string (1-2 sentences)
    }
  `;

  let response;
  
  try {
    const config = {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.NUMBER },
                collegeLevel: { type: Type.STRING },
                scholarshipTier: { type: Type.STRING }, 
                recommendedPathways: { type: Type.ARRAY, items: { type: Type.STRING } },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                nextAction: { type: Type.STRING },
                summary: { type: Type.STRING }
            }
        }
    };

    if (isImage) {
        response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: inputData } },
                    { text: prompt }
                ]
            },
            config
        });
    } else {
        response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${prompt}\n\nPlayer Info:\n${inputData}`,
            config
        });
    }

    const text = response.text || "{}";
    const cleanedText = cleanJson(text);
    const parsed = JSON.parse(cleanedText) as PlayerEvaluation;

    // Normalization for Tier
    let tier = parsed.scholarshipTier;
    if (tier) {
        if (tier.toLowerCase().includes("tier 1")) tier = "Tier 1";
        else if (tier.toLowerCase().includes("tier 2")) tier = "Tier 2";
        else if (tier.toLowerCase().includes("tier 3")) tier = "Tier 3";
        else tier = "Tier 3";
    } else {
        tier = "Tier 3";
    }
    parsed.scholarshipTier = tier as "Tier 1" | "Tier 2" | "Tier 3";

    // Ensure array fields are actually arrays to prevent slice errors
    if (!Array.isArray(parsed.recommendedPathways)) parsed.recommendedPathways = ["Exposure Events"];
    if (!Array.isArray(parsed.strengths)) parsed.strengths = [];
    if (!Array.isArray(parsed.weaknesses)) parsed.weaknesses = [];

    return parsed;

  } catch (error) {
    console.error("AI Evaluation Error", error);
    // Fallback if AI fails
    return {
        score: 50,
        collegeLevel: "Unknown",
        scholarshipTier: "Tier 3",
        recommendedPathways: ["Exposure Events"],
        strengths: ["Review needed"],
        weaknesses: ["Data unclear"],
        nextAction: "Manual Review",
        summary: "AI could not process this input. Please check the data and try again."
    };
  }
};

// 2. Generate Event Plan
export const generateEventPlan = async (
    title: string,
    location: string,
    date: string,
    type: string,
    fee: string
): Promise<{ agenda: string[], marketingCopy: string, checklist: string[] }> => {
    const ai = getAiClient();
    const prompt = `
        You are an event planner for WARUBI Sports.
        Create an "Event Kit" for a new soccer scouting event.

        Event Details:
        - Name: ${title}
        - Type: ${type}
        - Location: ${location}
        - Date: ${date}
        - Cost: ${fee}
        
        Generate 3 things:
        1. 'marketingCopy': A short, exciting blurb (with emojis) suitable for WhatsApp/Instagram to recruit players. Mention the date, location, and that spots are limited.
        2. 'agenda': A 4-5 item timeline (e.g., 9:00 AM Check-in, 10:00 AM Matches).
        3. 'checklist': 5 critical tasks the scout must do before the event (e.g., Book field, Print rosters).
        
        Return strict JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        agenda: { type: Type.ARRAY, items: { type: Type.STRING } },
                        marketingCopy: { type: Type.STRING },
                        checklist: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        const text = response.text || "{}";
        const cleanedText = cleanJson(text);
        const parsed = JSON.parse(cleanedText);
        
        // Defensive checks
        return {
            agenda: Array.isArray(parsed.agenda) ? parsed.agenda : ["09:00 AM - Arrival", "10:00 AM - Kickoff"],
            marketingCopy: parsed.marketingCopy || `Join us for ${title}! ⚽️\n📍 ${location}\n📅 ${date}\nSign up now!`,
            checklist: Array.isArray(parsed.checklist) ? parsed.checklist : ["Bring Balls", "Bring Bibs"]
        };
    } catch (e) {
        console.error("Event Gen Error", e);
        return {
            agenda: ["10:00 AM - Arrival", "10:30 AM - Warmup", "11:00 AM - Matches", "13:00 PM - Closing"],
            marketingCopy: `🔥 Upcoming WARUBI Event: ${title}\n📍 ${location}\n📅 ${date}\n💰 ${fee}\n\nDon't miss your chance to get scouted! Reply to register.`,
            checklist: ["Confirm Field Booking", "Notify Staff", "Prepare Bibs & Balls", "Print Player Check-in List", "Bring Water"]
        };
    }
};

// 3. Generate Weekly Tasks & Personalization (Now includes Questionnaire Data)
export const generateOnboardingData = async (
    role: string, 
    region: string,
    quizAnswers?: Record<string, string>
): Promise<{ tasks: string[], welcomeMessage: string, scoutPersona: string }> => {
    const ai = getAiClient();
    
    let context = `Role: ${role}, Region: ${region}.`;
    if (quizAnswers) {
        context += `
        Additional Context from Scout Questionnaire:
        - Primary Environment: ${quizAnswers['environment']}
        - Existing Access: ${quizAnswers['access']}
        - Contact Method: ${quizAnswers['contact']}
        - Main Motivation: ${quizAnswers['motivation']}
        `;
    }

    const prompt = `
        You are a master head scout and mentor for WARUBI. A new scout has joined.
        
        Based on their profile:
        ${context}
        
        Your Goal:
        Identify "Hidden Gold Mines" in their existing network they might be overlooking.
        Give them 3 HIGHLY SPECIFIC, actionable "Power Moves" to find players immediately.
        
        Examples of logic:
        - If they are a College Coach, suggest: "Export your 'Not Interested' list from your recruiting software. Those players are perfect leads for Warubi."
        - If they are a Club Coach, suggest: "Email the 3 best players cut from your ECNL/GA team tryouts."
        - If they use Veo/Hudl, suggest: "Watch last week's opponent footage and ID their best player."
        
        Generate:
        1. 'scoutPersona': A cool 2-word title for them based on their answers (e.g., "The Connector", "The Tactician", "The Insider").
        2. 'welcomeMessage': A short, punchy 1-sentence welcome that acknowledges their specific leverage.
        3. 'tasks': 3 specific, non-generic tasks based on the logic above.

        Return JSON.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        scoutPersona: { type: Type.STRING },
                        welcomeMessage: { type: Type.STRING },
                        tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        const text = response.text || "{}";
        const cleanedText = cleanJson(text);
        return JSON.parse(cleanedText);
    } catch (e) {
        return {
            scoutPersona: "The Scout",
            welcomeMessage: "Welcome to the team! Let's find some talent.",
            tasks: ["Check your existing contact lists", "Review past game footage", "Scout a local match"]
        };
    }
};

// 4. Q&A
export const askScoutAI = async (question: string): Promise<string> => {
    const ai = getAiClient();
    const prompt = `
      You are a helpful expert mentor for soccer scouts at WARUBI. 
      Answer the question below.
      If the question provides a specific Persona/Role context, assume that persona and answer accordingly.
      
      Question/Context: ${question}
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "I couldn't find an answer to that.";
    } catch (e) {
        return "Service unavailable. Please try again.";
    }
};

// 5. Generate Outreach Message
export const generateOutreachMessage = async (
    scoutName: string,
    player: Player,
    templateType: string,
    assessmentLink?: string
): Promise<string> => {
    const ai = getAiClient();
    const prompt = `
        You are an assistant for a soccer scout named ${scoutName} working for WARUBI.
        Draft a ${templateType} message to a player named ${player.name}.
        
        Player Details:
        - Position: ${player.position}
        - Age: ${player.age}
        - Status: ${player.status}
        - Key Strengths: ${player.evaluation?.strengths.join(', ') || 'N/A'}
        - College Projection: ${player.evaluation?.collegeLevel || 'N/A'}
        
        The message should be:
        1. Professional but approachable.
        2. Short and concise (suitable for WhatsApp or Email).
        3. Mention specific strengths if available to show we did our homework.
        4. Include a clear call to action.
        ${assessmentLink ? `5. IMPORTANT: You MUST include this specific link for them to take a free assessment: ${assessmentLink}. Frame it as a "free evaluation" to see where they stand and get into our database.` : ''}
        
        Do not include subject lines, just the body.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text || "Hi, I'd like to connect.";
    } catch (e) {
        return `Hi ${player.name}, this is ${scoutName} from WARUBI. I've reviewed your profile and see great potential. Let's connect!`;
    }
};

// 6. Bulk Extraction
export const extractPlayersFromBulkData = async (
  inputData: string,
  isImage: boolean = false,
  mimeType: string = 'image/jpeg'
): Promise<Partial<Player>[]> => {
  const ai = getAiClient();
  
  const prompt = `
    You are a high-speed data extraction engine for a soccer scouting platform.
    I have provided a roster, stats sheet, or list of players. 
    
    TASK:
    Extract each player into a structured JSON object.
    
    FIELDS TO EXTRACT:
    - name (string): The player's full name.
    - age (number): Default to 17 if not found.
    - position (string): e.g., "CM", "ST", "GK". Default "Unknown" if missing.
    - club (string): Current team or school.
    
    ESTIMATION (Based on context, league, or stats provided):
    - score (number): 0-100 recruitability score.
    - scholarshipTier (string): "Tier 1", "Tier 2", or "Tier 3".
    - recommendedPathways (string[]): "College Pathway", "Development in Europe", "Exposure Events".
    - summary (string): 1 brief sentence justifying the score/tier.

    OUTPUT:
    Return ONLY a JSON Array of objects. No markdown. No comments.
  `;

  // Strict Schema for Bulk Extraction to avoid parsing errors
  const bulkSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        age: { type: Type.NUMBER },
        position: { type: Type.STRING },
        club: { type: Type.STRING },
        evaluation: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            scholarshipTier: { type: Type.STRING },
            recommendedPathways: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
          },
        },
      },
    },
  };

  try {
     let response;
     if (isImage) {
        response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: inputData } },
                    { text: prompt }
                ]
            },
            config: { 
                responseMimeType: 'application/json',
                responseSchema: bulkSchema
            }
        });
     } else {
        response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${prompt}\n\nDATA:\n${inputData}`,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: bulkSchema
            }
        });
     }

     const text = response.text || "[]";
     const cleaned = cleanJson(text);
     
     try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
            return parsed;
        } else {
            console.error("Parsed result is not an array:", parsed);
            return [];
        }
     } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "\nCleaned Text:", cleaned);
        return [];
     }

  } catch (error) {
      console.error("Bulk extraction failed", error);
      return [];
  }
};