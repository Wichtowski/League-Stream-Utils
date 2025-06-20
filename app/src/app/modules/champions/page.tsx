"use client";

import React, { useState, useEffect } from "react";
import Image from 'next/image';
import { DDRAGON_CDN } from '@lib/constants';
import { useNavigation } from '@lib/contexts/NavigationContext';

type Champion = {
  id: string;
  name: string;
  title: string;
};

type Spell = {
  id: string;
  name: string;
  image: { full: string };
};

type Passive = {
  name: string;
  image: { full: string };
};

type ChampionDetail = Champion & {
  passive: Passive;
  spells: Spell[];
};

const VERSION = "15.11.1";

const languages = [
  { code: 'en_US', name: 'English' },
  { code: 'pl_PL', name: 'Polski' },
  { code: 'de_DE', name: 'Deutsch' },
  { code: 'es_ES', name: 'Español' },
  { code: 'fr_FR', name: 'Français' },
  { code: 'it_IT', name: 'Italiano' },
  { code: 'pt_BR', name: 'Português' },
  { code: 'ru_RU', name: 'Русский' },
  { code: 'ko_KR', name: '한국어' },
  { code: 'ja_JP', name: '日本語' },
];

const CHAMP_LIST_URL = (lang: string) => `${DDRAGON_CDN}/${VERSION}/data/${lang}/champion.json`;
const ICON_URL = (champ: string) => `${DDRAGON_CDN}/${VERSION}/img/champion/${champ}.png`;
const CHAMP_DETAIL_URL = (champ: string, lang: string) => `${DDRAGON_CDN}/cdn/${VERSION}/data/${lang}/champion/${champ}.json`;
const SPELL_ICON_URL = (img: string) => `${DDRAGON_CDN}/${VERSION}/img/spell/${img}`;

