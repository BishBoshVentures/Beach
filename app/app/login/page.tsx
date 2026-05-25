"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import { createClient } from "@/lib/supabase";

function LoginForm() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(
    searchParams.get("error") === "not_authorised"
      ? "You are not authorised to access this application."
      : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });

      if (otpError) {
        setError(otpError.message);
        setLoading(false);
        return;
      }

      sessionStorage.setItem("otp_email", email.trim());
      router.push("/verify");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <h1 className="text-xl font-bold text-center text-gray-900 mb-6">
        Login
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email address
          </label>
          <input
            type="email"
            id="email"
            required
            aria-required="true"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@beach-events.co.uk"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors"
          />
        </div>

        {error && <p className="text-sm text-red-500" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-teal hover:bg-brand-teal-light text-white font-semibold py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2"
        >
          {loading ? "Sending..." : "Request One-Time Pin"}
        </button>
      </form>

      <p className="mt-4 text-[11px] text-gray-400 text-center leading-relaxed">
        By continuing, you agree to Beach Events&apos; Terms of Service and
        Privacy Policy.
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
