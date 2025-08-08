import React from "react";

type ChampSelectLayoutProps = {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  above?: React.ReactNode;
};

export const ChampSelectLayout: React.FC<ChampSelectLayoutProps> = ({ left, center, right, above }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full z-10 animate-champ-select-layout">
      {above && <div className="w-full">{above}</div>}
      <div className="w-full flex flex-row items-end justify-between">
        <div className="flex-1 flex justify-start">{left}</div>
        <div className="flex-shrink-0">{center}</div>
        <div className="flex-1 flex justify-end">{right}</div>
      </div>
    </div>
  );
};
