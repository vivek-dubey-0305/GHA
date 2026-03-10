import { config } from "dotenv";
config();

import { SignJWT, importJWK } from "jose";

const SIGNING_KEY_ID = process.env.CLOUDFLARE_STREAM_KEY_ID;
const SIGNING_JWK_B64 = process.env.CLOUDFLARE_STREAM_JWK;
const STREAM_SUBDOMAIN = process.env.CLOUDFLARE_STREAM_SUBDOMAIN;

// The live input that has an active stream
const LIVE_INPUT_UID = "eeded29dbd7111e88fd008b5786b8e7b";

async function main() {
    const now = Math.floor(Date.now() / 1000);
    const jwkJson = JSON.parse(Buffer.from(SIGNING_JWK_B64, "base64").toString("utf-8"));
    const privateKey = await importJWK(jwkJson, "RS256");

    const token = await new SignJWT({
        sub: LIVE_INPUT_UID,
        kid: SIGNING_KEY_ID,
        exp: now + 3600,
        nbf: now - 60,
    })
    .setProtectedHeader({ alg: "RS256", kid: SIGNING_KEY_ID })
    .sign(privateKey);

    const hlsUrl = `https://${STREAM_SUBDOMAIN}/${token}/manifest/video.m3u8`;

    const resp = await fetch(hlsUrl);
    console.log(`Status: ${resp.status} ${resp.statusText}`);
    
    if (resp.ok) {
        const body = await resp.text();
        console.log("\nManifest (first 400 chars):");
        console.log(body.substring(0, 400));
        console.log("\n=== SHAREABLE HLS URL (valid 1hr) ===");
        console.log(hlsUrl);
    } else {
        console.log("FAILED - still 401");
    }
}

main().catch(console.error);
