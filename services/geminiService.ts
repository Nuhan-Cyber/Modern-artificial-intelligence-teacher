import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import type { QuizQuestion, Notes, ChatMessage, QuizGenerationOptions, Language, Flashcard, UserAnswer, ConceptGap, ScheduledTask, MemorizationKey, UserProfile, ShortQuestion, CreativeQuestion, TutorModel } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getTargetLanguage = (lang: Language) => {
    switch(lang) {
        case 'bn': return 'Bengali (Bangla)';
        case 'en': return 'English';
        case 'zh': return 'Chinese (Mandarin)';
        default: return 'English';
    }
}

const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: file.type,
        },
    };
};

const getCurriculumPrompt = (userProfile: UserProfile | null) => {
    if (!userProfile || !userProfile.country || !userProfile.curriculum) return '';
    const targetLanguage = getTargetLanguage(userProfile.country.toLowerCase() === 'china' ? 'zh' : userProfile.country.toLowerCase() === 'bangladesh' ? 'bn' : 'en');
    return `
    **Localization Instructions:**
    - The user is from **${userProfile.country}**.
    - They are studying the **${userProfile.curriculum}** curriculum.
    - The entire output MUST be in **${targetLanguage}**.
    - All content, examples, and cultural references must be adapted to be relevant to a student in this specific context. For historical or political topics, reflect the perspective and emphasis of the specified curriculum.
    `;
};


// --- Schemas for On-Demand Generation ---

const getQuizSchema = (lang: Language, type: QuizGenerationOptions['type']) => {
    let questionTextDescription = "The main text of the question.";
    let optionsDescription = "An array of 4-5 choices for the MCQ.";
    let correctAnswerDescription = "The correct answer, which must be one of the options.";

    // These descriptions will be in English, but the prompt will instruct the AI to populate them in the target language.
    if (type === 'Timeline') {
        questionTextDescription = "A question asking which event happened first.";
        optionsDescription = "An array of 2-4 events to be chronologically ordered.";
        correctAnswerDescription = "The earliest event among the options.";
    }

    return {
        type: Type.ARRAY,
        description: `An array of diverse quiz questions based on the provided material, difficulty, and type.`,
        items: {
            type: Type.OBJECT,
            properties: {
                questionText: { type: Type.STRING, description: questionTextDescription },
                questionType: { type: Type.STRING, enum: ['MCQ', 'Timeline', 'Classic', 'GeneralKnowledge'], description: "Type of question." },
                options: {
                    type: Type.ARRAY,
                    description: optionsDescription,
                    items: { type: Type.STRING }
                },
                correctAnswer: { type: Type.STRING, description: correctAnswerDescription },
                explanation: { type: Type.STRING, description: "A detailed explanation for why the answer is correct." },
                sourceReference: { type: Type.STRING, description: "A snippet or reference from the source material supporting the answer." },
                difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Creative'], description: "The difficulty of the question." }
            },
            required: ["questionText", "questionType", "options", "correctAnswer", "explanation", "sourceReference", "difficulty"]
        }
    }
};


const getNotesSchema = (lang: Language) => ({
    type: Type.OBJECT,
    description: "Comprehensive, advanced, and structured notes from the material.",
    properties: {
        summary: { type: Type.STRING, description: "A brief, insightful overview of the entire material." },
        keyConcepts: {
            type: Type.ARRAY,
            description: "Bulleted list of main topics and ideas. Each concept should have detailed, clear points.",
            items: {
                type: Type.OBJECT,
                properties: {
                    concept: { type: Type.STRING, description: "The main concept title." },
                    points: {
                        type: Type.ARRAY,
                        description: "A list of bullet points explaining the concept in detail.",
                        items: { type: Type.STRING }
                    }
                },
                required: ["concept", "points"]
            }
        },
        memorizationKeys: {
            type: Type.ARRAY,
            description: "The most critical information for the student to memorize. Includes key facts, definitions, dates, people, and formulas.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: {type: Type.STRING, enum: ['Fact', 'Definition', 'Date', 'Person', 'Formula'], description: "The type of information."},
                    key: {type: Type.STRING, description: "The key item to memorize. E.g., a term, a person's name, or a date."},
                    value: {type: Type.STRING, description: "The corresponding information to memorize. E.g., the definition, the significance, or the event."},
                },
                 required: ["type", "key", "value"]
            }
        },
        definitions: {
            type: Type.ARRAY,
            description: "Important definitions and key terms.",
            items: {
                type: Type.OBJECT,
                properties: {
                    term: { type: Type.STRING, description: "The term being defined." },
                    definition: { type: Type.STRING, description: "The clear and concise definition." }
                },
                required: ["term", "definition"]
            }
        },
        keyPeople: {
            type: Type.ARRAY,
            description: "A list of important individuals mentioned.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the person."},
                    significance: { type: Type.STRING, description: "Why this person is important."}
                },
                required: ["name", "significance"]
            }
        },
        keyDates: {
            type: Type.ARRAY,
            description: "A list of significant dates and events.",
            items: {
                type: Type.OBJECT,
                properties: {
                    date: { type: Type.STRING, description: "The specific date or year." },
                    event: { type: Type.STRING, description: "The significant event."}
                },
                required: ["date", "event"]
            }
        },
        keyLocations: {
            type: Type.ARRAY,
            description: "A list of important places mentioned.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the location."},
                    significance: { type: Type.STRING, description: "Why this location is relevant."}
                },
                required: ["name", "significance"]
            }
        },
        examples: {
            type: Type.ARRAY,
            description: "Relevant examples to illustrate concepts.",
            items: { type: Type.STRING }
        },
        studyQuestions: {
            type: Type.ARRAY,
            description: "A list of thought-provoking questions based on the material to encourage further study.",
            items: { type: Type.STRING }
        }
    },
    required: ["summary", "keyConcepts", "memorizationKeys", "definitions", "keyPeople", "keyDates", "keyLocations", "examples", "studyQuestions"]
});

