"use client";

import { useEffect, useRef, useState } from "react";
import { CarouselItem } from "@libTournament/types";

interface CarouselTickerProps {
  items: CarouselItem[];
  speed: number; // pixels per second
  backgroundColor?: string;
  className?: string;
}

export const CarouselTicker = ({ items, speed, backgroundColor, className = "" }: CarouselTickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  // Sort items by order
  const sortedItems = [...(items || [])].sort((a, b) => a.order - b.order);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && contentRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        setContentWidth(contentRef.current.scrollWidth);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    // Use ResizeObserver for more accurate dimension tracking
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      resizeObserver.disconnect();
    };
  }, [items]);

  if (!sortedItems.length) {
    return (
      <div 
        className={`h-12 backdrop-blur-sm border-t border-gray-600/50 ${className}`}
        style={{ backgroundColor: backgroundColor || "#1f2937" }}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-gray-400 text-sm">No carousel items</span>
        </div>
      </div>
    );
  }

  // Calculate animation duration based on content width and speed
  const animationDuration = contentWidth > 0 ? (contentWidth + containerWidth) / speed : 20;

  return (
    <>
      <style jsx>{`
        @keyframes scrollLeft {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
      <div 
        ref={containerRef}
        className={`h-12 backdrop-blur-sm border-t border-gray-600/50 overflow-hidden relative ${className}`}
        style={{ backgroundColor: backgroundColor || "#1f2937" }}
      >
      <div 
        ref={contentRef}
        className="flex items-center h-full whitespace-nowrap"
        style={{
          animationName: 'scrollLeft',
          animationDuration: `${animationDuration}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationPlayState: contentWidth > containerWidth ? 'running' : 'paused'
        }}
      >
        {/* Render items twice for seamless loop */}
        {[...sortedItems, ...sortedItems].map((item, index) => (
          <div
            key={`${item._id || item.text}-${index}`}
            className="flex-shrink-0 px-4 py-2 mx-2 rounded text-sm font-medium shadow-sm"
            style={{
              backgroundColor: item.backgroundColor || "#1f2937",
              color: item.textColor || "#ffffff"
            }}
          >
            {item.text}
          </div>
        ))}
      </div>
    </div>
    </>
  );
};