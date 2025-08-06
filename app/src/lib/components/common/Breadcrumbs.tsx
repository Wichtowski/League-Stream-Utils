"use client";

import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { HomeIcon } from "@heroicons/react/24/outline";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
  items, 
  className = "" 
}) => {
  return (
      <nav className={`flex items-center space-x-3 text-base mb-4 ${className} `}>
        <Link
          href="/modules"
          className="flex items-start text-gray-400 hover:text-white transition-colors"
        >
          <HomeIcon className="w-6 h-6 mr-2 flex-shrink-0" />
          <span className="text-lg">Modules</span>
        </Link>
       
       {items.map((item, index) => (
         <div key={index} className="flex items-center space-x-3">
           <ChevronRightIcon className="w-5 h-5 text-gray-500 " />
           {item.href && !item.isActive ? (
             <Link
               href={item.href}
               className="text-gray-400 hover:text-white transition-colors text-lg"
             >
               {item.label}
             </Link>
           ) : (
             <span className={`text-lg ${item.isActive ? "text-white font-medium" : "text-gray-400"}`}>
               {item.label}
             </span>
           )}
         </div>
       ))}
    </nav>
  );
};