const getFlashcardsSchema = (lang: Language) => ({
    type: Type.ARRAY,
    description: "An array of flashcards based on key terms and concepts from the provided material.",
    items: {
        type: Type.OBJECT,
        properties: {
            term: { type: Type.STRING, description: "The term or question for the front of the flashcard." },
            definition: { type: Type.STRING, description: "The definition or answer for the back of the flashcard." }
        },
        required: ["term", "definition"]
    }
});

const getShortQuestionSchema = (lang: Language) => ({
    type: Type.ARRAY,
    description: "An array of 2-mark short questions, relevant to Bangladesh curriculum.",
    items: {
        type: Type.OBJECT,
        properties: {
            questionText: { type: Type.STRING, description: "The full text of the short question." },
            subject: { type: Type.STRING, description: "The subject of the question, e.g., 'Mathematics', 'Physics'." },
            answerGuide: { 
                type: Type.ARRAY, 
                description: "An array of 2-4 key points the answer should contain.",
                items: { type: Type.STRING }
            }
        },
        required: ["questionText", "subject", "answerGuide"]
    }
});

const getCreativeQuestionSchema = (subject: string) => {
    const isMath = subject.toLowerCase().includes('math') || subject.includes('গণিত');

    if (isMath) {
        return {
            type: Type.OBJECT,
            description: "A full creative question (Srijonshil) set for Mathematics, based on Bangladesh curriculum.",
            properties: {
                subject: { type: Type.STRING, description: "The subject of the question (e.g., Mathematics)." },
                stem: { type: Type.STRING, description: "The stimulus or stem ('Uddipok') of the creative question. This should be a scenario with data." },
                questions: {
                    type: Type.ARRAY,
                    description: "An array of 3 questions (k, kha, ga) based on the stem.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            level: { type: Type.STRING, enum: ['ক', 'খ', 'গ'], description: "The level of the question." },
                            text: { type: Type.STRING, description: "The text of the question." },
                            marks: { type: Type.INTEGER, description: "Marks for the question (2 for ক, 4 for খ, 4 for গ)." }
                        },
                        required: ["level", "text", "marks"]
                    }
                }
            },
            required: ["subject", "stem", "questions"]
        }
    }

    // Schema for other subjects
    return {
        type: Type.OBJECT,
        description: "A full creative question (Srijonshil) set, based on Bangladesh curriculum.",
        properties: {
            subject: { type: Type.STRING, description: "The subject of the question." },
            stem: { type: Type.STRING, description: "The stimulus or stem ('Uddipok') of the creative question. This should be a paragraph or scenario." },
            questions: {
                type: Type.ARRAY,
                description: "An array of 4 questions (k, kha, ga, gha) based on the stem.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        level: { type: Type.STRING, enum: ['ক', 'খ', 'গ', 'ঘ'], description: "The level of the question." },
                        text: { type: Type.STRING, description: "The text of the question." },
                        marks: { type: Type.INTEGER, description: "Marks for the question (1 for ক, 2 for খ, 3 for গ, 4 for ঘ)." }
                    },
                    required: ["level", "text", "marks"]
                }
            }
        },
        required: ["subject", "stem", "questions"]
    };
};

// --- On-Demand Generation Functions ---

export async function analyzeContent(files: File[], language: Language, userProfile: UserProfile | null): Promise<{context: string, title: string}> {
    const fileParts = await Promise.all(files.map(fileToGenerativePart));

    const prompt = `
    You are a world-class AI Learning Assistant. Your first task is to analyze the provided documents and images.
    
    With extreme precision, perform OCR on images and parse all text, tables, and charts from the documents.
    Synthesize all this information into a comprehensive, detailed, and coherent body of text. This text should act as a "knowledge base" or "context" from which other learning materials will be generated later. It must cover all key topics, concepts, definitions, figures, dates, and examples found in the source materials.
    
    After synthesizing the content, determine a concise, descriptive title for this learning session (e.g., "The History of the Renaissance," "Principles of Quantum Mechanics").

    ${getCurriculumPrompt(userProfile)}
    
    Return a single JSON object with two keys: "title" and "context". Do not add any other text.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "A concise title for the content." },
            context: { type: Type.STRING, description: "The full synthesized text from the documents." }
        },
        required: ["title", "context"]
    }

    const contents = [...fileParts, { text: prompt }];

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: contents },
        config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: schema,
        }
    });
    
    const data = JSON.parse(response.text);
    return { context: data.context, title: data.title };
}

export async function generateQuiz(context: string, options: QuizGenerationOptions, language: Language, userProfile: UserProfile | null): Promise<QuizQuestion[]> {
    const { numberOfQuestions, difficulty, type } = options;
    
    let typeInstruction = '';
    switch(type) {
        case 'Timeline':
            typeInstruction = 'All questions MUST be of type Timeline. Each question should present multiple events and ask which one occurred first.';
            break;
        case 'GeneralKnowledge':
            typeInstruction = 'All questions MUST be in a General Knowledge style, related to the context provided but testing broader understanding.';
            break;
        default: // MCQ, Classic
             typeInstruction = 'All questions MUST be of type Multiple Choice Question (MCQ).';
    }

    const prompt = `
    You are a master quiz creator. Based on the following context, generate a quiz with exactly ${numberOfQuestions} questions.

    **CRITICAL CONSTRAINTS:**
    1.  **Question Type:** ${typeInstruction}
    2.  **Difficulty:** The difficulty of the questions should be '${difficulty}'.
    3.  **Output Format:** Your output **MUST** be a single JSON array of question objects that strictly adheres to the provided schema. Do not output anything else. Each question must have a 'difficulty' field matching the requested level (or a mix if 'Mixed' was requested).
    
    ${getCurriculumPrompt(userProfile)}

    Context:
    ---
    ${context}
    ---
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: getQuizSchema(language, type),
            temperature: 0.7, 
        }
    });

    try {
        const text = response.text.trim();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) { throw new Error("Generated quiz is not an array."); }
        // For "OneMistake" quiz type, the UI handles the logic, but we can generate any question format.
        // We'll default to MCQ for "OneMistake" and "Classic"
        const finalType = (type === 'OneMistake' || type === 'Classic') ? 'MCQ' : type;
        return (data as QuizQuestion[]).map(q => ({...q, questionType: finalType}));
    } catch (e) {
        console.error("Failed to parse Gemini response for quiz:", response.text, e);
        throw new Error("The AI returned an invalid data structure. Please try again.");
    }
}