export default function App() {
  const { setActiveModule } = useNavigation();
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Champion | null>(null);
  const [champDetail, setChampDetail] = useState<ChampionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [redTeam, setRedTeam] = useState<Champion[]>([]);
  const [blueTeam, setBlueTeam] = useState<Champion[]>([]);
  const [draggedChamp, setDraggedChamp] = useState<Champion | null>(null);
  const [dragOverRed, setDragOverRed] = useState(false);
  const [dragOverBlue, setDragOverBlue] = useState(false);
  const [showOnlyR, setShowOnlyR] = useState(false);
  const [language, setLanguage] = useState('pl_PL');

  useEffect(() => {
    setActiveModule('champions');
  }, [setActiveModule]);

  useEffect(() => {
    fetch(CHAMP_LIST_URL(language))
      .then((res) => res.json())
      .then((data) => {
        setChampions(Object.values(data.data));
        setLoading(false);
      });
  }, [language]);

  useEffect(() => {
    if (!selected) return;
    setDetailLoading(true);
    fetch(CHAMP_DETAIL_URL(selected.id, language))
      .then((res) => res.json())
      .then((data) => {
        setChampDetail(data.data[selected.id]);
        setDetailLoading(false);
      });
  }, [selected, language]);

  const scrollToFooter = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen text-white p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-7xl p-4 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6 text-center">League of Legends Champion Spell Showcaser</h1>

        <div className="flex justify-center mb-6 w-full gap-4">
          <input
            type="text"
            placeholder="Search champion..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
          />

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-4 py-2 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center mb-4 w-full mb-4 mt-2 mx-2">
          <button
            className="px-4 py-2 rounded bg-gray-700 text-white font-semibold hover:bg-gray-600 transition mr-2"
            onClick={() => setShowOnlyR(v => !v)}
          >
            {showOnlyR ? 'Show All Abilities' : 'Show Only R'}
          </button>
        </div>
        <div className={`flex flex-row justify-center gap-8 w-full ${showOnlyR ? 'max-w-4xl' : 'max-w-6xl'} mb-8 mx-auto`}>
          <div
            className={`${showOnlyR ? 'w-[450px]' : 'w-[700px]'} rounded-lg p-6 min-h-[140px] flex flex-col items-center transition-all duration-300 bg-red-900 bg-opacity-90 border-2 border-red-700 ${dragOverRed ? 'ring-4 ring-red-400 bg-opacity-100' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverRed(true); }}
            onDragLeave={() => setDragOverRed(false)}
            onDrop={() => {
              setDragOverRed(false);
              if (draggedChamp && !redTeam.some(c => c.id === draggedChamp.id) && !blueTeam.some(c => c.id === draggedChamp.id)) {
                setRedTeam([...redTeam, draggedChamp]);
              }
              setDraggedChamp(null);
            }}
          >
            <div className="font-bold text-xl mb-3 text-red-300">Red Team</div>
            <div className="flex flex-col gap-4 w-full">
              {redTeam.map(champ => (
                <div
                  key={champ.id}
                  className="flex flex-row items-center gap-6 bg-red-950 bg-opacity-60 rounded p-4 w-full justify-start"
                  onDoubleClick={() => setRedTeam(redTeam.filter(c => c.id !== champ.id))}
                >
                  <div className="flex flex-col items-center min-w-[100px]">
                    <Image
                      src={ICON_URL(champ.id)}
                      alt={champ.name}
                      width={80}
                      height={80}
                      className="rounded"
                    />
                    <span className="text-sm text-center font-medium">{champ.name}</span>
                  </div>
                  <TeamChampionAbilities champId={champ.id} showOnlyR={showOnlyR} language={language} />
                </div>
              ))}
            </div>
          </div>
          <div
            className={`${showOnlyR ? 'w-[450px]' : 'w-[700px]'} rounded-lg p-6 min-h-[140px] flex flex-col items-center transition-all duration-300 bg-blue-900 bg-opacity-90 border-2 border-blue-700 ${dragOverBlue ? 'ring-4 ring-blue-400 bg-opacity-100' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverBlue(true); }}
            onDragLeave={() => setDragOverBlue(false)}
            onDrop={() => {
              setDragOverBlue(false);
              if (draggedChamp && !blueTeam.some(c => c.id === draggedChamp.id) && !redTeam.some(c => c.id === draggedChamp.id)) {
                setBlueTeam([...blueTeam, draggedChamp]);
              }
              setDraggedChamp(null);
            }}
          >
            <div className="font-bold text-xl mb-3 text-blue-300">Blue Team</div>
            <div className="flex flex-col gap-4 w-full">
              {blueTeam.map(champ => (
                <div
                  key={champ.id}
                  className="flex flex-row items-center gap-6 bg-blue-950 bg-opacity-60 rounded p-4 w-full justify-start"
                  onDoubleClick={() => setBlueTeam(blueTeam.filter(c => c.id !== champ.id))}
                >
                  <div className="flex flex-col items-center min-w-[100px]">
                    <Image
                      src={ICON_URL(champ.id)}
                      alt={champ.name}
                      width={80}
                      height={80}
                      className="rounded"
                    />
                    <span className="text-sm text-center font-medium">{champ.name}</span>
                  </div>
                  <TeamChampionAbilities champId={champ.id} showOnlyR={showOnlyR} language={language} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4 w-full h-full max-w-5xl mx-auto">
          {champions
            .filter(champ => champ.name.toLowerCase().includes(search.toLowerCase()))
            .map((champ) => (
              <div
                key={champ.id}
                className="flex flex-col items-center bg-gray-800 rounded-lg p-2 hover:bg-gray-700 transition cursor-pointer h-full opacity-100"
                onClick={() => setSelected(champ)}
                draggable
                onDragStart={() => setDraggedChamp(champ)}
                style={{
                  opacity: redTeam.some(c => c.id === champ.id) || blueTeam.some(c => c.id === champ.id) ? 0.4 : 1,
                  pointerEvents: redTeam.some(c => c.id === champ.id) || blueTeam.some(c => c.id === champ.id) ? 'none' : 'auto',
                }}
              >
                <Image
                  src={ICON_URL(champ.id)}
                  alt={champ.name}
                  width={80}
                  height={80}
                  className="object-contain mb-2"
                />
                <span className="font-semibold text-center">{champ.name}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Scroll to Footer Button */}
      <button
        onClick={scrollToFooter}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-40"
        title="Scroll to Footer"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {selected && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-gray-900 rounded-lg p-6 max-w-lg w-full relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-white hover:text-gray-300"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>
            <div className="flex items-center mb-4">
              <Image
                src={ICON_URL(selected.id)}
                alt={selected.name}
                width={80}
                height={80}
                className="mr-4"
              />
              <div>
                <h2 className="text-2xl font-bold">{selected.name}</h2>
                <p className="text-gray-400">{selected.title}</p>
              </div>
            </div>

            {detailLoading ? (
              <p>Loading abilities...</p>
            ) : champDetail ? (
              <div>
                <div className="grid grid-cols-4 gap-4">
                  {champDetail.spells.map((spell, index) => (
                    <div key={spell.id} className="text-center">
                      <h4 className="text-sm font-medium mb-2">{['Q', 'W', 'E', 'R'][index]}</h4>
                      <Image
                        src={SPELL_ICON_URL(spell.image.full)}
                        alt={spell.name}
                        width={50}
                        height={50}
                        className="mx-auto mb-2"
                      />
                      <p className="text-xs">{spell.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamChampionAbilities({ champId, showOnlyR = false, language }: { champId: string, showOnlyR?: boolean, language: string }) {
  const [abilities, setAbilities] = useState<{ passive: Passive; spells: Spell[] } | null>(null);

  useEffect(() => {
    fetch(CHAMP_DETAIL_URL(champId, language))
      .then(res => res.json())
      .then(data => {
        const champData = data.data[champId];
        setAbilities({
          passive: champData.passive,
          spells: champData.spells
        });
      });
  }, [champId, language]);

  if (!abilities) return <div className="text-xs">Loading...</div>;

  return (
    <div className="flex gap-4 items-center">
      {abilities.spells.map((spell, index) => {
        if (showOnlyR && index !== 3) return null;
        return (
          <div key={spell.id} className="flex flex-col items-center max-w-[80px]">
            <Image
              src={SPELL_ICON_URL(spell.image.full)}
              alt={spell.name}
              width={40}
              height={40}
              title={spell.name}
            />
            <span className="text-sm text-center mt-1 font-bold">{['Q', 'W', 'E', 'R'][index]}</span>
            <span className="text-sm text-center leading-tight font-medium">{spell.name}</span>
          </div>
        );
      })}
    </div>
  );
} 