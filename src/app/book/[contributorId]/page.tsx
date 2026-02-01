"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";


export default function BookCallPage() {
  const { contributorId } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contributor, setContributor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  const [form, setForm] = useState({
    date: "",
    time: "",
    duration: 30,
    questionsInAdvance: "",
  });


  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/contributors/${contributorId}`);
        if (res.ok) setContributor(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contributorId]);


  async function handleBook() {
    if (!form.date || !form.time) return;
    setBooking(true);
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributorId,
          scheduledAt,
          durationMinutes: form.duration,
          questionsInAdvance: form.questionsInAdvance || undefined,
        }),
      });
      if (res.ok) {
        setBooked(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBooking(false);
    }
  }


  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8">Loading...</div>;
  if (!contributor) return <div className="max-w-2xl mx-auto px-4 py-8">Contributor not found.</div>;

  const rate = contributor.profile?.hourlyRate || 50;
  const price = form.duration === 60 ? rate : rate / 2;


  if (booked) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Call Requested!</h1>
        <p className="text-gray-600 mb-6">
          Your call with {contributor.name} has been requested. You will be notified once they confirm.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard/patient" className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">
            Go to Dashboard
          </Link>
          <Link href="/browse" className="text-teal-600 hover:text-teal-700 px-5 py-2 text-sm font-medium">
            Continue Browsing
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={`/contributors/${contributorId}`} className="text-sm text-teal-600 hover:text-teal-700 mb-4 inline-block">
        &larr; Back to Profile
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-2">Book a Call</h1>
        <p className="text-gray-600 mb-6">Schedule a 1-on-1 video call with {contributor.name}</p>

        {/* Contributor summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
            <span className="text-teal-700 font-semibold text-lg">
              {contributor.name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <div>
            <p className="font-semibold">{contributor.name}</p>
            <p className="text-sm text-gray-500">
              {contributor.profile?.procedureType} &middot; {contributor.profile?.ageRange} &middot; {contributor.profile?.timeSinceSurgery} post-op
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Call Duration</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForm(f => ({...f, duration: 30}))}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  form.duration === 30 ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"
                }`}>
                <p className="font-semibold">30 minutes</p>
                <p className="text-sm text-gray-500">${(rate / 2).toFixed(2)}</p>
              </button>
              <button type="button" onClick={() => setForm(f => ({...f, duration: 60}))}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  form.duration === 60 ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"
                }`}>
                <p className="font-semibold">60 minutes</p>
                <p className="text-sm text-gray-500">${rate.toFixed(2)}</p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" value={form.date}
                onChange={(e) => setForm(f => ({...f, date: e.target.value}))}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
              <input type="time" value={form.time}
                onChange={(e) => setForm(f => ({...f, time: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Questions for the Contributor (optional)
            </label>
            <textarea value={form.questionsInAdvance}
              onChange={(e) => setForm(f => ({...f, questionsInAdvance: e.target.value}))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={4}
              placeholder="Share any specific questions you'd like to discuss so your contributor can prepare..." />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Total</span>
              <span className="text-2xl font-bold text-teal-700">${price.toFixed(2)}</span>
            </div>
            <button onClick={handleBook} disabled={booking || !form.date || !form.time}
              className="w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors">
              {booking ? "Booking..." : `Book Call - ${price.toFixed(2)}`}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              You will not be charged until the contributor confirms the call.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}