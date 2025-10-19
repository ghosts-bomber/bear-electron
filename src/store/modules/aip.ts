import { store } from "@/store";
import { defineStore } from "pinia";
import { ref } from "vue";
const STORAGE_KEY = "aip_infos";

// 从 localStorage 加载数据
const loadFromStorage = (): Map<string, any> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error("Failed to load AIP data from localStorage:", error);
  }
  return new Map<string, any>();
};

// 保存数据到 localStorage
const saveToStorage = (aipInfos: Map<string, any>) => {
  try {
    const data = Object.fromEntries(aipInfos);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save AIP data to localStorage:", error);
  }
};

export const useAipStore = defineStore("aip", () => {
  // 从 localStorage 初始化数据
  const aipInfos = ref(loadFromStorage());

  const addAipInfo = (code: string, info: any) => {
    aipInfos.value.set(code, info);
    saveToStorage(aipInfos.value);
    console.log(`AIP info added for code: ${code}`);
  };

  const getAipInfo = (code: string) => {
    const info = aipInfos.value.get(code);
    console.log(`AIP info retrieved for code: ${code}`, info ? "found" : "not found");
    return info || null;
  };

  const deleteAipInfo = (code: string) => {
    const deleted = aipInfos.value.delete(code);
    if (deleted) {
      saveToStorage(aipInfos.value);
      console.log(`AIP info deleted for code: ${code}`);
    }
    return deleted;
  };

  const clearAllAipInfo = () => {
    aipInfos.value.clear();
    saveToStorage(aipInfos.value);
    console.log("All AIP info cleared");
  };

  const getAllAipInfo = () => {
    return Array.from(aipInfos.value.entries());
  };

  const getAipCount = () => {
    return aipInfos.value.size;
  };

  return {
    addAipInfo,
    getAipInfo,
    deleteAipInfo,
    clearAllAipInfo,
    getAllAipInfo,
    getAipCount,
  };
});

export function useAipStoreHook() {
  return useAipStore(store);
}
