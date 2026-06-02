import { useState } from "react";
import { useModal } from "@lib/contexts/ModalContext";

interface SessionPasswordModalProps {
  sessionId: string;
  onPasswordCorrect: () => void;
  onCancel: () => void;
}

export const SessionPasswordModal = ({
  sessionId: _sessionId,
  onPasswordCorrect,
  onCancel
}: SessionPasswordModalProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showAlert } = useModal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // For now, we'll use a simple password check
      // In a real implementation, you'd verify against the session's stored password
      if (password === "admin" || password === "1234") {
        onPasswordCorrect();
      } else {
        setError("Incorrect password");
      }
    } catch (_err) {
      await showAlert({ type: "error", message: "Failed to verify password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4">Session Password Required</h2>
        <p className="text-gray-400 mb-6">This session is password protected. Please enter the password to continue.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500"
              placeholder="Enter password"
              autoFocus
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? "Verifying..." : "Enter Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
