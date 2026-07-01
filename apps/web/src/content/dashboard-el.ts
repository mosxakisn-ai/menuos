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
  account: "Λογαριασμός",
  accountEmail: "Email σύνδεσης",
  changePassword: {
    title: "Αλλαγή κωδικού",
    current: "Τρέχων κωδικός",
    new: "Νέος κωδικός (min 8)",
    confirm: "Επιβεβαίωση νέου κωδικού",
    submit: "Αποθήκευση κωδικού",
    saving: "Αποθήκευση…",
    success: "Ο κωδικός άλλαξε.",
  },
  addVenue: "Προσθήκη καταστήματος",
  editCatalog: "Επεξεργασία καταλόγου",
  livePreview: "Δες πώς φαίνεται",
  importPdf: "Εισαγωγή από PDF",
  importPdfPro: "Εισαγωγή PDF (μόνο Pro)",
  loadingCatalog: "Φόρτωση καταλόγου...",
  importWizard: {
    hint:
      "Ανέβασε PDF καταλόγου — αναλύουμε αυτόματα (digital + OCR για εικόνες). Έλεγξε τα αποτελέσματα πριν την αποθήκευση.",
    analyzeButton: "Ανάλυση & προεπισκόπηση",
    processingTitle: "Ανάλυση PDF καταλόγου",
    pipeline: {
      scan: "Σάρωση PDF",
      extract: "Ανάλυση σελίδων",
      ocr: "OCR εικόνων",
      parse: "Κατηγορίες & είδη",
      done: "Έτοιμο",
    },
    loadingScanFile: (file: string, page: number, total: number) =>
      `${file} — σελίδα ${page}/${total}`,
    loadingImport: "Εισαγωγή στον κατάλογο...",
    advancedTitle: "Προχωρημένα — επιλογή σελίδων",
    advancedHint:
      "Cover/logo παραλείπονται αυτόματα. Άλλαξε ποιες σελίδες μπαίνουν στην ανάλυση αν κάτι λείπει.",
    pageKind: {
      digital: "Digital",
      scan: "OCR",
      cover: "Cover",
    },
    selectMenuPages: "Μόνο μενού",
    selectAll: "Όλες",
    deselectAll: "Καμία",
    reanalyze: "Ξανά ανάλυση",
    ocrUsed: (n: number) =>
      n === 1 ? "1 σελίδα μέσω OCR" : `${n} σελίδες μέσω OCR`,
  },
  previewCatalog: "Προεπισκόπηση",
  newCatalogPlaceholder: "Νέος κατάλογος (π.χ. Pool Bar)",
  addCatalog: "+ Κατάλογος",
  deleteCatalog: "Διαγραφή καταλόγου",
  deleteCatalogHasData: "Δεν μπορείς να διαγράψεις κατάλογο που έχει κατηγορίες ή είδη.",
  deleteCatalogLast: "Πρέπει να υπάρχει τουλάχιστον ένας κατάλογος στο κατάστημα.",
  deleteCatalogConfirm: (name: string) =>
    `Διαγραφή του καταλόγου «${name}»;\n\nΕίσαι σίγουρος; Η ενέργεια δεν αναιρείται.`,
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
    inactiveTitle: "Χρειάζεται ενεργή συνδρομή",
    inactiveGeneric:
      "Η συνδρομή σου δεν είναι ενεργή. Διάλεξε πλάνο για να συνεχίσουν οι πελάτες σου να βλέπουν τον QR κατάλογο.",
    canceledInactive:
      "Η συνδρομή σου ακυρώθηκε. Διάλεξε ξανά πλάνο — ο κατάλογός σου είναι αποθηκευμένος.",
    staffNoCheckout: "Μόνο διαχειριστής ή υπεύθυνος μπορεί να αλλάξει πλάνο.",
  },
  trial: {
    expired:
      "Η δωρεάν δοκιμή σου έληξε. Διάλεξε πλάνο για να συνεχίσεις — οι πελάτες σου δεν βλέπουν πλέον το menu.",
    endingSoon: (days: number) =>
      days === 1
        ? "Η δωρεάν δοκιμή σου λήγει αύριο. Διάλεξε πλάνο για να μην σταματήσει το menu."
        : `Η δωρεάν δοκιμή σου λήγει σε ${days} μέρες. Διάλεξε πλάνο όταν είσαι έτοιμος.`,
    bannerHealthy: (days: number, date: string) =>
      `Δωρεάν δοκιμή — ${days} ${days === 1 ? "μέρα" : "μέρες"} απομένουν (έως ${date})`,
    bannerMid: (days: number, date: string) =>
      `Μέσα στη δοκιμή σου — ${days} ${days === 1 ? "μέρα" : "μέρες"} απομένουν (έως ${date})`,
    bannerEnding: (days: number, date: string) =>
      `Η δοκιμή λήγει σύντομα — ${days} ${days === 1 ? "μέρα" : "μέρες"} (έως ${date})`,
    bannerLastDay: "Η δοκιμή σου λήγει αύριο — κράτησε το menu online",
    setupHint: "Ολοκλήρωσε: κατάστημα → κατάλογος → QR.",
    choosePlan: "Δες τα πλάνα",
    upgradeNow: "Αναβάθμιση τώρα",
    welcomeBadge: "Ξεκίνημα δοκιμής",
    welcomeTitle: "Καλώς ήρθες στο MenuOS",
    welcomeEnds: (days: number, date: string) =>
      `Έχεις ${days} ημέρες δωρεάν δοκιμή — λήγει ${date}. Χωρίς κάρτα.`,
    welcomeEmailHint: "Σου στείλαμε email με τα βήματα. Θα λάβεις υπενθύμιση πριν τη λήξη.",
    limits:
      "Στη δοκιμή: 1 κατάστημα, 1 κατάλογος, μέχρι 50 είδη. Μπορείς να αναβαθμιστείς όποτε θες.",
    endsOn: "Δοκιμή έως",
  },
  upgrade: {
    pdfImport:
      "Η εισαγωγή menu από PDF είναι διαθέσιμη στο πλάνο Pro. Ανέβασε PDF και γεμίζεις τον κατάλογο γρήγορα — χωρίς να πληκτρολογείς κάθε είδος.",
    pdfImportCta: "Δες το πλάνο Pro",
  },
  welcome:
    "Καλώς ήρθες στο MenuOS! Ακολούθησε τον οδηγό παρακάτω: πρώτα φτιάξε το κατάστημά σου, μετά βάλε είδη στον κατάλογο και τέλος βγάλε QR για τα τραπέζια.",
  venueCreated:
    "Το κατάστημα δημιουργήθηκε! Τώρα πρόσθεσε κατηγορίες και είδη — ή κάνε εισαγωγή από PDF αν έχεις Pro.",
  /** Γενικός όρος καταλόγου — φαγητά, ποτά, κ.λπ. (όχι μόνο «πιάτα»). */
  catalogEntry: {
    one: "είδος",
    many: "είδη",
    count: (n: number) => `${n} ${n === 1 ? "είδος" : "είδη"}`,
    add: "Προσθήκη είδους",
    new: "Νέο είδος",
    save: "Αποθήκευση είδους",
    deleteConfirm: "Διαγραφή του είδους;\n\nΕίσαι σίγουρος; Η ενέργεια δεν αναιρείται.",
    editTitle: "Επεξεργασία είδους",
    deleteTitle: "Διαγραφή είδους",
    empty: "Δεν υπάρχουν είδη — πρόσθεσε το πρώτο.",
    categoryHasEntries:
      "Δεν μπορείς να διαγράψεις κατηγορία που έχει είδη. Διέγραψε πρώτα όλα τα είδη.",
    categoryDeleteHint: "Διέγραψε πρώτα όλα τα είδη της κατηγορίας",
    notFound: "Το είδος δεν βρέθηκε.",
    invalidData: "Μη έγκυρα δεδομένα είδους.",
    deactivated: "Το είδος απενεργοποιήθηκε.",
    updated: "Το είδος ενημερώθηκε.",
    deleted: "Το είδος διαγράφηκε.",
    added: (name: string) => `Το είδος «${name}» προστέθηκε στον κατάλογο.`,
  },
  waiter: {
    shareTitle: "Link για το κινητό του σερβιτόρου",
    shareDescription:
      "Αντέγραψε και στείλε το link (π.χ. με WhatsApp). Στο κινητό: άνοιξε τη σελίδα και πάτα «Ενεργοποίηση» για ειδοποιήσεις — χωρίς σύνδεση ή κωδικό.",
    sharePerDevice: "Οι ειδοποιήσεις είναι ανά συσκευή — κάθε σερβιτόρος ανοίγει το δικό του link.",
    rotateTitle: "Αλλαγή κωδικού πρόσβασης",
    rotateDescription:
      "Αν το link διέρρευσε ή άλλαξε προσωπικό, δημιούργησε νέο κωδικό. Το παλιό link σταματά να λειτουργεί — στείλε το νέο στους σερβιτόρους.",
    rotateConfirm:
      "Να αλλάξει ο κωδικός; Το τρέχον link θα σταματήσει να λειτουργεί και οι σερβιτόροι θα χρειαστούν το νέο.",
    rotateButton: "Νέος κωδικός",
    rotating: "Αλλαγή...",
    rotateFailed: "Αποτυχία αλλαγής κωδικού.",
    rotateSuccess: "Ο κωδικός άλλαξε. Στείλε το νέο link στο προσωπικό.",
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
    enableSuccess: "Επιτυχία — οι ειδοποιήσεις είναι ενεργές σε αυτή τη συσκευή.",
    enableFailed: "Αποτυχία. Δοκίμασε ξανά ή άνοιξε το link σε Chrome/Safari.",
    unsupported:
      "Αυτό το browser (π.χ. Messenger, Instagram, WhatsApp) δεν υποστηρίζει push ειδοποιήσεις. Άνοιξε το link σε Chrome (Android) ή Safari (iPhone).",
    disabledServer: "Οι push ειδοποιήσεις δεν είναι ρυθμισμένες στον server — επικοινώνησε με την υποστήριξη.",
    inAppBrowser:
      "Φαίνεται ότι άνοιξες το link μέσα σε Messenger ή άλλη εφαρμογή. Για push: πάτα ⋮ → «Άνοιγμα στο Chrome» ή στείλε το link στον εαυτό σου και άνοιξέ το εκεί.",
    iosHint:
      "iPhone: Άνοιξε σε Safari (όχι Messenger). Πάτα «Ενεργοποίηση» → Επίτρεψε ειδοποιήσεις. Για καλύτερα αποτελέσματα: Προσθήκη στην Αρχική οθόνη.",
    androidHint:
      "Android: Άνοιξε σε Chrome (όχι Messenger). Πάτα «Ενεργοποίηση» και επέτρεψε ειδοποιήσεις όταν το ζητήσει.",
    pageOpenHint:
      "Όσο η σελίδα είναι ανοιχτή, θα ακούς ήχο και θα βλέπεις κλήσεις αυτόματα — ακόμα κι αν δεν ενεργοποιήσεις push.",
  },
  photos: {
    label: "Φωτογραφία (προαιρετικό)",
    logoLabel: "Logo καταστήματος",
    logoHint: "Εμφανίζεται στο QR menu δίπλα στο όνομα. Τετράγωνο ή στρογγυλό PNG/JPG — ιδανικά 200×200 px.",
    logoSaveHint: "Μετά το upload, πάτα «Αποθήκευση ρυθμίσεων» για να εμφανιστεί στο menu.",
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
