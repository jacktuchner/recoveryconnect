"use client";

import { useState } from "react";

interface DisclaimerBannerProps {
  variant?: "info" | "warning";
  dismissible?: boolean;
}

export default function DisclaimerBanner({
  variant = "info",
  dismissible = false
}: DisclaimerBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const bgColor = variant === "warning"
    ? "bg-amber-50 border-amber-200"
    : "bg-blue-50 border-blue-200";

  const textColor = variant === "warning"
    ? "text-amber-800"
    : "text-blue-800";

  const iconColor = variant === "warning"
    ? "text-amber-500"
    : "text-blue-500";

  return (
    <div className={`${bgColor} border rounded-lg p-4 mb-4`}>
      <div className="flex items-start gap-3">
        <div className={`${iconColor} flex-shrink-0 mt-0.5`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className={`${textColor} font-semibold text-sm mb-1`}>
            Peer Experiences Only - Not Medical Advice
          </h4>
          <p className={`${textColor} text-sm opacity-90`}>
            The content shared here reflects personal recovery experiences and emotional support from peers.
            This is <strong>not</strong> medical advice. Always follow your doctor&apos;s instructions and
            consult healthcare professionals for medical decisions.
          </p>
        </div>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className={`${textColor} hover:opacity-70 flex-shrink-0`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