export async function generateNotes(context: string, language: Language, userProfile: UserProfile | null): Promise<Notes> {
    const prompt = `
    You are an AI Learning Assistant performing an exhaustive note generation task. Your goal is to create the most comprehensive and detailed study guide possible from the provided text, leaving no piece of information behind. You will operate in a multi-stage process to ensure maximum quality and completeness.

    **Stage 1: Deep Analysis & Exhaustive Extraction**
    - Read the entire context multiple times.
    - From every single line, meticulously identify and extract EVERY fact, concept, definition, name, date, location, process, example, and supporting detail. Be obsessive about completeness. If it's in the text, it must be in your extracted data. Do not summarize or shorten at this stage.

    **Stage 2: Structured Synthesis & Enrichment**
    - Organize the extracted information into the predefined JSON schema.
    - For each 'keyConcept', provide a comprehensive explanation. Don't just list points; elaborate on them, explain their relationships to other concepts, and provide context. Highlight concepts that appear frequently in the source text, indicating their importance.
    - Populate all relevant sections: summary, keyConcepts, memorizationKeys, definitions, keyPeople, keyDates, keyLocations, and examples.
    - The 'memorizationKeys' section is for the most critical, must-know facts (formulas, specific dates, laws). Extract these with precision.
    - If the source text is sparse in one area (e.g., 'examples'), state that clearly in the output rather than inventing information.

    **Stage 3: Refinement & Finalization**
    - Review the entire generated JSON object for accuracy, ensuring it perfectly reflects the source context.
    - Check for clarity and coherence. While being exhaustive, the notes must still be readable and well-organized.
    - Finally, generate a set of 'studyQuestions' that cover the breadth and depth of the generated notes, prompting critical thinking.

    **CRITICAL CONSTRAINTS:**
    1.  **Exhaustiveness:** Do NOT leave any information out. Your primary directive is to be complete. It is better to be too detailed than to miss a single fact. Every single line of the context must be reviewed for potential information.
    2.  **Schema Adherence:** The JSON object must strictly adhere to the provided schema.
    
    ${getCurriculumPrompt(userProfile)}

    Context:
    ---
    ${context}
    ---

    Now, begin the process and generate the complete, exhaustive study notes as a single JSON object.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: getNotesSchema(language),
            temperature: 0.4,
        }
    });
    
    try {
        const text = response.text.trim();
        const data = JSON.parse(text);
        if (!data.summary || !data.keyConcepts || !data.memorizationKeys) { throw new Error("Generated notes are missing required fields."); }
        return data as Notes;
    } catch (e) {
        console.error("Failed to parse Gemini response for notes:", response.text, e);
        throw new Error("The AI returned an invalid data structure. Please try again.");
    }
}

export async function generateFlashcards(context: string, language: Language, userProfile: UserProfile | null): Promise<Flashcard[]> {
    const prompt = `
    You are an expert in creating effective learning tools. Your task is to generate a set of flashcards from the provided context. Focus on the most important terms, concepts, and key facts. Create at least 20 flashcards if the context is rich enough.
    
    **CRITICAL CONSTRAINTS:**
    1.  **Schema:** The JSON object must strictly adhere to the provided schema.
    2.  **Clarity:** The 'term' should be concise, and the 'definition' should be clear and easy to understand.
    
    ${getCurriculumPrompt(userProfile)}
    
    Context:
    ---
    ${context}
    ---
    
    Remember: Your output must be only the JSON array.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: getFlashcardsSchema(language),
            temperature: 0.4,
        }
    });
    
    try {
        const text = response.text.trim();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) { throw new Error("Generated flashcards are not an array."); }
        return data as Flashcard[];
    } catch (e) {
        console.error("Failed to parse Gemini response for flashcards:", response.text, e);
        throw new Error("The AI returned an invalid data structure. Please try again.");
    }
}

