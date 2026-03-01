import { postJSON } from "./client";

export function createUser(display_name: string, email?: string) {
    return postJSON<{ user_id: number }>("/v1/users", { display_name });
}