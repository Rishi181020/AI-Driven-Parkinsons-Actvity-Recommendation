import { InferpostJSON } from "./client";


export function createChat(message: string) {
    return InferpostJSON<{ content: string }>("/chat", { message });
}