import React from 'react';

export interface AccordionItem {
  id: string;
  header: React.ReactNode;
  renderContent: () => React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  openId: string | null;
  onToggle: (id: string) => void;
  className?: string;
}

export const Accordion = ({ items, openId, onToggle, className = '' }: AccordionProps): React.ReactElement => (
  <div className={`space-y-4 ${className}`}>
    {items.map(item => (
      <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <button
          className="w-full flex justify-between items-center px-6 py-4 focus:outline-none text-left bg-gray-800 hover:bg-gray-700 transition-colors"
          onClick={() => onToggle(item.id)}
          type="button"
        >
          {item.header}
          <span className="text-gray-400">{openId === item.id ? '▲' : '▼'}</span>
        </button>
        {openId === item.id && (
          <div className="p-6 bg-gray-900">
            {item.renderContent()}
          </div>
        )}
      </div>
    ))}
  </div>
); 