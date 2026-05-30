"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        retry: 2,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* Brutalist Sonner toaster — square corners, thick borders, no iOS rounding */}
            <Toaster
                position="bottom-right"
                toastOptions={{
                    className: "!rounded-none !border-4 !border-black !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] !font-bold !text-black !bg-white",
                    style: {
                        borderRadius: "0px",
                        fontFamily: "inherit",
                    },
                }}
            />
        </QueryClientProvider>
    );
}
