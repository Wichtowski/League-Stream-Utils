"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { dynamicMock, MockPhase } from "@lib/mocks/dynamic-champselect";

interface MockControlPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

const MockControlPanel: React.FC<MockControlPanelProps> = ({ isVisible, onToggle }) => {
  const [currentState, setCurrentState] = useState<ReturnType<typeof dynamicMock.getCurrentState> | null>(null);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [autoAdvanceInterval, setAutoAdvanceInterval] = useState<number>(5000);
  const [seed, setSeed] = useState<number | null>(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize state on client side
    setCurrentState(dynamicMock.getCurrentState());
    setSeed(dynamicMock.getSeed());

    // Set initial position to right side
    setPosition({ x: window.innerWidth - 340, y: 20 });

    const updateState = () => {
      setCurrentState(dynamicMock.getCurrentState());
    };

    // Update state every second
    const intervalId = setInterval(updateState, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Keep panel within viewport bounds
        const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 320);
        const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 400);

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handlePhaseChange = useCallback((phase: MockPhase) => {
    dynamicMock.setPhase(phase);
    setCurrentState(dynamicMock.getCurrentState());
  }, []);

  const handleTurnChange = useCallback((turn: number) => {
    dynamicMock.setTurn(turn);
    setCurrentState(dynamicMock.getCurrentState());
  }, []);

  const handleAutoAdvanceToggle = useCallback(() => {
    if (autoAdvance) {
      dynamicMock.stopAutoAdvance();
      setAutoAdvance(false);
    } else {
      dynamicMock.startAutoAdvance(autoAdvanceInterval);
      setAutoAdvance(true);
    }
  }, [autoAdvance, autoAdvanceInterval]);

  const handleSeedChange = useCallback((newSeed: number) => {
    setSeed(newSeed);
    dynamicMock.setSeed(newSeed);
  }, []);

  const handleAdvanceTurn = useCallback(() => {
    dynamicMock.advanceTurn();
    setCurrentState(dynamicMock.getCurrentState());
  }, []);

  const handleChampionHoverFromInput = useCallback(() => {
    const input = document.querySelector('input[placeholder="Champion ID"]') as HTMLInputElement;
    const championId = parseInt(input?.value || "0");
    if (championId > 0) {
      dynamicMock.forceChampionHover(championId);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const championId = parseInt(e.currentTarget.value);
      if (championId > 0) {
        dynamicMock.forceChampionHover(championId);
      }
    }
  }, []);

  const handleAutoAdvanceIntervalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoAdvanceInterval(Math.max(5000, parseInt(e.target.value)));
  }, []);

  const handleGoToStart = useCallback(() => {
    handleTurnChange(0);
  }, [handleTurnChange]);

  const handleGoToEnd = useCallback(() => {
    handleTurnChange(currentState?.totalTurns ? currentState.totalTurns - 1 : 0);
  }, [handleTurnChange, currentState?.totalTurns]);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg"
      >
        Show Mock Controls
      </button>
    );
  }

  // Don't render until we have state
  if (!currentState) {
    return (
      <div
        ref={panelRef}
        style={{ left: position.x, top: position.y }}
        className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-4 min-w-80 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{ left: position.x, top: position.y }}
      className={`fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-4 min-w-80 select-none ${isDragging ? "cursor-grabbing" : "cursor-move"}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">Mock Control Panel</h3>
        <div className="flex items-center gap-2">
          <button
            onMouseDown={handleMouseDown}
            onMouseUp={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-white p-1 rounded cursor-move select-none"
            title="Drag to move panel"
          >
            ⋮⋮
          </button>
          <button onClick={onToggle} className="text-gray-400 hover:text-white text-xl">
            ×
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Current State */}
        <div className="bg-gray-700 rounded p-3">
          <div className="text-white text-sm">
            <div>
              Phase: <span className="font-semibold">{currentState.phase}</span>
            </div>
            <div>
              Turn: <span className="font-semibold">{currentState.turn + 1}</span> / {currentState.totalTurns}
            </div>
          </div>
        </div>

        {/* Phase Selection */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">Phase:</label>
          <select
            value={currentState.phase}
            onChange={(e) => handlePhaseChange(e.target.value as MockPhase)}
            className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
          >
            <option value="BAN_1">Ban Phase 1</option>
            <option value="PICK_1">Pick Phase 1</option>
            <option value="BAN_2">Ban Phase 2</option>
            <option value="PICK_2">Pick Phase 2</option>
            <option value="FINALIZATION">Finalization</option>
          </select>
        </div>

        {/* Turn Slider */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Turn: {currentState.turn + 1} / {currentState.totalTurns}
          </label>
          <input
            type="range"
            min="0"
            max={currentState.totalTurns - 1}
            value={currentState.turn}
            onChange={(e) => handleTurnChange(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Manual Controls */}
        <div className="flex gap-2">
          <button
            onClick={handleAdvanceTurn}
            disabled={currentState.turn >= currentState.totalTurns - 1}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-2 rounded text-sm"
          >
            Advance Turn
          </button>
        </div>

        {/* Hover Champion */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">Hover Champion:</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Champion ID"
              min="1"
              max="999"
              className="flex-1 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 text-sm"
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleChampionHoverFromInput}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm"
            >
              Hover
            </button>
          </div>
          <p className="text-gray-400 text-xs mt-1">Enter champion ID and press Enter or click Hover</p>
        </div>

        {/* Champion Seed */}
        <div className="border-t border-gray-600 pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-white text-sm font-medium">Champion Seed:</label>
            <input
              type="number"
              value={seed || 0}
              onChange={(e) => handleSeedChange(parseInt(e.target.value))}
              min="0"
              max="999"
              className="w-20 bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 text-sm"
            />
          </div>
          <p className="text-gray-400 text-xs">Change seed for different champion variety</p>
        </div>

        {/* Auto Advance */}
        <div className="border-t border-gray-600 pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-white text-sm font-medium">Auto Advance:</label>
            <input type="checkbox" checked={autoAdvance} onChange={handleAutoAdvanceToggle} className="rounded" />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-white text-sm">Interval (ms):</label>
            <input
              type="number"
              value={autoAdvanceInterval}
              onChange={handleAutoAdvanceIntervalChange}
              min="5000"
              max="30000"
              step="1000"
              className="w-20 bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 text-sm"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t border-gray-600 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleGoToStart}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
            >
              Start
            </button>
            <button
              onClick={handleGoToEnd}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
            >
              End
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { MockControlPanel };
