import { config } from "dotenv";
config();

import { SignJWT, importJWK } from "jose";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const SIGNING_KEY_ID = process.env.CLOUDFLARE_STREAM_KEY_ID;
const SIGNING_JWK_B64 = process.env.CLOUDFLARE_STREAM_JWK;
const STREAM_SUBDOMAIN = process.env.CLOUDFLARE_STREAM_SUBDOMAIN;

const cfHeaders = {
    "Authorization": `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
};

async function main() {
    // 1. List all live inputs
    console.log("=== LISTING ALL LIVE INPUTS ===");
    const inputsResp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/live_inputs`,
        { headers: cfHeaders }
    );
    const inputsData = await inputsResp.json();
    
    if (!inputsData.success) {
        console.error("Failed to list inputs:", inputsData.errors);
        return;
    }

    for (const input of inputsData.result) {
        console.log(`\n  ID: ${input.uid}`);
        console.log(`  Name: ${input.meta?.name || 'unnamed'}`);
        console.log(`  Created: ${input.created}`);
        console.log(`  Status: ${JSON.stringify(input.status)}`);
        console.log(`  Recording mode: ${input.recording?.mode}`);
        console.log(`  requireSignedURLs: ${input.recording?.requireSignedURLs}`);
    }

    // 2. List videos (recordings from live inputs)
    console.log("\n\n=== LISTING VIDEOS ===");
    const videosResp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream?limit=5`,
        { headers: cfHeaders }
    );
    const videosData = await videosResp.json();
    
    if (videosData.success && videosData.result?.length) {
        for (const vid of videosData.result) {
            console.log(`\n  Video UID: ${vid.uid}`);
            console.log(`  Live Input: ${vid.liveInput || 'N/A'}`);
            console.log(`  Status: ${vid.status?.state}`);
            console.log(`  requireSignedURLs: ${vid.requireSignedURLs}`);
            console.log(`  Created: ${vid.created}`);
            console.log(`  Duration: ${vid.duration}s`);
        }
    } else {
        console.log("  No videos found");
    }

    // 3. List signing keys
    console.log("\n\n=== LISTING SIGNING KEYS ===");
    const keysResp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/keys`,
        { headers: cfHeaders }
    );
    const keysData = await keysResp.json();
    
    if (keysData.success) {
        for (const key of keysData.result) {
            console.log(`  Key ID: ${key.id}`);
            console.log(`  Created: ${key.created}`);
        }
    }

    // 4. Try signing with each live input UID
    console.log("\n\n=== TESTING SIGNED URLS ===");
    const jwkJson = JSON.parse(Buffer.from(SIGNING_JWK_B64, "base64").toString("utf-8"));
    const privateKey = await importJWK(jwkJson, "RS256");

    const uidsToTest = inputsData.result.map(i => i.uid);
    // Also add any video UIDs
    if (videosData.success && videosData.result) {
        for (const v of videosData.result) {
            if (!uidsToTest.includes(v.uid)) uidsToTest.push(v.uid);
        }
    }

    for (const uid of uidsToTest) {
        const token = await new SignJWT({ sub: uid })
            .setProtectedHeader({ alg: "RS256", kid: SIGNING_KEY_ID })
            .setExpirationTime("1h")
            .sign(privateKey);

        const hlsUrl = `https://${STREAM_SUBDOMAIN}/${token}/manifest/video.m3u8`;
        
        try {
            const resp = await fetch(hlsUrl);
            console.log(`\n  UID: ${uid} → ${resp.status} ${resp.statusText}`);
            if (resp.ok) {
                const body = await resp.text();
                console.log(`  Manifest (first 200):\n    ${body.substring(0, 200).replace(/\n/g, '\n    ')}`);
            }
        } catch (e) {
            console.log(`  UID: ${uid} → ERROR: ${e.message}`);
        }
    }
}

main().catch(e => {
    console.error("FAILED:", e.message);
    console.error(e.stack);
});
