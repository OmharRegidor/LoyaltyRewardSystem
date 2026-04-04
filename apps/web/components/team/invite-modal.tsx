// apps/web/components/team/invite-modal.tsx

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  X,
  UserPlus,
  Mail,
  User,
  MapPin,
  Loader2,
  CheckCircle,
  Copy,
  AlertCircle,
} from "lucide-react";

interface InviteModalProps {
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalState = "form" | "submitting" | "success" | "error";

interface CreateAccountResponse {
  success: boolean;
  userId?: string;
  email?: string;
  error?: string;
  code?: string;
}

export function InviteModal({
  businessId,
  onClose,
  onSuccess,
}: InviteModalProps) {
  const [state, setState] = useState<ModalState>("form");
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [branchName, setBranchName] = useState("");

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Valid email is required");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setState("submitting");
    setError("");

    const supabase = createClient();

    try {
      // Get current user (owner)
      const {
        data: { user: owner },
      } = await supabase.auth.getUser();
      if (!owner) {
        setError("You must be logged in");
        setState("form");
        return;
      }

      // Create the invite record only. Invitee will set their own password
      // when they open the link.
      const { data: invite, error: inviteError } = await supabase
        .from("staff_invites")
        .insert({
          business_id: businessId,
          email: email.toLowerCase().trim(),
          name: name.trim(),
          role: "cashier",
          branch_name: branchName.trim() || null,
          invited_by: owner.id,
          status: "pending",
        })
        .select("token")
        .single();

      if (inviteError) {
        setError(inviteError.message);
        setState("form");
        return;
      }

      // Generate invite link
      const link = `${window.location.origin}/invite/${invite.token}`;
      setInviteLink(link);
      setState("success");

      // Send invite email (non-blocking)
      try {
        const { data: business } = await supabase
          .from("businesses")
          .select("name")
          .eq("id", businessId)
          .single();

        const res = await fetch("/api/staff/send-invite-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            staffName: name.trim(),
            businessName: business?.name || "Your Business",
            inviteUrl: link,
            role: "cashier",
          }),
        });
        const result = await res.json();
        setEmailSent(result.success);
      } catch {
        setEmailSent(false);
      }
    } catch (err) {
      console.error("Invite creation error:", err);
      setError("Failed to create invite. Please try again.");
      setState("form");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDone = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-2xl w-full max-w-md border border-border/50 shadow-2xl max-h-[90vh] overflow-y-auto border-t-2 border-t-primary">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-primary rounded-t-2xl z-10">
          <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2 tracking-tight">
            <UserPlus className="w-5 h-5 text-white" />
            {state === "success" ? "Invite Created!" : "Invite Staff/Cashier"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {state === "success" ? (
            // Success State
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-muted-foreground">
                  {emailSent === true ? (
                    <>Invite sent to <span className="text-foreground font-medium">{email}</span></>
                  ) : emailSent === false ? (
                    <>Invite created for <span className="text-foreground font-medium">{name}</span> <span className="text-amber-600">(email could not be sent)</span></>
                  ) : (
                    <>Invite created for <span className="text-foreground font-medium">{name}</span></>
                  )}
                </p>
                {branchName && (
                  <p className="text-muted-foreground text-sm">Branch: {branchName}</p>
                )}
              </div>

              {/* Invite Link */}
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-2">Share this link:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-foreground text-sm truncate">
                    {inviteLink}
                  </code>
                  <button
                    onClick={copyLink}
                    className={`p-2 rounded-lg transition-colors ${
                      copied
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-primary hover:bg-primary/90"
                    }`}
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Copy className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Invite instructions */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-amber-800 font-medium">
                      {emailSent ? "Email sent! As a backup, you can also:" : "Share with your cashier:"}
                    </p>
                    <ul className="text-amber-700 mt-2 space-y-1">
                      <li>• {emailSent ? "Copy and share the invite link above" : "The invite link above"}</li>
                      <li>
                        • They will be able to create their own account and
                        password when they open the link.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDone}
                className="w-full py-3 bg-secondary hover:bg-secondary/90 text-foreground border border-border rounded-xl font-medium transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            // Form State
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cashier Name <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter cashier's name"
                    className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-all"
                    disabled={state === "submitting"}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cashier@email.com"
                    className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-all"
                    disabled={state === "submitting"}
                  />
                </div>
              </div>

              {/* Branch Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Branch Name <span className="text-muted-foreground">(optional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g., San Pedro Branch"
                    className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-all"
                    disabled={state === "submitting"}
                  />
                </div>
              </div>

              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200/60 rounded-xl p-4">
                Invitees will create their own account and password when they
                open the link.
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={state === "submitting"}
                className="w-full py-3 bg-secondary hover:bg-secondary/90 text-foreground border border-border rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {state === "submitting" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Invite...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Invite
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
