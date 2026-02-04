"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface PurchaseButtonProps {
  recordingId: string;
  price: number;
  disabled?: boolean;
}

export default function PurchaseButton({
  recordingId,
  price,
  disabled = false,
}: PurchaseButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase() {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordingId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create checkout session");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Purchase error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handlePurchase}
        disabled={disabled || loading}
        className="w-full bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          `Purchase - $${price.toFixed(2)}`
        )}
      </button>
      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </div>
  );
}
