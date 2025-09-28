"use client";

import { useState, useEffect, useCallback } from "react";
import { useModal } from "@lib/contexts/ModalContext";
import { LoadingSpinner } from "@lib/components/common";
import { ErrorBoundary } from "@lib/components/common/ErrorBoundary";
import { Ticker, TickerFormData } from "@libTournament/types";
import { Tournament } from "@libTournament/types";
import { createDefaultTickerForm } from "@/libTournament/utils/ticker/defaultValues";
import { TickerForm } from "./TickerForm";
import { useApiCall } from "@lib/hooks/useErrorHandling";
import { sanitizeStreamBannerForm } from "@/libTournament/utils/ticker/validators";

interface TickerManagerProps {
  tournamentId: string;
  tournament: Tournament;
  ticker: Ticker | null;
  tickerLoading: boolean;
  onTickerUpdated: () => void;
  onPreviewChange: (preview: TickerFormData | null) => void;
}

export const TickerManager = ({
  tournamentId,
  tournament: _tournament,
  ticker,
  tickerLoading,
  onTickerUpdated,
  onPreviewChange
}: TickerManagerProps) => {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<TickerFormData>(createDefaultTickerForm());
  const { showAlert, showConfirm } = useModal();
  const { apiCall, isLoading: isSubmitting, error, clearError } = useApiCall();

  // Update form data when ticker changes
  useEffect(() => {
    if (ticker) {
      setFormData({
        title: ticker.title,
        titleBackgroundColor: ticker.titleBackgroundColor || "#1f2937",
        titleTextColor: ticker.titleTextColor || "#ffffff",
        carouselItems: (ticker.carouselItems || []).map(
          (item: { text: string; backgroundColor?: string; textColor?: string; order: number }) => ({
            text: item.text,
            backgroundColor: item.backgroundColor || "#1f2937",
            textColor: item.textColor || "#ffffff",
            order: item.order
          })
        ),
        carouselSpeed: ticker.carouselSpeed,
        carouselBackgroundColor: ticker.carouselBackgroundColor || "#1f2937"
      });
    } else {
      setFormData(createDefaultTickerForm());
    }
  }, [ticker]);

  const handleSaveticker = async (): Promise<void> => {
    clearError();

    // Sanitize form data before sending
    const sanitizedData = sanitizeStreamBannerForm(formData);

    const result = await apiCall<{ ticker: Ticker; message: string }>(
      `/api/v1/tournaments/${tournamentId}/ticker`,
      {
        method: "POST",
        body: JSON.stringify({
          title: sanitizedData.title,
          titleBackgroundColor: sanitizedData.titleBackgroundColor,
          titleTextColor: sanitizedData.titleTextColor,
          carouselItems: sanitizedData.carouselItems.map((item) => ({
            text: item.text,
            backgroundColor: item.backgroundColor,
            textColor: item.textColor,
            order: item.order
          })),
          carouselSpeed: sanitizedData.carouselSpeed,
          carouselBackgroundColor: sanitizedData.carouselBackgroundColor
        })
      },
      { maxAttempts: 2, delay: 1000 } // Retry once with 1 second delay
    );

    if (result) {
      await showAlert({
        type: "success",
        message: result.message || "Ticker saved successfully"
      });

      setShowForm(false);
      setIsEditing(false);
      onTickerUpdated();
      onPreviewChange(null);
    }
  };

  const handleDeleteTicker = async (): Promise<void> => {
    if (!ticker) return;

    const confirmed = await showConfirm({
      title: "Delete Ticker",
      message: `Are you sure you want to delete "${ticker.title}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger"
    });

    if (!confirmed) return;

    clearError();

    const result = await apiCall<{ message: string }>(
      `/api/v1/tournaments/${tournamentId}/ticker`,
      { method: "DELETE" },
      { maxAttempts: 2, delay: 1000 } // Retry once with 1 second delay
    );

    if (result) {
      await showAlert({
        type: "success",
        message: result.message || "Ticker deleted successfully"
      });

      onTickerUpdated();
    }
  };

  const handleCancelEdit = (): void => {
    if (isEditing && ticker) {
      // Reset to current ticker data
      setFormData({
        title: ticker.title,
        titleBackgroundColor: ticker.titleBackgroundColor || "#1f2937",
        titleTextColor: ticker.titleTextColor || "#ffffff",
        carouselItems: (ticker.carouselItems || []).map(
          (item: { text: string; backgroundColor?: string; textColor?: string; order: number }) => ({
            text: item.text,
            backgroundColor: item.backgroundColor || "#1f2937",
            textColor: item.textColor || "#ffffff",
            order: item.order
          })
        ),
        carouselSpeed: ticker.carouselSpeed,
        carouselBackgroundColor: ticker.carouselBackgroundColor || "#1f2937"
      });
    } else {
      setFormData(createDefaultTickerForm());
    }
    setShowForm(false);
    setIsEditing(false);
    onPreviewChange(null);
  };

  // Update preview when form data changes
  const updatePreview = useCallback(() => {
    if (showForm) {
      onPreviewChange(formData);
    } else {
      onPreviewChange(null);
    }
  }, [formData, showForm, onPreviewChange]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  if (tickerLoading) {
    return <LoadingSpinner text="Loading Ticker..." />;
  }

  return (
    <ErrorBoundary context="TickerManager" showDetails={process.env.NODE_ENV === "development"}>
      <div className="space-y-6">
        {/* Error display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-red-800 dark:text-red-200">
                  {error.message instanceof Error ? error.message.message : error.message}
                </span>
              </div>
              <button onClick={clearError} className="text-red-400 hover:text-red-600">
                ×
              </button>
            </div>
          </div>
        )}

        {/* ticker Management Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{ticker ? "Ticker" : "Create Ticker"}</h2>
          <div className="flex gap-2">
            {ticker && !showForm && (
              <>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowForm(true);
                  }}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  Edit ticker
                </button>
                <button
                  onClick={handleDeleteTicker}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  Delete ticker
                </button>
              </>
            )}
            {!ticker && !showForm && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setShowForm(true);
                }}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Create ticker
              </button>
            )}
          </div>
        </div>

        {/* Current ticker Display */}
        {ticker && !showForm && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{ticker.title}</h3>
                <p className="text-sm text-gray-400">
                  {ticker.carouselItems?.length || 0} carousel items • Speed: {ticker.carouselSpeed}ms
                </p>
              </div>
            </div>

            {(ticker.carouselItems?.length || 0) > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Carousel Items:</h4>
                <div className="grid gap-2">
                  {(ticker.carouselItems || [])
                    .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
                    .map((item: { order: number; text: string; backgroundColor?: string }, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-700 rounded text-sm">
                        <span className="text-gray-400 w-6">{item.order}.</span>
                        <span className="flex-1">{item.text}</span>
                        <div
                          className="w-4 h-4 rounded border border-gray-500"
                          style={{ backgroundColor: item.backgroundColor }}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <TickerForm
            formData={formData}
            setFormData={setFormData}
            editingTicker={isEditing ? ticker : null}
            onAddTicker={handleSaveticker}
            onUpdateTicker={handleSaveticker}
            onCancelEdit={handleCancelEdit}
            onCloseForm={handleCancelEdit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};
