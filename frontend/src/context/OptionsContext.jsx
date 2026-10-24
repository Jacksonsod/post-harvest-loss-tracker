import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const OptionsContext = createContext({
  districts: [],
  crops: [],
  seasons: ['A', 'B', 'C'],
  loading: true,
  error: null,
  refetch: () => {},
});

export function OptionsProvider({ children }) {
  const [options, setOptions] = useState({
    districts: [
      "Bugesera", "Burera", "Gakenke", "Gasabo", "Gatsibo", "Gicumbi", "Gisagara", "Huye",
      "Kamonyi", "Karongi", "Kayonza", "Kicukiro", "Kirehe", "Muhanga", "Musanze", "Ngoma",
      "Ngororero", "Nyabihu", "Nyagatare", "Nyamagabe", "Nyamasheke", "Nyanza", "Nyarugenge",
      "Nyaruguru", "Rubavu", "Ruhango", "Rulindo", "Rusizi", "Rutsiro", "Rwamagana"
    ],
    crops: [
      "Maize", "Irish potato", "Paddy rice", "Climbing bean", "Bush bean", "Cassava",
      "Cooking banana", "Dessert banana", "Banana for beer", "Sorghum", "Soybean", "Sweet potato",
      "Vegetables", "Fruits", "Pea", "Wheat", "Other cereals", "Other crops", "Fodder crops"
    ],
    seasons: ['A', 'B', 'C'],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOptions();
      if (data && data.districts && data.crops) {
        setOptions({
          districts: data.districts,
          crops: data.crops,
          seasons: data.seasons || ['A', 'B', 'C'],
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load options from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  return (
    <OptionsContext.Provider
      value={{
        districts: options.districts,
        crops: options.crops,
        seasons: options.seasons,
        loading,
        error,
        refetch: fetchOptions,
      }}
    >
      {children}
    </OptionsContext.Provider>
  );
}

export function useOptions() {
  const context = useContext(OptionsContext);
  if (!context) {
    throw new Error('useOptions must be used within an OptionsProvider');
  }
  return context;
}
