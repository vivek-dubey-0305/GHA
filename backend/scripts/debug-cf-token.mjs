import { config } from "dotenv";
config();

import { SignJWT, importJWK } from "jose";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const SIGNING_KEY_ID = process.env.CLOUDFLARE_STREAM_KEY_ID;
const SIGNING_JWK_B64 = process.env.CLOUDFLARE_STREAM_JWK;
const STREAM_SUBDOMAIN = process.env.CLOUDFLARE_STREAM_SUBDOMAIN;

// Active live-inprogress video
const VIDEO_UID = "df54b03bb6f62d4101760b04a1e07ddc";
// The live input it's from
const LIVE_INPUT_UID = "eeded29dbd7111e88fd008b5786b8e7b";

const cfHeaders = {
    "Authorization": `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
};

async function main() {
    // === APPROACH 1: CF API Token Endpoint (Option 1) ===
    console.log("=== CF API TOKEN ENDPOINT (Option 1) ===");
    // Try for the active video
    for (const uid of [VIDEO_UID, LIVE_INPUT_UID]) {
        const resp = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${uid}/token`,
            { method: "POST", headers: cfHeaders }
        );
        const data = await resp.json();
        if (data.success && data.result?.token) {
            const token = data.result.token;
            console.log(`\n  UID ${uid}: Token received (len=${token.length})`);
            
            // Test this API-generated token
            const hlsUrl = `https://${STREAM_SUBDOMAIN}/${token}/manifest/video.m3u8`;
            const playResp = await fetch(hlsUrl);
            console.log(`  Playback: ${playResp.status} ${playResp.statusText}`);
            if (playResp.ok) {
                const body = await playResp.text();
                console.log(`  Manifest:\n    ${body.substring(0, 300).replace(/\n/g, '\n    ')}`);
            }
            
            // Decode and show token structure
            const parts = token.split('.');
            const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
            console.log(`  Token header:`, JSON.stringify(header));
            console.log(`  Token payload:`, JSON.stringify(payload));
        } else {
            console.log(`\n  UID ${uid}: FAILED -`, data.errors || data.messages);
        }
    }

    // === APPROACH 2: Self-signed with kid in payload (matching old code) ===
    console.log("\n\n=== SELF-SIGNED WITH kid IN PAYLOAD ===");
    const jwkJson = JSON.parse(Buffer.from(SIGNING_JWK_B64, "base64").toString("utf-8"));
    const privateKey = await importJWK(jwkJson, "RS256");

    for (const uid of [VIDEO_UID, LIVE_INPUT_UID]) {
        const now = Math.floor(Date.now() / 1000);
        
        // Include kid in payload (as Cloudflare docs suggest)
        const token = await new SignJWT({
            sub: uid,
            kid: SIGNING_KEY_ID,
            exp: now + 3600,
            nbf: now - 60,
        })
        .setProtectedHeader({ alg: "RS256", kid: SIGNING_KEY_ID })
        .setIssuedAt()
        .sign(privateKey);

        const hlsUrl = `https://${STREAM_SUBDOMAIN}/${token}/manifest/video.m3u8`;
        const playResp = await fetch(hlsUrl);
        console.log(`\n  UID ${uid}: ${playResp.status} ${playResp.statusText}`);
        if (playResp.ok) {
            const body = await playResp.text();
            console.log(`  Manifest:\n    ${body.substring(0, 300).replace(/\n/g, '\n    ')}`);
        }
    }

    // === APPROACH 3: Minimal self-signed (exactly as user's docs) ===
    console.log("\n\n=== MINIMAL SELF-SIGNED (user's docs) ===");
    for (const uid of [VIDEO_UID, LIVE_INPUT_UID]) {
        const token = await new SignJWT({ sub: uid })
            .setProtectedHeader({ alg: "RS256", kid: SIGNING_KEY_ID })
            .setExpirationTime("1h")
            .sign(privateKey);

        const hlsUrl = `https://${STREAM_SUBDOMAIN}/${token}/manifest/video.m3u8`;
        const playResp = await fetch(hlsUrl);
        console.log(`\n  UID ${uid}: ${playResp.status} ${playResp.statusText}`);
        if (playResp.ok) {
            const body = await playResp.text();
            console.log(`  Manifest:\n    ${body.substring(0, 300).replace(/\n/g, '\n    ')}`);
        }
    }
}

main().catch(e => {
    console.error("FAILED:", e.message);
    console.error(e.stack);
});
