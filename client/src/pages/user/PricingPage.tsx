import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, ArrowRight, Sun, Moon, BadgeCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@lib/axios";
import { cn } from "@lib/cn";
import { useThemeStore } from "@store/themeStore";
import { useAuthStore } from "@store/authStore";
import { useMySubscription } from "@features/subscription/api/subscription.api";
import type { Plan, BillingCycle, Subscription } from "@shared/types";

function getActivePlan(subscription: Subscription | null | undefined): Plan | null {
  if (!subscription) return null;
  if (!["active", "grace_period"].includes(subscription.status)) return null;
  if (!subscription.planId || typeof subscription.planId === "string") return null;
  return subscription.planId as Plan;
}

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const { theme, setTheme, resolvedTheme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans-public"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Plan[] }>("/plans");
      return data.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: subscription } = useMySubscription(isAuthenticated);
  const activePlan = getActivePlan(subscription);

  function getPlanAction(plan: Plan): {
    label: string;
    disabled: boolean;
    variant: "primary" | "secondary" | "ghost";
  } {
    if (!isAuthenticated) {
      return {
        label: plan.price.monthly === 0 ? "Start free" : "Get started",
        disabled: false,
        variant: plan.badge ? "primary" : plan.price.monthly === 0 ? "ghost" : "secondary",
      };
    }

    if (activePlan?._id === plan._id) {
      return { label: "Current plan", disabled: true, variant: "ghost" };
    }

    if (activePlan) {
      const isUpgrade = plan.tier > activePlan.tier;
      return {
        label: isUpgrade ? "Upgrade" : "Downgrade",
        disabled: false,
        variant: isUpgrade ? "primary" : "ghost",
      };
    }

    return {
      label: plan.price.monthly === 0 ? "Start free" : "Get started",
      disabled: false,
      variant: plan.badge ? "primary" : plan.price.monthly === 0 ? "ghost" : "secondary",
    };
  }

  function handlePlanClick(plan: Plan) {
    if (!isAuthenticated) {
      navigate(`/register?plan=${plan.slug}`);
      return;
    }
    navigate(`/plans?autoselect=${plan.slug}`);
  }

  const yearlyDiscount = (monthly: number, yearly: number) =>
    monthly > 0 ? Math.round((1 - yearly / 12 / monthly) * 100) : 0;

  return (
    <div className={cn("min-h-screen", resolvedTheme === "dark" ? "dark" : "")}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        {/* Nav */}
        <nav className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">SubDash</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <section className="px-6 pb-16 pt-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-2xl"
          >
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300">
              <Zap className="h-3 w-3" />
              Simple, transparent pricing
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              Plans that grow
              <br />
              <span className="text-brand-600 dark:text-brand-400">with your business</span>
            </h1>
            <p className="mt-5 text-lg text-zinc-500 dark:text-zinc-400">
              Start free. Upgrade when you need more. No hidden fees, no surprises.
            </p>
          </motion.div>

          {/* Billing toggle */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-8 flex items-center justify-center gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 w-fit mx-auto"
          >
            {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={cn(
                  "rounded-lg px-5 py-2 text-sm font-medium capitalize transition-all",
                  billingCycle === cycle
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                {cycle}
                {cycle === "yearly" && billingCycle !== "yearly" && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                    -30%
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        </section>

        {/* Plans */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-6xl">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-96 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {plans?.map((plan, idx) => {
                  const price =
                    billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;
                  const discount = yearlyDiscount(plan.price.monthly, plan.price.yearly);
                  const isPopular = !!plan.badge;
                  const isCurrent = activePlan?._id === plan._id;
                  const action = getPlanAction(plan);

                  return (
                    <motion.div
                      key={plan._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.07 }}
                      className={cn(
                        "relative flex flex-col rounded-2xl border bg-white p-6 dark:bg-zinc-900",
                        isCurrent
                          ? "border-emerald-400 shadow-lg shadow-emerald-100 dark:border-emerald-600 dark:shadow-emerald-950/50"
                          : isPopular
                          ? "border-brand-400 shadow-lg shadow-brand-100 dark:border-brand-600 dark:shadow-brand-950/50"
                          : "border-zinc-200 dark:border-zinc-800"
                      )}
                    >
                      {/* Badges — current plan takes priority over popular */}
                      {isCurrent ? (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-1 text-xs font-bold text-white shadow-md">
                            <BadgeCheck className="h-3 w-3" />
                            Current plan
                          </span>
                        </div>
                      ) : isPopular ? (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <span className="rounded-full bg-brand-600 px-4 py-1 text-xs font-bold text-white shadow-md">
                            {plan.badge}
                          </span>
                        </div>
                      ) : null}

                      <div className="mb-5">
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                          {plan.name}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {plan.description}
                        </p>
                      </div>

                      <div className="mb-5">
                        <div className="flex items-end gap-1">
                          <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                            ${price}
                          </span>
                          {price > 0 && (
                            <span className="mb-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                              /{billingCycle === "yearly" ? "yr" : "mo"}
                            </span>
                          )}
                        </div>
                        {billingCycle === "yearly" && discount > 0 && (
                          <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Save {discount}% vs monthly billing
                          </p>
                        )}
                        {price === 0 && (
                          <p className="mt-1 text-xs text-zinc-400">Free forever, no card required</p>
                        )}
                      </div>

                      <ul className="mb-6 flex-1 space-y-2.5">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5">
                            <CheckCircle2 className={cn(
                              "mt-0.5 h-4 w-4 shrink-0",
                              isCurrent ? "text-emerald-500" : "text-emerald-500"
                            )} />
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => !action.disabled && handlePlanClick(plan)}
                        disabled={action.disabled}
                        className={cn(
                          "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
                          action.disabled
                            ? "cursor-default border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : action.variant === "primary"
                            ? "bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                            : action.variant === "secondary"
                            ? "border border-brand-300 text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-950/30"
                            : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        )}
                      >
                        {action.label}
                        {!action.disabled && <ArrowRight className="h-3.5 w-3.5" />}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Feature comparison table */}
        <section className="border-t border-zinc-200 bg-white px-6 py-16 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Compare plans
            </h2>
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Feature
                    </th>
                    {plans?.map((p) => (
                      <th
                        key={p._id}
                        className={cn(
                          "px-5 py-3 text-center text-xs font-medium uppercase tracking-wide",
                          activePlan?._id === p._id
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-zinc-500 dark:text-zinc-400"
                        )}
                      >
                        {p.name}
                        {activePlan?._id === p._id && (
                          <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                            yours
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {[
                    { label: "Storage", key: "storage_gb" as const, format: (v: number) => `${v >= 1000 ? `${v / 1000}TB` : `${v}GB`}` },
                    { label: "Team members", key: "team_members" as const, format: (v: number) => v >= 9999 ? "Unlimited" : `${v}` },
                    { label: "API access", key: "api_access" as const, format: (v: boolean | number) => v ? "✓" : "—" },
                    { label: "Priority support", key: "priority_support" as const, format: (v: boolean | number) => v ? "✓" : "—" },
                    { label: "Custom reports", key: "custom_reports" as const, format: (v: boolean | number) => v ? "✓" : "—" },
                  ].map((row) => (
                    <tr key={row.key} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="px-5 py-3 font-medium text-zinc-700 dark:text-zinc-300">{row.label}</td>
                      {plans?.map((p) => {
                        const val = p.featureFlags[row.key];
                        const formatted = row.format(val as never);
                        return (
                          <td
                            key={p._id}
                            className={cn(
                              "px-5 py-3 text-center",
                              activePlan?._id === p._id && "bg-emerald-50/50 dark:bg-emerald-950/10",
                              formatted === "✓" ? "text-emerald-600 dark:text-emerald-400 font-semibold" :
                              formatted === "—" ? "text-zinc-300 dark:text-zinc-700" :
                              "text-zinc-700 dark:text-zinc-300 font-medium"
                            )}
                          >
                            {formatted}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA footer */}
        <section className="bg-brand-600 px-6 py-16 text-center dark:bg-brand-700">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-white">Ready to get started?</h2>
            <p className="mt-2 text-brand-200">
              Join thousands of teams already using SubDash.
            </p>
            <Link
              to={isAuthenticated ? "/plans" : "/register"}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
            >
              {isAuthenticated ? "View all plans" : "Start free today"} <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-200 bg-white px-6 py-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} SubDash · Built with React + Fastify + MongoDB
          </p>
        </footer>
      </div>
    </div>
  );
}
