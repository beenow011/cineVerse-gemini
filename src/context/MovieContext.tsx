'use client';
import { trpc } from "@/app/_trpc/client";
import { useMutation } from "@tanstack/react-query";
import { Console } from "console";
import { Dispatch, FormEvent, ReactNode, SetStateAction, createContext, useCallback, useEffect, useRef, useState } from "react";
import { useCompletion } from 'ai/react';
import { toast } from "@/components/ui/use-toast";
import service from "@/firebase/firestore";
// import { json } from "stream/consumers";
interface contextParams {

    imdbId: string
    setImdbId: Dispatch<SetStateAction<string>>
    movie: string
    setMovie: Dispatch<SetStateAction<string>>
    searchSimilarMovies: () => void
    searchMovieByID: () => void
    searchMovieByName: () => void
    loading: boolean
    loading2: boolean
    res: any
    res2: any
    msg: string
    addMsg: () => void
    msgFlag: boolean
    setMsg: Dispatch<SetStateAction<string>>
    setFlag: Dispatch<SetStateAction<boolean>>

}
export const MovieContext = createContext<contextParams>({
    imdbId: '',
    setImdbId: () => { },
    movie: '',
    setMovie: () => { },
    searchSimilarMovies: () => { },
    searchMovieByID: () => { },
    searchMovieByName: () => { },
    loading: false,
    loading2: false,
    msgFlag: false,
    msg: '',
    setMsg: () => { },
    addMsg: () => { },
    res: {},
    res2: {},
    setFlag: () => { }
});

