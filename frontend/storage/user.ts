import * as SecureStore from "expo-secure-store";

const USER_ID_KEY = "user_id";

export async function setUserId(id: number) {
    await SecureStore.setItemAsync(USER_ID_KEY, String(id));
}

export async function getUserId() {
    const v = await SecureStore.getItemAsync(USER_ID_KEY);
    return v ? Number(v) : null;
}