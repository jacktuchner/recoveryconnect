"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MatchBadge from "@/components/MatchBadge";


const categoryLabels: Record<string, string> = {
  WEEKLY_TIMELINE: "Week-by-Week Timeline",
  WISH_I_KNEW: "Things I Wish I Knew",
  PRACTICAL_TIPS: "Practical Tips",
  MENTAL_HEALTH: "Mental & Emotional Health",
  RETURN_TO_ACTIVITY: "Return to Activity",
  MISTAKES_AND_LESSONS: "Mistakes & Lessons Learned",
};


const activityLabels: Record<string, string> = {
  SEDENTARY: "Sedentary",
  RECREATIONAL: "Recreational",
  COMPETITIVE_ATHLETE: "Competitive Athlete",
  PROFESSIONAL_ATHLETE: "Professional Athlete",
};


export default function RecordingDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [recording, setRecording] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [review, setReview] = useState({ rating: 5, matchRelevance: 5, helpfulness: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/recordings/${id}`);
        if (res.ok) setRecording(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function submitReview() {
    if (!recording) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: recording.contributorId,
          recordingId: recording.id,
          ...review,
        }),
      });
      if (res.ok) {
        const newReview = await res.json();
        setRecording((prev: any) => ({
          ...prev,
          reviews: [newReview, ...(prev.reviews || [])],
        }));
        setShowReviewForm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;
  if (!recording) return <div className="max-w-4xl mx-auto px-4 py-8">Recording not found.</div>;

  const avgRating = recording.reviews?.length
    ? (recording.reviews.reduce((a: number, r: any) => a + r.rating, 0) / recording.reviews.length).toFixed(1)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/browse" className="text-sm text-teal-600 hover:text-teal-700 mb-4 inline-block">
        &larr; Back to Browse
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Player Area */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-teal-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="text-sm text-teal-600">
              {recording.isVideo ? "Video" : "Audio"} Recording
              {recording.durationSeconds && ` · ${Math.floor(recording.durationSeconds / 60)}:${(recording.durationSeconds % 60).toString().padStart(2, "0")}`}
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                {categoryLabels[recording.category] || recording.category}
              </span>
              <h1 className="text-2xl font-bold mt-2">{recording.title}</h1>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-teal-700">${recording.price.toFixed(2)}</p>
              <p className="text-xs text-gray-400">{recording.viewCount} views</p>
            </div>
          </div>

          {recording.description && (
            <p className="text-gray-600 mb-6">{recording.description}</p>
          )}

          {/* Contributor Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <span className="text-teal-700 font-semibold">
                  {recording.contributor?.name?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
              <div>
                <Link href={`/contributors/${recording.contributorId}`} className="font-semibold hover:text-teal-700">
                  {recording.contributor?.name || "Anonymous"}
                </Link>
                {avgRating && (
                  <p className="text-sm text-gray-500">
                    {avgRating} avg rating &middot; {recording.reviews.length} reviews
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                {recording.procedureType}
              </span>
              <span className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                {recording.ageRange}
              </span>
              <span className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                {activityLabels[recording.activityLevel] || recording.activityLevel}
              </span>
            </div>

            {recording.contributor?.profile?.isAvailableForCalls && (
              <Link
                href={`/book/${recording.contributorId}`}
                className="mt-3 inline-block bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium"
              >
                Book a Live Call with {recording.contributor.name?.split(" ")[0]}
              </Link>
            )}
          </div>

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Reviews ({recording.reviews?.length || 0})</h2>
              {session && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Write a Review
                </button>
              )}
            </div>

            {showReviewForm && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Overall (1-5)</label>
                    <input type="number" min={1} max={5} value={review.rating}
                      onChange={(e) => setReview(r => ({...r, rating: parseInt(e.target.value)}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Match Relevance (1-5)</label>
                    <input type="number" min={1} max={5} value={review.matchRelevance}
                      onChange={(e) => setReview(r => ({...r, matchRelevance: parseInt(e.target.value)}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Helpfulness (1-5)</label>
                    <input type="number" min={1} max={5} value={review.helpfulness}
                      onChange={(e) => setReview(r => ({...r, helpfulness: parseInt(e.target.value)}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm mt-1" />
                  </div>
                </div>
                <textarea value={review.comment} onChange={(e) => setReview(r => ({...r, comment: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3}
                  placeholder="Share your thoughts about this recording..." />
                <button onClick={submitReview} disabled={submittingReview}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium">
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            )}

            {recording.reviews?.length === 0 ? (
              <p className="text-gray-400 text-sm">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {recording.reviews.map((r: any) => (
                  <div key={r.id} className="border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{r.author?.name || "Anonymous"}</span>
                      <span className="text-yellow-500 text-sm">
                        {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}