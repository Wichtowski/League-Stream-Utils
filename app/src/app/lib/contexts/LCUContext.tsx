'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LCUConnector } from '@lib/services/lcu-connector';
import { storage } from '@lib/utils/storage';

import type { ChampSelectSession } from '@lib/types';

import { LCUData, LCUChampSelectSession } from '../types/electron';
import { MOCK_CHAMP_SELECT_DATA } from '@lib/mocks/champselect';

interface LCUContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  isInitialized: boolean;
  
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  
  // Champion select data
  champSelectSession: ChampSelectSession | null;
  
  // Settings
  autoReconnect: boolean;
  setAutoReconnect: (enabled: boolean) => void;
  
  // Status
  lastConnectedAt: Date | null;
  connectionAttempts: number;
}

const LCUContext = createContext<LCUContextType | undefined>(undefined);

const LCU_SETTINGS_KEY = 'lcu-settings';
const LCU_CONNECTION_KEY = 'lcu-connection-state';

interface LCUSettings {
  autoReconnect: boolean;
  lastConnectedAt: Date | null;
}

export function LCUProvider({ children }: { children: ReactNode }) {
  // Check if we're in Electron environment without depending on the context
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;
  
  // Get mock data state directly from localStorage to avoid circular dependency
  const [useMockData] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('useMockData');
      return stored === 'true';
    }
    return false;
  });
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [champSelectSession, setChampSelectSession] = useState<ChampSelectSession | null>(null);
  const [lcuNotFound, setLcuNotFound] = useState(false);
  
  // Settings
  const [autoReconnect, setAutoReconnectState] = useState(true);
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  // LCU Connector instance
  const [lcuConnector] = useState(() => new LCUConnector({
    autoReconnect: false, // We'll handle auto-reconnect at this level
    maxReconnectAttempts: 5,
    pollInterval: 1000
  }));

  // Function to update Electron with LCU data
  const updateElectronLCUData = useCallback(async (data: Partial<LCUData>) => {
    if (isElectron && window.electronAPI?.updateLCUData) {
      try {
        await window.electronAPI.updateLCUData(data);
      } catch (error) {
        console.error('Failed to update Electron LCU data:', error);
      }
    }
  }, [isElectron]);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await storage.get<LCUSettings>(LCU_SETTINGS_KEY);
        if (settings) {
          setAutoReconnectState(settings.autoReconnect);
          setLastConnectedAt(settings.lastConnectedAt ? new Date(settings.lastConnectedAt) : null);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load LCU settings:', error);
        setIsInitialized(true);
      }
    };

    loadSettings();
  }, []);

  // Track if we should auto-connect
  const [shouldAutoConnect, setShouldAutoConnect] = useState(false);

  // Check auto-connect state on initialization
  useEffect(() => {
    if (!isInitialized) return;

    const checkAutoConnect = async () => {
      try {
        const connectionState = await storage.get<{ wasConnected: boolean }>(LCU_CONNECTION_KEY);
        if (connectionState?.wasConnected && autoReconnect && !isConnected && !isConnecting) {
          setShouldAutoConnect(true);
        }
      } catch (error) {
        console.error('Failed to check auto-connect state:', error);
      }
    };

    checkAutoConnect();
  }, [isInitialized, autoReconnect, isConnected, isConnecting]);

  // Save settings when they change
  const saveSettings = useCallback(async () => {
    const settings: LCUSettings = {
      autoReconnect,
      lastConnectedAt
    };
    await storage.set(LCU_SETTINGS_KEY, settings);
  }, [autoReconnect, lastConnectedAt]);

  useEffect(() => {
    saveSettings();
  }, [saveSettings]);

  // Setup LCU connector event handlers
  useEffect(() => {
    lcuConnector.setOnStatusChange((status) => {
      setIsConnecting(status === 'connecting');
      setIsConnected(status === 'connected');
      
      // Update Electron with connection status
      updateElectronLCUData({
        isConnected: status === 'connected',
        isConnecting: status === 'connecting',
        connectionError: status === 'error' ? connectionError : null,
        useMockData: useMockData
      });
      
      if (status === 'connected') {
        setConnectionError(null);
        setLastConnectedAt(new Date());
        setConnectionAttempts(0);
        storage.set(LCU_CONNECTION_KEY, { wasConnected: true });
      } else if (status === 'error') {
        setConnectionAttempts(prev => prev + 1);
        storage.set(LCU_CONNECTION_KEY, { wasConnected: false });
      } else if (status === 'disconnected') {
        storage.set(LCU_CONNECTION_KEY, { wasConnected: false });
      }
    });

    lcuConnector.setOnChampSelectUpdate((data) => {
      setChampSelectSession(data);
      
      // Update Electron with champion select data
      updateElectronLCUData({
        champSelectSession: data as LCUChampSelectSession | null,
        useMockData: useMockData
      });
    });

    lcuConnector.setOnError((error) => {
      setConnectionError(error);
      setConnectionAttempts(prev => prev + 1);
      
      // Update Electron with error
      updateElectronLCUData({
        connectionError: error
      });
    });

  }, [lcuConnector, updateElectronLCUData, connectionError, useMockData]);

  // Handle mock data toggle
  useEffect(() => {
    if (useMockData) {
      // When mock data is enabled, provide static mock champion select data
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      setChampSelectSession(MOCK_CHAMP_SELECT_DATA as ChampSelectSession);
      
      // Update Electron with mock data
      updateElectronLCUData({
        isConnected: true,
        isConnecting: false,
        connectionError: null,
        champSelectSession: MOCK_CHAMP_SELECT_DATA as unknown as LCUChampSelectSession,
        useMockData: true
      });
    } else {
      // When mock data is disabled, try to connect to real LCU first
      // Don't clear champSelectSession immediately to avoid flickering
      setIsConnected(false);
      setIsConnecting(true);
      setConnectionError(null);
      
      // Update Electron with connection attempt
      updateElectronLCUData({
        isConnected: false,
        isConnecting: true,
        connectionError: null,
        useMockData: false
      });
      
      // Try to connect to real LCU
      setTimeout(() => {
        lcuConnector.connect().catch((error) => {
          console.error('Failed to connect to LCU after disabling mock data:', error);
          // If connection fails, clear the mock data
          setChampSelectSession(null);
          setIsConnecting(false);
          updateElectronLCUData({
            isConnected: false,
            isConnecting: false,
            connectionError: error instanceof Error ? error.message : 'Connection failed',
            champSelectSession: null,
            useMockData: false
          });
        });
      }, 100);
    }
  }, [useMockData, updateElectronLCUData, lcuConnector]);

  const connect = useCallback(async () => {
    try {
      setConnectionError(null);
      try {
        await lcuConnector.connect();
      } catch (error: unknown) {
        if (
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof (error as { message?: string }).message === 'string' &&
          ((error as { message: string }).message.toLowerCase().includes('not found') ||
            (error as { message: string }).message.toLowerCase().includes('404'))
        ) {
          setLcuNotFound(true);
          return;
        } else {
          throw error;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to League Client';
      setConnectionError(errorMessage);
      console.error('LCU connection failed:', error);
    }
  }, [lcuConnector]);

  // Perform auto-connect when needed
  useEffect(() => {
    if (shouldAutoConnect && !isConnected && !isConnecting) {
      setShouldAutoConnect(false);
      // Delay auto-connect to avoid blocking initial render
      setTimeout(() => {
        connect();
      }, 1000);
    }
  }, [shouldAutoConnect, isConnected, isConnecting, connect]);

  // Auto-reconnect logic for connection failures
  useEffect(() => {
    if (!isConnected && !isConnecting && autoReconnect && connectionAttempts > 0 && connectionAttempts < 5) {
      const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 10000);
      const timeoutId = setTimeout(() => {
        connect();
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, isConnecting, autoReconnect, connectionAttempts, connect]);

  const disconnect = useCallback(() => {
    lcuConnector.disconnect();
    setChampSelectSession(null);
    setConnectionAttempts(0);
  }, [lcuConnector]);

  const reconnect = useCallback(async () => {
    disconnect();
    // Small delay to ensure clean disconnect
    setTimeout(() => connect(), 500);
  }, [disconnect, connect]);

  const setAutoReconnect = useCallback((enabled: boolean) => {
    setAutoReconnectState(enabled);
  }, []);

  const value: LCUContextType = {
    isConnected,
    isConnecting,
    connectionError,
    isInitialized,
    connect,
    disconnect,
    reconnect,
    champSelectSession,
    autoReconnect,
    setAutoReconnect,
    lastConnectedAt,
    connectionAttempts
  };

  return (
    <LCUContext.Provider value={value}>
      {lcuNotFound ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#f87171' }}>
          <h2>League Client Not Found</h2>
          <p>The League Client is not running or could not be found. Please start the League Client and try again.</p>
        </div>
      ) : (
        children
      )}
    </LCUContext.Provider>
  );
}

export function useLCU(): LCUContextType {
  const context = useContext(LCUContext);
  if (context === undefined) {
    throw new Error('useLCU must be used within an LCUProvider');
  }
  return context;
} 