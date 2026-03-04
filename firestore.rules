import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { obfuscateLua } from './obfuscate.mjs';

// Initialize Firebase Admin with service account from env
let app, db;
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  app = initializeApp({ credential: cert(serviceAccount) });
  db = getFirestore(app);
} catch (e) {
  console.error('Firebase init error — make sure FIREBASE_SERVICE_ACCOUNT env var is set:', e.message);
}

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const key = url.searchParams.get('key');

  if (!db) {
    return new Response('-- Server config error: FIREBASE_SERVICE_ACCOUNT not set', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }

  if (!id) {
    return new Response('-- Missing script id', { status: 400, headers: { 'Content-Type': 'text/plain' } });
  }

  try {
    // Get script metadata
    const scriptDoc = await db.collection('scripts').doc(id).get();
    if (!scriptDoc.exists) {
      return new Response('-- Script not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
    }

    const script = scriptDoc.data();

    // Check key requirement
    if (!script.keyless) {
      if (!key) {
        return new Response('-- Key required. Get one from the hub.', {
          status: 403, headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Validate key (keys are top-level collection with scriptId field)
      const keysSnap = await db.collection('keys').where('scriptId', '==', id).where('key', '==', key).get();
      if (keysSnap.empty) {
        return new Response('-- Invalid key', {
          status: 403, headers: { 'Content-Type': 'text/plain' }
        });
      }

      const keyData = keysSnap.docs[0].data();

      // Check expiry
      if (keyData.expiresAt && keyData.expiresAt.toDate() < new Date()) {
        return new Response('-- Key expired', {
          status: 403, headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Check max uses
      if (keyData.maxUses > 0 && (keyData.uses || 0) >= keyData.maxUses) {
        return new Response('-- Key max uses reached', {
          status: 403, headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Increment uses
      await keysSnap.docs[0].ref.update({ uses: (keyData.uses || 0) + 1 });
    }

    // Get code from protected script_code collection (admin SDK bypasses rules)
    const codeDoc = await db.collection('script_code').doc(id).get();
    if (!codeDoc.exists || !codeDoc.data().code) {
      return new Response('-- Script code not found', {
        status: 404, headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Log the request
    await db.collection('logs').add({
      scriptId: id,
      scriptName: script.name || '',
      key: key || null,
      timestamp: new Date(),
      ip: req.headers.get('x-forwarded-for') || 'unknown'
    });

    // Obfuscate the code — 3 layers of encryption
    const rawCode = codeDoc.data().code;
    const obfuscated = obfuscateLua(rawCode);

    return new Response(obfuscated, {
      status: 200,
      headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' }
    });
  } catch (err) {
    console.error('Serve error:', err);
    return new Response('-- Server error', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
};
