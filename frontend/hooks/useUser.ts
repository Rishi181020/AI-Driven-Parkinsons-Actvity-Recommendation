import React from "react";
import { getUsername } from "@/storage/user";

export function useUsername() {
    const [username, setUsername] = React.useState<string | null>(null);

    React.useEffect(() => {
        (async () => {
            const name = await getUsername();
            setUsername(name);
        })();
    }, []);

    return username;
}