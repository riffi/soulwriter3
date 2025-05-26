import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Model {
  modelName: string;
}

interface ApiSettingsStore {
  // Global settings
  openRouterKey: string;
  incLuminApiKey: string;
  currentOpenRouterModel: string;

  // Models
  openRouterModels: Model[];

  // Actions for global settings
  setOpenRouterKey: (key: string) => void;
  setIncLuminApiKey: (key: string) => void;
  setCurrentOpenRouterModel: (model: string) => void;

  // Actions for models
  addModel: (modelName: string) => void;
  deleteModel: (modelName: string) => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useApiSettingsStore = create<ApiSettingsStore>()(
    persist(
        (set, get) => ({
          // Initial state
          openRouterKey: '',
          incLuminApiKey: '',
          currentOpenRouterModel: '',
          openRouterModels: [],
          isLoading: false,

          // Global settings actions
          setOpenRouterKey: (key) => set({ openRouterKey: key }),
          setIncLuminApiKey: (key) => set({ incLuminApiKey: key }),
          setCurrentOpenRouterModel: (model) => set({ currentOpenRouterModel: model }),

          // Models actions
          addModel: (modelName) => {
            const { openRouterModels } = get();
            const trimmedName = modelName.trim();

            if (trimmedName && !openRouterModels.some(m => m.modelName === trimmedName)) {
              set({
                openRouterModels: [...openRouterModels, { modelName: trimmedName }]
              });
            }
          },

          deleteModel: (modelName) => {
            const { openRouterModels, currentOpenRouterModel } = get();
            const updatedModels = openRouterModels.filter(m => m.modelName !== modelName);

            set({
              openRouterModels: updatedModels,
              // Reset current model if it was deleted
              currentOpenRouterModel: currentOpenRouterModel === modelName ? '' : currentOpenRouterModel
            });
          },

          // Loading state action
          setIsLoading: (loading) => set({ isLoading: loading }),
        }),
        {
          name: 'api-settings-storage',
        }
    )
);

// Helper function to get API key outside of React components
export const getIncLuminApiKey = (): string => {
  return useApiSettingsStore.getState().incLuminApiKey;
};

export const getOpenRouterKey = (): string => {
  return useApiSettingsStore.getState().openRouterKey;
};
