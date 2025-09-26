"use client";

import { useState, useEffect, useCallback } from "react";
import type { Ticker, TickerFormData, CarouselItemFormData } from "@libTournament/types";
import { createDefaultCarouselItemForm } from "@/libTournament/utils/ticker/defaultValues";
import { TickerPreview } from "./TickerPreview";
import { ErrorBoundary } from "@lib/components/common/ErrorBoundary";
import {
  validateStreamBannerForm,
  validateCarouselItem,
  formatValidationErrors,
  hasUnsavedChanges
} from "@/libTournament/utils/ticker/validators";
import { useErrorHandling } from "@lib/hooks/useErrorHandling";

interface TickerFormProps {
  formData: TickerFormData;
  setFormData: React.Dispatch<React.SetStateAction<TickerFormData>>;
  editingTicker: Ticker | null;
  onAddTicker: () => Promise<void>;
  onUpdateTicker: () => Promise<void>;
  onCancelEdit: () => void;
  onCloseForm: () => void;
  isSubmitting?: boolean;
}

export const TickerForm = ({
  formData,
  setFormData,
  editingTicker,
  onAddTicker,
  onUpdateTicker,
  onCancelEdit,
  onCloseForm,
  isSubmitting = false
}: TickerFormProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<TickerFormData | null>(null);
  const { handleError, clearError: _clearError } = useErrorHandling();

  // Track changes to original data
  useEffect(() => {
    if (editingTicker && !originalData) {
      const original: TickerFormData = {
        title: editingTicker.title,
        titleBackgroundColor: editingTicker.titleBackgroundColor || "#1f2937",
        titleTextColor: editingTicker.titleTextColor || "#ffffff",
        carouselItems: (editingTicker.carouselItems || []).map(
          (item: { text: string; backgroundColor?: string; textColor?: string; order: number }) => ({
            text: item.text,
            backgroundColor: item.backgroundColor || "#1f2937",
            textColor: item.textColor || "#ffffff",
            order: item.order
          })
        ),
        carouselSpeed: editingTicker.carouselSpeed,
        carouselBackgroundColor: editingTicker.carouselBackgroundColor || "#1f2937"
      };
      setOriginalData(original);
    }
  }, [editingTicker, originalData]);

  // Track unsaved changes
  useEffect(() => {
    setHasChanges(hasUnsavedChanges(formData, originalData));
  }, [formData, originalData]);

  // Validation function with comprehensive error handling
  const validateForm = useCallback((): boolean => {
    try {
      const validationErrors = validateStreamBannerForm(formData);
      const formattedErrors = formatValidationErrors(validationErrors);

      setErrors(formattedErrors);
      return validationErrors.length === 0;
    } catch (error) {
      handleError(error instanceof Error ? error : new Error("Validation failed"));
      return false;
    }
  }, [formData, handleError]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      if (validateForm()) {
        if (editingTicker) {
          await onUpdateTicker();
        } else {
          await onAddTicker();
        }
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error("Failed to submit form"));
    }
  };

  const addCarouselItem = () => {
    const newItem = {
      ...createDefaultCarouselItemForm(),
      order: formData.carouselItems.length
    };
    setFormData({
      ...formData,
      carouselItems: [...formData.carouselItems, newItem]
    });
  };

  const removeCarouselItem = (index: number) => {
    const newItems = formData.carouselItems.filter((_, i) => i !== index);
    // Reorder remaining items
    const reorderedItems = newItems.map((item, i) => ({ ...item, order: i }));
    setFormData({
      ...formData,
      carouselItems: reorderedItems
    });
  };

  const updateCarouselItem = useCallback(
    (index: number, updates: Partial<CarouselItemFormData>) => {
      try {
        const newItems = [...formData.carouselItems];
        newItems[index] = { ...newItems[index], ...updates };

        // Validate the updated item
        if (updates.text !== undefined || updates.backgroundColor !== undefined || updates.textColor !== undefined) {
          const itemErrors = validateCarouselItem(newItems[index]);
          const newErrors = { ...errors };

          // Clear existing errors for this item
          Object.keys(newErrors).forEach((key) => {
            if (key.startsWith(`carouselItem_${index}_`)) {
              delete newErrors[key];
            }
          });

          // Add new errors if any
          itemErrors.forEach((error) => {
            newErrors[`carouselItem_${index}_${error.field}`] = error.message;
          });

          setErrors(newErrors);
        }

        setFormData({
          ...formData,
          carouselItems: newItems
        });
      } catch (error) {
        handleError(error instanceof Error ? error : new Error("Failed to update carousel item"));
      }
    },
    [formData, errors, handleError, setFormData]
  );

  const moveCarouselItem = (index: number, direction: "up" | "down") => {
    const newItems = [...formData.carouselItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newItems.length) {
      // Swap items
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      // Update order values
      newItems.forEach((item, i) => {
        item.order = i;
      });
      setFormData({
        ...formData,
        carouselItems: newItems
      });
    }
  };

  const clearFieldError = useCallback(
    (field: string) => {
      if (errors[field]) {
        const newErrors = { ...errors };
        delete newErrors[field];
        setErrors(newErrors);
      }
    },
    [errors]
  );

  // Handle unsaved changes warning
  const handleCloseWithWarning = useCallback(async () => {
    if (hasChanges) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to close without saving?");
      if (!confirmed) return;
    }
    onCloseForm();
  }, [hasChanges, onCloseForm]);

  return (
    <ErrorBoundary context="TickerForm" showDetails={process.env.NODE_ENV === "development"}>
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">{editingTicker ? "Edit Ticker" : "Add New Ticker"}</h3>
            {hasChanges && <p className="text-sm text-yellow-400 mt-1">You have unsaved changes</p>}
          </div>
          <button
            onClick={handleCloseWithWarning}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white text-2xl disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Fields */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  clearFieldError("title");
                }}
                disabled={isSubmitting}
                className={`w-full bg-gray-700 border rounded px-3 py-2 disabled:opacity-50 ${
                  errors.title ? "border-red-500" : "border-gray-600"
                }`}
                placeholder="Enter Ticker title"
              />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
            </div>

            {/* Title Background Color */}
            <div>
              <label className="block text-sm font-medium mb-2">Title Background Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.titleBackgroundColor || "#1f2937"}
                  onChange={(e) => {
                    const newFormData = { ...formData, titleBackgroundColor: e.target.value };
                    setFormData(newFormData);
                  }}
                  className="w-12 h-10 rounded border border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.titleBackgroundColor || "#1f2937"}
                  onChange={(e) => {
                    const newFormData = { ...formData, titleBackgroundColor: e.target.value };
                    setFormData(newFormData);
                  }}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="#1f2937"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Background color for the title section (full-width)</p>
            </div>

            {/* Title Text Color */}
            <div>
              <label className="block text-sm font-medium mb-2">Title Text Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.titleTextColor || "#ffffff"}
                  onChange={(e) => {
                    const newFormData = { ...formData, titleTextColor: e.target.value };
                    setFormData(newFormData);
                  }}
                  className="w-12 h-10 rounded border border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.titleTextColor || "#ffffff"}
                  onChange={(e) => {
                    const newFormData = { ...formData, titleTextColor: e.target.value };
                    setFormData(newFormData);
                  }}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="#ffffff"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Text color for the title</p>
            </div>

            {/* Carousel Settings */}
            <div>
              <label className="block text-sm font-medium mb-2">Carousel Speed (px/s)</label>
              <input
                type="number"
                min="10"
                max="200"
                value={formData.carouselSpeed || 50}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    carouselSpeed: parseInt(e.target.value) || 50
                  });
                  clearFieldError("carouselSpeed");
                }}
                disabled={isSubmitting}
                className={`w-full bg-gray-700 border rounded px-3 py-2 ${
                  errors.carouselSpeed ? "border-red-500" : "border-gray-600"
                }`}
              />
              {errors.carouselSpeed && <p className="text-red-400 text-xs mt-1">{errors.carouselSpeed}</p>}
              <p className="text-xs text-gray-400 mt-1">
                Controls how fast the carousel items scroll (10-200 pixels per second)
              </p>
            </div>

            {/* Carousel Background Color */}
            <div>
              <label className="block text-sm font-medium mb-2">Carousel Background Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.carouselBackgroundColor || "#1f2937"}
                  onChange={(e) => {
                    const newFormData = { ...formData, carouselBackgroundColor: e.target.value };
                    setFormData(newFormData);
                  }}
                  className="w-12 h-10 rounded border border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.carouselBackgroundColor || "#1f2937"}
                  onChange={(e) => {
                    const newFormData = { ...formData, carouselBackgroundColor: e.target.value };
                    setFormData(newFormData);
                  }}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="#1f2937"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Background color for the carousel section (full-width)</p>
            </div>

            {/* Carousel Items */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium">Carousel Items ({formData.carouselItems.length})</label>
                <button
                  onClick={addCarouselItem}
                  disabled={isSubmitting || formData.carouselItems.length >= 20}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={formData.carouselItems.length >= 20 ? "Maximum 20 items allowed" : "Add new carousel item"}
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {formData.carouselItems.map((item, index) => (
                  <div key={index} className="bg-gray-700 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-300">Item {index + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveCarouselItem(index, "up")}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveCarouselItem(index, "down")}
                          disabled={index === formData.carouselItems.length - 1}
                          className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeCarouselItem(index)}
                          className="text-red-400 hover:text-red-300 ml-2"
                          title="Remove item"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={item.text || ""}
                        onChange={(e) => updateCarouselItem(index, { text: e.target.value })}
                        className={`w-full bg-gray-600 border rounded px-2 py-1 text-sm ${
                          errors[`carouselItem_${index}_text`] ? "border-red-500" : "border-gray-500"
                        }`}
                        placeholder="Enter carousel item text"
                      />
                      {errors[`carouselItem_${index}_text`] && (
                        <p className="text-red-400 text-xs">{errors[`carouselItem_${index}_text`]}</p>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Background Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={item.backgroundColor || "#1f2937"}
                              onChange={(e) => updateCarouselItem(index, { backgroundColor: e.target.value })}
                              className="w-8 h-6 rounded border border-gray-500"
                            />
                            <input
                              type="text"
                              value={item.backgroundColor || "#1f2937"}
                              onChange={(e) => updateCarouselItem(index, { backgroundColor: e.target.value })}
                              className="flex-1 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Text Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={item.textColor || "#ffffff"}
                              onChange={(e) => updateCarouselItem(index, { textColor: e.target.value })}
                              className="w-8 h-6 rounded border border-gray-500"
                            />
                            <input
                              type="text"
                              value={item.textColor || "#ffffff"}
                              onChange={(e) => updateCarouselItem(index, { textColor: e.target.value })}
                              className="flex-1 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {formData.carouselItems.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No carousel items yet</p>
                    <p className="text-xs">Click &quot;Add Item&quot; to create your first carousel item</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <TickerPreview
              key={`${formData.titleBackgroundColor}-${formData.titleTextColor}-${formData.carouselBackgroundColor}`}
              formData={formData}
              className="sticky top-4"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          {editingTicker && (
            <button onClick={onCancelEdit} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg">
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(errors).length > 0}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isSubmitting
              ? editingTicker
                ? "Updating..."
                : "Saving..."
              : editingTicker
                ? "Update Ticker"
                : "Save Ticker"}
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
};
