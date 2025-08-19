import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {  ArrowLeft, Archive, Clock, DollarSign, Zap, Calculator, Globe, ChevronDown } from 'lucide-react';
import { Header } from './Header';
import Footer from './Footer';
import { useCurrency } from '../hooks/useCurrency';

const PricingPage: React.FC = () => {
  const [standardGB, setStandardGB] = useState(0);
  const [archiveGB, setArchiveGB] = useState(0);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  const {
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
  } = useCurrency();

  // Prevent scroll wheel from changing number input values
  const preventScroll = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  // Calculate standard storage cost
  const calculateStandardCost = (gb: number) => {
    let totalCost = 0;
    let remainingGB = gb;

    // First 10GB at $0.035/GB
    if (remainingGB > 0) {
      const firstTier = Math.min(remainingGB, 10);
      totalCost += firstTier * 0.035;
      remainingGB -= firstTier;
    }

    // Next 20GB at $0.033/GB
    if (remainingGB > 0) {
      const secondTier = Math.min(remainingGB, 20);
      totalCost += secondTier * 0.033;
      remainingGB -= secondTier;
    }

    // Remaining GB at $0.03/GB
    if (remainingGB > 0) {
      totalCost += remainingGB * 0.03;
    }

    return totalCost;
  };

  // Calculate archive storage cost
  const calculateArchiveCost = (gb: number) => {
    let totalCost = 0;
    let remainingGB = gb;

    // First 10GB at $0.0035/GB
    if (remainingGB > 0) {
      const firstTier = Math.min(remainingGB, 10);
      totalCost += firstTier * 0.0035;
      remainingGB -= firstTier;
    }

    // Next 20GB at $0.0033/GB
    if (remainingGB > 0) {
      const secondTier = Math.min(remainingGB, 20);
      totalCost += secondTier * 0.0033;
      remainingGB -= secondTier;
    }

    // Remaining GB at $0.003/GB
    if (remainingGB > 0) {
      totalCost += remainingGB * 0.003;
    }

    return totalCost;
  };

  const standardCost = calculateStandardCost(standardGB);
  const archiveCost = calculateArchiveCost(archiveGB);
  const archiveRetrievalCost = archiveGB * 0.1 * 0.0025; // 10% of archive GB * $0.0025/GB
  const totalCost = standardCost + archiveCost + archiveRetrievalCost;

  // Convert currency when currency changes or when user enters values
  useEffect(() => {
    if (selectedCurrency !== 'usd' && !exchangeRate && !loading) {
      // Convert a sample amount to get the exchange rate
      convertCurrency(1);
    }
  }, [selectedCurrency, exchangeRate, loading]);

  // Handle currency selection
  const handleCurrencyChange = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    setShowCurrencyDropdown(false);
    setCurrencySearch('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.currency-dropdown')) {
        setShowCurrencyDropdown(false);
        setCurrencySearch('');
      }
    };

    if (showCurrencyDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCurrencyDropdown]);

  const currencyOptions = getCurrencyOptions();
  const currentCurrencyInfo = currencies[selectedCurrency];
  
  // Filter currencies based on search
  const filteredCurrencyOptions = currencyOptions.filter(option =>
    option.label.toLowerCase().includes(currencySearch.toLowerCase()) ||
    option.value.toLowerCase().includes(currencySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`
        .grid-background {
          position: relative;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
          background-size: 50px 50px;
          background-attachment: fixed;
        }
        
        .grid-background::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100px;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);
          pointer-events: none;
          z-index: 1;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        input[type="number"] {
          -moz-appearance: textfield;
        }
        
        /* Disable scroll wheel on number inputs */
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        /* Prevent scroll wheel from changing number input values */
        input[type="number"]:focus {
          outline: none;
        }
        
        /* Disable scroll wheel events on number inputs */
        input[type="number"] {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>
      <Header />
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        
        <div className="relative z-10 container mx-auto px-6 py-12 mt-14">
          <div className="flex items-center justify-between mb-12">
            <Link
              to="/home"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Regular Storage Pricing */}
      <section className="py-16 bg-gradient-to-b from-black to-gray-900 grid-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-4">
              <Zap className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Active Storage</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-white">
              Instant Access Storage
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Fast, real-time access to all your files with full AI search capabilities
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg shadow-black/20">
              {/* Currency Selector */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Storage Cost Calculator</h3>
                </div>
                
                {/* Currency Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                    className="currency-dropdown flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
                  >
                    <span>{currentCurrencyInfo?.symbol} {currentCurrencyInfo?.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showCurrencyDropdown && (
                    <div className="currency-dropdown absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-black/90 backdrop-blur-md border border-white/30 rounded-lg shadow-lg z-50">
                      <div className="p-2">
                        <input
                          type="text"
                          placeholder="Search currencies..."
                          value={currencySearch}
                          onChange={(e) => setCurrencySearch(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 mb-2"
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setShowCurrencyDropdown(false);
                          }}
                        />
                        <div className="space-y-1 max-h-80 overflow-y-auto">
                          {filteredCurrencyOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleCurrencyChange(option.value)}
                              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                                selectedCurrency === option.value
                                  ? 'bg-white/20 text-white'
                                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Detection Info */}
              {locationData && (
                <div className="mb-6 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Globe className="w-4 h-4" />
                    <span>
                      Detected location: {locationData.country_name} 
                      {locationData.currency && currencies[locationData.currency.toLowerCase()] && (
                        <span className="ml-2">
                          (Currency: {currencies[locationData.currency.toLowerCase()].symbol} {currencies[locationData.currency.toLowerCase()].name})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Standard Storage Input */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-white">Standard Storage</h4>
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">GB Amount</label>
                    <input
                      type="number"
                      value={standardGB === 0 ? '' : standardGB}
                      onChange={(e) => setStandardGB(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
                      onWheel={preventScroll}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/40 transition-colors"
                      placeholder="Enter GB"
                      min="0"
                    />
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {loading ? (
                          <span className="text-gray-400">Loading...</span>
                        ) : standardCost > 0 ? (
                          getFormattedPrice(standardCost)
                        ) : (
                          `${currentCurrencyInfo?.symbol || '$'}0.0000`
                        )}
                      </div>
                      <div className="text-gray-400 text-sm">per month</div>
                    </div>
                  </div>
                </div>

                {/* Archive Storage Input */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <Archive className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-white">Archive Storage</h4>
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">GB Amount</label>
                    <input
                      type="number"
                      value={archiveGB === 0 ? '' : archiveGB}
                      onChange={(e) => setArchiveGB(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
                      onWheel={preventScroll}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/40 transition-colors"
                      placeholder="Enter GB"
                      min="0"
                    />
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {loading ? (
                          <span className="text-gray-400">Loading...</span>
                        ) : archiveCost > 0 ? (
                          getFormattedPrice(archiveCost)
                        ) : (
                          `${currentCurrencyInfo?.symbol || '$'}0.0000`
                        )}
                      </div>
                      <div className="text-gray-400 text-sm">per month</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Archive Storage Explanation */}
              <div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                    <Archive className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">What is Archive Storage?</h4>
                    <p className="text-gray-300 leading-relaxed">
                      Archive storage is a cost-effective option for long-term data storage. Everything you upload can be archived, 
                      which costs <span className="text-white font-semibold">10x less</span> than standard storage. However, archived data 
                      cannot be accessed immediately. You need to make a request, and after <span className="text-white font-semibold">2 days</span>, 
                      you'll be able to view your archived data. Perfect for backup files, old photos, and data you don't need frequent access to.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Summary */}
              <div className="mt-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-white">Cost Summary</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-2">
                      {loading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (standardCost + archiveCost) > 0 ? (
                        getFormattedPrice(standardCost + archiveCost)
                      ) : (
                        `${currentCurrencyInfo?.symbol || '$'}0.0000`
                      )}
                    </div>
                    <div className="text-gray-400">storage cost per month</div>
                  </div>
                  
                  {archiveGB > 0 && (
                    <div className="text-center">
                      <div className="text-sm text-gray-300 mb-2">If you retrieve 10% of archive data then:</div>
                      <div className="text-lg font-semibold text-white mb-1">
                        Retrieval cost: {loading ? (
                          <span className="text-gray-400">Loading...</span>
                        ) : (
                          getFormattedPrice(archiveRetrievalCost)
                        )}
                      </div>
                      <div className="text-xl font-bold text-white">
                        Total: {loading ? (
                          <span className="text-gray-400">Loading...</span>
                        ) : (
                          getFormattedPrice(totalCost)
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Tiers */}
              <div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Pricing Tiers</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Standard Storage
                    </h5>
                                         <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-gray-300">0-10GB</span>
                         <span className="text-white">
                           {selectedCurrency === 'usd' ? '$0.035' : 
                             exchangeRate ? `${currentCurrencyInfo?.symbol || ''}${(0.035 * exchangeRate.rate).toFixed(4)}` : 
                             `${currentCurrencyInfo?.symbol || '$'}0.035`}/GB
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-300">10-30GB</span>
                         <span className="text-white">
                           {selectedCurrency === 'usd' ? '$0.033' : 
                             exchangeRate ? `${currentCurrencyInfo?.symbol || ''}${(0.033 * exchangeRate.rate).toFixed(4)}` : 
                             `${currentCurrencyInfo?.symbol || '$'}0.033`}/GB
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-300">30GB+</span>
                         <span className="text-white">
                           {selectedCurrency === 'usd' ? '$0.03' : 
                             exchangeRate ? `${currentCurrencyInfo?.symbol || ''}${(0.03 * exchangeRate.rate).toFixed(4)}` : 
                             `${currentCurrencyInfo?.symbol || '$'}0.03`}/GB
                         </span>
                       </div>
                     </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Archive className="w-4 h-4" />
                      Archive Storage
                    </h5>
                                         <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-gray-300">0-10GB</span>
                         <span className="text-white">
                           {selectedCurrency === 'usd' ? '$0.0035' : 
                             exchangeRate ? `${currentCurrencyInfo?.symbol || ''}${(0.0035 * exchangeRate.rate).toFixed(4)}` : 
                             `${currentCurrencyInfo?.symbol || '$'}0.0035`}/GB
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-300">10-30GB</span>
                         <span className="text-white">
                           {selectedCurrency === 'usd' ? '$0.0033' : 
                             exchangeRate ? `${currentCurrencyInfo?.symbol || ''}${(0.0033 * exchangeRate.rate).toFixed(4)}` : 
                             `${currentCurrencyInfo?.symbol || '$'}0.0033`}/GB
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-300">30GB+</span>
                         <span className="text-white">
                           {selectedCurrency === 'usd' ? '$0.003' : 
                             exchangeRate ? `${currentCurrencyInfo?.symbol || ''}${(0.003 * exchangeRate.rate).toFixed(4)}` : 
                             `${currentCurrencyInfo?.symbol || '$'}0.003`}/GB
                         </span>
                       </div>
                       <div className="border-t border-white/10 my-2"></div>
                       <div className="flex justify-between">
                         <span className="text-gray-300">Retrieval Cost</span>
                         <span className="text-white">
                           {selectedCurrency === 'usd' ? '$0.0025' : 
                             exchangeRate ? `${currentCurrencyInfo?.symbol || ''}${(0.0025 * exchangeRate.rate).toFixed(4)}` : 
                             `${currentCurrencyInfo?.symbol || '$'}0.0025`}/GB
                         </span>
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credit System Section */}
      <section className="py-16 bg-black grid-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-white">
            Credit-Based Pay As You Go
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Add credits to your account and your usage will be deducted from your available balance. 
            Only pay for what you actually use with our flexible credit system.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg shadow-black/20">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Add Credits</h3>
              <p className="text-gray-400 text-sm">Purchase credits anytime and add them to your account balance</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg shadow-black/20">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Automatic Deduction</h3>
              <p className="text-gray-400 text-sm">Your usage is automatically deducted from your available credits</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg shadow-black/20">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Pay As You Go</h3>
              <p className="text-gray-400 text-sm">No monthly commitments, only pay for what you actually use</p>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default PricingPage;
