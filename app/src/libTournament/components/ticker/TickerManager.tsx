"use client";

import { useState, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react";
import { useModal } from "@lib/contexts/ModalContext";
import { LoadingSpinner } from "@lib/components/common";
import type { Ticker, Tournament } from "@lib/types";
import type { TickerFormData } from "@lib/types/forms";
import { createDefaultTickerForm } from "@lib/types/forms";
import { TickerForm } from "./TickerForm";

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

  // Update form data when ticker changes
  useEffect(() => {
    if (ticker) {
      setFormData({
        title: ticker.title,
        titleBackgroundColor: ticker.titleBackgroundColor || "#1f2937",
        titleTextColor: ticker.titleTextColor || "#ffffff",
        carouselItems: (ticker.carouselItems || []).map((item: { text: string; backgroundColor: string; textColor: string; order: string; }) => ({
          text: item.text,
          backgroundColor: item.backgroundColor || "#1f2937",
          textColor: item.textColor || "#ffffff",
          order: item.order
        })),
        carouselSpeed: ticker.carouselSpeed,
        carouselBackgroundColor: ticker.carouselBackgroundColor || "#1f2937",
      });
    } else {
      setFormData(createDefaultTickerForm());
    }
  }, [ticker]);

  const handleSaveticker = async (): Promise<void> => {
    if (!formData.title.trim()) {
      await showAlert({
        type: "error",
        message: "Title is required"
      });
      return;
    }

    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/ticker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          titleBackgroundColor: formData.titleBackgroundColor,
          titleTextColor: formData.titleTextColor,
          carouselItems: formData.carouselItems.map(item => ({
            text: item.text,
            backgroundColor: item.backgroundColor,
            textColor: item.textColor,
            order: item.order
          })),
          carouselSpeed: formData.carouselSpeed,
          carouselBackgroundColor: formData.carouselBackgroundColor,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save ticker");
      }

      const result = await response.json();
      await showAlert({
        type: "success",
        message: result.message || "Ticker saved successfully"
      });

      setShowForm(false);
      setIsEditing(false);
      onTickerUpdated();
      onPreviewChange(null);
    } catch (error) {
      await showAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to save ticker"
      });
    }
  };

  const handleDeleteTicker = async (): Promise<void> => {
    if (!ticker) return;

    const confirmed = await showConfirm({
      title: "Delete Ticker",
      message: `Are you sure you want to delete "${ticker.title}"?`,
      confirmText: "Delete",
      cancelText: "Cancel"
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/ticker`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete Ticker");
      }

      await showAlert({
        type: "success",
        message: "Ticker deleted successfully"
      });

      onTickerUpdated();
    } catch (error) {
      await showAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to delete Ticker"
      });
    }
  };

  const handleCancelEdit = (): void => {
    if (isEditing && ticker) {
      // Reset to current ticker data
      setFormData({
        title: ticker.title,
        titleBackgroundColor: ticker.titleBackgroundColor || "#1f2937",
        titleTextColor: ticker.titleTextColor || "#ffffff",
        carouselItems: (ticker.carouselItems || []).map((item: { text: any; backgroundColor: any; textColor: any; order: any; }) => ({
          text: item.text,
          backgroundColor: item.backgroundColor || "#1f2937",
          textColor: item.textColor || "#ffffff",
          order: item.order
        })),
        carouselSpeed: ticker.carouselSpeed,
        carouselBackgroundColor: ticker.carouselBackgroundColor || "#1f2937",
      });
    } else {
      setFormData(createDefaultTickerForm());
    }
    setShowForm(false);
    setIsEditing(false);
    onPreviewChange(null);
  };



  // Update preview when form data changes
  useEffect(() => {
    if (showForm) {
      onPreviewChange(formData);
    } else {
      onPreviewChange(null);
    }
  }, [formData, showForm, onPreviewChange]);

  if (tickerLoading) {
    return <LoadingSpinner text="Loading Ticker..." />;
  }

  return (
    <div className="space-y-6">
      {/* ticker Management Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {ticker ? "Ticker" : "Create Ticker"}
        </h2>
        <div className="flex gap-2">
          {ticker && !showForm && (
            <>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
              >
                Edit ticker
              </button>
              <button
                onClick={handleDeleteTicker}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
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
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
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
                  .sort((a: { order: number; }, b: { order: number; }) => a.order - b.order)
                  .map((item: { order: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; text: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; backgroundColor: any; }, index: Key | null | undefined) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 bg-gray-700 rounded text-sm"
                    >
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
        />
      )}
    </div>
  );
};