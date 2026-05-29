import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ShoppingBag,
  Tag,
  Truck,
  Sparkles,
  ExternalLink,
  History,
  TrendingDown,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingUp,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { ComparisonData, GroundingSource, HistoryItem } from "./types";

const SUGGESTIONS = [
  { name: "Sony WH-1000XM5", desc: "Noise cancelling headphones" },
  { name: "AirPods Pro 2", desc: "Active noise cancelling earbuds" },
  { name: "DJI Mini 4 Pro", desc: "Lightweight folding camera drone" },
  { name: "Patagonia Torrentshell 3L", desc: "Waterproof outdoor jacket" },
  { name: "Kindle Paperwhite", desc: "Lightweight warm-light e-reader" }
];

const LOADING_STAGES = [
  "Firing up Google Search Grounding engine...",
  "Scanning active global ecommerce sites...",
  "Fetching current prices and retailers...",
  "Parsing variations (colors, specs, batches)...",
  "Checking for shipping, fees, and thresholds...",
  "Checking for active coupon codes and discounts...",
  "Formatting side-by-side comparison tables...",
];

const PRODUCT_CATEGORY_IMAGES: { keywords: string[]; url: string }[] = [
  {
    keywords: ["headphone", "sony", "bose", "sennheiser", "audio", "earbud", "airpod", "sound", "music"],
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&h=400&q=85"
  },
  {
    keywords: ["watch", "apple watch", "fitbit", "garmin", "rolex", "time", "clock", "smartwatch"],
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&h=400&q=85"
  },
  {
    keywords: ["shoe", "sneaker", "nike", "adidas", "running", "boot", "footwear", "cleats", "heels", "vans"],
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&h=400&q=85"
  },
  {
    keywords: ["laptop", "macbook", "computer", "pc", "chromebook", "notebook", "desk"],
    url: "https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=400&h=400&q=85"
  },
  {
    keywords: ["phone", "iphone", "pixel", "samsung", "galaxy", "smartphone", "mobile"],
    url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&h=400&q=85"
  },
  {
    keywords: ["camera", "dslr", "lens", "nikon", "canon", "sony alpha", "photography", "photo"],
    url: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&h=400&q=85"
  },
  {
    keywords: ["drone", "dji", "quadcopter", "mavic"],
    url: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=400&h=400&q=85"
  },
  {
    keywords: ["jacket", "patagonia", "coat", "clothing", "sweater", "fleece", "hoodie", "apparel", "shirt"],
    url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=400&q=85"
  },
  {
    keywords: ["kindle", "paperwhite", "e-reader", "book", "reading", "novel"],
    url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&h=400&q=85"
  },
  {
    keywords: ["coffee", "maker", "mug", "espresso", "cup", "pot", "keurig", "breville", "coffee maker", "maker"],
    url: "https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?auto=format&fit=crop&w=400&h=400&q=85"
  },
  {
    keywords: ["backpack", "bag", "luggage", "pack", "duffel", "tote"],
    url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&h=400&q=85"
  },
  {
    keywords: ["keyboard", "mouse", "keychron", "logitech", "corsair"],
    url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&h=400&q=85"
  },
  {
    keywords: ["perfume", "fragrance", "scent", "cologne"],
    url: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=400&h=400&q=85"
  },
  {
    keywords: ["bottle", "flask", "hydro", "yeti", "thermos", "water"],
    url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=400&h=400&q=85"
  },
  {
    keywords: ["chair", "desk", "furniture", "table", "stool"],
    url: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=400&h=400&q=85"
  },
  {
    keywords: ["speaker", "alexa", "echo", "sonos", "jbl"],
    url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=400&h=400&q=85"
  }
];

function resolveProductImage(queryStr: string): string {
  const normalized = queryStr.toLowerCase();
  for (const category of PRODUCT_CATEGORY_IMAGES) {
    if (category.keywords.some(kw => normalized.includes(kw))) {
      return category.url;
    }
  }
  // Highly premium default minimalist placeholder using a stunning clean background object
  return `https://loremflickr.com/400/400/${encodeURIComponent(normalized.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, ",")) || "product"}`;
}

