'use client';

import { useState } from 'react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

interface CopyButtonProps {
    text: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function CopyButton({ text, className = '', size = 'md' }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);

            // Reset after 2 seconds
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy text:', error);
        }
    };

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    const buttonSizeClasses = {
        sm: 'p-1',
        md: 'p-2',
        lg: 'p-3'
    };

    return (
        <button
            onClick={handleCopy}
            className={`
        relative inline-flex items-center justify-center rounded-md
        transition-all duration-200 ease-in-out
        hover:bg-gray-600 active:scale-95
        ${buttonSizeClasses[size]}
        ${copied ? 'text-green-400 bg-green-900/30' : 'text-gray-400 hover:text-white'}
        ${className}
      `}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
            <div className="relative">
                {/* Copy Icon */}
                <ClipboardIcon
                    className={`
            ${sizeClasses[size]} 
            transition-all duration-300 ease-in-out
            ${copied ? 'opacity-0 scale-0 rotate-180' : 'opacity-100 scale-100 rotate-0'}
          `}
                />

                {/* Check Icon */}
                <CheckIcon
                    className={`
            ${sizeClasses[size]} 
            absolute inset-0 transition-all duration-300 ease-in-out
            ${copied ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-180'}
          `}
                />
            </div>

            {/* Ripple effect */}
            <div
                className={`
          absolute inset-0 rounded-md bg-white/20 
          transition-all duration-300 ease-out
          ${copied ? 'animate-ping' : 'scale-0'}
        `}
            />
        </button>
    );
}
