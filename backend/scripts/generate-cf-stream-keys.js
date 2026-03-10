/**
 * Cloudflare Stream — Signing Key Generator
 * ═══════════════════════════════════════════
 * 
 * Generates a signing key pair for creating self-signed tokens.
 * Uses Option 2 from Cloudflare docs (recommended for high volume).
 * 
 * Usage:
 *   node scripts/generate-cf-stream-keys.js
 * 
 * Prerequisites:
 *   - CLOUDFLARE_API_TOKEN in .env (with Stream:Edit permission)
 *   - R2_ACCOUNT_ID in .env (same as Cloudflare Account ID)
 * 
 * Output:
 *   - Appends CLOUDFLARE_STREAM_KEY_ID and CLOUDFLARE_STREAM_PRIVATE_KEY to .env
 */

import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

// Load env
config({ path: envPath });

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!ACCOUNT_ID || !API_TOKEN) {
    console.error("❌ Missing R2_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in .env");
    process.exit(1);
}

async function generateSigningKeys() {
    console.log("🔑 Generating Cloudflare Stream signing keys...\n");

    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/keys`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json",
        },
    });

    const data = await response.json();

    if (!data.success) {
        console.error("❌ Cloudflare API error:", JSON.stringify(data.errors, null, 2));
        process.exit(1);
    }

    const { id: keyId, pem, jwk } = data.result;

    console.log("✅ Signing key generated successfully!\n");
    console.log(`   Key ID: ${keyId}`);
    console.log(`   PEM (base64, first 50 chars): ${pem.substring(0, 50)}...`);
    console.log(`   JWK (base64, first 50 chars): ${jwk.substring(0, 50)}...\n`);

    // Read existing .env
    let envContent = fs.readFileSync(envPath, "utf-8");

    // Remove old keys if they exist
    envContent = envContent.replace(/^CLOUDFLARE_STREAM_KEY_ID=.*$/m, "").trim();
    envContent = envContent.replace(/^CLOUDFLARE_STREAM_PRIVATE_KEY=.*$/m, "").trim();
    envContent = envContent.replace(/^CLOUDFLARE_STREAM_JWK=.*$/m, "").trim();

    // Append new keys
    const newVars = [
        "",
        "# Cloudflare Stream Signing Keys (auto-generated, do NOT share)",
        `CLOUDFLARE_STREAM_KEY_ID=${keyId}`,
        `CLOUDFLARE_STREAM_PRIVATE_KEY=${pem}`,
        `CLOUDFLARE_STREAM_JWK=${jwk}`,
    ].join("\n");

    envContent += "\n" + newVars + "\n";

    fs.writeFileSync(envPath, envContent, "utf-8");

    console.log("✅ Keys written to .env file:");
    console.log("   CLOUDFLARE_STREAM_KEY_ID");
    console.log("   CLOUDFLARE_STREAM_PRIVATE_KEY");
    console.log("   CLOUDFLARE_STREAM_JWK");
    console.log("\n⚠️  These keys are shown ONCE by Cloudflare. Back up your .env file securely!");
}

generateSigningKeys().catch((err) => {
    console.error("❌ Failed to generate keys:", err.message);
    process.exit(1);
});
