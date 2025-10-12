"use client";

import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { AiOutlineHome } from "react-icons/ai";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  showHome?: boolean;
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ showHome = true, items, className = "" }) => {
  return (
    <nav className={`flex items-center space-x-3 text-base mb-4 ${className} `}>
      {showHome && (
        <Link href="/modules" className="flex items-start text-gray-400 hover:text-white transition-colors">
          <AiOutlineHome className="w-6 h-6 mr-2 flex-shrink-0" />
          <span className="text-lg">Modules</span>
        </Link>
      )}

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          {(index > 0 || showHome) && <ChevronRightIcon className="w-5 h-5 text-gray-500 " />}
          {item.href && !item.isActive ? (
            <Link
              href={item.href}
              className="text-gray-400 hover:text-white transition-colors text-lg flex items-center"
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </Link>
          ) : (
            <span className={`text-lg flex items-center ${item.isActive ? "text-white font-medium" : "text-gray-400"}`}>
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};
