export function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-white">Loading...</p>
            </div>
        </div>
    );
} 