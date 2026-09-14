const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const sb = createClient(url, key);

async function verifySchema() {
  console.log("==================================================");
  console.log("BITC Supabase Database & Migration Verification");
  console.log("Supabase Host:", url);
  console.log("==================================================\n");

  const requiredTables = [
    { name: "profiles", desc: "User profiles, roles (creative/business/user), avatars" },
    { name: "jobs", desc: "Studio job opportunities & briefs" },
    { name: "events", desc: "Brunch events, dates, cities" },
    { name: "posts", desc: "Community posts and discussions" },
    { name: "portfolio_items", desc: "Creative portfolio projects & case studies" },
    { name: "reviews", desc: "Client & peer creative reviews" },
    { name: "job_applications", desc: "Job candidate applications with case studies" },
    { name: "rooms", desc: "Live audio rooms and topics" },
    { name: "room_participants", desc: "Active room speakers and listeners" },
    { name: "event_tickets", desc: "Event passes with BITC-XXXX-YYYY codes" },
    { name: "mentorship_bookings", desc: "1:1 mentor sessions and status" },
    { name: "user_products", desc: "Claimed digital marketplace assets" },
    { name: "course_enrollments", desc: "Learning progress and completed lessons" },
    { name: "messages", desc: "1:1 direct messaging threads" },
    { name: "payment_transactions", desc: "Ledger for tickets, mentorship, assets" },
  ];

  let presentCount = 0;
  let missingCount = 0;
  const missingTables = [];

  for (const t of requiredTables) {
    try {
      const { data, error } = await sb.from(t.name).select("*").limit(1);
      if (error) {
        console.log(`❌ [MISSING]  ${t.name.padEnd(22)} — ${t.desc}`);
        missingCount++;
        missingTables.push(t.name);
      } else {
        console.log(`✅ [ACTIVE]   ${t.name.padEnd(22)} — ${t.desc} (${data.length} sample row)`);
        presentCount++;
      }
    } catch (err) {
      console.log(`❌ [ERROR]    ${t.name.padEnd(22)} — ${err.message}`);
      missingCount++;
      missingTables.push(t.name);
    }
  }

  console.log("\n==================================================");
  console.log(`Summary: ${presentCount} Active / ${missingCount} Pending Migration`);
  console.log("==================================================");

  if (missingTables.length > 0) {
    console.log("\nPending Tables to run in Supabase SQL Editor:");
    console.log("👉 File: supabase/migrations/004_production_remediation_schema.sql");
    const projId = url.split("//")[1].split(".")[0];
    console.log(`👉 Supabase SQL Editor URL: https://supabase.com/dashboard/project/${projId}/sql`);
  } else {
    console.log("\n🎉 All database tables are fully active in Supabase Cloud!");
  }
}

verifySchema().catch(console.error);
