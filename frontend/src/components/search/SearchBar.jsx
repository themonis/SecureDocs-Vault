import React, { useState, useEffect } from "react";
import { fileAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function SearchBar({
  onSearch,
  onClearSearch,
  currentQuery = "",
}) {
  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const [userTags, setUserTags] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load user's tags for autocomplete
  useEffect(() => {
    loadUserTags();
  }, []);

  const loadUserTags = async () => {
    try {
      const response = await fileAPI.getUserTags();
      setUserTags(response.data.tags || []);
    } catch (error) {
      console.error("Failed to load tags:", error);
    }
  };

  const handleSearch = async (query) => {
    // ✅ FIX: Ensure query is a string and not empty
    const searchTerm = typeof query === "string" ? query : searchQuery;

    if (!searchTerm || typeof searchTerm !== "string" || !searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setLoading(true);
    try {
      console.log("🔍 Searching for:", searchTerm.trim());

      const response = await fileAPI.searchFilesByTags(searchTerm.trim());

      console.log("📦 Search response:", response.data);

      // ✅ Call onSearch with results and query
      onSearch(response.data.files || [], searchTerm.trim());
      toast.success(`Found ${response.data.files?.length || 0} files`);
      setShowSuggestions(false);
    } catch (error) {
      console.error("❌ Search error:", error);
      console.error("❌ Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Search failed");
      onSearch([], searchTerm.trim()); // ← Clear results on error
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Show tag suggestions
    if (value && value.trim()) {
      const filtered = userTags.filter((tag) =>
        tag.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestedTags(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestedTags([]);
    }
  };

  const handleTagSelect = (tag) => {
    if (!tag || typeof tag !== "string") return;

    setSearchQuery(tag);
    setShowSuggestions(false);

    // ✅ FIX: Auto-search when tag is selected with proper delay
    setTimeout(() => {
      handleSearch(tag);
    }, 100);
  };

  const handleClear = () => {
    setSearchQuery("");
    setShowSuggestions(false);
    setSuggestedTags([]);
    onClearSearch();
  };

  return (
    <div className="relative mb-6">
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Search files by tags..."
            className="w-full px-4 py-3 pl-12 pr-20 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
          />

          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-white/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Action Buttons */}
          <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-white/60 hover:text-white transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !searchQuery || !searchQuery.trim()}
              className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300"></div>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>

        {/* Tag Suggestions Dropdown */}
        {showSuggestions && suggestedTags.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-slate-800/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="p-2">
              <div className="text-xs text-white/60 px-2 py-1 mb-1">
                Suggested Tags:
              </div>
              {suggestedTags.map((tag, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTagSelect(tag)}
                  className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Popular Tags */}
      {userTags.length > 0 && !searchQuery && (
        <div className="mt-3">
          <div className="text-xs text-white/60 mb-2">Your Tags:</div>
          <div className="flex flex-wrap gap-2">
            {userTags.slice(0, 8).map((tag, index) => (
              <button
                key={index}
                onClick={() => handleTagSelect(tag)}
                className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-full text-sm transition-colors"
              >
                {tag}
              </button>
            ))}
            {userTags.length > 8 && (
              <span className="px-3 py-1 text-white/40 text-sm">
                +{userTags.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