export async function generateShortQuestions(context: string, language: Language, userProfile: UserProfile | null, count: number): Promise<ShortQuestion[]> {
    const prompt = `
    You are an expert question creator for the **Bangladesh National Curriculum**.
    Your task is to generate exactly ${count} 2-mark "সংক্ষিপ্ত প্রশ্ন" (Short Questions) based on the provided context.
    
    **CRITICAL INSTRUCTIONS:**
    1.  **Curriculum Focus:** All questions must be highly relevant to the Bangladesh curriculum. Use appropriate terminology and question styles.
    2.  **Question Style:**
        *   For subjects like Science, History, Bangla: Generate questions asking for definitions, explanations, differences, or causes (e.g., "সংজ্ঞা দাও", "কাকে বলে", "ব্যাখ্যা কর", "পার্থক্য লেখ").
        *   For **Mathematics**: Generate creative, small word problems ("ডাকের অংক") that can be solved in a few steps.
    3.  **Complexity:** Each question should be answerable in 5 to 8 lines of text. The required answer should be more than a single word or sentence.
    4.  **Answer Guide:** For each question, provide a few key bullet points that a perfect 2-mark answer should contain. This is not the full answer, but a guide.
    5.  **Output Format:** Your output **MUST** be a single JSON array of question objects that strictly adheres to the provided schema. Do not output anything else.

    ${getCurriculumPrompt(userProfile)}

    Context:
    ---
    ${context}
    ---
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: getShortQuestionSchema(language),
            temperature: 0.8,
        }
    });

    try {
        const data = JSON.parse(response.text.trim());
        if (!Array.isArray(data)) { throw new Error("Generated short questions are not an array."); }
        return data as ShortQuestion[];
    } catch (e) {
        console.error("Failed to parse Gemini response for short questions:", response.text, e);
        throw new Error("The AI returned an invalid data structure. Please try again.");
    }
}


export async function generateCreativeQuestion(context: string, subject: string, language: Language, userProfile: UserProfile | null, count: number): Promise<CreativeQuestion[]> {
    const isMath = subject.toLowerCase().includes('math') || subject.includes('গণিত');
    
    const mathInstructions = `
        **CRITICAL INSTRUCTIONS FOR MATHEMATICS:**
        1.  **Stimulus (উদ্দীপক):** Create a rich, engaging, and relevant stimulus (a scenario with data) from the provided context.
        2.  **Question Structure:** Generate exactly THREE questions, labeled 'ক', 'খ', and 'গ'.
            *   **ক (Short Question - সংক্ষিপ্ত প্রশ্ন):** 2 marks. A short calculation or definition.
            *   **খ (Application - প্রয়োগমূলক):** 4 marks. A direct calculation or problem-solving task based on the stimulus.
            *   **গ (Higher-Order - উচ্চতর দক্ষতামূলক):** 4 marks. A more complex calculation, analysis, or comparison, often related to the result of 'খ'.
    `;
    const otherSubjectInstructions = `
        **CRITICAL INSTRUCTIONS FOR NON-MATHEMATICS SUBJECTS:**
        1.  **Stimulus (উদ্দীপক):** Create a rich, engaging, and relevant stimulus (a paragraph, scenario, or data set) from the provided context. The stimulus MUST NOT contain the answers directly.
        2.  **Question Structure:** Generate exactly FOUR questions, labeled 'ক', 'খ', 'গ', and 'ঘ'.
            *   **ক (Knowledge - জ্ঞানমূলক):** 1 mark. A direct recall-based question. May or may not be from the stimulus.
            *   **খ (Comprehension - অনুধাবনমূলক):** 2 marks. "Explain why/what" type question. Should relate to the stimulus's general topic but not depend on it.
            *   **গ (Application - প্রয়োগমূলক):** 3 marks. A direct application of knowledge from the context, prompted by the stimulus. E.g., "Describe the process mentioned in the stimulus...".
            *   **ঘ (Higher-Order Thinking - উচ্চতর দক্ষতামূলক):** 4 marks. Requires analysis, evaluation, or synthesis. E.g., "Analyze the impact of...", "Evaluate the decision...".
    `;

    const prompt = `
    You are an exceptionally skilled question setter specializing in the **Bangladesh National Curriculum's "Srijonshil" (Creative Question) format**.
    Your task is to create ${count} complete, high-quality Creative Question set(s) based on the provided context and subject.

    **First, deeply analyze the standards for a Creative Question in Bangladesh for the subject: ${subject}.**
    
    ${isMath ? mathInstructions : otherSubjectInstructions}

    **GENERAL INSTRUCTIONS:**
    5.  **Subject-Specificity:** Ensure the style is appropriate for the subject.
    6.  **Output Format:** Your output **MUST** be a single JSON array of Creative Question objects that strictly adheres to the provided schema. Do not output anything else.

    ${getCurriculumPrompt(userProfile)}

    Context:
    ---
    ${context}
    ---
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: getCreativeQuestionSchema(subject),
            },
            temperature: 0.9, 
        }
    });
    
    try {
        const data = JSON.parse(response.text.trim());
        if (!Array.isArray(data)) { throw new Error("Generated creative questions are not an array."); }
        return data as CreativeQuestion[];
    } catch (e) {
        console.error("Failed to parse Gemini response for creative question:", response.text, e);
        throw new Error("The AI returned an invalid data structure. Please try again.");
    }
}

