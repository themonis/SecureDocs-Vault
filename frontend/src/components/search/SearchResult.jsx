import React from "react";
import FileList from "../files/FileList";

export default function SearchResults({ results, searchQuery, onClearSearch }) {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10 text-yellow-400"
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
        <h3 className="text-xl font-bold text-white mb-2">No Files Found</h3>
        <p className="text-white/60 mb-4">
          No files found matching "{searchQuery}". Try different tags or
          keywords.
        </p>
        <button
          onClick={onClearSearch}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
        >
          View All Files
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Search Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Search Results</h2>
            <p className="text-white/60">
              Found {results.length} file{results.length !== 1 ? "s" : ""} for "
              {searchQuery}"
            </p>
          </div>
        </div>

        <button
          onClick={onClearSearch}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
        >
          View All Files
        </button>
      </div>

      {/* Search Results List */}
      <FileList files={results} />
    </div>
  );
}
