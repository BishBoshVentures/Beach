"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn, useSignUp, useClerk, useAuth } from "@clerk/nextjs";
import AuthCard from "@/components/AuthCard";

type Stage = "email" | "code";
type Mode = "sign_in" | "sign_up";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded: signInLoaded, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();

  const notAuthorised = searchParams.get("error") === "not_authorised";

  const [stage, setStage] = useState<Stage>("email");
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(
    notAuthorised ? "You are not authorised to access this application." : ""
  );
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If we landed here as a not-authorised user, sign out the stale Clerk
  // session so they can try a different email (and so middleware stops
  // treating them as authenticated).
  useEffect(() => {
    if (notAuthorised && isSignedIn) {
      signOut().catch(() => {});
    }
  }, [notAuthorised, isSignedIn, signOut]);

  useEffect(() => {
    if (stage === "code") {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [stage]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!signInLoaded || !signUpLoaded) return;
    setLoading(true);

    // Check the allowlist before triggering Clerk. Otherwise anyone can
    // request an OTP code and we just block them at the dashboard layout
    // after they've verified — confusing UX.
    try {
      const res = await fetch("/api/auth/check-allowed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const { allowed } = (await res.json()) as { allowed: boolean };
      if (!allowed) {
        setError(
          "This email isn't recognised. If you think you should have access, please get in touch."
        );
        setLoading(false);
        return;
      }
    } catch {
      setError("Couldn't verify access right now. Please try again.");
      setLoading(false);
      return;
    }

    try {
      // Try sign-in first
      const attempt = await signIn.create({
        identifier: email.trim(),
      });
      const emailFactor = attempt.supportedFirstFactors?.find(
        (f) => f.strategy === "email_code"
      );
      if (!emailFactor || !("emailAddressId" in emailFactor)) {
        setError("Email code sign-in is not configured.");
        setLoading(false);
        return;
      }
      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: emailFactor.emailAddressId,
      });
      setMode("sign_in");
      setStage("code");
    } catch (err: unknown) {
      // User doesn't exist — fall through to sign-up
      const clerkError = err as { errors?: Array<{ code?: string; message?: string }> };
      const notFound = clerkError.errors?.[0]?.code === "form_identifier_not_found";
      if (notFound) {
        try {
          await signUp.create({ emailAddress: email.trim() });
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          setMode("sign_up");
          setStage("code");
        } catch (signUpErr: unknown) {
          const e = signUpErr as { errors?: Array<{ message?: string }> };
          setError(e.errors?.[0]?.message ?? "Failed to send code. Try again.");
        }
      } else {
        setError(clerkError.errors?.[0]?.message ?? "Failed to send code. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const next = [...otp];
        next[index] = "";
        setOtp(next);
        e.preventDefault();
      } else if (index > 0) {
        const next = [...otp];
        next[index - 1] = "";
        setOtp(next);
        inputRefs.current[index - 1]?.focus();
        e.preventDefault();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
    setOtp(next);
    const nextEmpty = next.findIndex((v) => !v);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (mode === "sign_in") {
        const result = await signIn!.attemptFirstFactor({
          strategy: "email_code",
          code,
        });
        if (result.status === "complete") {
          await setActiveSignIn!({ session: result.createdSessionId });
        } else {
          setError("Could not complete sign-in. Try again.");
          setLoading(false);
          return;
        }
      } else {
        const result = await signUp!.attemptEmailAddressVerification({ code });
        if (result.status === "complete") {
          await setActiveSignUp!({ session: result.createdSessionId });
        } else {
          setError("Could not complete sign-up. Try again.");
          setLoading(false);
          return;
        }
      }
      // Dashboard layout will enforce the allowed_users check
      router.push("/dashboard");
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string }> };
      setError(clerkError.errors?.[0]?.message ?? "Invalid or expired code. Try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setResent(false);
    try {
      if (mode === "sign_in" && signIn) {
        const emailFactor = signIn.supportedFirstFactors?.find(
          (f) => f.strategy === "email_code"
        );
        if (emailFactor && "emailAddressId" in emailFactor) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailFactor.emailAddressId,
          });
        }
      } else if (signUp) {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      }
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch {
      setError("Failed to resend code. Try again.");
    } finally {
      setResending(false);
    }
  };

  if (stage === "email") {
    return (
      <AuthCard>
        <h1 className="text-xl font-bold text-center text-gray-900 mb-6">Login</h1>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
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
          By continuing, you agree to Beach Events&apos; Terms of Service and Privacy
          Policy.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <h1 className="text-xl font-bold text-center text-gray-900 mb-2">
        Check your email
      </h1>
      <p className="text-sm text-gray-400 text-center mb-6">
        We sent a 6-digit code to <span className="text-gray-600">{email}</span>
      </p>

      <form onSubmit={handleCodeSubmit} className="space-y-4">
        <div
          className="flex justify-between gap-1.5 sm:gap-2"
          role="group"
          aria-label="One-time password"
          onPaste={handleOtpPaste}
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
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
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
          {loading ? "Verifying..." : "Verify →"}
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
