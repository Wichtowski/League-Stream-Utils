import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@lib/contexts/AuthContext";
import { Button } from "@lib/components/common";
import { AuthCredentials } from "@lib/types/auth";
import { useElectron } from "@libElectron/contexts/ElectronContext";

export function LoginForm() {
  const [credentials, setCredentials] = useState<AuthCredentials>({
    username: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { login } = useAuth();
  const router = useRouter();
  const { isElectron } = useElectron();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result = await login(credentials.username, credentials.password);

      if (result.success) {
        // Check if there's a return URL
        const returnTo = sessionStorage.getItem("returnTo");
        if (returnTo) {
          sessionStorage.removeItem("returnTo");
          router.push(returnTo);
        } else {
          // In Electron mode, redirect to download page to check assets first
          if (isElectron) {
            router.push("/download");
          } else {
            router.push("/");
          }
        }
      } else {
        setErrorMessage(result.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof AuthCredentials) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleGoogleSignIn = (): void => {
    const width = 420;
    const height = 560;
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2.5);
    const popup = window.open(
      "/api/v1/auth/google/start",
      "google_oauth",
      `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=no,status=no,toolbar=0,location=0,menubar=0,titlebar=0`
    );

    if (!popup) return;

    const messageHandler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== "oauth:google:success") return;
      window.removeEventListener("message", messageHandler);
      try {
        await fetch("/api/v1/auth/validate", { method: "GET", credentials: "include" });
        const returnTo = sessionStorage.getItem("returnTo");
        if (returnTo) {
          sessionStorage.removeItem("returnTo");
          router.push(returnTo);
        } else {
          // In Electron mode, redirect to download page to check assets first
          if (isElectron) {
            router.push("/download");
          } else {
            router.push("/modules");
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("message", messageHandler);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
          Username
        </label>
        <input
          id="username"
          type="text"
          required
          value={credentials.username}
          onChange={handleInputChange("username")}
          className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your username"
          disabled={isSubmitting}
          autoComplete="username"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={credentials.password}
          onChange={handleInputChange("password")}
          className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your password"
          disabled={isSubmitting}
          autoComplete="current-password"
        />
      </div>

      {errorMessage && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-md">{errorMessage}</div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || !credentials.username || !credentials.password}
        className="w-full"
      >
        {isSubmitting ? "Signing in..." : "Sign In"}
      </Button>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-gray-800 px-2 text-gray-400">or</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="cursor-pointer w-full inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-medium py-2 px-4 rounded hover:bg-gray-100 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="32" height="32" viewBox="0 0 48 48">
          <path
            fill="#FFC107"
            d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
          ></path>
          <path
            fill="#FF3D00"
            d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
          ></path>
          <path
            fill="#4CAF50"
            d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
          ></path>
          <path
            fill="#1976D2"
            d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
          ></path>
        </svg>
        Sign in with Google
      </button>
    </form>
  );
}
