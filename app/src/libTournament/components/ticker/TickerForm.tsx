"use client";

import { useState } from "react";
import type { Ticker } from "@lib/types";
import type { TickerFormData, CarouselItemFormData } from "@lib/types/forms";
import { createDefaultCarouselItemForm } from "@lib/types/forms";
import { TickerPreview } from "./TickerPreview";

interface TickerFormProps {
  formData: TickerFormData;
  setFormData: React.Dispatch<React.SetStateAction<TickerFormData>>;
  editingTicker: Ticker | null;
  onAddTicker: () => void;
  onUpdateTicker: () => void;
  onCancelEdit: () => void;
  onCloseForm: () => void;
}

export const TickerForm = ({
  formData,
  setFormData,
  editingTicker,
  onAddTicker,
  onUpdateTicker,
  onCancelEdit,
  onCloseForm
}: TickerFormProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }



    if (formData.carouselSpeed < 10 || formData.carouselSpeed > 200) {
      newErrors.carouselSpeed = "Carousel speed must be between 10 and 200 pixels per second";
    }



    // Validate carousel items
    formData.carouselItems.forEach((item, index) => {
      if (!item.text.trim()) {
        newErrors[`carouselItem_${index}_text`] = "Carousel item text is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      if (editingTicker) {
        onUpdateTicker();
      } else {
        onAddTicker();
      }
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

  const updateCarouselItem = (index: number, updates: Partial<CarouselItemFormData>) => {
    const newItems = [...formData.carouselItems];
    newItems[index] = { ...newItems[index], ...updates };
    setFormData({
      ...formData,
      carouselItems: newItems
    });

    // Clear specific item errors when user starts typing
    if (updates.text !== undefined && errors[`carouselItem_${index}_text`]) {
      const newErrors = { ...errors };
      delete newErrors[`carouselItem_${index}_text`];
      setErrors(newErrors);
    }
  };

  const moveCarouselItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...formData.carouselItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

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

  const clearError = (field: string) => {
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {editingTicker ? "Edit Ticker" : "Add New Ticker"}
        </h3>
        <button
          onClick={onCloseForm}
          className="text-gray-400 hover:text-white text-2xl"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Fields */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                clearError('title');
              }}
              className={`w-full bg-gray-700 border rounded px-3 py-2 ${errors.title ? 'border-red-500' : 'border-gray-600'
                }`}
              placeholder="Enter Ticker title"
            />
            {errors.title && (
              <p className="text-red-400 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          {/* Title Background Color */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title Background Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.titleBackgroundColor || '#1f2937'}
                onChange={(e) => {
                  const newFormData = { ...formData, titleBackgroundColor: e.target.value };
                  setFormData(newFormData);
                }}
                className="w-12 h-10 rounded border border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={formData.titleBackgroundColor || '#1f2937'}
                onChange={(e) => {
                  const newFormData = { ...formData, titleBackgroundColor: e.target.value };
                  setFormData(newFormData);
                }}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2"
                placeholder="#1f2937"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Background color for the title section (full-width)
            </p>
          </div>

          {/* Title Text Color */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title Text Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.titleTextColor || '#ffffff'}
                onChange={(e) => {
                  const newFormData = { ...formData, titleTextColor: e.target.value };
                  setFormData(newFormData);
                }}
                className="w-12 h-10 rounded border border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={formData.titleTextColor || '#ffffff'}
                onChange={(e) => {
                  const newFormData = { ...formData, titleTextColor: e.target.value };
                  setFormData(newFormData);
                }}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2"
                placeholder="#ffffff"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Text color for the title
            </p>
          </div>

          {/* Carousel Settings */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Carousel Speed (px/s)
            </label>
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
                clearError('carouselSpeed');
              }}
              className={`w-full bg-gray-700 border rounded px-3 py-2 ${errors.carouselSpeed ? 'border-red-500' : 'border-gray-600'
                }`}
            />
            {errors.carouselSpeed && (
              <p className="text-red-400 text-xs mt-1">{errors.carouselSpeed}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Controls how fast the carousel items scroll (10-200 pixels per second)
            </p>
          </div>

          {/* Carousel Background Color */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Carousel Background Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.carouselBackgroundColor || '#1f2937'}
                onChange={(e) => {
                  const newFormData = { ...formData, carouselBackgroundColor: e.target.value };
                  setFormData(newFormData);
                }}
                className="w-12 h-10 rounded border border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={formData.carouselBackgroundColor || '#1f2937'}
                onChange={(e) => {
                  const newFormData = { ...formData, carouselBackgroundColor: e.target.value };
                  setFormData(newFormData);
                }}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2"
                placeholder="#1f2937"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Background color for the carousel section (full-width)
            </p>
          </div>

          {/* Carousel Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium">
                Carousel Items ({formData.carouselItems.length})
              </label>
              <button
                onClick={addCarouselItem}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {formData.carouselItems.map((item, index) => (
                <div key={index} className="bg-gray-700 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-300">
                      Item {index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveCarouselItem(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveCarouselItem(index, 'down')}
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
                      value={item.text || ''}
                      onChange={(e) => updateCarouselItem(index, { text: e.target.value })}
                      className={`w-full bg-gray-600 border rounded px-2 py-1 text-sm ${errors[`carouselItem_${index}_text`] ? 'border-red-500' : 'border-gray-500'
                        }`}
                      placeholder="Enter carousel item text"
                    />
                    {errors[`carouselItem_${index}_text`] && (
                      <p className="text-red-400 text-xs">{errors[`carouselItem_${index}_text`]}</p>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Background Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={item.backgroundColor || '#1f2937'}
                            onChange={(e) => updateCarouselItem(index, { backgroundColor: e.target.value })}
                            className="w-8 h-6 rounded border border-gray-500"
                          />
                          <input
                            type="text"
                            value={item.backgroundColor || '#1f2937'}
                            onChange={(e) => updateCarouselItem(index, { backgroundColor: e.target.value })}
                            className="flex-1 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Text Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={item.textColor || '#ffffff'}
                            onChange={(e) => updateCarouselItem(index, { textColor: e.target.value })}
                            className="w-8 h-6 rounded border border-gray-500"
                          />
                          <input
                            type="text"
                            value={item.textColor || '#ffffff'}
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
                  <p className="text-xs">Click "Add Item" to create your first carousel item</p>
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
            autoPlay={false}
            className="sticky top-4"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 mt-6">
        {editingTicker && (
          <button
            onClick={onCancelEdit}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
        >
          {editingTicker ? "Update Ticker" : "Save Ticker"}
        </button>
      </div>
    </div>
  );
};