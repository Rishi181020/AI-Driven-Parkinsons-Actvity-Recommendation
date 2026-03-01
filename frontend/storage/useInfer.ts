import * as SecureStore from "expo-secure-store";

const INFER_KEY = "infer_result";

export async function setInferResult(result: any) {
    await SecureStore.setItemAsync(INFER_KEY, JSON.stringify(result));
    const verify = await SecureStore.getItemAsync(INFER_KEY);
}

export async function getInferResult() {
    const v = await SecureStore.getItemAsync(INFER_KEY);
    console.log(v)
    return v ? JSON.parse(v) : null;
}

export async function clearInferResult() {
    await SecureStore.deleteItemAsync(INFER_KEY);
}