function resolveStoreOfferImage(offerImage: string | undefined, storeName: string, queryStr: string): string {
  if (offerImage && offerImage.startsWith("http")) {
    return offerImage;
  }
  
  const normalizedStore = storeName.toLowerCase();
  const normalizedQuery = queryStr.toLowerCase();

  // Highlight specific tags using loremflickr for amazing live photos
  const cleanedSearch = encodeURIComponent(normalizedQuery.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, ",")) || "gadget";
  return `https://loremflickr.com/160/160/${cleanedSearch},${normalizedStore}`;
}

function buildDirectSearchLink(storeUrl: string, storeName: string, queryStr: string): string {
  const lowercaseUrl = storeUrl.toLowerCase();
  const queryClean = queryStr.trim();
  const queryEncoded = encodeURIComponent(queryClean);
  const storeLower = storeName.toLowerCase();
  
  // Strip protocols and www for domain-only detection
  const cleanDomain = lowercaseUrl
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];
  
  // Decide if the URL provided by Gemini or input is just a generic homepage link.
  // If it lacks path directories, search fields, or unique product ID parameters, it's safe to upgrade it.
  const isGeneric = !lowercaseUrl.includes('?') && 
                    !lowercaseUrl.includes('&') && 
                    (lowercaseUrl.split('/').filter(Boolean).length <= 2 || 
                     lowercaseUrl.endsWith('/') || 
                     lowercaseUrl.includes('bestbuy.com/site'));

  if (isGeneric || !storeUrl.startsWith('http')) {
    if (storeLower.includes("amazon")) {
      return `https://www.amazon.com/s?k=${queryEncoded}`;
    } else if (storeLower.includes("walmart")) {
      return `https://www.walmart.com/search?q=${queryEncoded}`;
    } else if (storeLower.includes("best buy") || storeLower.includes("bestbuy")) {
      return `https://www.bestbuy.com/site/searchpage.jsp?st=${queryEncoded}`;
    } else if (storeLower.includes("ebay")) {
      return `https://www.ebay.com/sch/i.html?_nkw=${queryEncoded}`;
    } else if (storeLower.includes("target")) {
      return `https://www.target.com/s?searchTerm=${queryEncoded}`;
    } else if (storeLower.includes("home depot") || storeLower.includes("homedepot")) {
      return `https://www.homedepot.com/s/${queryEncoded}`;
    } else if (storeLower.includes("apple")) {
      return `https://www.apple.com/us/search/${queryEncoded}`;
    } else if (storeLower.includes("costco")) {
      return `https://www.costco.com/CatalogSearch?keyword=${queryEncoded}`;
    } else if (storeLower.includes("etsy")) {
      return `https://www.etsy.com/search?q=${queryEncoded}`;
    } else if (storeLower.includes("macy")) {
      return `https://www.macys.com/shop/featured/${queryEncoded}`;
    } else if (storeLower.includes("b&h") || storeLower.includes("bhphoto")) {
      return `https://www.bhphotovideo.com/c/search?Ntt=${queryEncoded}`;
    } else if (storeLower.includes("nordstrom")) {
      return `https://www.nordstrom.com/sr?keyword=${queryEncoded}`;
    } else if (storeLower.includes("newegg")) {
      return `https://www.newegg.com/p/pl?d=${queryEncoded}`;
    }
    
    // Fallback: search restricted specifically to that vendor's domain via Google Site search
    if (cleanDomain && (cleanDomain.includes('.') && cleanDomain.length > 4)) {
      return `https://www.google.com/search?q=${queryEncoded}+site%3A${cleanDomain}`;
    }
  }

  // If already a deep or non-generic url, ensure it has a proper protocol
  return storeUrl.startsWith("http") ? storeUrl : `https://${storeUrl}`;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(LOADING_STAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  
  // Search state
  const [result, setResult] = useState<ComparisonData | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Filter states
  const [filterType, setFilterType] = useState<"all" | "free-shipping" | "discounted">("all");
  const [sortBy, setSortBy] = useState<"default" | "low-to-high" | "high-to-low">("low-to-high");

  // Keep track of search loading stages
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("price_comparison_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage:", e);
    }
  }, []);

  // Save history helper
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem("price_comparison_history", JSON.stringify(newHistory));
  };

  // Run price comparison API
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    setSources([]);
    setIsQuotaExceeded(false);
    
    // Animate search stages
    let stageIndex = 0;
    setLoadingStage(LOADING_STAGES[0]);
    
    loadingIntervalRef.current = setInterval(() => {
      stageIndex = (stageIndex + 1) % LOADING_STAGES.length;
      setLoadingStage(LOADING_STAGES[stageIndex]);
    }, 2800);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemQuery: searchQuery }),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error || "Failed to retrieve comparisons.");
      }

      if (body.data) {
        setResult(body.data);
        setSources(body.sources || []);
        
        if (body.isQuotaExceeded) {
          setIsQuotaExceeded(true);
        }

        // Save to History (limit to 6 items)
        const updatedHistory: HistoryItem[] = [
          {
            id: String(Date.now()),
            query: searchQuery,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            data: body.data,
            sources: body.sources || [],
            isQuotaExceeded: !!body.isQuotaExceeded
          },
          ...history.filter(item => item.query.toLowerCase() !== searchQuery.toLowerCase())
        ].slice(0, 8);
        
        saveHistory(updatedHistory);
      } else {
        throw new Error("No comparison data was returned.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while searching.");
    } finally {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
      setLoading(false);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setResult(item.data);
    setSources(item.sources);
    setQuery(item.query);
    setError(null);
    setIsQuotaExceeded(!!item.isQuotaExceeded);
    // Reset filters
    setFilterType("all");
    setSortBy("low-to-high");
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const filtered = history.filter(item => item.id !== id);
    saveHistory(filtered);
  };

  const clearAllHistory = () => {
    saveHistory([]);
  };

  // Helper to parse price string into numbers for sorting
  const getNumericalPrice = (priceStr: string): number => {
    const cleaned = priceStr.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? Infinity : parsed;
  };

  // Process and filter/sort options
  const processedOffers = result ? [...result.offers].filter(offer => {
    if (filterType === "free-shipping") {
      const ship = offer.shippingInfo.toLowerCase();
      return ship.includes("free") || ship.includes("$0") || ship === "0";
    }
    if (filterType === "discounted") {
      const disc = offer.discountInfo?.toLowerCase() || "";
      return disc && disc !== "none" && disc !== "no" && disc !== "standard";
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "low-to-high") {
      return getNumericalPrice(a.price) - getNumericalPrice(b.price);
    }
    if (sortBy === "high-to-low") {
      return getNumericalPrice(b.price) - getNumericalPrice(a.price);
    }
    return 0; // Default unordered
  }) : [];

  // Find absolute cheapest price
  const cheapestOffer = result?.offers && result.offers.length > 0 
    ? [...result.offers].reduce((min, o) => getNumericalPrice(o.price) < getNumericalPrice(min.price) ? o : min, result.offers[0])
    : null;

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-40 h-[500px]" />

      <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header Area */}
        <header id="header-section" className="text-center mb-12 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-full mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-600" />
            Empowered with Real-Time Google Search Grounding
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-sans tracking-tight text-slate-900 mb-3">
            Price <span id="span-branded text" className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Source</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            Analyze pricing, variation options, shipping rules, and active retail discounts from different online stores in one instant lookup.
          </p>
        </header>

        {/* Main Dashboard Layout Grid */}
        <main id="main-content" className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          
          {/* Left Column: Search Panel and Suggestions (4 cols on large screens) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Box 1: Core Search form */}
            <section id="search-box-card" className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2 mb-4">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                Find Best Prices
              </h2>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Search className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="search-input-field"
                    type="text"
                    required
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                    placeholder="Enter item name or description..."
                    className="block w-full pl-10.5 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm transition-all outline-none text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                
                <button
                  id="search-submit-btn"
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="relative overflow-hidden w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group/btn"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Comparing Prices...
                    </>
                  ) : (
                    <>
                      Analyze Options
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Suggestions Panel */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Try standard lookups
                </span>
                <div id="suggestions-list" className="space-y-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setQuery(s.name);
                        handleSearch(s.name);
                      }}
                      className="w-full text-left p-2.5 hover:bg-slate-50 disabled:opacity-50 border border-transparent hover:border-slate-100 rounded-lg transition-all flex items-start gap-2.5 group"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {s.name}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{s.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Box 2: History (Persisted) */}
            <section id="history-card" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  Recent Searches
                </h3>
                {history.length > 0 && (
                  <button
                    onClick={clearAllHistory}
                    disabled={loading}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                  <p className="text-xs text-slate-400">No recent searches yet</p>
                </div>
              ) : (
                <div id="history-items" className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => !loading && loadHistoryItem(h)}
                      className={`group w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-indigo-100 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between transition-all cursor-pointer ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                          {h.query}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">{h.timestamp}</span>
                      </div>
                      <button
                        onClick={(e) => deleteHistoryItem(e, h.id)}
                        disabled={loading}
                        className="text-slate-300 hover:text-red-500 p-1 rounded-md hover:bg-white transition-colors"
                        title="Remove from history"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Dynamic Output Area (8 cols on large screens) */}
          <div className="lg:col-span-8 flex flex-col min-h-[400px]">
            
            <AnimatePresence mode="wait">
              
              {/* STAGE A: Loading State with detailed increments */}
              {loading && (
                <motion.div
                  key="loading-container"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex-1 bg-white border border-slate-200 rounded-2xl p-10 shadow-xs flex flex-col items-center justify-center text-center space-y-6"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Gathering Store Listings</h3>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={loadingStage}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-sm text-indigo-600 font-medium font-mono min-h-[20px]"
                      >
                        {loadingStage}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  
                  <p className="text-xs text-slate-400 max-w-sm">
                    This active search leverages real-time crawling so you get direct, fresh market results instead of outdated records.
                  </p>
                </motion.div>
              )}

              {/* STAGE B: Error Display */}
              {error && !loading && (
                <motion.div
                  key="error-container"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex-1 bg-red-50 border border-red-200 rounded-2xl p-8 shadow-xs flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-red-950">Lookup Attempt Unsuccessful</h3>
                    <p className="text-sm text-red-700 max-w-md mx-auto">{error}</p>
                  </div>
                  <button
                    onClick={() => handleSearch(query)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    Retry Analysis
                  </button>
                </motion.div>
              )}

              {/* STAGE C: Blank Welcome Board */}
              {!loading && !error && !result && (
                <motion.div
                  key="initial-placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 bg-white border border-slate-200 border-dashed rounded-2xl p-12 shadow-xs flex flex-col items-center justify-center text-center space-y-5"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                    <SlidersHorizontal className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <h3 className="text-lg font-bold text-slate-900">No Item Selected</h3>
                    <p className="text-sm text-slate-500">
                      Enter an item name or description in the tool panel, or select any quick suggestion to analyze deals instantly.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-500" /> Best Deals
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">
                      <Truck className="w-3.5 h-3.5 text-indigo-500" /> Free Shipping
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">
                      <Tag className="w-3.5 h-3.5 text-amber-500" /> Promo & Discounts
                    </span>
                  </div>
                </motion.div>
              )}

              {/* STAGE D: Results Dashboard */}
              {!loading && !error && result && (
                <motion.div
                  key="results-panel"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {/* Quota Exceeded Sandbox Warning Alert Banner */}
                  {isQuotaExceeded && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                          <AlertCircle className="w-5.5 h-5.5 animate-bounce" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                            Standard API Quota Limits Exceeded (Rate Limit 429)
                          </h4>
                          <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                            Google has flagged this project's Gemini Key as having exhausted its rate limits. To keep the app fully operational and testable, we have enabled the <strong>Demo Sandbox Match</strong> which generates high-fidelity local models of pricing, stores, specs, and discounts for your specific queries.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
                        <div className="text-center md:text-right text-[10px] text-amber-600 font-medium px-3 py-1 bg-amber-100/50 rounded-lg border border-amber-200/40">
                          To resolve: Open <strong>Settings &gt; Secrets</strong> to provide a different Key.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Result Header & Spec Summary Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-slate-300 z-20">
                      {isQuotaExceeded ? "Sandbox Fallback Match" : "Live Grounding Result"}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start relative z-10">
                      {/* Product dynamic photograph display */}
                      <div className="md:col-span-4 lg:col-span-3">
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square sm:aspect-video md:aspect-square bg-slate-50 group shadow-2xs">
                          <img
                            src={resolveProductImage(result.itemName || query)}
                            alt={result.itemName || query}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                            <span className="text-[10px] font-semibold text-white/95 font-mono tracking-wider">Product Visualizer</span>
                          </div>
                        </div>
                      </div>

                      {/* Title & Description specs */}
                      <div className="md:col-span-8 lg:col-span-9 space-y-3.5">
                        <h2 className="text-2xl font-bold text-slate-950 tracking-tight flex items-center gap-2">
                          {isQuotaExceeded ? (
                            <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-[10px]">
                              !
                            </div>
                          ) : (
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          )}
                          {result.itemName || query}
                        </h2>
                        
                        <div className="text-sm text-slate-650 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                          {result.description}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Best Deal Callout & Quick Filters Block */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    
                    {/* Best Recommended Offer Card */}
                    {cheapestOffer && (
                      <div className="md:col-span-7 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex flex-col justify-between group">
                        <div>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full mb-3 uppercase tracking-wider">
                            <TrendingDown className="w-3 h-3" /> Cheapest Option Found
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 flex items-baseline gap-2">
                            <span className="font-mono text-emerald-700 text-2xl font-extrabold">{cheapestOffer.price}</span>
                            <span className="text-sm text-slate-500 font-sans">at {cheapestOffer.storeName}</span>
                          </h3>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-emerald-100/60 text-xs text-slate-600 space-y-1.5">
                          <p className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-emerald-600" />
                            <strong>Shipping:</strong> {cheapestOffer.shippingInfo || "Free"}
                          </p>
                          {cheapestOffer.discountInfo && cheapestOffer.discountInfo !== "None" && (
                            <p className="flex items-center gap-1.5 text-emerald-800">
                              <Tag className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                              <strong>Discounts:</strong> {cheapestOffer.discountInfo}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quick Interactive Sorting & Filters Panel */}
                    <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-center space-y-4">
                      
                      {/* Filter Selection */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <Filter className="w-3.5 h-3.5" /> Filter Offers
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100 text-xs font-medium">
                          <button
                            onClick={() => setFilterType("all")}
                            className={`py-1.5 px-2 rounded-md transition-all text-center ${
                              filterType === "all"
                                ? "bg-white text-indigo-600 shadow-xs ring-1 ring-slate-100 font-semibold"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            All ({result.offers.length})
                          </button>
                          <button
                            onClick={() => setFilterType("free-shipping")}
                            className={`py-1.5 px-2 rounded-md transition-all text-center ${
                              filterType === "free-shipping"
                                ? "bg-white text-indigo-600 shadow-xs ring-1 ring-slate-100 font-semibold"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Free Ship
                          </button>
                          <button
                            onClick={() => setFilterType("discounted")}
                            className={`py-1.5 px-2 rounded-md transition-all text-center ${
                              filterType === "discounted"
                                ? "bg-white text-indigo-600 shadow-xs ring-1 ring-slate-100 font-semibold"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Discounts
                          </button>
                        </div>
                      </div>

                      {/* Sort Selection */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <ArrowUpDown className="w-3.5 h-3.5" /> Sort Offers
                        </label>
                        <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100 text-xs font-medium">
                          <button
                            onClick={() => setSortBy("low-to-high")}
                            className={`py-1.5 px-2 rounded-md transition-all text-center ${
                              sortBy === "low-to-high"
                                ? "bg-white text-indigo-600 shadow-xs ring-1 ring-slate-100 font-semibold"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Price: Low-High
                          </button>
                          <button
                            onClick={() => setSortBy("high-to-low")}
                            className={`py-1.5 px-2 rounded-md transition-all text-center ${
                              sortBy === "high-to-low"
                                ? "bg-white text-indigo-600 shadow-xs ring-1 ring-slate-100 font-semibold"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Price: High-Low
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Offers List Display Area */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-slate-500" />
                        Available Store Deals
                      </h3>
                      <span className="text-xs text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-100 font-mono">
                        Showing {processedOffers.length} of {result.offers.length} results
                      </span>
                    </div>

                    {processedOffers.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 italic text-sm">
                        No matches correspond to the active filters. Toggle back to "All" or adjustment parameters.
                      </div>
                    ) : (
                      <div id="processed-offers-container" className="divide-y divide-slate-150">
                        {processedOffers.map((offer, index) => (
                          <div
                            key={index}
                            className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
                          >
                            {/* Left: Retailer, variations, conditions */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                              {/* Direct product image from the specific merchant website */}
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 p-0.5 flex-shrink-0 flex items-center justify-center shadow-3xs group/itemimg relative">
                                <img
                                  src={resolveStoreOfferImage(offer.itemImageUrl, offer.storeName, result.itemName || query)}
                                  alt={`${result.itemName} at ${offer.storeName}`}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover rounded-lg group-hover/itemimg:scale-105 transition-transform duration-350"
                                  onError={(e) => {
                                    // Robust fallback if provided merchant image breaks
                                    const cleanedSearch = encodeURIComponent((result.itemName || query).toLowerCase().replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, ",")) || "gadget";
                                    (e.target as HTMLImageElement).src = `https://loremflickr.com/160/160/${cleanedSearch},${offer.storeName.toLowerCase()}`;
                                  }}
                                />
                              </div>

                              <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    {/* Store logo via Google Favicons API with referrerPolicy */}
                                    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
                                      <img
                                        src={`https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(offer.storeUrl || offer.storeName.toLowerCase() + ".com")}`}
                                        alt=""
                                        referrerPolicy="no-referrer"
                                        className="w-4.5 h-4.5 object-contain"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = "none";
                                        }}
                                      />
                                    </div>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-200">
                                      {offer.storeName}
                                    </span>
                                  </div>
                                  
                                  {offer.variations && offer.variations !== "Standard" && offer.variations !== "Standard variations" && (
                                    <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] rounded-md border border-slate-100 font-medium">
                                      {offer.variations}
                                    </span>
                                  )}
                                </div>

                                {offer.notes && (
                                  <p className="text-xs text-slate-500 leading-relaxed font-sans mt-1">
                                    {offer.notes}
                                  </p>
                                )}

                                {/* Highlight details (Trucks and coupon tags) */}
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 mt-2">
                                  <span className="flex items-center gap-1">
                                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Shipping: <strong>{offer.shippingInfo}</strong></span>
                                  </span>
                                  
                                  {offer.discountInfo && offer.discountInfo !== "None" && offer.discountInfo !== "No" && (
                                    <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/60 font-medium">
                                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Discount: <strong>{offer.discountInfo}</strong></span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Price & Redirect Buttons */}
                            <div className="flex items-center justify-between md:flex-col md:items-end gap-3 flex-shrink-0 min-w-[140px]">
                              <div className="text-right">
                                <div className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                                  {offer.price}
                                </div>
                              </div>
                              
                              {offer.storeUrl && (
                                <a
                                  href={buildDirectSearchLink(offer.storeUrl, offer.storeName, result?.itemName || query)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white hover:text-white text-xs font-semibold rounded-xl tracking-wide transition-all shadow-xs cursor-pointer flex-shrink-0"
                                >
                                  Shop Item
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comparison Summary Advice & Tips */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Summary Recommendation text */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                          Market Analysis
                        </span>
                        <h4 className="text-base font-bold text-slate-950">Deals Recommendation</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {result.comparisonSummary}
                        </p>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-550" />
                        Always double check conditions at checkout since shipping rules may adjust dynamically.
                      </div>
                    </div>

                    {/* Shopping guidance bullets */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-3">
                        Smart Buying Guide
                      </span>
                      <h4 className="text-base font-bold text-slate-950 mb-3">Shopping Tips</h4>
                      <ul id="buying-tips-list" className="space-y-3">
                        {result.buyingTips && result.buyingTips.length > 0 ? (
                          result.buyingTips.map((tip, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="leading-relaxed">{tip}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-slate-400 italic">No direct buying tips generated for this item search.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Grounded Citation Source Links Footer */}
                  {sources.length > 0 && (
                    <div id="sources-citation-block" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Verified Web Search Citations
                        </h4>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                          {sources.length} sources crawled
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        These real-world URLs represent the direct links used to ground the prices, shipping conditions, and retailer offers shown above. Feel free to visit standard sites to verify offers:
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {sources.map((src) => (
                          <a
                            key={src.id}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-100 border border-slate-200/60 p-3 rounded-xl flex items-start gap-2.5 transition-all group cursor-pointer"
                          >
                            <span className="w-5 h-5 rounded-md bg-white border border-slate-200 font-mono text-[10px] text-slate-500 font-semibold flex items-center justify-center flex-shrink-0 group-hover:text-indigo-600 group-hover:border-indigo-250">
                              {src.id}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-indigo-700">
                                {src.title || "Retailer Offering / Comparison Source"}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono block truncate group-hover:text-indigo-500">
                                {src.uri}
                              </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-350 group-hover:text-indigo-500 flex-shrink-0 mt-0.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </main>

        <footer id="global-footer" className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Price Source. Leveraging advanced Google Search Grounding with Gemini 3.5 Flash.</p>
        </footer>

      </div>
    </div>
  );
}
