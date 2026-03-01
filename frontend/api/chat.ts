import { InferpostJSON } from "./client";


export function createChat(message: {
    message: string;
    history: { role: string; content: string }[];
    pred_label: string;
}) {
    return InferpostJSON<{ content: string }>("/chat", { message });
}