import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple in-memory cache for search queries to prevent slow API re-grounding
  interface CacheEntry {
    data: any;
    sources: any[];
    timestamp: number;
  }
  const queryCache: Record<string, CacheEntry> = {};
  const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

  // Secret-safe API Proxy for Price Comparison
  app.post("/api/compare", async (req, res) => {
    const { itemQuery } = req.body || {};
    try {
      if (!itemQuery || typeof itemQuery !== "string" || !itemQuery.trim()) {
        res.status(400).json({ error: "Item name or description is required." });
        return;
      }

      const normalizedQuery = itemQuery.trim().toLowerCase();
      const now = Date.now();

      // Check cache first
      if (queryCache[normalizedQuery] && (now - queryCache[normalizedQuery].timestamp < CACHE_TTL)) {
        console.log(`Cache HIT for query: "${normalizedQuery}"`);
        res.json({
          data: queryCache[normalizedQuery].data,
          sources: queryCache[normalizedQuery].sources,
          cached: true
        });
        return;
      }

      console.log(`Cache MISS for query: "${normalizedQuery}". Requesting real-time grounding...`);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error: "GEMINI_API_KEY environment variable is not set. Please add it via the Secrets panel in the Settings menu."
        });
        return;
      }

      // Initialize the Gemini client with proper User-Agent header for AI Studio
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      // Construct an optimized grounding prompt for faster reasoning
      const prompt = `Search and return active price comparisons across major retailers/stores for the item: "${itemQuery}".
Find 3-6 real store offers with listing price, shipping options, active sales/discounts, and specs. Keep it highly accurate to web results. Ensure accurate prices.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              itemName: {
                type: Type.STRING,
                description: "The standardized name or official name of the item identified."
              },
              description: {
                type: Type.STRING,
                description: "A solid summary or bullet list describing key specs, options, and features of the item."
              },
              offers: {
                type: Type.ARRAY,
                description: "List of active retail offers found on the current web.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    storeName: {
                      type: Type.STRING,
                      description: "The retailer's name (e.g. Walmart, Best Buy, eBay, Amazon, etc.)."
                    },
                    price: {
                      type: Type.STRING,
                      description: "The listing price (e.g., $129.99, $49.00). Must include currency."
                    },
                    shippingInfo: {
                      type: Type.STRING,
                      description: "Shipping options, free shipping thresholds, or direct shipping cost (e.g., Free, $5.99)."
                    },
                    variations: {
                      type: Type.STRING,
                      description: "Available variations at this retailer (e.g., colors, capacities, bundles, sizes). If none, state 'Standard'."
                    },
                    discountInfo: {
                      type: Type.STRING,
                      description: "Any active discounts, promo codes, or markdown details. If standard price, state 'None'."
                    },
                    storeUrl: {
                      type: Type.STRING,
                      description: "An official store domain or direct link if possible (e.g., amazon.com, target.com)."
                    },
                    itemImageUrl: {
                      type: Type.STRING,
                      description: "An absolute, direct product image URL found on this store's website, or a general high-quality photo URL representing the product sold by this specific merchant. Must start with http or https."
                    },
                    notes: {
                      type: Type.STRING,
                      description: "Extra remarks, such as stock status, return policies, or item condition (New/Refurbished)."
                    }
                  },
                  required: ["storeName", "price", "shippingInfo"]
                }
              },
              comparisonSummary: {
                type: Type.STRING,
                description: "Analysis identifying the absolute best deal, cheapest option, fastest shipping, and overall recommendation."
              },
              buyingTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Practical buying recommendations, price trends, or validation cautions for this item."
              },
              productImageQuery: {
                type: Type.STRING,
                description: "A refined search query (2-3 tags, comma-separated) for Unsplash to find a matching aesthetic product image. E.g. 'mug,ceramic' or 'coffee,maker' or 'shoes,running'."
              }
            },
            required: ["itemName", "description", "offers", "comparisonSummary", "buyingTips", "productImageQuery"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No text content returned from the generative model.");
      }

      let parsedData;
      try {
        parsedData = JSON.parse(text.trim());
      } catch (jsonErr) {
        console.error("Failed to parse Gemini JSON output structure:", text);
        parsedData = {
          itemName: itemQuery,
          description: "Search was finished but could not format the output properly.",
          offers: [],
          comparisonSummary: "Error during parsing. Here is some text representation: " + text,
          buyingTips: []
        };
      }

      // Extract real-time ground URLs from search results to give authentic links
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((chunk: any, i: number) => ({
          id: i + 1,
          title: chunk.web?.title || "Search Reference",
          uri: chunk.web?.uri || ""
        }))
        .filter((src: any) => src.uri.startsWith("http"));

      // Cache the valid response
      queryCache[normalizedQuery] = {
        data: parsedData,
        sources: sources,
        timestamp: now
      };

      res.json({
        data: parsedData,
        sources: sources
      });

    } catch (error: any) {
      console.error("Handler error on /api/compare:", error);
      
      const errorStr = String(error.message || error);
      const isQuotaExceeded = errorStr.includes("429") || 
                              errorStr.toLowerCase().includes("quota") || 
                              errorStr.includes("RESOURCE_EXHAUSTED") ||
                              errorStr.toLowerCase().includes("rate limit");

      if (isQuotaExceeded) {
        console.warn("Gemini Quota Exceeded detected. Generating elegant demo fallback data for query:", itemQuery);
        
        // Generate realistic mock data to serve as an interactive playground fallback
        const queryClean = itemQuery.trim();
        const basePrice = Math.floor(Math.random() * 200) + 49;
        
        const demoData = {
          itemName: `${queryClean} (Demo Sandbox Match)`,
          description: `This is a high-fidelity sandbox simulation of the price comparisons for "${queryClean}" because the current API Key has reached Google's Gemini rate limits/quotas. Perfect for testing layout, sorting, and user behavior!`,
          offers: [
            {
              storeName: "Amazon",
              price: `$${(basePrice * 0.95).toFixed(2)}`,
              shippingInfo: "Free Shipping with Prime",
              variations: "Standard Model / In Stock",
              discountInfo: "5% off coupon applied",
              storeUrl: "amazon.com",
              itemImageUrl: `https://loremflickr.com/300/300/${encodeURIComponent(queryClean.replace(/\s+/g, ""))},amazon`,
              notes: "Arrives in 2 days. 30-day easy returns policy applies."
            },
            {
              storeName: "Best Buy",
              price: `$${basePrice.toFixed(2)}`,
              shippingInfo: "Free store pickup today or $5.99 shipping",
              variations: "Standard Retail Package",
              discountInfo: "None",
              storeUrl: "bestbuy.com",
              itemImageUrl: `https://loremflickr.com/300/300/${encodeURIComponent(queryClean.replace(/\s+/g, ""))},gadget`,
              notes: "Full official manufacture warranty included."
            },
            {
              storeName: "Walmart",
              price: `$${(basePrice * 1.02).toFixed(2)}`,
              shippingInfo: "Free Shipping on orders over $35",
              variations: "OEM Box / Multiple colors available",
              discountInfo: "Clearance rollback pricing",
              storeUrl: "walmart.com",
              itemImageUrl: `https://loremflickr.com/300/300/${encodeURIComponent(queryClean.replace(/\s+/g, ""))},store`,
              notes: "Free 15-day return coverage."
            }
          ],
          comparisonSummary: `Amazon currently offers the lowest price at $${(basePrice * 0.95).toFixed(2)} with Free Prime Shipping. Best Buy lists standard MSRP with immediate pickup, while Walmart provides reliable shipping on any variant.`,
          buyingTips: [
            "We recommend adding the item to your Amazon cart immediately to lock in the 5% discount.",
            "Verify locally at Best Buy if you need same-day pickup or wish to inspect the box.",
            "Consider third-party seller ratings when ordering through major retail marketplaces."
          ],
          productImageQuery: queryClean.replace(/\s+/g, ",")
        };

        const demoSources = [
          { id: 1, title: "Official Product Listings & Stores", uri: "https://www.google.com/search?q=" + encodeURIComponent(itemQuery) },
          { id: 2, title: "Tech Bargains & Deals Comparison Guides", uri: "https://www.google.com/search?q=" + encodeURIComponent(itemQuery + " cheap price") }
        ];

        res.json({
          data: demoData,
          sources: demoSources,
          isQuotaExceeded: true,
          errorDiagnostic: errorStr
        });
        return;
      }

      res.status(500).json({
        error: error.message || "An unexpected error occurred during search and price comparison retrieval."
      });
    }
  });

  // Serve Vite assets in Development vs Built files in Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server listening on port ${PORT}`);
  });
}

startServer();
