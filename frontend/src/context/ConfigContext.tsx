import React, { createContext, useContext, useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import { fetchSettings, updateSettings as apiUpdateSettings } from '../services/api';

interface ConfigContextType {
  settings: SystemSettings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  getConfidenceLevel: (score?: number | null) => 'high' | 'medium' | 'low';
}

const DEFAULT_SETTINGS: SystemSettings = {
  app_name: 'MedLens',
  tagline: 'AI-Powered Clinical Information Intelligence',
  theme_color: '#0d9488',
  confidence_threshold_high: 0.90,
  confidence_threshold_medium: 0.70,
  supported_file_types: ['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.json', '.csv'],
  ai_summary_instructions:
    "Describe available findings concisely using cautious language ('The report states...'). " +
    "Never diagnose, prescribe, recommend dosage changes, or invent missing information.",
  feature_toggles: {
    patient_intake: true,
    report_upload: true,
    ai_summary: true,
    conflict_detection: true,
    comparison: true,
    timeline: true,
    export: true,
    side_by_side: true,
  },
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchSettings();
        setSettings(data);
      } catch (err) {
        // Fallback to defaults
      }
    };
    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    setIsLoading(true);
    try {
      const updated = await apiUpdateSettings(newSettings);
      setSettings(updated);
    } catch (err) {
      setSettings({ ...settings, ...newSettings });
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceLevel = (score?: number | null): 'high' | 'medium' | 'low' => {
    if (score === null || score === undefined) return 'low';
    if (score >= settings.confidence_threshold_high) return 'high';
    if (score >= settings.confidence_threshold_medium) return 'medium';
    return 'low';
  };

  return (
    <ConfigContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        getConfidenceLevel,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
