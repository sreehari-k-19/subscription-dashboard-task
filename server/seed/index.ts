import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { env } from "../src/config/env";
import { Plan } from "../src/models/Plan.model";
import { User } from "../src/models/User.model";

const plans = [
  {
    name: "Starter",
    slug: "starter",
    description: "Perfect for individuals and small projects getting started.",
    price: { monthly: 0, yearly: 0 },
    currency: "USD",
    tier: 1,
    duration: 30,
    isActive: true,
    badge: null,
    features: [
      "Up to 3 projects",
      "5 GB storage",
      "Email support",
      "Basic analytics",
      "1 team member",
    ],
    featureFlags: {
      api_access: false,
      priority_support: false,
      custom_reports: false,
      team_members: 1,
      storage_gb: 5,
    },
    stripePriceIds: { monthly: "", yearly: "" },
  },
  {
    name: "Basic",
    slug: "basic",
    description: "Great for freelancers and growing teams with more needs.",
    price: { monthly: 12, yearly: 99 },
    currency: "USD",
    tier: 2,
    duration: 30,
    isActive: true,
    badge: null,
    features: [
      "Up to 15 projects",
      "20 GB storage",
      "Priority email support",
      "Advanced analytics",
      "3 team members",
      "API access",
    ],
    featureFlags: {
      api_access: true,
      priority_support: false,
      custom_reports: false,
      team_members: 3,
      storage_gb: 20,
    },
    stripePriceIds: { monthly: "", yearly: "" },
  },
  {
    name: "Pro",
    slug: "pro",
    description: "Built for professional teams that need power and flexibility.",
    price: { monthly: 29, yearly: 249 },
    currency: "USD",
    tier: 3,
    duration: 30,
    isActive: true,
    badge: "Most Popular",
    features: [
      "Unlimited projects",
      "100 GB storage",
      "Priority chat & email support",
      "Custom reports",
      "10 team members",
      "API access",
      "Advanced integrations",
    ],
    featureFlags: {
      api_access: true,
      priority_support: true,
      custom_reports: true,
      team_members: 10,
      storage_gb: 100,
    },
    stripePriceIds: { monthly: "", yearly: "" },
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description: "Scalable solutions for large organizations with custom needs.",
    price: { monthly: 79, yearly: 699 },
    currency: "USD",
    tier: 4,
    duration: 30,
    isActive: true,
    badge: "Best Value",
    features: [
      "Unlimited projects",
      "1 TB storage",
      "24/7 dedicated support",
      "Custom reports & dashboards",
      "Unlimited team members",
      "API access",
      "SSO & SAML",
      "SLA guarantee",
      "Custom integrations",
    ],
    featureFlags: {
      api_access: true,
      priority_support: true,
      custom_reports: true,
      team_members: 9999,
      storage_gb: 1000,
    },
    stripePriceIds: { monthly: "", yearly: "" },
  },
];

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI, { dbName: "subscription_dashboard" });
    console.log("✅ Connected to MongoDB Atlas");

    // Seed Plans
    await Plan.deleteMany({});
    const createdPlans = await Plan.insertMany(plans);
    console.log(`✅ Seeded ${createdPlans.length} plans`);

    // Seed Admin User
    const existingAdmin = await User.findOne({ email: env.ADMIN_EMAIL });
    if (existingAdmin) {
      console.log("ℹ️  Admin user already exists — skipping");
    } else {
      await User.create({
        name: "Admin",
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
        role: "admin",
        isActive: true,
        preferences: {
          notifications: true,
          emailAlerts: true,
          theme: "system",
        },
      });
      console.log(`✅ Admin user created: ${env.ADMIN_EMAIL}`);
    }

    // Summary
    console.log("\n--- Seed Summary ---");
    createdPlans.forEach((p) => {
      console.log(`  [Tier ${p.tier}] ${p.name} — $${p.price.monthly}/mo | $${p.price.yearly}/yr`);
    });
    console.log("--------------------\n");

    await mongoose.connection.close();
    console.log("✅ Seed complete. Connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seed();
