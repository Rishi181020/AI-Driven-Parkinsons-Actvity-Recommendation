import { API_BASE_URL } from "@/constants/apis";
import { INFER_BASE_URL } from "@/constants/apis";

export async function getJSON<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function postJSON<T>(path: string, body: any): Promise<T> {
    const url = `${API_BASE_URL}${path}`;

    console.log("POST URL:", url);
    console.log("BODY:", body);

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        console.log("STATUS:", res.status);

        const text = await res.text();
        console.log("RESPONSE TEXT:", text);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        return JSON.parse(text);
    } catch (err) {
        console.log("FETCH ERROR:", err);
        throw err;
    }
}

export async function InferpostJSON<T>(path: string, body: any): Promise<T> {
    const url = `${INFER_BASE_URL}${path}`;

    console.log("POST URL:", url);
    console.log("BODY:", body);

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        console.log("STATUS:", res.status);

        const text = await res.text();
        console.log("RESPONSE TEXT:", text);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        return JSON.parse(text);
    } catch (err) {
        console.log("FETCH ERROR:", err);
        throw err;
    }
}