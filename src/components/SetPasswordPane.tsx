import React, { useState } from "react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";
import { KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface SetPasswordPaneProps {
  onDone: () => void;
}

export default function SetPasswordPane({ onDone }: SetPasswordPaneProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      // Wait a moment to show success before navigating away
      setTimeout(async () => {
        await supabase.auth.signOut();
        onDone();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred while updating your password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 h-full bg-zinc-50 flex items-center justify-center p-4 md:p-8 select-none">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white border border-zinc-200 p-8 rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.01)]"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-5 h-5 text-zinc-600" />
          </div>
          <h1 className="text-lg font-medium text-zinc-900">Set New Password</h1>
          <p className="text-[12.5px] text-zinc-500 mt-1">Please enter a secure password for your account.</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
            <p className="text-sm font-medium text-zinc-900">Password set successfully!</p>
            <p className="text-[12px] text-zinc-500 mt-1">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11.5px] font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-[4px] text-red-600">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="text-[12px] leading-relaxed">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-zinc-900 text-white text-sm font-medium rounded-[4px] hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Set Password"
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
