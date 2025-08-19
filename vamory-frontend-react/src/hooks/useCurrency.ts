import { useState, useEffect } from 'react';
import { currencyAPI } from '../services/api';
import { currencies } from '../data/currencies';
import type { ExchangeRateResponse, LocationData } from '../types';

export const useCurrency = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('usd');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect user location and set default currency
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        setLocationData(data);
        
        // Set currency based on location
        if (data.currency && currencies[data.currency.toLowerCase()]) {
          setSelectedCurrency(data.currency.toLowerCase());
        }
      } catch (err) {
        console.error('Failed to detect location:', err);
        // Default to USD if location detection fails
        setSelectedCurrency('usd');
      }
    };

    detectLocation();
  }, []);

  // Convert USD amount to selected currency
  const convertCurrency = async (usdAmount: number) => {
    if (selectedCurrency === 'usd') {
      setExchangeRate(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await currencyAPI.getExchangeRate('USD', selectedCurrency.toUpperCase(), usdAmount);
      setExchangeRate(response);
    } catch (err) {
      console.error('Failed to convert currency:', err);
      setError('Failed to convert currency. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get formatted price in selected currency
  const getFormattedPrice = (usdAmount: number) => {
    if (selectedCurrency === 'usd') {
      return `$${usdAmount.toFixed(4)}`;
    }

    if (exchangeRate && exchangeRate.base_currency === 'USD' && exchangeRate.target_currency === selectedCurrency.toUpperCase()) {
      const currencyInfo = currencies[selectedCurrency];
      const symbol = currencyInfo?.symbol || selectedCurrency.toUpperCase();
      // Calculate the converted amount using the rate
      const convertedAmount = usdAmount * exchangeRate.rate;
      return `${symbol}${convertedAmount.toFixed(4)}`;
    }

    // If no exchange rate yet, show USD amount with correct currency symbol
    const currencyInfo = currencies[selectedCurrency];
    const symbol = currencyInfo?.symbol || selectedCurrency.toUpperCase();
    return `${symbol}${usdAmount.toFixed(4)}`;
  };

  // Get currency options for dropdown
  const getCurrencyOptions = () => {
    return Object.entries(currencies).map(([code, info]) => ({
      value: code,
      label: `${info.symbol} ${info.name} (${code.toUpperCase()})`
    })).sort((a, b) => a.label.localeCompare(b.label));
  };

  return {
    selectedCurrency,
    setSelectedCurrency,
    locationData,
    exchangeRate,
    loading,
    error,
    convertCurrency,
    getFormattedPrice,
    getCurrencyOptions,
    currencies
  };
};
