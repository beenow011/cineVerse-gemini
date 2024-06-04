import { genAI, openai } from "@/lib/openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const validator =  z.object({
    Plot : z.string(),
   
})
export const GET=async(req: NextRequest , res:NextApiResponse)=>{


    const url = new URL(req.url);
    const searchparam = new URLSearchParams(url.searchParams)
    const Plot = searchparam.get('Plot')

    if (!Plot) {
        return res.status(400).json({ error: 'required query parameters' });
    }

    try{
       
          
        console.log(Plot)
        
       
        const prompt = `Find a movie with a plot similar to "${Plot}" , and return the result in JSON format:
        {
            "imdbid1": "xyz"
        }
          without any explanation and any other response.`;

        // Getting the generative model and generating content
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text(); // Await the text extraction
        console.log('Response text:', text);
        const con = JSON.parse(text);
        
        return NextResponse.json(con, { status: 200 });
        // return 1
    }catch(err){
        throw new Error("Something went wrong!")
    }
}