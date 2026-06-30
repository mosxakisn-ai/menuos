/** Ανθρώπινα ελληνικά για το panel διαχείρισης — χωρίς τεχνικούς όρους. */
export const DASHBOARD_EL = {
  venue: "Κατάστημα",
  venues: "Καταστήματα",
  menu: "Κατάλογος",
  menus: "Κατάλογοι",
  qrCodes: "QR codes",
  subscription: "Συνδρομή",
  overview: "Επισκόπηση",
  logout: "Αποσύνδεση",
  calls: "Κλήσεις",
  settings: "Ρυθμίσεις",
  addVenue: "Προσθήκη καταστήματος",
  editCatalog: "Επεξεργασία καταλόγου",
  livePreview: "Δες πώς φαίνεται",
  importPdf: "Εισαγωγή από PDF",
  importPdfPro: "Εισαγωγή PDF (μόνο Pro)",
  loadingCatalog: "Φόρτωση καταλόγου...",
  previewCatalog: "Προεπισκόπηση",
  newCatalogPlaceholder: "Νέος κατάλογος (π.χ. Pool Bar)",
  addCatalog: "+ Κατάλογος",
  roleLabels: {
    ADMIN: "Διαχειριστής",
    MANAGER: "Υπεύθυνος",
  } as Record<string, string>,
  planLabels: {
    TRIAL: "Δωρεάν δοκιμή",
    BASIC: "Basic",
    PRO: "Pro",
    ENTERPRISE: "Enterprise",
  } as Record<string, string>,
  billing: {
    checkoutFailed: "Δεν ξεκίνησε η πληρωμή. Δοκίμασε ξανά.",
    cancelled: "Η πληρωμή ακυρώθηκε. Δεν χρεώθηκε τίποτα.",
    confirming: "Επιβεβαιώνουμε την πληρωμή σου...",
    confirmFailed: "Η επιβεβαίωση απέτυχε. Αν χρεωθήκες, στείλε email στο info@b-os.gr.",
    activated: "Η συνδρομή ενεργοποιήθηκε. Ευχαριστούμε!",
    activatedDev: "Το πλάνο ενεργοποιήθηκε (δοκιμαστική λειτουργία).",
  },
  trial: {
    expired:
      "Η δωρεάν δοκιμή σου έληξε. Διάλεξε πλάνο για να συνεχίσεις — οι πελάτες σου δεν βλέπουν πλέον το menu.",
    endingSoon: (days: number) =>
      days === 1
        ? "Η δωρεάν δοκιμή σου λήγει αύριο. Διάλεξε πλάνο για να μην σταματήσει το menu."
        : `Η δωρεάν δοκιμή σου λήγει σε ${days} μέρες. Διάλεξε πλάνο όταν είσαι έτοιμος.`,
    limits:
      "Στη δοκιμή: 1 κατάστημα, 1 κατάλογος, μέχρι 50 πιάτα. Μπορείς να αναβαθμιστείς όποτε θες.",
    endsOn: "Δοκιμή έως",
  },
  upgrade: {
    pdfImport:
      "Η εισαγωγή menu από PDF είναι διαθέσιμη στο πλάνο Pro. Ανέβασε PDF και γεμίζεις τον κατάλογο γρήγορα — χωρίς να πληκτρολογείς κάθε πιάτο.",
    pdfImportCta: "Δες το πλάνο Pro",
  },
  welcome:
    "Καλώς ήρθες στο MenuOS! Ακολούθησε τον οδηγό παρακάτω: πρώτα φτιάξε το κατάστημά σου, μετά βάλε πιάτα και τέλος βγάλε QR για τα τραπέζια.",
  venueCreated:
    "Το κατάστημα δημιουργήθηκε! Τώρα πρόσθεσε κατηγορίες και πιάτα — ή κάνε εισαγωγή από PDF αν έχεις Pro.",
  waiter: {
    shareTitle: "Link για το κινητό του σερβιτόρου",
    shareDescription:
      "Αντέγραψε και στείλε το link (π.χ. με WhatsApp). Στο κινητό: άνοιξε τη σελίδα και πάτα «Ενεργοποίηση» για ειδοποιήσεις — χωρίς σύνδεση ή κωδικό.",
    sharePerDevice: "Οι ειδοποιήσεις είναι ανά συσκευή — κάθε σερβιτόρος ανοίγει το δικό του link.",
    copyLink: "Αντιγραφή link",
    copied: "Αντιγράφηκε!",
  },
  push: {
    title: "Ειδοποιήσεις σε αυτή τη συσκευή",
    description:
      "Λάβε ειδοποίηση όταν έρχεται κλήση σερβιτόρου ή παραγγελία — ακόμα κι αν η σελίδα είναι κλειστή.",
    subscribed: "Οι ειδοποιήσεις είναι ενεργές σε αυτή τη συσκευή.",
    denied: "Οι ειδοποιήσεις αποκλείστηκαν από το browser. Άλλαξέ το από τις ρυθμίσεις του κινητού.",
    enable: "Ενεργοποίηση",
    disable: "Απενεργοποίηση",
  },
  photos: {
    label: "Φωτογραφία πιάτου (προαιρετικό)",
    uploadButton: "Ανέβασμα από κινητό/υπολογιστή",
    uploading: "Ανέβασμα...",
    uploadHint: "JPG ή PNG έως 5 MB — βελτιστοποιείται αυτόματα για το menu.",
    uploadFailed: "Αποτυχία ανεβάσματος.",
    urlPlaceholder: "ή επικόλλησε link φωτογραφίας",
    urlOptional: "ή επικόλλησε link φωτογραφίας",
    urlOnlyHint: "Χωρίς φωτό εμφανίζεται ως καθαρή γραμμή στο menu.",
    remove: "Αφαίρεση",
  },
} as const;

export function planLabel(planId: string): string {
  return DASHBOARD_EL.planLabels[planId] ?? planId;
}

export function roleLabel(role: string): string {
  return DASHBOARD_EL.roleLabels[role] ?? role;
}
