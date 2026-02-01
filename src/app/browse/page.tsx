"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import RecordingCard from "@/components/RecordingCard";
import ContributorCard from "@/components/ContributorCard";
import FilterSidebar from "@/components/FilterSidebar";

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [tab, setTab] = useState(searchParams.get("tab") || "recordings");
  const [filters, setFilters] = useState({
    procedure: searchParams.get("procedure") || "",
    ageRange: searchParams.get("ageRange") || "",
    activityLevel: searchParams.get("activityLevel") || "",
    category: searchParams.get("category") || "",
  });
  const [recordings, setRecordings] = useState<any[]>([]);
  const [contributors, setContributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.procedure) params.set("procedure", filters.procedure);
    if (filters.ageRange) params.set("ageRange", filters.ageRange);
    if (filters.activityLevel) params.set("activityLevel", filters.activityLevel);
    if (filters.category && tab === "recordings") params.set("category", filters.category);
    params.set("page", pagination.page.toString());

    try {
      if (tab === "recordings") {
        const res = await fetch(`/api/recordings?${params}`);
        const data = await res.json();
        setRecordings(data.recordings || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      } else {
        const res = await fetch(`/api/contributors?${params}`);
        const data = await res.json();
        setContributors(data.contributors || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [tab, filters, pagination.page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleFilterChange(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Recovery Content</h1>
        <p className="text-gray-600">
          Find recordings and contributors matched to your situation.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-8">
        <button
          onClick={() => { setTab("recordings"); setPagination(p => ({...p, page: 1})); }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "recordings" ? "bg-white text-teal-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Recordings
        </button>
        <button
          onClick={() => { setTab("contributors"); setPagination(p => ({...p, page: 1})); }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "contributors" ? "bg-white text-teal-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Contributors
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4">Filters</h2>
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              showCategory={tab === "recordings"}
            />
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 h-72 animate-pulse" />
              ))}
            </div>
          ) : tab === "recordings" ? (
            recordings.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg mb-2">No recordings found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recordings.map((rec: any) => (
                  <RecordingCard
                    key={rec.id}
                    id={rec.id}
                    title={rec.title}
                    contributorName={rec.contributor?.name || "Anonymous"}
                    procedureType={rec.procedureType}
                    ageRange={rec.ageRange}
                    activityLevel={rec.activityLevel}
                    category={rec.category}
                    durationSeconds={rec.durationSeconds}
                    isVideo={rec.isVideo}
                    price={rec.price}
                    viewCount={rec.viewCount}
                    averageRating={
                      rec.reviews?.length
                        ? rec.reviews.reduce((a: number, r: any) => a + r.rating, 0) / rec.reviews.length
                        : undefined
                    }
                    matchScore={rec.matchScore}
                  />
                ))}
              </div>
            )
          ) : (
            contributors.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg mb-2">No contributors found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {contributors.map((c: any) => (
                  <ContributorCard
                    key={c.id}
                    id={c.id}
                    name={c.name || "Anonymous"}
                    procedureType={c.profile?.procedureType || ""}
                    ageRange={c.profile?.ageRange || ""}
                    activityLevel={c.profile?.activityLevel || ""}
                    recoveryGoals={c.profile?.recoveryGoals || []}
                    timeSinceSurgery={c.profile?.timeSinceSurgery}
                    recordingCount={c.recordings?.length || 0}
                    averageRating={
                      c.reviewsReceived?.length
                        ? c.reviewsReceived.reduce((a: number, r: any) => a + r.rating, 0) / c.reviewsReceived.length
                        : undefined
                    }
                    reviewCount={c.reviewsReceived?.length || 0}
                    hourlyRate={c.profile?.hourlyRate}
                    isAvailableForCalls={c.profile?.isAvailableForCalls || false}
                    matchScore={(c as any).matchScore}
                  />
                ))}
              </div>
            )
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8">Loading...</div>}>
      <BrowseContent />
    </Suspense>
  );
}
