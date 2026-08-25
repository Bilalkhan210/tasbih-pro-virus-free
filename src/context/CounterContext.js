import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useRef,
  useState,
} from 'react';
import { DEFAULT_COUNTER, PRESET_COUNTERS } from '../constants/counters';
import {
  loadCountersState,
  saveCountersState,
} from '../storage/tasbihProStorage';

const CounterContext = createContext(null);

export const CounterProvider = ({ children }) => {
  const [customCounters, setCustomCounters] = useState([]);
  const [presetOverrides, setPresetOverrides] = useState({});
  const [hiddenPresetIds, setHiddenPresetIds] = useState([]);
  const [activeCounter, setActiveCounter] = useState(DEFAULT_COUNTER);
  const hasHydratedRef = useRef(false);
  const persistTimerRef = useRef(null);

  const selectCounter = useCallback((counter) => {
    setActiveCounter(counter);
  }, []);

  const resolveCounterById = useCallback(
    (id, loadedCustomCounters, loadedPresetOverrides) => {
      if (!id) return DEFAULT_COUNTER;

      const preset = PRESET_COUNTERS.find((c) => c.id === id);
      if (preset) {
        return {
          ...preset,
          ...(loadedPresetOverrides?.[id] || {}),
          isPreset: true,
        };
      }

      const custom = (loadedCustomCounters || []).find((c) => c.id === id);
      if (custom) return custom;

      return DEFAULT_COUNTER;
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const saved = await loadCountersState();
      if (!saved || cancelled) return;

      const loadedCustomCounters = Array.isArray(saved.customCounters)
        ? saved.customCounters
        : [];
      const loadedPresetOverrides =
        saved.presetOverrides && typeof saved.presetOverrides === 'object'
          ? saved.presetOverrides
          : {};
      const loadedHiddenPresetIds = Array.isArray(saved.hiddenPresetIds)
        ? saved.hiddenPresetIds
        : [];

      setCustomCounters(loadedCustomCounters);
      setPresetOverrides(loadedPresetOverrides);
      setHiddenPresetIds(loadedHiddenPresetIds);

      setActiveCounter(
        resolveCounterById(
          saved.activeCounterId,
          loadedCustomCounters,
          loadedPresetOverrides,
        ),
      );
    };

    hydrate().finally(() => {
      if (!cancelled) hasHydratedRef.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [resolveCounterById]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;

    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = setTimeout(() => {
      saveCountersState({
        customCounters,
        presetOverrides,
        hiddenPresetIds,
        activeCounterId: activeCounter?.id,
      });
    }, 700);

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, [activeCounter, customCounters, hiddenPresetIds, presetOverrides]);

  const addCustomCounter = useCallback(({ label, target, initialCount = 0, arabic = '' }) => {
    const counter = {
      id: `custom-${Date.now()}`,
      label: label.trim(),
      arabic: arabic.trim(),
      target,
      initialCount,
      isCustom: true,
    };
    setCustomCounters((prev) => [...prev, counter]);
    setActiveCounter(counter);
    return counter;
  }, []);

  const isPresetCounter = useCallback((id) => {
    return PRESET_COUNTERS.some((counter) => counter.id === id);
  }, []);

  const updateCounter = useCallback((id, { label, target, initialCount = 0, arabic = '' }) => {
    const updates = {
      label: label.trim(),
      arabic: arabic.trim(),
      target,
      initialCount,
    };

    if (isPresetCounter(id)) {
      setPresetOverrides((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...updates },
      }));
    } else {
      setCustomCounters((prev) =>
        prev.map((counter) =>
          counter.id === id ? { ...counter, ...updates } : counter,
        ),
      );
    }

    setActiveCounter((prev) =>
      prev.id === id ? { ...prev, ...updates } : prev,
    );
  }, [isPresetCounter]);

  const deleteCounter = useCallback((id) => {
    if (isPresetCounter(id)) {
      setHiddenPresetIds((prev) => [...prev, id]);
      setPresetOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      setCustomCounters((prev) => prev.filter((counter) => counter.id !== id));
    }

    setActiveCounter((prev) => (prev.id === id ? DEFAULT_COUNTER : prev));
  }, [isPresetCounter]);

  const allCounters = useMemo(() => {
    const visiblePresets = PRESET_COUNTERS.filter(
      (counter) => !hiddenPresetIds.includes(counter.id),
    ).map((counter) => ({
      ...counter,
      ...presetOverrides[counter.id],
      isPreset: true,
    }));

    return [...visiblePresets, ...customCounters];
  }, [customCounters, hiddenPresetIds, presetOverrides]);

  const value = useMemo(
    () => ({
      activeCounter,
      allCounters,
      customCounters,
      selectCounter,
      addCustomCounter,
      updateCounter,
      deleteCounter,
    }),
    [
      activeCounter,
      allCounters,
      customCounters,
      selectCounter,
      addCustomCounter,
      updateCounter,
      deleteCounter,
    ],
  );

  return (
    <CounterContext.Provider value={value}>{children}</CounterContext.Provider>
  );
};

export const useCounter = () => {
  const context = useContext(CounterContext);
  if (!context) {
    throw new Error('useCounter must be used within CounterProvider');
  }
  return context;
};
