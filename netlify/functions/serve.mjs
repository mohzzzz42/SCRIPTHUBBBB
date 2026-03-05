// Loadstring API — validates keys, serves obfuscated Lua code
// Called by Roblox: game:HttpGet("https://your-site.netlify.app/api/serve?id=SCRIPT_ID&key=KEY")

import admin from "firebase-admin";
import { obfuscateLua } from "./obfuscate.mjs";

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export default async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("", {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const key = url.searchParams.get("key");

  if (!id) {
    return new Response("-- error: missing script id", {
      status: 400,
      headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    // Get script metadata
    const scriptSnap = await db.collection("scripts").doc(id).get();
    if (!scriptSnap.exists) {
      return new Response("-- error: script not found", {
        status: 404,
        headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
      });
    }

    const scriptData = scriptSnap.data();

    // If script requires a key (keyless !== true), validate it
    if (!scriptData.keyless) {
      if (!key) {
        return new Response("-- error: this script requires a key", {
          status: 403,
          headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
        });
      }

      // Find the key in the keys collection
      const keysQuery = await db.collection("keys").where("key", "==", key).where("scriptId", "==", id).get();

      if (keysQuery.empty) {
        return new Response("-- error: invalid key", {
          status: 403,
          headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
        });
      }

      const keyDoc = keysQuery.docs[0];
      const keyData = keyDoc.data();

      // Check if key is expired
      if (keyData.expiresAt) {
        const expiry = keyData.expiresAt.toDate ? keyData.expiresAt.toDate() : new Date(keyData.expiresAt);
        if (expiry < new Date()) {
          return new Response("-- error: key expired", {
            status: 403,
            headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
          });
        }
      }

      // Check if key has exceeded max uses
      if (keyData.maxUses > 0 && (keyData.uses || 0) >= keyData.maxUses) {
        return new Response("-- error: key has reached max uses", {
          status: 403,
          headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
        });
      }

      // Increment use count
      await keyDoc.ref.update({ uses: (keyData.uses || 0) + 1 });
    }

    // Get the script code (using Admin SDK bypasses Firestore rules)
    const codeSnap = await db.collection("script_code").doc(id).get();
    if (!codeSnap.exists) {
      return new Response("-- error: script code not found", {
        status: 404,
        headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
      });
    }

    const rawCode = codeSnap.data().code;

    // Obfuscate and return
    const obfuscated = obfuscateLua(rawCode);

    return new Response(obfuscated, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Serve error:", err);
    return new Response("-- error: internal server error", {
      status: 500,
      headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
    });
  }
};