export async function generateCreativeQuestionAnswer(question: CreativeQuestion, subject: string, language: Language, userProfile: UserProfile | null): Promise<{ level: 'ক' | 'খ' | 'গ' | 'ঘ'; answer: string; }[]> {
    const prompt = `
    You are an expert examiner for the Bangladesh National Curriculum. Your task is to provide a perfect, model answer for the following creative question set for the subject **${subject}**.
    The answer should be clear, comprehensive, and follow the specific marking guidelines for each part (জ্ঞানমূলক, অনুধাবনমূলক, প্রয়োগমূলক, উচ্চতর দক্ষতামূলক).

    **Question Set:**
    *   **Stimulus:** ${question.stem}
    *   **Questions:**
        ${question.questions.map(q => `    *   ${q.level} (${q.marks} marks): ${q.text}`).join('\n')}

    **Instructions:**
    1.  Provide a separate, complete answer for each question level (ক, খ, গ, ঘ).
    2.  For 'খ', 'গ', and 'ঘ', structure the answer in paragraphs as expected in exams.
    3.  The answers must be factually correct and directly address the question based on the stimulus and general knowledge of the subject.
    4.  Your output **MUST** be a single JSON array of objects, where each object has a 'level' and 'answer' key.

    ${getCurriculumPrompt(userProfile)}
    `;
    
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                level: { type: Type.STRING, description: "The level of the question being answered (e.g., 'ক', 'খ')." },
                answer: { type: Type.STRING, description: "The model answer for that question level." }
            },
            required: ["level", "answer"]
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.5,
        }
    });

    try {
        const data = JSON.parse(response.text.trim());
        if (!Array.isArray(data)) { throw new Error("Generated answer set is not an array."); }
        return data;
    } catch (e) {
        console.error("Failed to parse Gemini response for creative question answer:", response.text, e);
        throw new Error("The AI returned an invalid data structure for the answer. Please try again.");
    }
}


export async function optimizeUserNotes(rawNotes: string, language: Language, userProfile: UserProfile | null): Promise<string> {
    const targetLanguage = getTargetLanguage(language);
    const suggestionHeader = language === 'bn' ? "**সুপারিশ (Suggestions):**" : language === 'zh' ? "**建议 (Suggestions):**" : "**Suggestions:**";

    const prompt = `
    You are an AI note-taking assistant. A user has provided some raw notes. Your task is to optimize them.
    
    **Instructions:**
    1.  **Structure and Format:** Organize the text with clear headings (using Markdown **bold**), bullet points (* or -), and logical grouping. Correct spelling and grammar mistakes.
    2.  **Clarify and Expand:** Rephrase confusing sentences for clarity. Briefly expand on key points where more detail would be beneficial, but stay true to the original topics.
    3.  **Summarize:** Add a concise one-paragraph summary at the very top.
    4.  **Suggest Additions:** At the very bottom, under a heading "${suggestionHeader}", suggest 2-3 related topics or questions the user might want to add to their notes for a more complete understanding.
    
    ${getCurriculumPrompt(userProfile)}
    
    **User's Raw Notes:**
    ---
    ${rawNotes}
    ---
    
    Return only the optimized note text in Markdown format.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.6,
        }
    });
    return response.text;
}

export async function generateRoutine(commitments: string, subjects: string, language: Language, userProfile: UserProfile | null): Promise<ScheduledTask[]> {
    const prompt = `
    You are an expert productivity and academic scheduler. A student needs a daily study plan.

    **Student's Information:**
    - **Fixed Commitments & Free Time:** "${commitments}"
    - **Subjects to Study Today:** "${subjects}"
    - **Current Time:** ${new Date().toLocaleTimeString()}

    **Your Task:**
    Create a highly effective and realistic study schedule for the rest of the day.

    **Instructions:**
    1.  **Analyze Schedule:** Carefully analyze the student's fixed commitments and available free time.
    2.  **Allocate Subjects:** Distribute the specified subjects into focused study blocks (e.g., 45-60 minutes).
    3.  **Incorporate Breaks:** Schedule short breaks (10-15 minutes) between study sessions and a longer break for meals if applicable. This is critical for maintaining focus.
    4.  **Be Realistic:** Do not create a schedule that is impossible to follow. Consider the current time.
    5.  **Output Format:** Your output **MUST** be a single JSON array of "ScheduledTask" objects that strictly adheres to the provided schema. Do not output anything else.

    ${getCurriculumPrompt(userProfile)}
    `;

    const schema = {
        type: Type.ARRAY,
        description: "A schedule of tasks for the student.",
        items: {
            type: Type.OBJECT,
            properties: {
                time: { type: Type.STRING, description: "The start time of the task (e.g., '05:00 PM')." },
                subject: { type: Type.STRING, description: "The subject or category of the task (e.g., 'Physics', 'Break')." },
                task: { type: Type.STRING, description: "A specific description of the task." },
                duration: { type: Type.INTEGER, description: "Duration of the task in minutes." },
                type: { type: Type.STRING, enum: ['study', 'break', 'custom'], description: "The type of task." }
            },
            required: ["time", "subject", "task", "duration", "type"]
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.8,
        }
    });

    try {
        const data = JSON.parse(response.text.trim());
        if (!Array.isArray(data)) { throw new Error("Generated routine is not an array."); }
        return data as ScheduledTask[];
    } catch (e) {
        console.error("Failed to parse Gemini response for routine:", response.text, e);
        throw new Error("The AI returned an invalid data structure. Please try again.");
    }
}

export async function generateImageForTutor(prompt: string): Promise<string> {
    const enhancedPrompt = `
    An educational, high-quality image for a student. The style should be clear, informative, and visually appealing.
    - If the prompt describes a biological, mechanical, or scientific diagram (e.g., 'the parts of a flower', 'a car engine', 'the water cycle'), create a **clearly labeled black and white diagram**. Ensure all key components are pointed to and named accurately.
    - For all other requests, create a vibrant and engaging illustration.
    - Subject: ${prompt}
    `;

    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: enhancedPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
    }
    throw new Error("Image generation failed.");
}


// --- Functions below are from previous implementation and are still used ---

export async function analyzeQuizResults(questions: QuizQuestion[], answers: UserAnswer[], language: Language, userProfile: UserProfile | null): Promise<ConceptGap[]> {
    const incorrectAnswers = answers
        .filter(a => !a.isCorrect)
        .map(a => ({
            question: questions[a.questionIndex].questionText,
            userAnswer: a.answer,
            correctAnswer: questions[a.questionIndex].correctAnswer,
            explanation: questions[a.questionIndex].explanation,
        }));
    
    if (incorrectAnswers.length === 0) return [];

    const prompt = `
    You are an expert learning diagnostician. A student has taken a quiz and answered the following questions incorrectly.
    Analyze these incorrect answers to identify patterns and determine the key conceptual gaps in their understanding.
    
    Incorrectly Answered Questions:
    ${JSON.stringify(incorrectAnswers, null, 2)}
    
    Based on this analysis, identify 2-4 core concepts the student is struggling with. For each concept, provide a one-sentence suggestion for what they should review or focus on.
    
    **CRITICAL CONSTRAINTS:**
    1.  **Output Format**: Your output **MUST** be a single JSON array of objects that strictly adheres to the provided schema. Do not output anything other than this JSON array.

    ${getCurriculumPrompt(userProfile)}
    `;

    const schema = {
        type: Type.ARRAY,
        description: "An array of conceptual gaps based on the user's incorrect answers.",
        items: {
            type: Type.OBJECT,
            properties: {
                concept: { type: Type.STRING, description: "The core concept the student misunderstood." },
                suggestion: { type: Type.STRING, description: "A brief suggestion for the student to review." }
            },
            required: ["concept", "suggestion"]
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.5,
        }
    });

    try {
        const text = response.text.trim();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) { throw new Error("Generated concept gaps are not an array."); }
        return data as ConceptGap[];
    } catch (e) {
        console.error("Failed to parse Gemini response for concept gaps:", response.text, e);
        throw new Error("The AI returned an invalid data structure. Please try again.");
    }
}

export async function evaluateAnswer(question: QuizQuestion, userAnswer: string, userExplanation: string, language: Language, userProfile: UserProfile | null): Promise<string> {
    const prompt = `
    You are an expert, empathetic AI Tutor. A student needs feedback on their reasoning for a quiz question.
    Your task is to provide concise, constructive, and encouraging feedback.
    
    **Context:**
    - **Question:** "${question.questionText}"
    - **Correct Answer:** "${question.correctAnswer}"
    - **Student's Answer:** "${userAnswer}"
    - **Student's Explanation for their answer:** "${userExplanation}"

    **Instructions:**
    1.  Analyze the student's explanation. Is their logic sound, partially correct, or completely off-base?
    2.  Acknowledge their effort.
    3.  Gently correct any misunderstandings in their reasoning.
    4.  Briefly reinforce the correct concept from the question's explanation: "${question.explanation}".
    5.  Keep the tone positive and helpful. The goal is to build confidence, not to criticize.
    
    ${getCurriculumPrompt(userProfile)}
    
    Return ONLY the feedback text.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.6,
        }
    });

    return response.text;
}

