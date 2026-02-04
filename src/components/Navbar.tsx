"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RC</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Recovery<span className="text-teal-600">Connect</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/browse"
              className="text-gray-600 hover:text-teal-600 transition-colors"
            >
              Browse Recordings
            </Link>
            <Link
              href="/browse?tab=contributors"
              className="text-gray-600 hover:text-teal-600 transition-colors"
            >
              Find a Contributor
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-teal-600 transition-colors"
            >
              About
            </Link>
            {session ? (
              <>
                <Link
                  href={
                    (session.user as any)?.role === "CONTRIBUTOR" ||
                    (session.user as any)?.role === "BOTH"
                      ? "/dashboard/contributor"
                      : "/dashboard/patient"
                  }
                  className="text-gray-600 hover:text-teal-600 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-gray-600 hover:text-teal-600 transition-colors"
                >
                  Sign Out
                </button>
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-teal-700 text-sm font-medium">
                    {session.user?.name?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-gray-600 hover:text-teal-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/browse" className="block py-2 text-gray-600">Browse Recordings</Link>
            <Link href="/browse?tab=contributors" className="block py-2 text-gray-600">Find a Contributor</Link>
            <Link href="/about" className="block py-2 text-gray-600">About</Link>
            {session ? (
              <>
                <Link href="/dashboard/patient" className="block py-2 text-gray-600">Dashboard</Link>
                <button onClick={() => signOut()} className="block py-2 text-gray-600">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="block py-2 text-gray-600">Sign In</Link>
                <Link href="/auth/register" className="block py-2 text-teal-600 font-medium">Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
