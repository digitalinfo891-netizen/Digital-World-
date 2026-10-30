"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const countries = getCountries()
  .map((country) => ({
    country,
    code: `+${getCountryCallingCode(country)}`,
    name: regionNames.of(country) ?? country,
  }))
  .sort((a, b) => {
    if (a.country === "IN") return -1;
    if (b.country === "IN") return 1;
    return a.name.localeCompare(b.name);
  });

export default function AuthForm({
  mode,
}: {
  mode: "login" | "register";
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("IN");
  const [mounted, setMounted] = useState(false);
  const countryCode = `+${getCountryCallingCode(selectedCountry)}`;
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const register = mode === "register";
  const isIndia = selectedCountry === "IN";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!register) return;
    const params = new URLSearchParams(window.location.search);
    const referral = params.get("ref");
    if (referral) {
      setReferralCode(referral.trim().slice(0, 32).toUpperCase());
    }
  }, [register]);

  function getPhoneE164(): string {
    let digits = phone.replace(/\D/g, "");
    const countryDigits = countryCode.replace(/\D/g, "");

    if (digits.startsWith(countryDigits) && digits.length > 10) {
      digits = digits.slice(countryDigits.length);
    }
    digits = digits.replace(/^0+/, "");
    return `${countryCode}${digits}`;
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const phoneE164 = getPhoneE164();

    if (register && !name.trim()) {
      setError("Enter your user name.");
      setBusy(false);
      return;
    }

    if (register && isIndia && !/^\+91[6-9]\d{9}$/.test(phoneE164)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      setBusy(false);
      return;
    }

    if (register && !isIndia && phoneE164.replace(/\D/g, "").length < 7) {
      setError("Enter a valid mobile number with your country code.");
      setBusy(false);
      return;
    }

    const normalizedPostalCode = postalCode.trim().toUpperCase();

    if (register && isIndia && !/^\d{6}$/.test(normalizedPostalCode)) {
      setError("Enter a valid 6-digit Indian PIN code.");
      setBusy(false);
      return;
    }

    if (
      register &&
      !isIndia &&
      !/^[A-Z0-9][A-Z0-9 -]{0,10}[A-Z0-9]$/.test(normalizedPostalCode)
    ) {
      setError("Enter a valid postal or ZIP code for your country.");
      setBusy(false);
      return;
    }
    if (register && !isIndia && !email.trim()) {
      setError("Email address is required for international accounts.");
      setBusy(false);
      return;
    }

    if (!register && !username.trim()) {
      setError("Enter your mobile number or email address.");
      setBusy(false);
      return;
    }

    try {
      const payload = register
        ? {
            name: name.trim(),
            countryCode,
            phoneE164,
            postalCode: normalizedPostalCode,
            email: isIndia ? null : email.trim().toLowerCase(),
            password,
            ...(referralCode.trim()
              ? { referralCode: referralCode.trim().toUpperCase() }
              : {}),
          }
        : {
            username: username.trim(),
            password,
          };

      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Request failed. Please try again.");
        return;
      }

      router.replace(data.redirectTo || "/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

  return (
    <form onSubmit={submit} className="space-y-5">
      {register && (
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">
            User Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Enter your full name"
          />
        </div>
      )}

      {!register && (
        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">
            User Name
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            maxLength={254}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
            placeholder="Mobile number or email address"
          />
        </div>
      )}

      {register && (
        <>
      <div>
        <label htmlFor="countryCode" className="mb-2 block text-sm font-semibold text-slate-700">
          Country / Region
        </label>
        <select
          id="countryCode"
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value as CountryCode)}
          className={inputClass}
        >
          {mounted && countries.map((country) => (
            <option key={country.country} value={country.country}>
              {country.name} ({country.code})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-700">
          Mobile number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          placeholder={isIndia ? "10-digit mobile number" : "Mobile number"}
        />
        <p className="mt-1 text-xs text-slate-500">
          Country code: {countryCode}
        </p>
      </div>

            <div>
        <label htmlFor="postalCode" className="mb-2 block text-sm font-semibold text-slate-700">
          PIN Code / Post Code
        </label>
        <input
          id="postalCode"
          name="postalCode"
          type="text"
          autoComplete="postal-code"
          required
          maxLength={16}
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
          className={inputClass}
          placeholder={isIndia ? "Enter 6-digit PIN code" : "Enter postal / ZIP code"}
        />
        <p className="mt-1 text-xs text-slate-500">
          {isIndia ? "Enter exactly 6 digits." : "Enter your local postal or ZIP code."}
        </p>
      </div>
<div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
          Email address {isIndia ? "(optional)" : ""}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required={!isIndia}
          disabled={isIndia}
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}
          placeholder={isIndia ? "Not required for Indian accounts" : "you@example.com"}
        />
      </div>
        </>
      )}

      {register && (
        <div>
          <label htmlFor="referralCode" className="mb-2 block text-sm font-semibold text-slate-700">
            Referral code <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="referralCode"
            name="referralCode"
            type="text"
            autoComplete="off"
            maxLength={32}
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            placeholder="Enter referral code"
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          required
          minLength={register ? 8 : 1}
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder={register ? "At least 8 characters" : "Enter your password"}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-emerald-700 px-4 py-3.5 font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Please wait..." : register ? "Create account" : "Sign in"}
      </button>

      <p className="text-center text-sm text-slate-600">
        {register ? "Already registered?" : "New to DIGITAL WORD?"}{" "}
        <Link
          className="font-semibold text-emerald-700 hover:underline"
          href={register ? "/login" : "/register"}
        >
          {register ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}