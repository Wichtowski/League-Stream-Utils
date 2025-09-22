"use client";

import { useState, useEffect } from "react";
import { useModal } from "@lib/contexts/ModalContext";
import { LoadingSpinner } from "@lib/components/common";
import type { StreamBanner, Tournament } from "@lib/types";
import type { StreamBannerFormData } from "@lib/types/forms";
import { createDefaultStreamBannerForm } from "@lib/types/forms";
import { StreamBannerForm } from "./StreamBannerForm";

interface StreamBannerManagerProps {
  tournamentId: string;
  tournament: Tournament;
  banner: StreamBanner | null;
  bannerLoading: boolean;
  onBannerUpdated: () => void;
  onPreviewChange: (preview: StreamBannerFormData | null) => void;
}

export const StreamBannerManager = ({
  tournamentId,
  tournament: _tournament,
  banner,
  bannerLoading,
  onBannerUpdated,
  onPreviewChange
}: StreamBannerManagerProps) => {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<StreamBannerFormData>(createDefaultStreamBannerForm());
  const { showAlert, showConfirm } = useModal();

  // Update form data when banner changes
  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title,
        titleBackgroundColor: banner.titleBackgroundColor || "#1f2937",
        titleTextColor: banner.titleTextColor || "#ffffff",
        carouselItems: (banner.carouselItems || []).map(item => ({
          text: item.text,
          backgroundColor: item.backgroundColor || "#1f2937",
          textColor: item.textColor || "#ffffff",
          order: item.order
        })),
        carouselSpeed: banner.carouselSpeed,
        carouselBackgroundColor: banner.carouselBackgroundColor || "#1f2937",
      });
    } else {
      setFormData(createDefaultStreamBannerForm());
    }
  }, [banner]);

  const handleSaveBanner = async (): Promise<void> => {
    if (!formData.title.trim()) {
      await showAlert({
        type: "error",
        message: "Title is required"
      });
      return;
    }

    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/stream-banners`, {
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
        throw new Error(error.error || "Failed to save stream banner");
      }

      const result = await response.json();
      await showAlert({
        type: "success",
        message: result.message || "Stream banner saved successfully"
      });

      setShowForm(false);
      setIsEditing(false);
      onBannerUpdated();
      onPreviewChange(null);
    } catch (error) {
      await showAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to save stream banner"
      });
    }
  };

  const handleDeleteBanner = async (): Promise<void> => {
    if (!banner) return;

    const confirmed = await showConfirm({
      title: "Delete Stream Banner",
      message: `Are you sure you want to delete "${banner.title}"?`,
      confirmText: "Delete",
      cancelText: "Cancel"
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/stream-banners`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete stream banner");
      }

      await showAlert({
        type: "success",
        message: "Stream banner deleted successfully"
      });

      onBannerUpdated();
    } catch (error) {
      await showAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to delete stream banner"
      });
    }
  };

  const handleCancelEdit = (): void => {
    if (isEditing && banner) {
      // Reset to current banner data
      setFormData({
        title: banner.title,
        titleBackgroundColor: banner.titleBackgroundColor || "#1f2937",
        titleTextColor: banner.titleTextColor || "#ffffff",
        carouselItems: (banner.carouselItems || []).map(item => ({
          text: item.text,
          backgroundColor: item.backgroundColor || "#1f2937",
          textColor: item.textColor || "#ffffff",
          order: item.order
        })),
        carouselSpeed: banner.carouselSpeed,
        carouselBackgroundColor: banner.carouselBackgroundColor || "#1f2937",
      });
    } else {
      setFormData(createDefaultStreamBannerForm());
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

  if (bannerLoading) {
    return <LoadingSpinner text="Loading stream banner..." />;
  }

  return (
    <div className="space-y-6">
      {/* Banner Management Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {banner ? "Stream Banner" : "Create Stream Banner"}
        </h2>
        <div className="flex gap-2">
          {banner && !showForm && (
            <>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
              >
                Edit Banner
              </button>
              <button
                onClick={handleDeleteBanner}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
              >
                Delete Banner
              </button>
            </>
          )}
          {!banner && !showForm && (
            <button
              onClick={() => {
                setIsEditing(false);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            >
              Create Banner
            </button>
          )}
        </div>
      </div>

      {/* Current Banner Display */}
      {banner && !showForm && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{banner.title}</h3>
              <p className="text-sm text-gray-400">
                {banner.carouselItems?.length || 0} carousel items • Speed: {banner.carouselSpeed}ms
              </p>
            </div>
          </div>

          {(banner.carouselItems?.length || 0) > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Carousel Items:</h4>
              <div className="grid gap-2">
                {(banner.carouselItems || [])
                  .sort((a, b) => a.order - b.order)
                  .map((item, index) => (
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
        <StreamBannerForm
          formData={formData}
          setFormData={setFormData}
          editingBanner={isEditing ? banner : null}
          onAddBanner={handleSaveBanner}
          onUpdateBanner={handleSaveBanner}
          onCancelEdit={handleCancelEdit}
          onCloseForm={handleCancelEdit}
        />
      )}
    </div>
  );
};