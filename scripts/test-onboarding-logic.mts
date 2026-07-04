import assert from "node:assert/strict";
import {
  isOnboardingComplete,
  isOnboardingPathAllowed,
  isOnboardingSetupComplete,
  needsOnboardingConfirmation,
  resolveOnboardingCookieFlags,
} from "../apps/web/src/lib/onboarding-logic.ts";

const fresh = { hasVenue: false, hasItem: false };
const withVenue = { hasVenue: true, hasItem: false };
const withCatalog = { hasVenue: true, hasItem: true };
const afterQr = { hasVenue: true, hasItem: true };

assert.equal(isOnboardingSetupComplete(fresh, false), false);
assert.equal(isOnboardingSetupComplete(withVenue, false), false);
assert.equal(isOnboardingSetupComplete(withCatalog, false), false);
assert.equal(isOnboardingSetupComplete(withCatalog, true), true);

assert.equal(isOnboardingComplete(withCatalog, true, false), false);
assert.equal(isOnboardingComplete(withCatalog, true, true), true);
assert.equal(needsOnboardingConfirmation(withCatalog, true, false), true);
assert.equal(needsOnboardingConfirmation(withCatalog, true, true), false);

assert.equal(isOnboardingPathAllowed("/dashboard/menus", withVenue, false, false), false);
assert.equal(isOnboardingPathAllowed("/dashboard", withVenue, false, false), true);
assert.equal(isOnboardingPathAllowed("/dashboard/billing", withVenue, false, false), true);
assert.equal(isOnboardingPathAllowed("/dashboard/menus", withCatalog, true, true), true);

const stale = resolveOnboardingCookieFlags(withVenue, true, true);
assert.equal(stale.qrVisited, false);
assert.equal(stale.confirmed, false);

const valid = resolveOnboardingCookieFlags(afterQr, true, false);
assert.equal(valid.qrVisited, true);
assert.equal(valid.confirmed, false);

console.log("onboarding-logic: all assertions passed");
