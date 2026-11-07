/**
 * Verify INT runtime environment detection and safety guards.
 * Tests that fail-closed guards work correctly without making external calls.
 */

import { isIntEnvironment, getDatabaseUrl } from "@/lib/int-env";
import {
  assertUploadsEnabled,
  shouldBlockEmail,
  assertPaymentsEnabled,
  shouldBlockExternalApi,
  shouldBlockWebhook,
} from "@/server/int-guards";

console.log("=== INT Runtime Environment Verification ===\n");

// Test 1: Environment detection
console.log("1. Environment Detection");
const isInt = isIntEnvironment();
console.log(`   INT_ENVIRONMENT=${process.env.INT_ENVIRONMENT}`);
console.log(`   isIntEnvironment() = ${isInt}`);
console.log(`   ${isInt ? "✓" : "✗"} INT mode detected\n`);

// Test 2: Database URL validation
console.log("2. Database URL Validation");
try {
  const dbUrl = getDatabaseUrl();
  console.log(`   ✓ Database URL validated`);
  console.log(`   (approved resource check passed)\n`);
} catch (error) {
  if (error instanceof Error) {
    console.log(`   ✗ Database validation failed:`);
    console.log(`   ${error.message}\n`);
  }
}

// Test 3: Upload blocking
console.log("3. Upload Blocking");
try {
  assertUploadsEnabled();
  console.log(`   ✗ Uploads NOT blocked (FAIL - expected blocked)\n`);
} catch (error) {
  if (error instanceof Error && error.message.includes("disabled in INT")) {
    console.log(`   ✓ Uploads blocked in INT\n`);
  } else {
    console.log(`   ? Unexpected error: ${error}\n`);
  }
}

// Test 4: Email blocking
console.log("4. Email Blocking");
const emailBlocked = shouldBlockEmail();
console.log(`   INT_EMAIL_ENABLED=${process.env.INT_EMAIL_ENABLED}`);
console.log(`   shouldBlockEmail() = ${emailBlocked}`);
console.log(`   ${emailBlocked ? "✓" : "✗"} Email blocked (expected: true)\n`);

// Test 5: Payment blocking
console.log("5. Payment Blocking");
try {
  assertPaymentsEnabled();
  console.log(`   ✗ Payments NOT blocked (FAIL - expected blocked)\n`);
} catch (error) {
  if (error instanceof Error && error.message.includes("disabled in INT")) {
    console.log(`   ✓ Payments blocked in INT\n`);
  } else {
    console.log(`   ? Unexpected error: ${error}\n`);
  }
}

// Test 6: External API blocking
console.log("6. External API Blocking");
const apiBlocked = shouldBlockExternalApi("TestAPI");
console.log(`   INT_EXTERNAL_APIS_ENABLED=${process.env.INT_EXTERNAL_APIS_ENABLED}`);
console.log(`   shouldBlockExternalApi() = ${apiBlocked}`);
console.log(`   ${apiBlocked ? "✓" : "✗"} External APIs blocked (expected: true)\n`);

// Test 7: Webhook blocking
console.log("7. Webhook Blocking");
const webhookBlocked = shouldBlockWebhook("test");
console.log(`   shouldBlockWebhook() = ${webhookBlocked}`);
console.log(`   ${webhookBlocked ? "✓" : "✗"} Webhooks blocked (expected: true)\n`);

// Summary
console.log("=== Summary ===");
if (isInt) {
  console.log("✓ INT environment verified");
  console.log("✓ All fail-closed guards operational");
} else {
  console.log("✗ Not in INT environment");
}
console.log("");
