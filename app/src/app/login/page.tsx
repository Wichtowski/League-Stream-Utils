"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthTabs, MessageDisplay, LoginForm, RegisterForm, ContactInfo } from "@lib/auth/components";
import { useAuth } from "@lib/contexts/AuthContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { PageWrapper } from "@lib/components/common";
import { useElectron } from "@libElectron/contexts/ElectronContext";

export default function AuthPage() {
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const { user, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { isElectron } = useElectron();

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
        // In Electron mode, redirect to download page to check assets first
        if (isElectron) {
          router.push("/download");
        } else {
          router.push("/modules");
        }
      }
    }
  }, [setActiveModule, user, isLoading, router, isElectron]);

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
        loading={true}
        requireAuth={false}
      >
        <></>
      </PageWrapper>
    );
  }

  if (user) {
    return null;
  }

  return (
    <PageWrapper contentClassName="max-w-md mx-auto mt-10" requireAuth={false}>
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
