#!/usr/bin/env node
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("# Πρόσθεσε στο .env (και στο production server):");
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log("VAPID_SUBJECT=mailto:info@b-os.gr");
