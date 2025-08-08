'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            // Show all pages if total is less than max visible
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Calculate start and end pages
            let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            const end = Math.min(totalPages, start + maxVisible - 1);

            // Adjust start if end is at max
            if (end === totalPages) {
                start = Math.max(1, end - maxVisible + 1);
            }

            // Add first page and ellipsis if needed
            if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push('...');
            }

            // Add visible pages
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            // Add ellipsis and last page if needed
            if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className={`flex items-center justify-center space-x-1 ${className}`}>
            {/* Previous Button */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
            >
                <ChevronLeftIcon className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            {getPageNumbers().map((page, index) => (
                <div key={index}>
                    {page === '...' ? (
                        <span className="px-3 py-2 text-gray-400">...</span>
                    ) : (
                        <button
                            onClick={() => onPageChange(page as number)}
                            className={`px-3 py-2 rounded-md border transition-colors ${
                                currentPage === page
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            {page}
                        </button>
                    )}
                </div>
            ))}

            {/* Next Button */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
            >
                <ChevronRightIcon className="w-4 h-4" />
            </button>
        </div>
    );
}
