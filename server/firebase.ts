// server/firebase.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";

if (getApps().length === 0) {
  // Resolve the path to your newly downloaded credentials file
  const serviceAccountPath = path.join(__dirname, "service-account.json");

  initializeApp({
    credential: cert(serviceAccountPath),
    projectId: "multi-landlord-apartment-manager"
  });
}

export const db = getFirestore();