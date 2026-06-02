import { useState, useCallback } from "react";
import type { CreateTeamRequest } from "@libTeam/types";

interface UseTeamFormProps {
  initialData: Partial<CreateTeamRequest>;
  onSubmit: (data: Partial<CreateTeamRequest>) => Promise<void>;
}

export const useTeamForm = ({ initialData, onSubmit }: UseTeamFormProps) => {
  const [formData, setFormData] = useState<Partial<CreateTeamRequest>>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = useCallback((updates: Partial<CreateTeamRequest>): void => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const updatePlayer = useCallback(
    (index: number, field: "inGameName" | "tag" | "country", value: string): void => {
      const newPlayers = [...(formData.players?.main || [])];
      newPlayers[index] = { ...newPlayers[index], [field]: value };
      setFormData((prev) => ({
        ...prev,
        players: { ...prev.players!, main: newPlayers }
      }));
    },
    [formData.players?.main]
  );

  const updateSubstitute = useCallback(
    (index: number, field: "role" | "inGameName" | "tag" | "country", value: string): void => {
      const newSubs = [...(formData.players?.substitutes || [])];
      newSubs[index] = { ...newSubs[index], [field]: value };
      setFormData((prev) => ({
        ...prev,
        players: { ...prev.players!, substitutes: newSubs }
      }));
    },
    [formData.players?.substitutes]
  );

  const addSubstitute = useCallback((): void => {
    const newSubs = [...(formData.players?.substitutes || [])];
    newSubs.push({ role: "TOP", inGameName: "", tag: "" });
    setFormData((prev) => ({
      ...prev,
      players: { ...prev.players!, substitutes: newSubs }
    }));
  }, [formData.players?.substitutes]);

  const removeSubstitute = useCallback(
    (index: number): void => {
      const newSubs = [...(formData.players?.substitutes || [])];
      newSubs.splice(index, 1);
      setFormData((prev) => ({
        ...prev,
        players: { ...prev.players!, substitutes: newSubs }
      }));
    },
    [formData.players?.substitutes]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onSubmit]
  );

  return {
    formData,
    isSubmitting,
    updateFormData,
    updatePlayer,
    updateSubstitute,
    addSubstitute,
    removeSubstitute,
    handleSubmit
  };
};