export const MovieProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: ReactNode }) => {
    const [imdbId, setImdbId] = useState<string>('');
    const [flag, setFlag] = useState<boolean>(false);
    const [movie, setMovie] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [res, setRes] = useState<any>({});
    const [res2, setRes2] = useState<any>({});
    const [answer, setAnswer] = useState('')
    const [msg, setMsg] = useState('')
    const { mutate: searchFromApiById, isLoading: isLoading1 } = trpc.retriveMoviesFromImdb.useMutation({
        onSuccess: (data) => {
            console.log(data)
            setRes(data)
        }
    }
    )
    const { mutate: searchFromApiById2, isLoading: loading2 } = trpc.retriveMoviesFromImdb.useMutation({
        onSuccess: (data) => {
            console.log(data)
            setRes2(data)
        }
    }
    )
    const { mutate: searchFromApiByName, isLoading: isLoading2 } = trpc.retriveMoviesFromMovieName.useMutation({
        onSuccess: (data) => {
            console.log(data)
            setRes(data)

        }
    }
    )


    // useEffect(() => {
    //     setRes({})
    // }, [movie, imdbId])

    const searchForSimilarMovies = async ({ Title, imdbID, Language }: { Title: string, imdbID: string, Language: string }) => {
        try {
            // console.log("1", Title, imdbID)
            const requestBody = {
                Title: Title,
                imdbID: imdbID
            };
            // Making a GET request with query parameters
            const response = await fetch(`/api/fav-movies?Title=${encodeURIComponent(Title)}&imdbID=${encodeURIComponent(imdbID)}&Language=${encodeURIComponent(Language)}`, {
                method: 'GET'
            });


            if (!response.ok || response.status !== 200) {
                throw new Error('Failed to  retrive the movie!')
            }

            return response

        } catch (err) {
            console.log("ERROR:", err)
        }
    }

    // const { mutate: searchForSimilarMovies } = trpc.searchSimilarMovies.useMutation({
    //     onSuccess: (data) => {
    //         console.log("Data", data)
    //     }
    // })

    useEffect(() => {
        setLoading(isLoading1 || isLoading2)
    }, [isLoading1, isLoading2])


    const searchMovieByID = () => {
        searchFromApiById({ imdbId })
    }

    const searchMovieByName = () => {
        searchFromApiByName({ movie })
    }

    // console.log(Language)

    const searchSimilarMovies = () => {
        if (res && res.Title && res.imdbID) {
            const Language = res.Language?.split(',')[0]; // Extract the first language or default to undefined
            searchForSimilarMovies({ Title: res.Title, imdbID: res.imdbID, Language: Language }).then(async (res) => {
                if (!res?.body) {
                    console.error('No response body');
                    return;
                }

                const reader = res.body.getReader();
                const chunks: Uint8Array[] = [];
                let done, value;
                try {
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

                    searchFromApiById2({ imdbId: parsedResponse.imdbid1 });
                } catch (error) {
                    console.error('Error reading stream:', error);
                }
            }).catch(error => {
                console.error('Error fetching similar movies:', error);
            });
        } else {
            console.error('Title and imdbID are required');
        }
    };


    const getImdbID = (answer: string) => {

        const cleanedString = answer
            .replace(/["\n:'\\n ]/g, '').trim();
        // console.log(cleanedString)
        const matchid = cleanedString.match(/tt\d+/);
        const id = matchid ? matchid[0].match(/tt\d+/) : null;
        const resStr = id ? id[0] : null;
        // console.log(resStr)

        const similarMovieId = resStr ? resStr.slice(0, 2) + resStr.slice(3, 6) + resStr.slice(7, 10) + resStr.slice(11, 12) : ''
        return similarMovieId
    }
    // console.log(similarMovieId)
    const backupMessage = useRef('')
    const [msgLoading, setMsgLoading] = useState(false)
    const [messages, setMessages] = useState()
    const utils = trpc.useContext()
    const { mutate: msgProcess } = useMutation({
        mutationFn: async ({ msg }: { msg: string }) => {

            console.log('Mutation Function Triggered', res, msg);
            if (Object.keys(res).length === 0 || !msg) {
                throw new Error('Invalid input data');
            }
            try {
                const response = await fetch('/api/message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        movieID: res.imdbID,
                        movieName: res.Title,
                        Director: res.Director,
                        Year: res.Year,
                        message: msg
                    })
                });
                if (!response.ok) {
                    throw new Error('Failed to send message');
                }
                return response.json(); // Assuming your endpoint returns JSON
            } catch (err) {
                console.error('Error in mutationFn:', err);
                throw err; // Re-throw to let onError handle it
            }
        },
        onMutate: async () => {
            console.log('onMutate Triggered');
            backupMessage.current = msg;
            await utils.getMessages.cancel();
            const previousMessages = utils.getMessages.getInfiniteData();
            utils.getMessages.setInfiniteData(
                {
                    movieID: res.imdbID,
                    limit: 10
                },
                (data) => {
                    if (!data) {
                        return {
                            pages: [],
                            pageParams: [],
                        };
                    }
                    // console.log('data:', data)
                    return {
                        ...data,
                        pages: data.pages.map((page) => ({
                            ...page,
                            messages: page.messages,
                        }))
                    }
                }
            );

            setMsgLoading(true);

            return {
                previousMessages: previousMessages?.pages.flatMap(page => page.messages) ?? []
            };
        },
        onSuccess: async (data) => {
            console.log('onSuccess Triggered');
            setMsgLoading(false);
            setMsg('')
            if (!data) {
                return toast({
                    title: 'There was a problem sending this message',
                    description: 'Please refresh this page and try again',
                    variant: 'destructive',
                });
            }
            // console.log('Messages:', data);
            // setMessages(data);
        },
        onError: (error, _, context) => {
            console.error('onError Triggered:', error);
            setMsg(backupMessage.current);
            // Optionally reset to previous messages if needed
            // utils.getMessages.setInfiniteData(
            //     { movieID: res.imdbID, limit: 10 },
            //     { pages: [{ messages: context.previousMessages }], pageParams: [] }
            // );
        },
        onSettled: async () => {
            console.log('onSettled Triggered');
            setMsg('')
            setMsgLoading(false);
            await utils.getMessages.invalidate({ movieID: res.imdbID });
        }
    });

    const addMsg = () => {
        console.log('addMsg Triggered');

        msgProcess({ msg });

    }

    // Example of calling addMsg, e.g., on button click






    return (

        <MovieContext.Provider value={{ imdbId, setImdbId, searchSimilarMovies, movie, setMovie, msgFlag: flag, searchMovieByID, loading, loading2, addMsg, searchMovieByName, res, res2, msg, setMsg, setFlag }}>
            {children}

        </MovieContext.Provider>


    )


};

// export default MovieProvider;
