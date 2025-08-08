interface MessageDisplayProps {
    error: string;
    success: string;
}

export function MessageDisplay({ error, success }: MessageDisplayProps) {
    return (
        <>
            {error && <div className="bg-red-600 text-white p-3 rounded mb-4">{error}</div>}

            {success && <div className="bg-green-600 text-white p-3 rounded mb-4">{success}</div>}
        </>
    );
}
