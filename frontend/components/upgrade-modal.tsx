"use client";

import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIERS = [
  {
    id: "starter",
    name: "Starter Pack",
    price: 200,
    credits: 5,
    description: "Perfect for single website owners",
    features: [
      "5 Complete SEO Audits",
      "Full Core Web Vitals report",
      "AI recommendations from Gemini",
      "PDF export downloads",
    ],
    bgColor: "bg-white",
    btnColor: "bg-[#FFDE59]",
    badge: null,
  },
  {
    id: "pro",
    name: "Pro Pack",
    price: 400,
    credits: 12,
    description: "Best value for freelancers & SMBs",
    features: [
      "12 Complete SEO Audits",
      "Priority BullMQ queue parsing",
      "Full Core Web Vitals report",
      "AI recommendations from Gemini",
      "Professional PDF exports",
    ],
    bgColor: "bg-[#ffe26d] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
    btnColor: "bg-[#FF5757] text-white",
    badge: "🔥 POPULAR (Best Value)",
  },
  {
    id: "agency",
    name: "Agency Pack",
    price: 1000,
    credits: 35,
    description: "Designed for marketing teams & agencies",
    features: [
      "35 Complete SEO Audits",
      "Priority BullMQ queue parsing",
      "Full Core Web Vitals report",
      "AI recommendations from Gemini",
      "Professional PDF exports",
      "24/7 Priority support access",
    ],
    bgColor: "bg-[#e2f1ff]",
    btnColor: "bg-black text-white",
    badge: "🚀 GROWTH",
  },
];

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { user, checkAuth } = useAuth();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async (tierId: string) => {
    setLoadingTier(tierId);
    setError(null);

    try {
      console.log(`[UpgradeModal] Initiating purchase for tier: ${tierId}`);

      // 1. Create Order on the Backend
      const { data: order } = await api.post("/billing/order", { tierId });

      // 2. Configure Razorpay Options
      // Uses public environment variable or standard test key fallback
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder_key";

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "SEO Health Scanner",
        description: `Purchase ${order.tierName}`,
        order_id: order.id,
        handler: async function (response: any) {
          console.debug("[UpgradeModal] Razorpay transaction response captured, sending to verification endpoint:", response);
          
          try {
            await api.post("/billing/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tierId,
            });

            await checkAuth();
            alert(`Payment verified successfully! Your ${order.tierName} credits are now active.`);
          } catch (verifyError: any) {
            console.error("[UpgradeModal] Verification failed:", verifyError);
            alert("Payment signature verification failed. Please contact support.");
          } finally {
            onClose();
          }
        },
        prefill: {
          email: user?.email || "",
          name: user?.name || "",
        },
        theme: {
          color: "#FF5757",
        },
      };

      // 3. Open Razorpay Popup
      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on("payment.failed", function (response: any) {
        console.error("[UpgradeModal] Razorpay payment failed:", response.error);
        alert(`Payment failed: ${response.error.description}`);
      });
      rzpInstance.open();
    } catch (err: any) {
      console.error("[UpgradeModal] Purchase error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to initialize payment gateway. Please ensure Razorpay is available."
      );
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl bg-white border-4 border-black p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-block bg-[#FFDE59] border-2 border-black px-3 py-1 font-bold text-sm transform -rotate-1">
            ⚡ GET MORE SEO SCANS
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tight">
            Upgrade Your Plan
          </h2>
          <p className="text-gray-600 font-medium">
            Cache hits remain free forever! Purchase a credit bundle below. Credits are deducted only on a scan Cache Miss (when running a new analysis).
          </p>
          {error && (
            <p className="text-red-500 font-bold bg-red-50 p-2 border-2 border-red-500 mt-2">
              {error}
            </p>
          )}
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`neo-card flex flex-col justify-between border-4 border-black p-6 transition-all duration-300 hover:translate-y-[-4px] ${tier.bgColor}`}
            >
              <div className="space-y-4">
                {/* Header Info */}
                <div className="space-y-2">
                  <div className="h-6">
                    {tier.badge && (
                      <span className="bg-black text-white text-xs font-bold px-2 py-0.5 uppercase tracking-wide">
                        {tier.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black uppercase">{tier.name}</h3>
                  <p className="text-sm font-medium text-gray-700">{tier.description}</p>
                </div>

                {/* Price */}
                <div className="py-2 border-y-2 border-black/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">₹{tier.price}</span>
                    <span className="text-gray-500 font-bold">one-time</span>
                  </div>
                  <p className="text-sm font-bold text-gray-500 mt-1">
                    {tier.credits} Scan Credits ({(tier.price / tier.credits).toFixed(1)}/scan)
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 pt-2">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm font-medium text-gray-800">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Checkout Action Button */}
              <button
                onClick={() => handlePurchase(tier.id)}
                disabled={loadingTier !== null}
                className={`neo-button w-full mt-8 flex items-center justify-center gap-2 text-lg uppercase transition-transform py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${tier.btnColor} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loadingTier === tier.id ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Opening Checkout...
                  </>
                ) : (
                  "Select Pack"
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
