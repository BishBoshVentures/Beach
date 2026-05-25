"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import { createClient } from "@/lib/supabase";

export default function VerifyPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email] = useState(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("otp_email") ?? ""
      : ""
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!email) {
      router.push("/login");
      return;
    }
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [email, router]);

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        // Clear current field
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
        e.preventDefault();
      } else if (index > 0) {
        // Move to previous and clear it
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
        e.preventDefault();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);

    const nextEmpty = newOtp.findIndex((v) => !v);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (verifyError) {
        setError("Invalid or expired code. Try again.");
        setLoading(false);
        return;
      }

      // Check allowed_users
      const { data: allowedUser, error: lookupError } = await supabase
        .from("allowed_users")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (lookupError || !allowedUser) {
        await supabase.auth.signOut();
        sessionStorage.removeItem("otp_email");
        router.push("/login?error=not_authorised");
        return;
      }

      sessionStorage.removeItem("otp_email");
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setResent(false);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.signInWithOtp({ email });
      if (resendError) {
        setError("Failed to resend code. Try again.");
      } else {
        setResent(true);
        setTimeout(() => setResent(false), 3000);
      }
    } catch {
      setError("Failed to resend code.");
    }
    setResending(false);
  };

  return (
    <AuthCard>
      <h1 className="text-xl font-bold text-center text-gray-900 mb-2">
        Check your email
      </h1>
      <p className="text-sm text-gray-400 text-center mb-6">
        We sent a 6-digit code to{" "}
        <span className="text-gray-600">{email}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 6-box OTP input */}
        <div
          className="flex justify-between gap-1.5 sm:gap-2"
          role="group"
          aria-label="One-time password"
          onPaste={handlePaste}
        >
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-full aspect-square max-w-[48px] sm:max-w-[52px] border border-gray-200 rounded-lg text-center text-lg sm:text-xl font-semibold text-gray-900 transition-colors focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
              aria-label={`Digit ${i + 1} of 6`}
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-500" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={loading || resending}
          className="w-full bg-brand-teal hover:bg-brand-teal-light text-white font-semibold py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2"
        >
          {loading ? "Verifying..." : "Verify \u2192"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={handleResend}
          disabled={resending || loading}
          className="text-xs text-gray-400 hover:text-brand-teal transition-colors disabled:opacity-50"
        >
          {resending ? "Sending..." : resent ? "Code sent!" : "Resend code"}
        </button>
      </div>
    </AuthCard>
  );
}
