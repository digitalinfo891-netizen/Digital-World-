
"use client";

import { useEffect, useState } from "react";

export default function SettingsForm() {
  const [price, setPrice] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/admin/settings");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load settings.");
        }

        setPrice(
          data.membershipPriceInr == null
            ? ""
            : String(data.membershipPriceInr)
        );
        setEnabled(data.membershipEnabled);
        setConfigured(data.configured);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Loading failed."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, []);

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipPriceInr: Number(price),
          membershipEnabled: enabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save settings.");
      }

      setConfigured(true);
      setMessage("Platform settings saved successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Saving failed."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-8 text-slate-600 shadow">
        Loading platform settings...
      </div>
    );
  }

  return (
    <form onSubmit={saveSettings} className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h2 className="text-xl font-bold text-slate-900">
          Lifetime Membership
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Set the one-time lifetime membership price for new members.
        </p>

        <div className="mt-6 max-w-md">
          <label
            htmlFor="membershipPrice"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Membership Price (INR)
          </label>

          <div className="flex items-center rounded-xl border border-slate-300 px-4">
            <span className="text-lg font-bold text-slate-500">₹</span>
            <input
              id="membershipPrice"
              type="number"
              min="0.01"
              max="10000000"
              step="0.01"
              required
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="w-full border-0 bg-transparent p-4 text-xl font-bold text-slate-900 outline-none"
              placeholder="Enter membership price"
            />
          </div>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="mt-1 h-5 w-5"
          />
          <span>
            <span className="block font-semibold text-slate-900">
              Enable new membership purchases
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              Disabling this prevents new membership payment requests.
              Existing members retain their lifetime access.
            </span>
          </span>
        </label>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          {configured
            ? "A membership price has been configured."
            : "Membership pricing has not been configured yet. New membership purchases should remain unavailable."}
        </div>

        <button
          type="submit"
          disabled={saving || !price || Number(price) <= 0}
          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Platform Settings"}
        </button>

        {message && (
          <p
            role="status"
            className="mt-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-700"
          >
            {message}
          </p>
        )}
      </section>
    </form>
  );
}
