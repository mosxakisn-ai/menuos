import type { SeoBlogPost } from "@/content/seo-blog";

/** Topical blog posts — batch 2 (SEO growth, quality over volume). */
export const SEO_BLOG_TOPICAL_POSTS: SeoBlogPost[] = [
  {
    slug: "gdpr-qr-menu",
    title: "GDPR και QR menu — τι πρέπει να ξέρετε",
    description:
      "Προσωπικά δεδομένα, cookies και κλήσεις σερβιτόρου από QR. Πρακτικός οδηγός για εστιατόρια και ξενοδοχεία στην Ελλάδα.",
    publishedAt: "2026-07-01",
    readingMinutes: 5,
    relatedPaths: ["/privacy", "/qr-menu", "/pricing"],
    sections: [
      {
        paragraphs: [
          "Το QR menu δεν συλλέγει στοιχεία πελάτη για να δει κανείς το menu — σκανάρει και ανοίγει σελίδα. Το MenuOS φιλοξενείται στην ΕΕ και ακολουθεί βασικές αρχές GDPR για λογαριασμούς επιχειρήσεων.",
          "Όταν ενεργοποιείτε κλήση σερβιτόρου, καταγράφεται μόνο ό,τι χρειάζεται για την εξυπηρέτηση (π.χ. αριθμός τραπεζιού) — όχι όνομα ή email επισκέπτη.",
        ],
      },
      {
        heading: "Τι δεδομένα επεξεργάζεται η επιχείρηση",
        paragraphs: [
          "Ο λογαριασμός ιδιοκτήτη (email, στοιχεία συνδρομής) — για τη λειτουργία της υπηρεσίας.",
          "Τεχνικά logs (IP, browser) — όπως σε κάθε website, για ασφάλεια και σταθερότητα.",
          "Κλήσεις σερβιτόρου — προσωρινά, για live panel· όχι marketing προφίλ επισκεπτών.",
        ],
      },
      {
        heading: "Τι να γράψετε στην πολιτική απορρήτου σας",
        paragraphs: [
          "Αναφέρετε ότι χρησιμοποιείτε ψηφιακό menu (MenuOS) και ότι οι επισκέπτες δεν χρειάζονται εγγραφή.",
          "Αν συλλέγετε email για newsletter ξεχωριστά, αυτό είναι δικό σας σύστημα — όχι το QR menu.",
        ],
      },
    ],
  },
  {
    slug: "haccp-psifiako-menu",
    title: "HACCP και ψηφιακό menu — συνεργασία, όχι αντίθεση",
    description:
      "Πώς ένα ενημερωμένο QR menu βοηθά στην ιχνηλασιμότητα πιάτων, allergens και εποχικές αλλαγές.",
    publishedAt: "2026-06-28",
    readingMinutes: 4,
    relatedPaths: ["/digital-menu", "/blog/allergens-sto-qr-menu"],
    sections: [
      {
        paragraphs: [
          "Το HACCP εστιάζει σε διαδικασίες ασφάλειας τροφίμων. Το ψηφιακό menu δεν αντικαθιστά HACCP — αλλά διευκολύνει την ενημέρωση πελατών για allergens και αλλαγές πιάτων.",
        ],
      },
      {
        heading: "Πλεονεκτήματα για την κουζίνα",
        paragraphs: [
          "Άμεση αφαίρεση πιάτου από το menu όταν λήγει υλικό.",
          "Σαφής λίστα allergens ανά πιάτο — ενημερωμένη ταυτόχρονα σε όλα τα τραπέζια.",
          "Λιγότερα λάθη από παλιά printed menus που δεν προλάβατε να αλλάξετε.",
        ],
      },
    ],
  },
  {
    slug: "pos-kai-qr-menu",
    title: "POS και QR menu — πώς δουλεύουν μαζί",
    description:
      "Το QR menu δεν αντικαθιστά το ταμείο. Δείτε πώς συνδυάζονται για εξυπηρέτηση, τιμές και live κλήσεις.",
    publishedAt: "2026-06-25",
    readingMinutes: 4,
    relatedPaths: ["/live-360", "/qr-menu", "/pos-leitourgei"],
    sections: [
      {
        paragraphs: [
          "Πολλά μαγαζιά κρατούν POS για ταμείο και QR menu για κατάλογο + κλήση σερβιτόρου. Οι τιμές ευθυγραμμίζονται χειροκίνητα από το panel MenuOS — σε δευτερόλεπτα.",
          "Το Live 360° καλύπτει live κλήσεις και pass signals — όχι πληρωμή POS.",
        ],
      },
      {
        heading: "Ροή εργασίας",
        paragraphs: [
          "Πελάτης σκανάρει → βλέπει menu → καλεί σερβιτόρο.",
          "Σερβιτόρος παίρνει παραγγελία → κουζίνα/bar → ταμείο POS όπως πάντα.",
        ],
      },
    ],
  },
  {
    slug: "allergens-nomothesia-ellada",
    title: "Allergens στο menu — τι ισχύει στην Ελλάδα",
    description:
      "Υποχρεώσεις ενημέρωσης πελατών για allergens και πώς το QR menu τις κάνει πιο εύκολες.",
    publishedAt: "2026-06-22",
    readingMinutes: 5,
    relatedPaths: ["/blog/allergens-sto-qr-menu", "/estiatorio/qr-menu"],
    sections: [
      {
        paragraphs: [
          "Οι επιχειρήσεις εστίασης πρέπει να ενημερώνουν για allergens. Το ψηφιακό menu επιτρέπει σαφή πεδία ανά πιάτο — χωρίς μικρογράμματα σε χαρτί.",
        ],
      },
      {
        heading: "Βέλτιστες πρακτικές",
        paragraphs: [
          "Συμπληρώνετε allergens για κάθε πιάτο στο panel.",
          "Ενημερώνετε αμέσως όταν αλλάζει συνταγή ή προμηθευτής.",
          "Εκπαιδεύετε προσωπικό να δείχνει το QR menu σε ερωτήσεις.",
        ],
      },
    ],
  },
  {
    slug: "epoxiko-menu-touristes",
    title: "Εποχικό menu για τουριστικές περιοχές",
    description:
      "Πώς να αλλάζετε πιάτα και τιμές ανά σεζόν χωρίς επανεκτύπωση — Ρόδος, Κρήτη, νησιά.",
    publishedAt: "2026-06-20",
    readingMinutes: 4,
    relatedPaths: ["/rodos/qr-menu", "/kriti/qr-menu", "/blog/poliglosso-menu-touristes"],
    sections: [
      {
        paragraphs: [
          "Σε τουριστικές περιοχές το menu αλλάζει συχνά: νέα πιάτα, higher season pricing, περισσότερες γλώσσες. Με QR menu οι αλλαγές είναι live την ίδια στιγμή.",
        ],
      },
      {
        heading: "Checklist σεζόν",
        paragraphs: [
          "Ενεργοποιήστε EN/DE/FR πριν ανοίξει η σεζόν.",
          "Αρχειοθετήστε παλιά κατηγορία αντί να τη διαγράφετε — γρήγορη επαναφορά.",
          "Δοκιμάστε QR σε 2–3 τραπέζια πριν την πλήρη κυκλοφορία.",
        ],
      },
    ],
  },
  {
    slug: "fotografies-piata-qr-menu",
    title: "Φωτογραφίες πιάτων για QR menu — tips",
    description:
      "Καλό φωτισμό, μέγεθος εικόνας και consistency — πώς να δείχνει premium το menu σας.",
    publishedAt: "2026-06-18",
    readingMinutes: 4,
    relatedPaths: ["/digital-menu", "/qr-menu"],
    sections: [
      {
        paragraphs: [
          "Οι φωτογραφίες πουλάνε στο mobile. Χρησιμοποιείτε URL εικόνας στο panel MenuOS — δεν χρειάζεται ξεχωριστό hosting αν έχετε ήδη CDN ή site.",
        ],
      },
      {
        heading: "Quick tips",
        paragraphs: [
          "Φωτίστε από πλάγια, όχι flash από πάνω.",
          "Ίδιο aspect ratio σε όλες τις φωτό — πιο καθαρό scroll.",
          "Ξεκινήστε με bestsellers, όχι όλο τον κατάλογο.",
        ],
      },
    ],
  },
  {
    slug: "wifi-guest-qr-menu",
    title: "WiFi και QR menu — χρειάζεται internet ο πελάτης;",
    description:
      "Πώς λειτουργεί το mobile menu με δεδομένα κινητού ή WiFi ξενοδοχείου.",
    publishedAt: "2026-06-16",
    readingMinutes: 3,
    relatedPaths: ["/xenodocheio/digital-menu", "/qr-menu"],
    sections: [
      {
        paragraphs: [
          "Το QR menu ανοίγει στο browser. Χρειάζεται σύνδεση — συνήθως 4G/5G ή guest WiFi. Προτείνετε captive portal WiFi που ανοίγει γρήγορα μετά το login.",
          "Το MenuOS είναι lightweight — φορτώνει γρήγορα ακόμα και σε μέτρια σήμα.",
        ],
      },
    ],
  },
  {
    slug: "breakfast-buffet-qr-xenodoxeio",
    title: "Breakfast buffet με QR menu σε ξενοδοχείο",
    description:
      "Πολλαπλές γλώσσες, allergens και daily specials στο πρωινό — χωρίς πλαστικές λίστες.",
    publishedAt: "2026-06-14",
    readingMinutes: 4,
    relatedPaths: ["/xenodocheio/digital-menu", "/blog/qr-menu-xenodocheio"],
    sections: [
      {
        paragraphs: [
          "Στο breakfast buffet αλλάζουν πιάτα καθημερινά. QR σε κάθε τραπέζι ή στο entrance του buffet ενημερώνει τουρίστες σε 4 γλώσσες.",
        ],
      },
      {
        heading: "Συνδυασμός με room service",
        paragraphs: [
          "Ξεχωριστοί κατάλογοι: breakfast, all-day dining, room service — όλοι από το ίδιο panel.",
        ],
      },
    ],
  },
  {
    slug: "kostos-qr-menu-vs-ektyposi",
    title: "Κόστος QR menu vs επανεκτύπωση menu",
    description:
      "Απλή σύγκριση για μικρά εστιατόρια: τιμές εκτύπωσης, ενημερώσεις και δοκιμή MenuOS.",
    publishedAt: "2026-06-12",
    readingMinutes: 4,
    relatedPaths: ["/pricing", "/blog/digital-menu-vs-printed"],
    sections: [
      {
        paragraphs: [
          "Μια επανεκτύπωση menu (50–200 αντίγραφα) κοστίζει συχνά περισσότερο από μια μηνιαία συνδρομή Basic — χωρίς να μετράτε τον χρόνο σχεδιασμού.",
          "Με QR menu πληρώνετε συνδρομή και ενημερώνετε απεριόριστα.",
        ],
      },
    ],
  },
  {
    slug: "prosbasimotita-psifiako-menu",
    title: "Προσβασιμότητα ψηφιακού menu",
    description:
      "Μεγέθυνση κειμένου, contrast και απλή πλοήγηση — βασικά για inclusive εμπειρία.",
    publishedAt: "2026-06-10",
    readingMinutes: 4,
    relatedPaths: ["/digital-menu", "/qr-menu"],
    sections: [
      {
        paragraphs: [
          "Το browser του κινητού επιτρέπει zoom — το MenuOS QR menu έχει καθαρή typography και contrast.",
          "Κρατήστε σύντομες περιγραφές και ξεκάθαρες κατηγορίες για ευκολότερη πλοήγηση.",
        ],
      },
    ],
  },
  {
    slug: "polyglossi-stratigiki-touristes",
    title: "Στρατηγική γλωσσών QR menu για τουρίστες",
    description:
      "Πότε να ενεργοποιήσετε EN, DE, FR — και πώς να ελέγχετε ποιότητα μεταφράσεων.",
    publishedAt: "2026-06-08",
    readingMinutes: 5,
    relatedPaths: ["/blog/poliglosso-menu-touristes", "/mykonos/qr-menu"],
    sections: [
      {
        paragraphs: [
          "Ξεκινήστε με English — απαραίτητο σχεδόν παντού. Προσθέστε Deutsch για Γερμανούς επισκέπτες, Français για γαλλόφωνους.",
          "Μην αφήνετε κενά πεδία: αν λείπει μετάφραση, εμφανίζεται Ελληνικά.",
        ],
      },
    ],
  },
  {
    slug: "cafe-artopoiio-qr-menu",
    title: "QR menu για café και αρτοποιείο",
    description:
      "Counter service, τραπέζια και takeaway — πώς προσαρμόζετε το MenuOS.",
    publishedAt: "2026-06-05",
    readingMinutes: 4,
    relatedPaths: ["/cafe/qr-menu", "/bakery/qr-menu", "/cafeteria/qr-menu"],
    sections: [
      {
        paragraphs: [
          "Στο café οι πελάτες θέλουν γρήγορη πρόσβαση σε καφέ, γλυκά και daily specials. QR στο τραπέζι ή στον πάγκο μειώνει ερωτήσεις «τι έχετε σήμερα;».",
          "Στο αρτοποιείο βοηθά για λίστα προϊόντων με allergens (γλουτένη, ξηροί καρποί).",
        ],
      },
    ],
  },
  {
    slug: "kalokairiano-menu-anoixis",
    title: "Καλοκαιρινό menu — πώς το ενημερώνετε γρήγορα",
    description:
      "Seasonal πιάτα, ποτά και τιμές υψηλής σεζόν. QR menu αντί για επανεκτύπωση κάθε εβδομάδα.",
    publishedAt: "2026-07-02",
    readingMinutes: 4,
    relatedPaths: ["/beach-bar/qr-menu", "/pool-bar/digital-menu", "/blog/digital-menu-vs-printed"],
    sections: [
      {
        paragraphs: [
          "Το καλοκαίρι αλλάζουν συχνά τα πιάτα (ψάρια, σαλάτες, cocktails). Με printed menu κάθε αλλαγή κοστίζει χρόνο και χρήμα.",
          "Από το panel MenuOS ενημερώνετε τιμές και διαθεσιμότητα live — οι επισκέπτες βλέπουν αμέσως τι ισχύει σήμερα.",
        ],
      },
      {
        heading: "Tips για beach bar & pool",
        paragraphs: [
          "Ξεχωριστός κατάλογος pool bar / main restaurant — QR ανά ζώνη.",
          "Sunbed QR με ?sunbed= — κλήση σερβιτόρου χωρίς app.",
        ],
      },
    ],
  },
  {
    slug: "qr-menu-xenodocheio-wifi",
    title: "QR menu σε ξενοδοχείο — Wi‑Fi, δωμάτια και lobby",
    description:
      "Room service, πρωινό, pool bar: ένα panel, πολλαπλοί κατάλογοι και γλώσσες για τουρίστες.",
    publishedAt: "2026-07-03",
    readingMinutes: 5,
    relatedPaths: ["/xenodocheio/digital-menu", "/room-service/qr-menu", "/blog/qr-menu-xenodocheio"],
    sections: [
      {
        paragraphs: [
          "Στα ξενοδοχεία το QR menu λειτουργεί σε δωμάτια (?room=), lobby και εστιατόριο. Ο επισκέπτης δεν χρειάζεται app — μόνο browser.",
          "Συνδυάστε με Wi‑Fi captive portal ή QR στο welcome card — το menu ανοίγει αμέσως.",
        ],
      },
      {
        heading: "Live 360° για reception",
        paragraphs: [
          "Κλήσεις room service και σερβιτόρου εμφανίζονται live στο panel — λιγότερα τηλέφωνα στην reception.",
        ],
      },
    ],
  },
  {
    slug: "qr-menu-social-media",
    title: "QR menu και social media — Instagram, Google Maps",
    description:
      "Link στο bio, Google Business και τραπέζια — μία πηγή αλήθειας για τιμές και πιάτα.",
    publishedAt: "2026-07-04",
    readingMinutes: 4,
    relatedPaths: ["/qr-menu", "/pos-leitourgei", "/blog/pws-ftiaxno-qr-menu"],
    sections: [
      {
        paragraphs: [
          "Αντί για PDF menu στο Instagram, δώστε link στο ψηφιακό κατάλογο σας. Όταν αλλάζετε τιμή, δεν χρειάζεται νέο post.",
          "Στο Google Business Profile βάλτε link menuos.gr/m/{slug} — οι επισκέπτες βλέπουν live περιεχόμενο.",
        ],
      },
    ],
  },
  {
    slug: "allergens-eu-2023",
    title: "Allergens στο menu — τι ισχύει στην ΕΕ για εστίαση",
    description:
      "14 allergens, ενημέρωση πελάτη και ψηφιακός κατάλογος. Σύντομος οδηγός για εστιατόρια στην Ελλάδα.",
    publishedAt: "2026-07-04",
    readingMinutes: 5,
    relatedPaths: ["/blog/allergens-sto-qr-menu", "/estiatorio/qr-menu", "/privacy"],
    sections: [
      {
        paragraphs: [
          "Η ευρωπαϊκή νομοθεσία απαιτεί σαφή ενημέρωση για allergens. Το QR menu διευκολύνει ετικέτες ανά πιάτο (γλουτένη, γαλακτοκομικά, ξηροί καρποί κ.λπ.).",
          "Όταν αλλάζετε συνταγή, ενημερώνετε μία φορά στο panel — όχι σε κάθε printed menu.",
        ],
      },
    ],
  },
  {
    slug: "pos-na-dialeksete-qr-menu",
    title: "Πώς να διαλέξετε πλατφόρμα QR menu",
    description:
      "Checklist πριν την αγορά: γλώσσες, ενημέρωση τιμών, κλήση σερβιτόρου, δοκιμή χωρίς κάρτα και τι μένει δικό σας.",
    publishedAt: "2026-07-18",
    readingMinutes: 6,
    relatedPaths: ["/pricing", "/qr-menu", "/pos-leitourgei", "/blog/digital-menu-vs-printed"],
    sections: [
      {
        paragraphs: [
          "Δεν χρειάζεστε το «μεγαλύτερο» σύστημα. Χρειάζεστε αυτό που ανοίγει σε 10 δευτερόλεπτα στο κινητό του πελάτη, ενημερώνεται σε λεπτά και δεν σας κλειδώνει σε ακριβό συμβόλαιο.",
          "Παρακάτω ένα πρακτικό checklist για εστιατόρια, ξενοδοχεία και bars στην Ελλάδα — πριν πληρώσετε συνδρομή.",
        ],
      },
      {
        heading: "1. Ο πελάτης χρειάζεται εφαρμογή;",
        paragraphs: [
          "Καλή απάντηση: όχι. Σκανάρει το QR και ανοίγει browser. Αν ζητούν download app για να δει το menu, χάνετε επισκέπτες — ιδίως τουρίστες.",
        ],
      },
      {
        heading: "2. Πόσες γλώσσες και πόσο γρήγορα αλλάζουν τιμές;",
        paragraphs: [
          "Για τουρισμό στην Ελλάδα θέλετε τουλάχιστον Ελληνικά + Αγγλικά (ιδανικά και Γερμανικά/Γαλλικά).",
          "Ρωτήστε: αλλάζω τιμή σε 30 δευτερόλεπτα από το κινητό μου; Αν η απάντηση είναι «μόνο από το γραφείο» ή «μεταξύ βαρδιών», θα μείνετε με λάθος τιμές το Σαββατοκύριακο.",
        ],
      },
      {
        heading: "3. Κλήση σερβιτόρου και Live λειτουργία",
        paragraphs: [
          "Αν έχετε πολλά τραπέζια ή room service, μετράει η σύνδεση QR → τραπέζι/δωμάτιο → ειδοποίηση στο κινητό της ομάδας.",
          "Στο MenuOS αυτό είναι το Live 360° στο πλάνο Pro — δεν είναι υποχρεωτικό για απλό κατάλογο, αλλά αλλάζει τη ροή σε busy service.",
        ],
      },
      {
        heading: "4. Δοκιμή, τιμές και έξοδος",
        paragraphs: [
          "Προτιμήστε δοκιμή χωρίς κάρτα και μηνιαία συνδρομή που ακυρώνεται εύκολα.",
          "Ρωτήστε τι γίνεται με τα δεδομένα σας αν φύγετε: εξάγετε κατάλογο; Ποιος κρατάει το domain του menu;",
          "Δείτε ζωντανά demo πριν την απόφαση — στο MenuOS υπάρχει δημόσιο παράδειγμα και δοκιμή {trialDaysGen}.",
        ],
      },
      {
        heading: "Σύντομη λίστα ελέγχου",
        paragraphs: [
          "Χωρίς app για πελάτη · πολυγλωσσικό · γρήγορη αλλαγή τιμών · QR ανά τραπέζι/δωμάτιο · καθαρή τιμολόγηση · δοκιμή χωρίς κάρτα.",
          "Αν τσεκάρετε αυτά, είστε πιο κοντά σε εργαλείο που δουλεύει στην πραγματική βάρδια — όχι μόνο στο demo.",
        ],
      },
    ],
  },
  {
    slug: "eisagogi-katalogou-apo-pdf",
    title: "Εισαγωγή καταλόγου από PDF στο ψηφιακό menu",
    description:
      "Έχετε ήδη printed menu σε PDF; Πώς περνάτε πιάτα και τιμές σε QR κατάλογο με έλεγχο πριν τη δημοσίευση.",
    publishedAt: "2026-07-18",
    readingMinutes: 5,
    relatedPaths: ["/pricing", "/qr-menu", "/blog/pws-ftiaxno-qr-menu", "/digital-menu"],
    sections: [
      {
        paragraphs: [
          "Πολλά καταστήματα ξεκινούν με έτοιμο PDF ή σκαναρισμένο menu. Δεν χρειάζεται να ξαναγράψετε τα πάντα από το μηδέν — αρκεί μια προσεκτική εισαγωγή και έλεγχος πριν το δουν οι πελάτες.",
          "Στο MenuOS (πλάνο Pro) ανεβάζετε PDF, βλέπετε προσχέδιο πιάτων και αποφασίζετε τι μπαίνει στον κατάλογο. Τίποτα δεν δημοσιεύεται αυτόματα χωρίς το δικό σας OK.",
        ],
      },
      {
        heading: "Τι περιμένετε από ένα καλό PDF import",
        paragraphs: [
          "Αναγνώριση κατηγοριών και τιμών όπου το layout είναι καθαρό.",
          "Υποστήριξη και για σκαναρισμένες σελίδες — όχι μόνο «ψηφιακά» PDF με επιλέξιμο κείμενο.",
          "Πάντα οθόνη ελέγχου: διορθώνετε λάθη OCR, διπλότυπα ή τιμές πριν την αποθήκευση.",
        ],
      },
      {
        heading: "Πρακτικά βήματα",
        paragraphs: [
          "1. Ανεβάστε καθαρό PDF (όσο γίνεται ευανάγνωστο).",
          "2. Ελέγξτε το προσχέδιο: ονόματα, τιμές, κατηγορίες.",
          "3. Συμπληρώστε φωτογραφίες και allergens όπου χρειάζεται.",
          "4. Προσθέστε Αγγλικά (και άλλες γλώσσες) για τουρίστες.",
          "5. Κατεβάστε QR και δοκιμάστε από κινητό πριν τα βάλετε στα τραπέζια.",
        ],
      },
      {
        heading: "Όρια και ρεαλισμός",
        paragraphs: [
          "Πολύπλοκα σχέδια με πολλές στήλες ή καλλιτεχνικά fonts μπορεί να χρειαστούν διορθώσεις στο χέρι — αυτό είναι φυσιολογικό.",
          "Η εισαγωγή εξοικονομεί χρόνο· δεν αντικαθιστά τον έλεγχό σας. Το τελικό menu πρέπει να το διαβάσει άνθρωπος πριν βγει live.",
        ],
      },
    ],
  },
  {
    slug: "basic-vs-pro-menuos",
    title: "Basic ή Pro στο MenuOS — ποιο πλάνο σας κάνει;",
    description:
      "Απλή σύγκριση πλάνων: ένα κατάστημα vs Live 360°, PDF import και πολλαπλά καταστήματα. Χωρίς πίεση upsell.",
    publishedAt: "2026-07-18",
    readingMinutes: 5,
    relatedPaths: ["/pricing", "/live-360", "/ypiresies", "/blog/menuos-live-360"],
    sections: [
      {
        paragraphs: [
          "Και τα δύο πλάνα δίνουν ψηφιακό QR κατάλογο, πολυγλωσσία και online ενημέρωση. Η διαφορά είναι πόσα καταστήματα έχετε και αν θέλετε live κλήσεις / μηνύματα κουζίνας στην ομάδα.",
          "Ξεκινήστε με τη δοκιμή {trialDaysGen} — χωρίς κάρτα — και δείτε τι χρησιμοποιείτε πραγματικά στη βάρδια.",
        ],
      },
      {
        heading: "Basic — ιδανικό για ένα μαγαζί",
        paragraphs: [
          "Ένα κατάστημα, αρκετοί κατάλογοι (π.χ. εστιατόριο + bar), απεριόριστα πιάτα, QR για τον κατάλογο.",
          "Ταιριάζει σε εστιατόριο, café ή μικρό bar που θέλει καθαρό ψηφιακό menu χωρίς live λειτουργία σερβιτόρου.",
        ],
      },
      {
        heading: "Pro — όταν μετράει το Live 360°",
        paragraphs: [
          "Έως 3 καταστήματα, απεριόριστοι κατάλογοι, εισαγωγή από PDF.",
          "Live 360°: κλήση σερβιτόρου από QR, μηνύματα πάσου από κουζίνα/bar στο κινητό, οθόνες χώρων για τον manager.",
          "Αν έχετε beach/pool, room service ή πολλές ζώνες, το Pro συνήθως αποδίδει από την πρώτη γεμάτη εβδομάδα.",
        ],
      },
      {
        heading: "Γρήγορη απόφαση",
        paragraphs: [
          "Ένα μαγαζί, μόνο κατάλογος → Basic.",
          "Πολλαπλοί χώροι, κλήσεις, κουζίνα που στέλνει «έτοιμο» στο κινητό, ή PDF για γρήγορο ανέβασμα → Pro.",
          "Δείτε λεπτομέρειες και τιμές στη σελίδα πληρωμής — η αναβάθμιση γίνεται από το panel όταν είστε έτοιμοι.",
        ],
      },
    ],
  },
];
