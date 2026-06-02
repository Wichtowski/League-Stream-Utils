import React from "react";

type ChampSelectLayoutProps = {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  above?: React.ReactNode;
  mainUIAnimated?: boolean;
  _cardsAnimated?: boolean;
};

export const ChampSelectLayout: React.FC<ChampSelectLayoutProps> = ({
  left,
  center,
  right,
  above,
  mainUIAnimated,
  _cardsAnimated
}) => {
  return (
    <div
      className={`fixed bottom-0 left-0 w-full z-10 transition-all duration-800 ease-out ${mainUIAnimated ? "translate-y-0" : "translate-y-full"}`}
    >
      {above && <div className="w-full">{above}</div>}
      <div className="w-full flex flex-row items-end">
        <div className="flex-1 flex justify-start">{left}</div>
        <div className="flex-shrink">{center}</div>
        <div className="flex-1 flex justify-end">{right}</div>
      </div>
    </div>
  );
};
