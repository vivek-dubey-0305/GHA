/**
 * Diagnose why the live stream shows a black screen.
 * Checks: CF live input status, HLS manifest content, video segments.
 */
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

async function generateToken(uid) {
    const now = Math.floor(Date.now() / 1000);
    const jwkJson = JSON.parse(Buffer.from(SIGNING_JWK_B64, "base64").toString("utf-8"));
    const privateKey = await importJWK(jwkJson, "RS256");
    return new SignJWT({ sub: uid, kid: SIGNING_KEY_ID, exp: now + 3600, nbf: now - 60 })
        .setProtectedHeader({ alg: "RS256", kid: SIGNING_KEY_ID })
        .sign(privateKey);
}

async function main() {
    console.log("=== CLOUDFLARE STREAM DIAGNOSTIC ===\n");

    // 1. List all live inputs
    console.log("1. Fetching all live inputs...");
    const inputsResp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/live_inputs`, { headers: cfHeaders });
    const inputsData = await inputsResp.json();
    
    if (!inputsData.success) {
        console.error("Failed to fetch live inputs:", inputsData.errors);
        return;
    }

    console.log(`   Found ${inputsData.result.length} live inputs:\n`);
    
    for (const input of inputsData.result) {
        const state = input.status?.current?.state || "unknown";
        console.log(`   [${state.toUpperCase().padEnd(12)}] ${input.uid} — "${input.meta?.name || 'unnamed'}" (created: ${input.created})`);
    }

    // 2. Find active/connected inputs
    console.log("\n2. Checking each live input status...");
    let activeInputs = [];
    
    for (const input of inputsData.result) {
        const detailResp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/live_inputs/${input.uid}`, { headers: cfHeaders });
        const detail = await detailResp.json();
        const state = detail.result?.status?.current?.state || "disconnected";
        const isActive = state === "connected" || state === "reconnecting";
        
        if (isActive) {
            activeInputs.push(input);
            console.log(`   ✅ ${input.uid} — CONNECTED (state: ${state})`);
        } else {
            console.log(`   ❌ ${input.uid} — ${state}`);
        }
    }

    if (activeInputs.length === 0) {
        console.log("\n   ⚠️  NO LIVE INPUTS ARE CURRENTLY CONNECTED!");
        console.log("   → This means OBS is not streaming. Video player will show black screen.");
        console.log("   → Start OBS → Settings → Stream → paste RTMP URL & Key → Start Streaming");
    }

    // 3. For each live input, check if there are in-progress videos
    console.log("\n3. Checking for live/in-progress videos...");
    
    for (const input of inputsData.result) {
        const videosResp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/live_inputs/${input.uid}/videos`, { headers: cfHeaders });
        const videosData = await videosResp.json();
        const videos = videosData.result || [];
        
        if (videos.length > 0) {
            console.log(`\n   Live Input ${input.uid} has ${videos.length} video(s):`);
            for (const v of videos) {
                const state = v.status?.state || "unknown";
                console.log(`     [${state.padEnd(15)}] ${v.uid} — duration: ${v.duration || 'live'}s, ready: ${v.readyToStream}`);
            }
        }
    }

    // 4. Test signed URL for each live input
    console.log("\n4. Testing signed HLS URLs...");
    
    for (const input of inputsData.result) {
        try {
            const token = await generateToken(input.uid);
            const hlsUrl = `https://${STREAM_SUBDOMAIN}/${token}/manifest/video.m3u8`;
            const resp = await fetch(hlsUrl);
            
            console.log(`\n   ${input.uid} (${input.meta?.name}):`);
            console.log(`   HTTP Status: ${resp.status}`);
            
            if (resp.ok) {
                const body = await resp.text();
                const lines = body.split('\n').filter(l => l.trim());
                console.log(`   Manifest lines: ${lines.length}`);
                
                // Check if manifest has actual stream segments
                const hasSegments = body.includes('.ts') || body.includes('.m4s') || body.includes('EXT-X-STREAM-INF');
                const hasEndList = body.includes('#EXT-X-ENDLIST');
                const isLive = !hasEndList && (body.includes('EXT-X-STREAM-INF') || body.includes('EXT-X-TARGETDURATION'));
                
                console.log(`   Has segments: ${hasSegments}`);
                console.log(`   Is live (no ENDLIST): ${isLive}`);
                console.log(`   Manifest content:\n${body.substring(0, 500)}`);
            } else {
                const body = await resp.text();
                console.log(`   ❌ FAILED: ${body.substring(0, 200)}`);
            }
        } catch (err) {
            console.log(`   ❌ Error for ${input.uid}: ${err.message}`);
        }
    }

    // 5. Check MongoDB for the live class
    console.log("\n5. Summary & Recommendations:");
    console.log("   - If HTTP 200 but manifest is empty/no segments → OBS not connected");
    console.log("   - If HTTP 401 → Token signing issue (kid/nbf missing from payload)");
    console.log("   - If HTTP 200 with segments but black screen → Video.js config issue");
    console.log("   - Video.js on a hidden div gets 0 dimensions → fixed in latest code");
}

main().catch(console.error);
