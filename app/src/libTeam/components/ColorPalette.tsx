import React, { useState } from "react";

interface ColorPaletteProps {
  colors: string[];
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  onColorsChange: (colors: { primary: string; secondary: string; accent: string }) => void;
}

interface ColorSlotProps {
  color: string;
  label: string;
  onDrop: (color: string) => void;
  onDragStart: (e: React.DragEvent, color: string) => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
}

const ColorSlot: React.FC<ColorSlotProps> = ({
  color,
  label,
  onDrop,
  onDragStart,
  isDragOver,
  onDragOver,
  onDragLeave
}) => {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedColor = e.dataTransfer.getData("text/plain");
    onDrop(droppedColor);
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <div
        className={`w-16 h-16 rounded-lg border-2 border-gray-600 cursor-move transition-all duration-200 ${
          isDragOver ? "border-blue-400 scale-110" : ""
        }`}
        style={{ backgroundColor: color }}
        draggable
        onDragStart={(e) => onDragStart(e, color)}
        onDrop={handleDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      />
    </div>
  );
};

const ColorPalette: React.FC<ColorPaletteProps> = ({
  colors,
  primaryColor,
  secondaryColor,
  accentColor,
  onColorsChange
}) => {
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [draggedColor, setDraggedColor] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, color: string) => {
    setDraggedColor(color);
    e.dataTransfer.setData("text/plain", color);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (slotType: string, color: string) => {
    if (!draggedColor) return;

    const newColors = { primary: primaryColor, secondary: secondaryColor, accent: accentColor };

    // Check if we're dragging from a slot to another slot
    const sourceSlot = Object.entries(newColors).find(([_, slotColor]) => slotColor === draggedColor)?.[0];

    if (sourceSlot && sourceSlot !== slotType) {
      // Swapping between slots
      newColors[sourceSlot as keyof typeof newColors] = color;
      newColors[slotType as keyof typeof newColors] = draggedColor;
    } else {
      // Dropping from palette to slot, or same slot
      newColors[slotType as keyof typeof newColors] = draggedColor;
    }

    onColorsChange(newColors);
    setDraggedColor(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  return (
    <div className="flex items-center justify-between space-x-8">
      {/* Color Slots - Left Side */}
      <div className="flex space-x-6">
        <ColorSlot
          color={primaryColor}
          label="Primary"
          onDrop={(color) => handleDrop("primary", color)}
          onDragStart={handleDragStart}
          isDragOver={dragOverSlot === "primary"}
          onDragOver={(e) => {
            handleDragOver(e);
            setDragOverSlot("primary");
          }}
          onDragLeave={handleDragLeave}
        />
        <ColorSlot
          color={secondaryColor}
          label="Secondary"
          onDrop={(color) => handleDrop("secondary", color)}
          onDragStart={handleDragStart}
          isDragOver={dragOverSlot === "secondary"}
          onDragOver={(e) => {
            handleDragOver(e);
            setDragOverSlot("secondary");
          }}
          onDragLeave={handleDragLeave}
        />
        <ColorSlot
          color={accentColor}
          label="Accent"
          onDrop={(color) => handleDrop("accent", color)}
          onDragStart={handleDragStart}
          isDragOver={dragOverSlot === "accent"}
          onDragOver={(e) => {
            handleDragOver(e);
            setDragOverSlot("accent");
          }}
          onDragLeave={handleDragLeave}
        />
      </div>

      {/* Color Palette - Center */}
      <div className="flex-1 flex flex-col items-center">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Generated Color Palette</h4>
        <div className="grid grid-cols-4 gap-3">
          {colors.map((color, index) => (
            <div
              key={index}
              className="w-12 h-12 rounded-lg border-2 border-gray-600 cursor-grab active:cursor-grabbing transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
              draggable
              onDragStart={(e) => handleDragStart(e, color)}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Drag colors from palette to slots, or drag between slots to swap
        </p>
      </div>
    </div>
  );
};

export { ColorPalette };
