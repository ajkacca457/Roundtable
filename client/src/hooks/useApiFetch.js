import { useAuth } from "@clerk/clerk-react";
import { useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export function useApiFetch() {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    const apiFetch = useCallback(
        async (path, options = {}) => {
            if (!isLoaded || !isSignedIn) {
                throw new Error("apiFetch called before Clerk auth was ready");
            }

            const token = await getToken();
            const headers = {
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...options.headers,
                Authorization: `Bearer ${token}`,
            };
            return fetch(`${API_URL}${path}`, { ...options, headers });
        },
        [getToken, isLoaded, isSignedIn]
    );

    return { apiFetch, isLoaded, isSignedIn };
}