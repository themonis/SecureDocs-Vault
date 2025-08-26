// utils/locationService.js
const https = require("https");
const http = require("http");

// Add cache at the module level
const locationCache = new Map();
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// function for IP-based location detection
const getLocationFromIP = async (ipAddress) => {
  try {
    console.log("🔍 [DEBUG] Starting getLocationFromIP with:", ipAddress);

    let finalIP = ipAddress;

    if (
      !ipAddress ||
      ipAddress === "::1" ||
      ipAddress === "127.0.0.1" ||
      ipAddress?.includes("localhost") ||
      ipAddress?.startsWith("192.168.") ||
      ipAddress?.startsWith("10.") ||
      ipAddress?.startsWith("172.")
    ) {
      try {
        console.log(
          "🔍 [DEBUG] Detected local/private IP, fetching public IP..."
        );

        const publicIP = await new Promise((resolve, reject) => {
          const req = https.get("https://api.ipify.org?format=json", (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
              try {
                const parsed = JSON.parse(data);
                resolve(parsed.ip);
              } catch (e) {
                reject(e);
              }
            });
          });
          req.on("error", reject);
          req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error("Timeout"));
          });
        });

        finalIP = publicIP;
        console.log("🔍 [DEBUG] Successfully got public IP:", finalIP);
      } catch (error) {
        console.error("❌ [DEBUG] Public IP fetch failed:", error);
        return "Local Development (IP detection failed)";
      }
    }

    // ✅ CHECK CACHE FIRST
    const cacheKey = `loc_${finalIP}`;
    const cached = locationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(
        `📋 [CACHE HIT] Using cached location for ${finalIP}: ${cached.location}`
      );
      return cached.location;
    }

    console.log(
      `🔄 [CACHE MISS] No cache for ${finalIP}, fetching from API...`
    );

    // ✅ Try multiple location services
    const locationServices = [
      // Service 1: ipinfo.io (more reliable)
      {
        url: `https://ipinfo.io/${finalIP}/json`,
        parser: (data) => {
          if (data.city && data.region && data.country) {
            return `${data.city}, ${data.region}, ${data.country}`;
          }
          return null;
        },
      },
      // Service 2: ipapi.co (backup)
      {
        url: `https://ipapi.co/${finalIP}/json/`,
        parser: (data) => {
          if (data.city && data.region && data.country_name) {
            return `${data.city}, ${data.region}, ${data.country_name}`;
          }
          return null;
        },
      },
      // Service 3: ip-api.com with different approach
      {
        url: `http://ip-api.com/json/${finalIP}?fields=city,regionName,country,status`,
        parser: (data) => {
          if (
            data.status === "success" &&
            data.city &&
            data.regionName &&
            data.country
          ) {
            return `${data.city}, ${data.regionName}, ${data.country}`;
          }
          return null;
        },
      },
    ];

    // Try each service until one works
    for (let i = 0; i < locationServices.length; i++) {
      const service = locationServices[i];
      try {
        console.log(
          `🔍 [DEBUG] Trying location service ${i + 1}:`,
          service.url
        );

        const locationData = await new Promise((resolve, reject) => {
          const protocol = service.url.startsWith("https://")
            ? require("https")
            : require("http");
          const req = protocol.get(service.url, (res) => {
            console.log(
              `🔍 [DEBUG] Service ${i + 1} response status:`,
              res.statusCode
            );

            if (res.statusCode !== 200) {
              reject(new Error(`HTTP ${res.statusCode}`));
              return;
            }

            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
              try {
                const parsed = JSON.parse(data);
                console.log(
                  `🔍 [DEBUG] Service ${i + 1} parsed response:`,
                  parsed
                );
                resolve(parsed);
              } catch (e) {
                reject(e);
              }
            });
          });
          req.on("error", reject);
          req.setTimeout(8000, () => {
            req.destroy();
            reject(new Error("Timeout"));
          });
        });

        const location = service.parser(locationData);
        if (location) {
          console.log(
            `🔍 [DEBUG] Service ${i + 1} success! Location:`,
            location
          );

          // ✅ CACHE THE SUCCESSFUL RESULT
          locationCache.set(cacheKey, {
            location: location,
            timestamp: Date.now(),
            service: `Service ${i + 1}`, // Optional: track which service worked
          });

          console.log(
            `💾 [CACHE STORE] Cached location for ${finalIP}: ${location}`
          );

          return location;
        } else {
          console.log(`❌ [DEBUG] Service ${i + 1} couldn't parse location`);
        }
      } catch (error) {
        console.error(`❌ [DEBUG] Service ${i + 1} failed:`, error.message);
        continue; // Try next service
      }
    }

    // If all services fail, return a meaningful fallback
    console.log("❌ [DEBUG] All location services failed");
    return "Unknown Location";
  } catch (error) {
    console.error("❌ [DEBUG] Overall error in getLocationFromIP:", error);
    return "Unknown Location";
  }
};
// Export the function
module.exports = {
  getLocationFromIP,
};