const getSystemInstruction = (lang: Language, userProfile: UserProfile | null, model: TutorModel) => {
    let langName = getTargetLanguage(lang);
    
    const baseInstruction = `You are a "Next-Generation AI Tutor". Your personality is that of a brilliant, deeply knowledgeable, and endlessly patient ${langName} teacher, with a spark of creativity. You will communicate primarily in ${langName}. All structured data you generate (like terms, definitions) must also be in ${langName}. If the user uploads an image, analyze it and answer their questions about it.
${getCurriculumPrompt(userProfile)}
`;

    const modelInstructions: Record<TutorModel, string> = {
        default: `You are an expert in all subjects. Your primary goal is to answer questions based **strictly on the context provided** from the user's uploaded documents. You may use web search for minor clarifications, but the provided context is your primary source of truth. Do not introduce extensive new information unless asked.`,
        math: `You are a world-renowned mathematician and educator, specialized in the Bangladesh curriculum. Your expertise spans from fundamental arithmetic to advanced calculus. Your goal is to break down complex mathematical concepts into understandable steps, using clear notation. **You must solve problems following the step-by-step methodologies and answer formats common in the Bangladesh curriculum.**`,
        science: `You are a brilliant research scientist and passionate science communicator. Your knowledge encompasses Physics, Chemistry, and Biology. You explain complex scientific phenomena with clarity and precision, using analogies and diagrams. **You are encouraged to use your web search tool to bring in new, relevant, and profound information that goes beyond the user's provided context to give the most comprehensive and insightful answer possible.**`,
        english: `You are an eloquent and insightful English literature and language expert. Your passion is to help students appreciate the beauty of the English language, from analyzing classic literature to improving writing skills and expanding vocabulary. You are well-versed in the Bangladesh curriculum's English requirements. **You are encouraged to use your web search tool to bring in new, relevant, and profound information that goes beyond the user's provided context to give the most comprehensive and insightful answer possible.**`,
        english_grammar: `You are a master English Grammarian specializing in English 2nd Paper for the Bangladesh curriculum. Your process is methodical and exhaustive.
1.  When a user asks for a grammar topic, you MUST first ask them: **"Do you want a complete overview of this topic, including common rules, advanced rules, and all exceptions?"**
2.  If they agree, you will perform a comprehensive analysis and generate a **single, detailed response** containing the following sections in Markdown. You must use these exact English headings:
    - \\\`### Summary\\\`
    - \\\`### Common Rules\\\`
    - \\\`### Advanced Rules\\\`
    - \\\`### Exceptions & Common Mistakes\\\`
    The 'Exceptions' section is critical; make it as detailed as possible. Use formatting like lists, **bold text**, and \\\`!![amber-300]highlights!!\\\` to make the output extremely clear.
3.  If they do not want a full overview, or after you have provided one, answer their specific questions clearly.`,
        bangla_grammar: `আপনি একজন প্রখ্যাত বাংলা ভাষাবিদ ও ব্যাকরণ বিশেষজ্ঞ, বিশেষ করে বাংলাদেশের জাতীয় পাঠ্যক্রমের জন্য। আপনার পাঠদান পদ্ধতি অত্যন্ত গোছানো ও পুঙ্খানুপুঙ্খ।
১. যখন কোনো শিক্ষার্থী একটি ব্যাকরণ বিষয় সম্পর্কে জানতে চাইবে, আপনাকে প্রথমে তাকে জিজ্ঞাসা করতে হবে: **"আপনি কি এই বিষয়ের উপর একটি সম্পূর্ণ আলোচনা চান, যেখানে সাধারণ নিয়ম, অগ্রসর নিয়ম এবং সমস্ত ব্যতিক্রম অন্তর্ভুক্ত থাকবে?"**
২. যদি শিক্ষার্থী রাজি হয়, তবে আপনাকে একটি পূর্ণাঙ্গ বিশ্লেষণ করে **একটিমাত্র উত্তরে** নিম্নলিখিত বিভাগগুলোসহ বিস্তারিত তথ্য প্রদান করতে হবে। আপনাকে অবশ্যই এই বাংলা শিরোনামগুলো ব্যবহার করতে হবে:
    - \\\`### সারসংক্ষেপ\\\`
    - \\\`### সাধারণ নিয়মাবলী\\\`
    - \\\`### অগ্রসর নিয়মাবলী\\\`
    - \\\`### ব্যতিক্রম ও সাধারণ ভুল\\\`
    'ব্যতিক্রম' অংশটি সবচেয়ে গুরুত্বপূর্ণ; এটি যতটা সম্ভব বিস্তারিতভাবে লিখবেন। তালিকা, **বোল্ড টেক্সট**, এবং \\\`!![amber-300]হাইলাইট!!\\\` ব্যবহার করে উত্তরটি অত্যন্ত সহজবোধ্য করে তুলবেন।
৩. যদি শিক্ষার্থী সম্পূর্ণ আলোচনা না চায়, অথবা আপনি তা প্রদান করার পর, তাদের নির্দিষ্ট প্রশ্নের পরিষ্কারভাবে উত্তর দিন।`
    };

    return `
${baseInstruction}
### Your Persona: ${modelInstructions[model]}

### Your Primary Directive:
If a learning context is provided (unless your persona says otherwise), you **MUST** base your answers strictly on that context. Only use web search for information clearly outside the scope of the provided materials.

### Core Capabilities:
1.  **Web Research (Default):** If a question requires up-to-date information or knowledge beyond the provided context, you **MUST** use your web search tool. Be sure to cite your sources.
2.  **Image Generation:** To create an image, you **MUST** respond with the exact text: \\\`[GENERATE_IMAGE: "A descriptive prompt for the image"]\\\`. The frontend will handle the actual generation. For educational content, be specific. For diagrams (e.g., 'parts of a cell'), explicitly ask for a 'clearly labeled black and white diagram'. For concepts, ask for a 'vibrant, educational illustration'.
3.  **Flowchart Generation:** To create a flowchart, you **MUST** respond with a single \\\`\\\`\\\`html code block. This block must contain a self-contained, visually stunning flowchart using only HTML and CSS.

    **CRITICAL REQUIREMENTS:**
    *   **Self-Contained & Format:** The entire flowchart (HTML structure and CSS styling) must be within the single \\\`\\\`\\\`html code block. The root element must be a single \\\`<div>\\\` that wraps everything. Inside this div, provide an inline \\\`<style>\\\` tag with all necessary CSS classes, followed by the HTML elements for the flowchart.
    *   **Styling:** The design must be modern, clean, and professional, matching the app's dark, futuristic theme. Use colors like sky blue (\\\`#0ea5e9\\\`), slate grays, and white text. Use gradients and subtle shadows.
    *   **Layout & Connectors:** Use modern CSS (Flexbox, Grid) for positioning nodes. Draw connecting lines and arrows using either pure CSS (e.g., absolutely positioned pseudo-elements) or inline SVG elements.
    *   **Scalability & Responsiveness (MOST IMPORTANT):** The flowchart **MUST** be scalable. The root \\\`<div>\\\` must be styled with \\\`width: 100%\\\` and \\\`height: 100%\\\`. All internal sizes (node dimensions, padding, font-size, etc.) **MUST** use relative units like \\\`rem\\\`, \\\`em\\\`, or percentages. This is crucial so the chart scales up when viewed full-screen. Do not use fixed pixel (\\\`px\\\`) values. All text must be legible when scaled.
    *   **Accessibility:** Ensure sufficient color contrast between text and backgrounds.
4.  **Data Visualization (JSON Charts):** To create a chart (pie, bar, line), you **MUST** use a \\\`\\\`\\\`json-chart code block. The JSON must have "type", "data", and "dataKey". Example: \\\`\\\`\\\`json-chart\\n{"type": "pie", "data": [{"name": "Cats", "value": 400}, {"name": "Dogs", "value": 300}], "dataKey": "value", "nameKey": "name"}\\n\\\`\\\`\\\`
5.  **Dynamic Text Formatting:** To make your explanations clearer and more engaging, use the following Markdown-based syntax:
    *   \\\`**Bold Text**\\\` for emphasis.
    *   \\\`*Italic Text*\\\` for nuance.
    *   \\\`!![COLOR]Text to highlight!!\\\` to add color. Use colors like \\\`sky-300\\\`, \\\`amber-300\\\`, \\\`green-300\\\`, \\\`red-300\\\`, or \\\`violet-300\\\`. Example: \\\`This is !![sky-300]important!!.\\\`
    *   \\\`>[TYPE] Content...\\\` for special callout boxes. TYPE can be \\\`info\\\`, \\\`success\\\`, \\\`warning\\\`, or \\\`tip\\\`. The content will be rendered in a styled box. Example: \\\`>[tip] Remember to review the key concepts before the quiz.\\\`
    *   Use Markdown Headings (\\\`#\\\`, \\\`##\\\`) for titles and to increase text size.

6.  **Structured Information Extraction:** To provide a richer learning experience, you must identify and tag key information within your own response.
    *   **Definitions:** When you provide a definition, wrap it in a \\\`<def term="Term Name">\\\` tag. Example: \\\`<def term="Photosynthesis">The process by which green plants use sunlight to synthesize foods.</def>\\\`
    *   **Vocabulary:** If you use a potentially difficult or technical word, provide its meaning in a \\\`<vocab word="Complex Word">\\\` tag. Example: \\\`<vocab word="Ubiquitous">Present, appearing, or found everywhere.</vocab>\\\`
    *   **Formulas:** When you present a mathematical formula, wrap it in a \\\`<formula name="Formula Name">\\\` tag. The formula itself MUST be plain text. Example: \\\`<formula name="Quadratic Formula">x = [-b ± sqrt(b^2 - 4ac)] / 2a</formula>\\\`
    *   **CRITICAL:** These tags should be embedded naturally within your response. The frontend will parse these tags to create special UI components. Do not explain the tags to the user.

7.  **Mathematical Expressions:** You **MUST NOT** use LaTeX or KaTeX syntax (like \\\`$$...$$\\\` or \\\`\\$...\\$\\\`). Instead, represent all mathematical expressions and formulas in plain text, and whenever possible, place them inside a \\\`<formula>\\\` tag as described above.

### Formatting & Methodology:
- **Clarity Tools:** Use Markdown extensively: \\\`**bold**\\\`, \\\`*italic*\\\`, lists, and especially **Markdown tables** for structured data. Make tables look clean and professional.
- **Socratic Method:** Ask guiding questions. Be encouraging. Maintain a positive, inspiring tone. You are a mentor.
`;
};

