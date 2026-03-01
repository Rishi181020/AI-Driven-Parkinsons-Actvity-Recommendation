import { InferpostJSON, postJSON } from "./client";



export function createInfer() {
    const x: number[][] = Array.from({ length: 100 }, () => [
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
    ]);
    return InferpostJSON<{ user_id: number }>("/infer", { x });
}



