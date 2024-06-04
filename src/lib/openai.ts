import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

const API_KEY =  process.env.GEMINI_API_KEY
            ;

        // Access your API key (see "Set up your API key" above)
export const genAI = new GoogleGenerativeAI(API_KEY!);