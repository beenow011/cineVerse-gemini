import { genAI } from "@/lib/openai";
import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema using zod
const validator = z.object({
    Title: z.string(),
    imdbID: z.string(),
    Language: z.string().optional() // Assuming Language is optional
});

// The API handler function
export const GET = async (req: NextApiRequest, res: NextApiResponse) => {
    // Parsing the URL to extract query parameters
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const searchParams = new URLSearchParams(url.searchParams);
    const Title = searchParams.get('Title');
    const imdbID = searchParams.get('imdbID');
    const Language = searchParams.get('Language');

    // Validating required query parameters
    if (!Title || !imdbID) {
        return res.status(400).json({ error: 'Title and imdbID are required query parameters' });
    }

    try {
        // Constructing the prompt for the AI model
        const prompt = `Find a ${Language || 'English'} movie with a plot similar to "
        ${Title}"(${imdbID}), but exclude any sequels or prequels, and return the result in JSON format:
        {
            "imdbid1": "xyz"
        } without any explanation and any other response.`;

        // Getting the generative model and generating content
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text(); // Await the text extraction
        console.log('Response text:', text);
        const con = JSON.parse(text); // Parse the JSON string

        // Logging the response for debugging purposes

        // Sending the response
        return NextResponse.json(con, { status: 200 }); // Return the parsed JSON
    } catch (err) {
        console.error('Error:', err); // Log the error
        return NextResponse.json({ error: "Something went wrong!" }, { status: 500 });// Return an error response
    }
};
