'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface BackButtonProps {
  to: string;
  children?: React.ReactNode;
  className?: string;
}

export const BackButton = ({ to, children = 'Back', className = '' }: BackButtonProps): React.ReactElement => {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(to)}
      className={`cursor-pointer flex items-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg ${className}`}
    >
      <ArrowLeftIcon className="w-5 h-5 mr-2" />
      {children}
    </button>
  );
}; 