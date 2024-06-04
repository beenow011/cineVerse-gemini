'use client';
import { trpc } from "@/app/_trpc/client";
import { Dispatch, SetStateAction, createContext, useEffect, useState } from "react";

interface contextParams {
    Plot: string
    setPlot: Dispatch<SetStateAction<string>>
    searchPlot: () => void
    answer: string
    loading: boolean
    res: any
}

export const PlotContext = createContext<contextParams>({
    Plot: '',
    setPlot: () => { },
    searchPlot: () => { },
    answer: '',
    loading: false,
    res: {}
})

export const PlotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [Plot, setPlot] = useState('')
    const [answer, setAnswer] = useState('')
    const [loading, setLoading] = useState(false)
    const [res, setRes] = useState({})
    const { mutate: searchFromApiById2, isLoading: loading2 } = trpc.retriveMoviesFromImdb.useMutation({
        onSuccess: (data) => {
            console.log(data)
            setRes(data)
        }
    }
    )

    const getImdbID = (answer: string) => {

        console.log("1", answer)
        const cleanedString = answer
            .replace(/["\n:'\\n ]/g, '').trim();
        // console.log(cleanedString)
        const matchid = cleanedString.match(/tt\d+/);
        const id = matchid ? matchid[0].match(/tt\d+/) : null;
        const resStr = id ? id[0] : null;
        // console.log(resStr)

        const similarMovieId = resStr ? resStr.slice(0, 2) + resStr.slice(3, 6) + resStr.slice(7, 10) + resStr.slice(11, 12) : ''
        console.log("2", similarMovieId)
        return similarMovieId
    }
    const searchPlot = async () => {
        try {
            setLoading(true)
            if (Plot.length > 0) {
                const res = await fetch(`/api/fav-plots?Plot=${Plot}`, {
                    method: 'GET'
                });

                if (!res?.body) {
                    console.error('No response body');
                    return;
                }

                const reader = res?.body?.getReader();
                const chunks: Uint8Array[] = [];
                let done, value;

                while ({ done, value } = await reader.read(), !done) {
                    if (value) {
                        chunks.push(value);
                    }
                }
                const combinedChunks = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
                let offset = 0;
                for (const chunk of chunks) {
                    combinedChunks.set(chunk, offset);
                    offset += chunk.length;
                }
                const text = new TextDecoder("utf-8").decode(combinedChunks);
                console.log(text);
                // Parse the response and perform further actions if needed
                const parsedResponse = JSON.parse(text);
                console.log(parsedResponse);


                setAnswer(parsedResponse?.imdbid1)

                //  searchFromApiById2({ imdbId: answer })
            }
            // console.log("answer", answer)

        } catch (err) {
            console.log("ERROR:", err)
        }
        finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setAnswer('')
    }, [Plot])

    useEffect(() => {
        setRes({})
        if (answer.length > 0) {
            searchFromApiById2({ imdbId: answer })
        }
    }, [answer])
    return (

        <PlotContext.Provider value={{ Plot, setPlot, searchPlot, answer, loading, res }}>
            {children}

        </PlotContext.Provider>


    )

}