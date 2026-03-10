import { config } from "dotenv";
config();

import { SignJWT, importJWK } from "jose";

const SIGNING_KEY_ID = process.env.CLOUDFLARE_STREAM_KEY_ID;
const SIGNING_JWK_B64 = process.env.CLOUDFLARE_STREAM_JWK;
const STREAM_SUBDOMAIN = process.env.CLOUDFLARE_STREAM_SUBDOMAIN;
const LIVE_INPUT_ID = process.env.CLOUDFLARE_LIVE_INPUT_ID;

async function main() {
    console.log("KEY_ID:", SIGNING_KEY_ID);
    console.log("SUBDOMAIN:", STREAM_SUBDOMAIN);
    console.log("LIVE_INPUT_ID:", LIVE_INPUT_ID);
    console.log("JWK length:", SIGNING_JWK_B64?.length);

    // Decode JWK
    const jwkJson = JSON.parse(Buffer.from(SIGNING_JWK_B64, "base64").toString("utf-8"));
    console.log("\nJWK alg:", jwkJson.alg, "kty:", jwkJson.kty, "kid:", jwkJson.kid);

    // Import key
    const privateKey = await importJWK(jwkJson, "RS256");
    console.log("Key imported successfully");

    // Sign token
    const token = await new SignJWT({ sub: LIVE_INPUT_ID })
        .setProtectedHeader({ alg: "RS256", kid: SIGNING_KEY_ID })
        .setExpirationTime("1h")
        .sign(privateKey);

    console.log("\nToken length:", token.length);
    console.log("Token (first 80 chars):", token.substring(0, 80) + "...");

    const hlsUrl = `https://${STREAM_SUBDOMAIN}/${token}/manifest/video.m3u8`;
    console.log("\n=== HLS PLAYBACK URL ===");
    console.log(hlsUrl);
    console.log("\n=== TEST WITH CURL ===");
    console.log(`curl -s -o /dev/null -w "%{http_code}" "${hlsUrl}"`);
}

main().catch(e => {
    console.error("FAILED:", e.message);
    console.error(e.stack);
});
