import * as SecureStore from "expo-secure-store";

const USER_ID_KEY = "user_id";
const USERNAME_KEY = "username";

export async function setUser(id: number, username: string) {
    await SecureStore.setItemAsync(USER_ID_KEY, String(id));
    await SecureStore.setItemAsync(USERNAME_KEY, username);
}

export async function getUserId() {
    const v = await SecureStore.getItemAsync(USER_ID_KEY);
    return v ? Number(v) : null;
}

export async function getUsername() {
    return await SecureStore.getItemAsync(USERNAME_KEY);
}

export async function clearUser() {
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    await SecureStore.deleteItemAsync(USERNAME_KEY);
}