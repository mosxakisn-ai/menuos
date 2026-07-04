#!/usr/bin/env node
/**
 * MenuOS Stripe setup — ξεχωριστό από MatchWork / GoFleet.
 *
 * Usage:
 *   MENUOS_STRIPE_SECRET_KEY=sk_live_... node scripts/setup-menuos-stripe.mjs
 *   MENUOS_STRIPE_SECRET_KEY=sk_live_... node scripts/setup-menuos-stripe.mjs --domain=menuos.gr
 *   MENUOS_STRIPE_SECRET_KEY=sk_live_... node scripts/setup-menuos-stripe.mjs --write-env=/opt/menuos/.env
 */

import fs from "node:fs";

const STRIPE_API = "https://api.stripe.com/v1";
const DEFAULT_DOMAIN = "menuos.gr";

const key = process.env.MENUOS_STRIPE_SECRET_KEY?.trim();
const domainArg = process.argv.find((a) => a.startsWith("--domain="));
const writeEnvArg = process.argv.find((a) => a.startsWith("--write-env="));
const writeEnvPath = writeEnvArg?.split("=")[1];
const domain = domainArg?.split("=")[1] ?? DEFAULT_DOMAIN;
const webhookUrl = `https://${domain}/api/billing/webhook`;

if (!key) {
  console.error(`
ERROR: MENUOS_STRIPE_SECRET_KEY is required.

Do NOT use MatchWork keys. Create a new restricted key in Stripe Dashboard:
  Name: MenuOS Production
  Permissions: Checkout Sessions Write, Webhook Endpoints Write

Then run:
  MENUOS_STRIPE_SECRET_KEY=sk_live_... node scripts/setup-menuos-stripe.mjs
`);
  process.exit(1);
}

async function stripeGet(path) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? `Stripe GET ${path} failed (${res.status})`);
  return data;
}

async function stripePost(path, body) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body instanceof URLSearchParams ? body.toString() : body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? `Stripe POST ${path} failed (${res.status})`);
  return data;
}

function upsertEnvValue(envPath, envKey, envValue) {
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  content = content.replace(/\r/g, "");
  const line = `${envKey}=${envValue}`;
  const re = new RegExp(`^${envKey}=.*$`, "m");
  if (re.test(content)) {
    content = content.replace(re, line);
  } else {
    if (content.length && !content.endsWith("\n")) content += "\n";
    content += `${line}\n`;
  }
  fs.writeFileSync(envPath, content);
}

async function main() {
  console.log("MenuOS Stripe setup");
  console.log("====================");
  console.log(`Domain:  ${domain}`);
  console.log(`Webhook: ${webhookUrl}`);
  console.log("");

  const account = await stripeGet("/account");
  console.log(`Stripe account: ${account.settings?.dashboard?.display_name ?? account.id}`);
  console.log(`Country: ${account.country}`);
  console.log("");

  const existing = await stripeGet("/webhook_endpoints?limit=100");
  const menuosHook = (existing.data ?? []).find(
    (ep) => ep.url === webhookUrl || ep.metadata?.app === "menuos",
  );

  let webhookSecret;

  if (menuosHook) {
    console.log(`Webhook already exists: ${menuosHook.id}`);
    console.log(`URL: ${menuosHook.url}`);
    const rolled = await stripePost(`/webhook_endpoints/${menuosHook.id}/secret`, new URLSearchParams());
    webhookSecret = rolled.secret;
    console.log("Rolled webhook signing secret for existing endpoint");
  } else {
    const params = new URLSearchParams();
    params.set("url", webhookUrl);
    params.set("description", "MenuOS — menuos.gr (NOT MatchWork)");
    params.set("enabled_events[0]", "checkout.session.completed");
    params.set("enabled_events[1]", "customer.subscription.deleted");
    params.set("enabled_events[2]", "customer.subscription.updated");
    params.set("enabled_events[3]", "invoice.paid");
    params.set("enabled_events[4]", "invoice.payment_failed");
    params.set("metadata[app]", "menuos");
    params.set("metadata[platform]", domain);
    params.set("metadata[product_line]", "menuos");

    const created = await stripePost("/webhook_endpoints", params);
    webhookSecret = created.secret;
    console.log(`Created webhook: ${created.id}`);
  }

  console.log("");
  console.log("Add to /opt/menuos/.env (production):");
  console.log("-------------------------------------");
  console.log(`MENUOS_STRIPE_SECRET_KEY=${key.slice(0, 12)}...`);
  console.log(`MENUOS_STRIPE_WEBHOOK_SECRET=${webhookSecret.slice(0, 10)}...`);

  if (writeEnvPath) {
    upsertEnvValue(writeEnvPath, "MENUOS_STRIPE_SECRET_KEY", key);
    upsertEnvValue(writeEnvPath, "MENUOS_STRIPE_WEBHOOK_SECRET", webhookSecret);
    console.log("");
    console.log(`Wrote Stripe keys to ${writeEnvPath}`);
  }

  console.log("");
  console.log("Restart:");
  console.log("  docker compose -f docker-compose.prod.yml up -d menuos-web");
  console.log("");
  console.log("Verify:");
  console.log(`  curl -s https://${domain}/api/billing`);
  console.log('  → {"stripeEnabled":true,"app":"menuos",...}');
  console.log("");
  console.log("Stripe Dashboard — filter MenuOS payments only:");
  console.log("  Payments → Filter → Metadata → app = menuos");
  console.log("  Or search: client_reference_id starts with menuos:");
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
