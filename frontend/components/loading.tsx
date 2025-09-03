export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-pulse space-y-4">
                <div className="h-12 bg-gray-200 rounded w-96"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-72"></div>
                    <div className="h-4 bg-gray-200 rounded w-80"></div>
                </div>
            </div>
        </div>
    );
}
