"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@lib/contexts/AuthContext";
import { useElectron } from "@lib/contexts/ElectronContext";

const NotFoundPage: React.FC = (): React.ReactElement => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isElectronLoading, isElectron } = useElectron();

  useEffect(() => {
    if (authLoading || isElectronLoading || isElectron) return;

    if (user) {
      router.replace("/modules");
    } else {
      router.replace("/auth");
    }
  }, [authLoading, isElectronLoading, isElectron, user, router]);

  return <div className="min-h-screen flex items-center justify-center text-white">Redirecting...</div>;
};

export default NotFoundPage;
