"use client";

import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-yellow-600"
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
      </div>

      <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
      <p className="text-gray-600 mb-6">
        Your payment was cancelled. No charges were made.
      </p>

      <div className="flex gap-4 justify-center">
        <Link
          href="/browse"
          className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium"
        >
          Continue Browsing
        </Link>
        <Link
          href="/"
          className="text-teal-600 hover:text-teal-700 px-5 py-2 text-sm font-medium"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