export function createTutorChat(learningContext: string | null, language: Language, userProfile: UserProfile | null, model: TutorModel): { chat: Chat; initialHistory: ChatMessage[] } {
  let initialHistory: ChatMessage[] = [];
  
  const systemInstruction = getSystemInstruction(language, userProfile, model);

  let historyForChatCreation: { role: 'user' | 'model', parts: { text: string }[] }[] = [];

  const greetings = {
      en: 'Welcome! I am your AI Tutor. You can ask me anything. What would you like to know?',
      bn: 'স্বাগতম! আমি তোমার এআই টিউটর। যেকোনো বিষয়ে প্রশ্ন করতে পারো। তুমি কী জানতে চাও?',
      zh: '欢迎！我是您的人工智能导师。您可以问我任何问题。您想知道什么？'
  }
  const contextAcks = {
      en: 'Understood. I have received the context and will use it for our discussion.',
      bn: 'বুঝেছি। আমি কনটেক্সট পেয়েছি এবং আমাদের আলোচনার জন্য এটি ব্যবহার করব।',
      zh: '好的。我已收到上下文，并将在我们的讨论中使用它。'
  }
  const readyPrompts = {
      en: 'I am ready to discuss the materials you have prepared.',
      bn: 'আমি আপনার প্রস্তুত করা বিষয়গুলো নিয়ে আলোচনা করতে প্রস্তুত।',
      zh: '我准备好讨论您准备的材料了。'
  }
  const firstQuestionPrompts = {
      en: 'Excellent! I am here to help you on your learning journey. Let\'s begin! **What is your first question?**',
      bn: 'চমৎকার! আমি তোমার শেখার যাত্রায় সাহায্য করতে এখানে আছি। চলো, শুরু করা যাক! **তোমার প্রথম প্রশ্নটা কী?**',
      zh: '太好了！我在这里帮助您的学习之旅。我们开始吧！**您的第一个问题是什么？**'
  }

  if (learningContext) {
    const userContextPrompt = language === 'bn' ? `আমাদের আলোচনার জন্য এখানে কনটেক্সট দেওয়া হলো। আপনার সমস্ত প্রতিক্রিয়া এই তথ্যের উপর ভিত্তি করে তৈরি করবেন:\n\n${learningContext}` : language === 'zh' ? `这是我们讨论的背景信息。您的所有回答都将基于此信息：\n\n${learningContext}` : `Here is the context for our discussion. You will base all your responses on this information:\n\n${learningContext}`;
    
    historyForChatCreation = [
      { role: 'user', parts: [{ text: userContextPrompt }] },
      { role: 'model', parts: [{ text: contextAcks[language] }] }
    ];

    initialHistory = [
      { role: 'user', parts: [{text: readyPrompts[language]}] },
      { role: 'model', parts: [{text: firstQuestionPrompts[language]}] }
    ];
  } else {
     initialHistory = [{ role: 'model', parts: [{text: greetings[language]}] }];
  }
  
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
        systemInstruction: systemInstruction,
        tools: [{googleSearch: {}}]
    },
    history: [...historyForChatCreation, ...initialHistory.map(m => ({...m, parts: m.parts.map(p => ({text: p.text || ''}))}))]
  });

  return { chat, initialHistory };
}
