"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthTabs, MessageDisplay, LoginForm, RegisterForm, ContactInfo } from "@lib/auth/components";
import { useAuth } from "@lib/contexts/AuthContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { SettingsCog, PageWrapper } from "@lib/components/common";
import { useElectron } from "@libElectron/contexts/ElectronContext";

export default function AuthPage() {
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const { user, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { isElectron, useLocalData } = useElectron();

  // Debug logging
  useEffect(() => {
    setActiveModule("auth");

    if (!isLoading && user) {
      // Check if there's a returnTo path stored
      const returnTo = localStorage.getItem("returnTo");
      if (returnTo && returnTo !== "/login") {
        localStorage.removeItem("returnTo"); // Clean up
        router.push(returnTo);
      } else {
        router.push("/modules");
      }
    }
  }, [setActiveModule, user, isLoading, router]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleRegisterSuccess = (message: string) => {
    setSuccess(message);
    setError("");
  };

  const switchToLogin = () => {
    setIsLogin(true);
  };

  if (isLoading) {
    return (
      <PageWrapper
        title="Loading..."
        subtitle="Please wait while we check your authentication..."
        contentClassName="max-w-md mx-auto mt-10"
        actions={<SettingsCog blured={true} />}
        loading={true}
        requireAuth={false}
        loadingChildren={
          <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-8 shadow-2xl opacity-50 blur-sm pointer-events-none">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">League Stream Utils</h1>

            <AuthTabs isLogin={isLogin} onTabChange={setIsLogin} onClearMessages={clearMessages} />

            <MessageDisplay error={error} success={success} />

            {isLogin ? (
              <LoginForm />
            ) : (
              <RegisterForm onSuccess={handleRegisterSuccess} onError={setError} onSwitchToLogin={switchToLogin} />
            )}

            <ContactInfo />
          </div>
        }
      >
        <></>
      </PageWrapper>
    );
  }

  if (user) {
    return null;
  }

  return (
    <PageWrapper contentClassName="max-w-md mx-auto mt-10" actions={<SettingsCog />} requireAuth={false}>
      {/* Electron Mode Indicator */}
      {isElectron && (
        <div className="absolute top-6 right-6 flex items-center space-x-4 z-10">
          <div className="text-right">
            <div className="text-sm text-gray-400">
              Mode:{" "}
              <span className={useLocalData ? "text-green-400" : "text-blue-400"}>
                {useLocalData ? "Local Data" : "Online"}
              </span>
            </div>
            <div className="text-xs text-gray-500">{useLocalData ? "Saving to AppData" : "Using cloud storage"}</div>
          </div>
        </div>
      )}

      <div className="w-full bg-gray-800 rounded-lg p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">League Stream Utils</h1>

        <AuthTabs isLogin={isLogin} onTabChange={setIsLogin} onClearMessages={clearMessages} />

        <MessageDisplay error={error} success={success} />

        {isLogin ? (
          <LoginForm />
        ) : (
          <RegisterForm onSuccess={handleRegisterSuccess} onError={setError} onSwitchToLogin={switchToLogin} />
        )}

        <ContactInfo />
      </div>
    </PageWrapper>
  );
}
