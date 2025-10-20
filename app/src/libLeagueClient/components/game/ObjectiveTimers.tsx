import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
// import { LiveGameData } from "@libLeagueClient/types";
import { getDragonPitAsset, getBaronPitAsset, getAtakhanAsset } from "@libLeagueClient/components/common";
import { ObjectiveState, DragonType, ObjectiveTimersProps, OBJECTIVE_CONFIGS, ObjectiveType } from "@libLeagueClient/types/objective-timers";

const ObjectiveTimers: React.FC<ObjectiveTimersProps> = ({ gameData, gameVersion }) => {
  const [objectives, setObjectives] = useState<ObjectiveState[]>([]);
  const [currentDragonType, setCurrentDragonType] = useState<DragonType>("infernal");
  const [dragonTypeLocked, setDragonTypeLocked] = useState(false);

  const gameTime = gameData.gameData.gameTime;
  const events = useMemo(() => gameData.events || [], [gameData.events]);

  // Get dragon kills count
  const dragonKills = useMemo(() => events.filter(event => event.EventName === "DragonKill"), [events]);
  const totalDragonKills = dragonKills.length;

  // Get baron kills count
  const baronKills = useMemo(() => events.filter(event => event.EventName === "BaronKill"), [events]);
  const totalBaronKills = baronKills.length;

  // Get voidgrub kills count
  const voidgrubKills = useMemo(() => events.filter(event => event.EventName === "HordeKill"), [events]);
  const totalVoidgrubKills = voidgrubKills.length;

  // Get herald kills count
  const heraldKills = useMemo(() => events.filter(event => event.EventName === "HeraldKill"), [events]);
  const totalHeraldKills = heraldKills.length;

  // Get atakhan kills count
  const atakhanKills = useMemo(() => events.filter(event => event.EventName === "AtakhanKill"), [events]);
  const totalAtakhanKills = atakhanKills.length;

  const borderStyle = "border-2 border-zinc-600/50";

  // Keyboard controls for dragon type switching and reset
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent): void => {
      // Reset dragon timer on R key press (only when dragon type is locked)
      if (event.key.toLowerCase() === "r" && dragonTypeLocked) {
        // Reset dragon type lock to allow timer to appear again
        setDragonTypeLocked(false);
        return;
      }

      if (dragonTypeLocked) return;

      switch (event.key.toLowerCase()) {
        case "1":
          setCurrentDragonType("chemtech");
          break;
        case "2":
          setCurrentDragonType("cloud");
          break;
        case "3":
          setCurrentDragonType("hextech");
          break;
        case "4":
          setCurrentDragonType("infernal");
          break;
        case "5":
          setCurrentDragonType("mountain");
          break;
        case "6":
          setCurrentDragonType("ocean");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [dragonTypeLocked]);

  // Handle dragon type locking after 3rd dragon kill
  useEffect(() => {
    if (totalDragonKills >= 3 && !dragonTypeLocked) {
      setDragonTypeLocked(true);
    }
  }, [totalDragonKills, dragonTypeLocked]);

  // Calculate objective states
  const calculateObjectives = useCallback((): ObjectiveState[] => {
    const objectivesList: ObjectiveState[] = [];

    // Dragon logic (spawn at 5:00, respawn every 5 minutes, elder after 4th kill)
    const dragonConfig = OBJECTIVE_CONFIGS.dragon;
    const dragonSpawnTime = 300; // 5:00
    const firstDragonTimerStart = 150; // 2:30 - special case for first dragon
    
    // Determine if we should show elder dragon (after 4th dragon kill)
    const shouldShowElder = totalDragonKills >= 4;
    const elderConfig = OBJECTIVE_CONFIGS.elder;

    if (shouldShowElder) {
      // Show elder dragon respawn timer
      const lastDragonKill = dragonKills[dragonKills.length - 1];
      const lastDragonKillTime = lastDragonKill?.EventTime || 0;
      const elderRespawnTime = lastDragonKillTime + elderConfig.respawnTime;
      const elderTimeRemaining = elderRespawnTime - gameTime;
      
      if (elderTimeRemaining > 0) {
        objectivesList.push({
          id: "elder",
          name: "Elder Dragon",
          icon: getDragonPitAsset(gameVersion, "elder.png"),
          spawnTime: elderRespawnTime,
          respawnTime: elderConfig.respawnTime,
          isActive: elderTimeRemaining <= elderConfig.activeThreshold,
          isSpawned: false,
          timeRemaining: elderTimeRemaining,
          dragonType: "elder",
          objectiveType: "elder"
        });
      } else {
        objectivesList.push({
          id: "elder",
          name: "Elder Dragon",
          icon: getDragonPitAsset(gameVersion, "elder.png"),
          spawnTime: elderRespawnTime,
          respawnTime: elderConfig.respawnTime,
          isActive: false,
          isSpawned: true,
          timeRemaining: 0,
          dragonType: "elder",
          objectiveType: "elder"
        });
      }
    } else {
      // Show regular dragon
      let dragonTimeRemaining = 0;
      let dragonIsSpawned = false;
      
      if (totalDragonKills === 0) {
        // First dragon - timer starts at 2:30
        if (gameTime >= firstDragonTimerStart && gameTime < dragonSpawnTime) {
          dragonTimeRemaining = dragonSpawnTime - gameTime;
          dragonIsSpawned = false;
        } else if (gameTime >= dragonSpawnTime) {
          dragonTimeRemaining = 0;
          dragonIsSpawned = true;
        }
      } else {
        // Subsequent dragons - spawn 5 minutes after last kill
        const lastDragonKill = dragonKills[dragonKills.length - 1];
        const lastDragonKillTime = lastDragonKill?.EventTime || 0;
        const nextDragonSpawnTime = lastDragonKillTime + dragonConfig.respawnTime;
        
        if (gameTime < nextDragonSpawnTime) {
          dragonTimeRemaining = nextDragonSpawnTime - gameTime;
          dragonIsSpawned = false;
        } else {
          dragonTimeRemaining = 0;
          dragonIsSpawned = true;
        }
      }
      
      if (dragonTimeRemaining > 0 || dragonIsSpawned) {
        objectivesList.push({
          id: "dragon",
          name: "Dragon",
          icon: getDragonPitAsset(gameVersion, currentDragonType === "elder" ? "elder.png" : `${currentDragonType}.svg`),
          spawnTime: dragonSpawnTime,
          respawnTime: dragonConfig.respawnTime,
          isActive: dragonTimeRemaining <= dragonConfig.activeThreshold && dragonTimeRemaining > 0,
          isSpawned: dragonIsSpawned,
          timeRemaining: dragonTimeRemaining,
          dragonType: currentDragonType,
          objectiveType: "dragon"
        });
      }
    }

    // Voidgrubs logic (spawn at 8:00, die at 15:00, removed after 3 kills)
    const voidgrubConfig = OBJECTIVE_CONFIGS.voidgrubs;
    const voidgrubDeathTime = 900; // 15:00
    const voidgrubSpawnTime = 480; // 8:00
    // const voidgrubTimerStart = voidgrubSpawnTime - voidgrubConfig.timerStartOffset; // 3:00
    
    // Check if voidgrubs are still alive (not all 3 killed)
    const voidgrubsAlive = totalVoidgrubKills < 3;
    
    let voidgrubTimeRemaining = 0;
    let voidgrubIsSpawned = false;
    
    if (gameTime < voidgrubSpawnTime) {
      // Voidgrubs haven't spawned yet, show countdown timer
      voidgrubTimeRemaining = voidgrubSpawnTime - gameTime;
      voidgrubIsSpawned = false;
    } else if (voidgrubsAlive && gameTime < voidgrubDeathTime) {
      // Voidgrubs have spawned but not all killed, show icon only
      voidgrubTimeRemaining = 0;
      voidgrubIsSpawned = true;
    }
    
    if (voidgrubsAlive && gameTime < voidgrubDeathTime && (voidgrubTimeRemaining > 0 || voidgrubIsSpawned)) {
      objectivesList.push({
        id: "voidgrubs",
        name: "Voidgrubs",
        icon: getBaronPitAsset(gameVersion, "grubs.png"),
        spawnTime: voidgrubSpawnTime,
        respawnTime: voidgrubConfig.respawnTime,
        isActive: voidgrubTimeRemaining <= voidgrubConfig.activeThreshold && voidgrubTimeRemaining > 0,
        isSpawned: voidgrubIsSpawned,
        timeRemaining: voidgrubTimeRemaining,
        objectiveType: "voidgrubs"
      });
    }

    // Rift Herald logic (spawn 5 minutes after voidgrubs are slain, dies at 24:55)
    // Only start herald timer after voidgrubs are slain (all 3 killed)
    const heraldConfig = OBJECTIVE_CONFIGS.herald;
    const heraldDeathTimeForHerald = 1495; // 24:55
    const heraldSpawnTime = 900; // 15:00 (fallback)
    
    let heraldTimeRemaining = 0;
    let heraldIsSpawned = false;
    let heraldActualSpawnTime = 0;
    
    if (!voidgrubsAlive) {
      // Voidgrubs are slain, calculate herald spawn time
      if (totalVoidgrubKills > 0) {
        // Find the last voidgrub kill time
        const lastVoidgrubKill = voidgrubKills[voidgrubKills.length - 1];
        const lastVoidgrubKillTime = lastVoidgrubKill?.EventTime || 0;
        heraldActualSpawnTime = lastVoidgrubKillTime + heraldConfig.timerStartOffset; // 5 minutes after last voidgrub kill
      } else {
        // Fallback: use normal spawn time if no voidgrub kills detected
        heraldActualSpawnTime = heraldSpawnTime;
      }
      
      if (gameTime < heraldActualSpawnTime) {
        // Herald hasn't spawned yet, show countdown timer
        heraldTimeRemaining = heraldActualSpawnTime - gameTime;
        heraldIsSpawned = false;
      } else if (totalHeraldKills === 0 && gameTime < heraldDeathTimeForHerald) {
        // Herald has spawned but not killed, show icon only
        heraldTimeRemaining = 0;
        heraldIsSpawned = true;
      }
    }
    
    if (!voidgrubsAlive && gameTime < heraldDeathTimeForHerald && (heraldTimeRemaining > 0 || heraldIsSpawned)) {
      objectivesList.push({
        id: "herald",
        name: "Rift Herald",
        icon: getBaronPitAsset(gameVersion, "herald.png"),
        spawnTime: heraldActualSpawnTime,
        respawnTime: heraldConfig.respawnTime,
        isActive: heraldTimeRemaining <= heraldConfig.activeThreshold && heraldTimeRemaining > 0,
        isSpawned: heraldIsSpawned,
        timeRemaining: heraldTimeRemaining,
        objectiveType: "herald"
      });
    }

    // Atakhan logic (spawn at 20:00, only once)
    const atakhanConfig = OBJECTIVE_CONFIGS.atakhan;
    const atakhanSpawnTime = 1200; // 20:00
    const atakhanTimerStart = atakhanSpawnTime - atakhanConfig.timerStartOffset; // 15:00
    
    let atakhanTimeRemaining = 0;
    let atakhanIsSpawned = false;
    
    if (gameTime >= atakhanTimerStart && gameTime < atakhanSpawnTime) {
      // Atakhan countdown phase (15:00 to 20:00)
      atakhanTimeRemaining = atakhanSpawnTime - gameTime;
      atakhanIsSpawned = false;
    } else if (gameTime >= atakhanSpawnTime && totalAtakhanKills === 0) {
      // Atakhan has spawned but not killed, show icon only
      atakhanTimeRemaining = 0;
      atakhanIsSpawned = true;
    }
    
    if (totalAtakhanKills === 0 && (atakhanTimeRemaining > 0 || atakhanIsSpawned)) {
      objectivesList.push({
        id: "atakhan",
        name: "Atakhan",
        icon: getAtakhanAsset(gameVersion, "atakhan_ruinous.png"),
        spawnTime: atakhanSpawnTime,
        respawnTime: atakhanConfig.respawnTime,
        isActive: atakhanTimeRemaining <= atakhanConfig.activeThreshold && atakhanTimeRemaining > 0,
        isSpawned: atakhanIsSpawned,
        timeRemaining: atakhanTimeRemaining,
        objectiveType: "atakhan"
      });
    }

    // Baron Nashor logic (spawn at 25:00, respawn every 6 minutes)
    const baronConfig = OBJECTIVE_CONFIGS.baron;
    const baronSpawnTime = 1500; // 25:00
    const baronTimerStart = baronSpawnTime - baronConfig.timerStartOffset; // 20:00
    
    let baronTimeRemaining = 0;
    let baronIsSpawned = false;
    
    if (totalBaronKills === 0) {
      // Baron hasn't been killed yet
      if (gameTime >= baronTimerStart && gameTime < baronSpawnTime) {
        // Baron countdown phase (20:00 to 25:00)
        baronTimeRemaining = baronSpawnTime - gameTime;
        baronIsSpawned = false;
      } else if (gameTime >= baronSpawnTime) {
        // Baron has spawned but not killed, show icon only
        baronTimeRemaining = 0;
        baronIsSpawned = true;
      }
    } else {
      // Baron has been killed, show respawn timer
      const lastBaronKill = baronKills[baronKills.length - 1];
      const lastBaronKillTime = lastBaronKill?.EventTime || 0;
      const baronRespawnTime = lastBaronKillTime + baronConfig.respawnTime;
      const baronRespawnTimeRemaining = baronRespawnTime - gameTime;
      
      if (baronRespawnTimeRemaining > 0) {
        baronTimeRemaining = baronRespawnTimeRemaining;
        baronIsSpawned = false;
      } else {
        baronTimeRemaining = 0;
        baronIsSpawned = true;
      }
    }
    
    if (baronTimeRemaining > 0 || baronIsSpawned) {
      objectivesList.push({
        id: "baron",
        name: "Baron Nashor",
        icon: getBaronPitAsset(gameVersion, "baron.png"),
        spawnTime: baronSpawnTime,
        respawnTime: baronConfig.respawnTime,
        isActive: baronTimeRemaining <= baronConfig.activeThreshold && baronTimeRemaining > 0,
        isSpawned: baronIsSpawned,
        timeRemaining: baronTimeRemaining,
        objectiveType: "baron"
      });
    }

    return objectivesList.slice(0, 3); // Maximum 3 objectives
  }, [gameTime, totalDragonKills, totalBaronKills, totalVoidgrubKills, totalHeraldKills, totalAtakhanKills, currentDragonType, gameVersion, dragonKills, baronKills, voidgrubKills]);

  useEffect(() => {
    setObjectives(calculateObjectives());
  }, [calculateObjectives]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getObjectiveBackgroundColor = (objective: ObjectiveType): string => {
    switch (objective) {
      case "dragon":
        if (currentDragonType === "chemtech") return "rgb(54, 78, 15)";
        if (currentDragonType === "cloud") return "rgb(46, 70, 87)";
        if (currentDragonType === "hextech") return "rgb(27, 71, 84)";
        if (currentDragonType === "infernal") return "rgb(85, 46, 22)";
        if (currentDragonType === "mountain") return "rgb(78, 57, 36)";
        if (currentDragonType === "ocean") return "rgb(42, 81, 75)";
        if (currentDragonType === "elder") return "bg-green-600";
        return "bg-gray-600";
      case "elder":
        return "bg-yellow-600";
      case "voidgrubs":
      case "herald":
      case "baron":
        return "rgb(48, 34, 87)";
      case "atakhan":
        return "rgb(128, 31, 29)";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="absolute top-2 left-2 flex flex-row gap-2 z-10">
      <AnimatePresence>
        {objectives.map((objective) => (
          <motion.div
            key={objective.id}
            initial={{ opacity: 0, x: -20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.8 }}
            className={`flex items-center p-2 ${borderStyle} ${getObjectiveBackgroundColor(objective.objectiveType)} shadow-lg`}
            style={{ backgroundColor: getObjectiveBackgroundColor(objective.objectiveType) }}
          >
            <motion.div 
              className="w-12 h-12 relative"
            >
              <Image
                src={objective.icon}
                alt={objective.name}
                width={48}
                height={48}
                className="rounded"
              />
            </motion.div>
            
            {!objective.isSpawned && (
              <motion.div
                key={objective.timeRemaining}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className={`text-white font-mono text-xl font-bold ml-3 ${
                  objective.isActive ? "text-red-200" : "text-white"
                }`}
              >
                {formatTime(objective.timeRemaining)}
              </motion.div>
            )}
            
            {objective.isSpawned && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ backgroundColor: "rgb(49, 35, 87)" }}
                className="font-mono text-lg font-bold"
              >
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export { ObjectiveTimers };
