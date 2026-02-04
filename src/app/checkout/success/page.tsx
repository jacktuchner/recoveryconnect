"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [purchaseInfo, setPurchaseInfo] = useState<{
    type: string;
    recordingId?: string;
    recordingTitle?: string;
  } | null>(null);

  useEffect(() => {
    if (sessionId) {
      // Fetch purchase info from session
      fetch(`/api/checkout/session?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => setPurchaseInfo(data))
        .catch(console.error);
    }
  }, [sessionId]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-green-600"
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

      <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
      <p className="text-gray-600 mb-6">
        Thank you for your purchase. Your access has been granted.
      </p>

      <div className="flex gap-4 justify-center">
        {purchaseInfo?.recordingId ? (
          <Link
            href={`/recordings/${purchaseInfo.recordingId}`}
            className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium"
          >
            Watch Recording
          </Link>
        ) : (
          <Link
            href="/dashboard/patient"
            className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium"
          >
            Go to Dashboard
          </Link>
        )}
        <Link
          href="/browse"
          className="text-teal-600 hover:text-teal-700 px-5 py-2 text-sm font-medium"
        >
          Continue Browsing
        </Link>
      </div>
    </div>
  );
}
