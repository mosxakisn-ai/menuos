export type SeoBlogSection = {
  heading?: string;
  paragraphs: string[];
};

export type SeoBlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingMinutes: number;
  relatedPaths: string[];
  sections: SeoBlogSection[];
};

export const SEO_BLOG_POSTS: SeoBlogPost[] = [
  {
    slug: "pws-ftiaxno-qr-menu",
    title: "Πώς φτιάχνω QR menu για το εστιατόριό μου",
    description:
      "Απλός οδηγός: από εγγραφή μέχρι QR στο τραπέζι. Χωρίς τεχνικές γνώσεις, χωρίς app για τον πελάτη.",
    publishedAt: "2026-06-15",
    readingMinutes: 5,
    relatedPaths: ["/qr-menu", "/pos-leitourgei", "/estiatorio/qr-menu"],
    sections: [
      {
        paragraphs: [
          "Το QR menu αντικαθιστά το printed menu: ο πελάτης σκανάρει, βλέπει πιάτα και τιμές στο κινητό, εσείς ενημερώνετε online.",
          "Με το MenuOS ξεκινάτε δωρεάν δοκιμή 7 ημερών — χωρίς κάρτα.",
        ],
      },
      {
        heading: "Βήμα 1 — Λογαριασμός",
        paragraphs: [
          "Δημιουργείτε λογαριασμό με email και κωδικό επιβεβαίωσης. Μπαίνετε αμέσως στη διαχείριση του menu σας.",
        ],
      },
      {
        heading: "Βήμα 2 — Κατάλογος & πιάτα",
        paragraphs: [
          "Προσθέτετε κατάστημα, κατάλογο και κατηγορίες. Κάθε πιάτο έχει τιμή, περιγραφή και προαιρετική φωτογραφία.",
          "Συμπληρώνετε Ελληνικά (υποχρεωτικά) και προαιρετικά English, Deutsch, Français για τουρίστες.",
        ],
      },
      {
        heading: "Βήμα 3 — QR codes",
        paragraphs: [
          "Κατεβάζετε QR codes από τη διαχείριση και τους τοποθετείτε σε τραπέζια ή δωμάτια.",
          "Links με ?table=12 βοηθούν την κλήση σερβιτόρου — ο σερβιτόρος ξέρει από πού καλούν.",
        ],
      },
    ],
  },
  {
    slug: "digital-menu-vs-printed",
    title: "Ψηφιακό menu vs printed — τι συμφέρει;",
    description:
      "Κόστος, ενημερώσεις, τουρίστες, εικόνα καταστήματος — σύγκριση για εστιατόρια και ξενοδοχεία.",
    publishedAt: "2026-06-18",
    readingMinutes: 4,
    relatedPaths: ["/digital-menu", "/qr-menu", "/pricing"],
    sections: [
      {
        paragraphs: [
          "Το printed menu κοστίζει σε κάθε αλλαγή τιμής ή σεζόν. Το ψηφιακό menu ενημερώνεται σε δευτερόλεπτα από το κινητό σας.",
        ],
      },
      {
        heading: "Πλεονεκτήματα ψηφιακού",
        paragraphs: [
          "Άμεσες αλλαγές τιμών και πιάτων χωρίς επανεκτύπωση.",
          "Πολλαπλές γλώσσες QR — ιδανικό για τουριστικές περιοχές.",
          "Φωτογραφίες πιάτων και allergens online.",
          "Κλήση σερβιτόρου από το menu (με QR ανά τραπέζι).",
        ],
      },
      {
        heading: "Πότε αξίζει printed;",
        paragraphs: [
          "Μερικές επιχειρήσεις κρατούν ένα minimal printed ως backup — αλλά το κύριο menu μπορεί να είναι 100% QR.",
        ],
      },
    ],
  },
  {
    slug: "poliglosso-menu-touristes",
    title: "Πολυγλωσσικό menu για τουρίστες — GR, EN, DE, FR",
    description:
      "Γιατί οι τουρίστες θέλουν menu στη γλώσσα τους και πώς το λύνει το QR menu με πολλαπλές γλώσσες.",
    publishedAt: "2026-06-22",
    readingMinutes: 4,
    relatedPaths: ["/rodos/qr-menu", "/santorini/digital-menu", "/ypiresies"],
    sections: [
      {
        paragraphs: [
          "Σε νησιά και τουριστικές πόλεις, το menu στα Ελληνικά μόνο δυσκολεύει τους επισκέπτες — και το προσωπικό σας.",
          "Με MenuOS ο πελάτης αλλάζει γλώσσα με ένα πάτημα στο QR menu.",
        ],
      },
      {
        heading: "Πολλαπλές γλώσσες QR",
        paragraphs: [
          "Ελληνικά, English, Deutsch, Français — καλύπτουν το μεγαλύτερο μέρος των επισκεπτών στην Ελλάδα.",
          "Συμπληρώνετε τα κείμενα μία φορά στη διαχείριση — ο πελάτης επιλέγει γλώσσα στο κινητό.",
        ],
      },
      {
        heading: "Tips για ξενοδοχεία",
        paragraphs: [
          "Ξεχωριστός κατάλογος για pool bar, breakfast και room service — όλα πολυγλωσσικά.",
          "QR ανά δωμάτιο με ?room=101 για room service και κλήση σερβιτόρου.",
        ],
      },
    ],
  },
  {
    slug: "kliisi-serveritou-apo-qr-menu",
    title: "Κλήση σερβιτόρου από QR menu — πώς λειτουργεί",
    description:
      "QR ανά τραπέζι ή δωμάτιο: ο πελάτης καλεί σερβιτόρο ή ζητά λογαριασμό χωρίς app. Οδηγός για εστιατόρια και ξενοδοχεία.",
    publishedAt: "2026-06-25",
    readingMinutes: 4,
    relatedPaths: ["/pos-leitourgei", "/room-service/qr-menu", "/estiatorio/qr-menu"],
    sections: [
      {
        paragraphs: [
          "Με QR menu δεν χρειάζεται ο πελάτης να ψάχνει μάτι με μάτι τον σερβιτόρο. Πατάει «Κλήση σερβιτόρου» ή «Λογαριασμός» και εσείς βλέπετε από ποιο τραπέζι ή δωμάτιο καλούν.",
          "Λειτουργεί μόνο όταν το QR έχει ?table= ή ?room= — αλλιώς δεν εμφανίζονται τα κουμπιά (για ασφάλεια).",
        ],
      },
      {
        heading: "Panel σερβιτόρου",
        paragraphs: [
          "Από το dashboard βλέπετε live τις κλήσεις: αναμονή, σε εξέλιξη, ολοκληρωμένες.",
          "Ιδανικό για μεγάλους χώρους, beach bars και room service σε ξενοδοχεία.",
        ],
      },
      {
        heading: "Tips εγκατάστασης",
        paragraphs: [
          "Τυπώστε ξεχωριστό QR για κάθε τραπέζι — το link περιλαμβάνει τον αριθμό.",
          "Για ξενοδοχεία: ?room=101 στο QR του δωματίου για room service.",
        ],
      },
    ],
  },
  {
    slug: "pos-energopoiw-dokimastiki-periodo",
    title: "Πώς ξεκινάω δωρεάν δοκιμή 7 ημερών στο MenuOS",
    description:
      "Χωρίς κάρτα: εγγραφή με email, κωδικό επιβεβαίωσης, δημιουργία καταλόγου και QR. Τι περιλαμβάνει η δοκιμή και τι γίνεται μετά.",
    publishedAt: "2026-06-28",
    readingMinutes: 3,
    relatedPaths: ["/pricing", "/register", "/blog/pws-ftiaxno-qr-menu"],
    sections: [
      {
        paragraphs: [
          "Η δοκιμή 7 ημερών σας δίνει πρόσβαση στη διαχείριση: 1 κατάστημα, 1 κατάλογος, έως 50 πιάτα.",
          "Δεν χρειάζεται πιστωτική κάρτα — μόνο email και κωδικός επιβεβαίωσης.",
        ],
      },
      {
        heading: "Τι μπορείτε να δοκιμάσετε",
        paragraphs: [
          "Πολυγλωσσικό menu (GR, EN, DE, FR), QR codes, κλήση σερβιτόρου από τραπέζι.",
          "Δείτε live πώς φαίνεται το menu στους πελάτες με το demo: /m/demo-taverna?table=12",
        ],
      },
      {
        heading: "Μετά τη δοκιμή",
        paragraphs: [
          "Επιλέγετε Basic (€9.99/μήνα) ή Pro (€19.99/μήνα) — ή επικοινωνείτε για Enterprise.",
          "Τα δεδομένα σας μένουν — συνεχίζετε από εκεί που σταματήσατε.",
        ],
      },
    ],
  },
  {
    slug: "qr-menu-xenodocheio",
    title: "QR menu για ξενοδοχεία — pool bar, breakfast, room service",
    description:
      "Πώς οργανώνετε ψηφιακό menu σε ξενοδοχείο: ξεχωριστός κατάλογος ανά χώρο, πολυγλωσσικό QR, room service από το δωμάτιο.",
    publishedAt: "2026-06-29",
    readingMinutes: 5,
    relatedPaths: ["/xenodocheio/digital-menu", "/room-service/qr-menu", "/santorini/xenodocheio/digital-menu"],
    sections: [
      {
        paragraphs: [
          "Σε ξενοδοχείο δεν έχετε ένα menu — έχετε εστιατόριο, pool bar, breakfast, spa και room service. Το MenuOS σας επιτρέπει ξεχωριστούς καταλόγους ανά χώρο, όλοι με QR.",
          "Οι τουρίστες αλλάζουν γλώσσα με ένα πάτημα. Εσείς ενημερώνετε τιμές και πιάτα online.",
        ],
      },
      {
        heading: "QR ανά χώρο",
        paragraphs: [
          "Εστιατόριο: QR ανά τραπέζι με ?table=. Pool bar: QR σε ξαπλώστρες ή τραπέζια bar.",
          "Room service: QR στο δωμάτιο με ?room= — ο πελάτης παραγγέλνει χωρίς τηλεφώνημα.",
        ],
      },
      {
        heading: "Panel σερβιτόρου",
        paragraphs: [
          "Οι κλήσεις από τραπέζι ή δωμάτιο εμφανίζονται live στο dashboard — ιδανικό για μεγάλα ξενοδοχεία.",
          "Μπορείτε να λαμβάνετε και push ειδοποίηση στο κινητό του προσωπικού.",
        ],
      },
    ],
  },
  {
    slug: "qr-menu-estiatorio",
    title: "QR menu για εστιατόριο — τι χρειάζεστε πραγματικά",
    description:
      "Από το πρώτο QR στο τραπέζι μέχρι πολυγλωσσικό menu και κλήση σερβιτόρου. Οδηγός για εστιατόρια στην Ελλάδα.",
    publishedAt: "2026-06-29",
    readingMinutes: 4,
    relatedPaths: ["/estiatorio/qr-menu", "/qr-menu", "/thessaloniki/estiatorio/qr-menu"],
    sections: [
      {
        paragraphs: [
          "Ένα καλό QR menu για εστιατόριο δεν είναι PDF στο κινητό. Είναι καθαρή εμφάνιση, φωτογραφίες πιάτων, τιμές που ενημερώνονται αμέσως και γλώσσες για τουρίστες.",
          "Με MenuOS ξεκινάτε δωρεάν δοκιμή — χωρίς κάρτα.",
        ],
      },
      {
        heading: "Τι να βάλετε στο menu",
        paragraphs: [
          "Κατηγορίες (ορεκτικά, κυρίως, ποτά), τιμή, περιγραφή και προαιρετικά φωτό.",
          "Allergens και ετικέτες (vegan, gluten free) βοηθούν τους πελάτες να επιλέξουν γρήγορα.",
        ],
      },
      {
        heading: "QR ανά τραπέζι",
        paragraphs: [
          "Κάθε τραπέζι με δικό του QR (?table=12) — ο σερβιτόρος βλέπει από πού καλούν.",
          "Ο πελάτης μπορεί να ζητήσει λογαριασμό ή κλήση σερβιτόρου από το menu.",
        ],
      },
    ],
  },
  {
    slug: "beach-bar-qr-menu",
    title: "QR menu για beach bar — ξαπλώστρα, τουρίστες, γρήγορη εξυπηρέτηση",
    description:
      "Πώς λειτουργεί QR menu σε beach bar: QR στην ξαπλώστρα, πολυγλωσσικό menu, κλήση σερβιτόρου με αριθμό ξαπλώστρας.",
    publishedAt: "2026-06-30",
    readingMinutes: 4,
    relatedPaths: ["/beach-bar/qr-menu", "/mykonos/beach-bar/qr-menu", "/zakynthos/beach-bar/qr-menu"],
    sections: [
      {
        paragraphs: [
          "Σε beach bar ο πελάτης δεν θέλει να σηκώνεται για να δει τιμές. Σκανάρει QR από την ξαπλώστρα ή το τραπέζι και παραγγέλνει.",
          "Το MenuOS υποστηρίζει κλήση σερβιτόρου με αριθμό ξαπλώστρας — όχι «δωμάτιο».",
        ],
      },
      {
        heading: "Πολυγλωσσικό για τουρίστες",
        paragraphs: [
          "Σε νησιά και παραλίες, το menu στα Ελληνικά μόνο δυσκολεύει. Προσθέστε English, Deutsch, Français.",
          "Οι αλλαγές τιμών (happy hour, εποχικό menu) γίνονται online χωρίς επανεκτύπωση.",
        ],
      },
      {
        heading: "Tips εγκατάστασης",
        paragraphs: [
          "Ανθεκτικό QR σε κάθε ξαπλώστρα ή τραπέζι — μικρό, ευανάγνωστο.",
          "Δοκιμάστε το demo: menuos.gr/m/demo-taverna?table=12",
        ],
      },
    ],
  },
  {
    slug: "enimerosi-times-menu-xoris-ektupwsi",
    title: "Πώς ενημερώνω τιμές στο menu χωρίς επανεκτύπωση",
    description:
      "Αλλαγή τιμών, εποχικό menu και sold out πιάτα — online σε δευτερόλεπτα. Γιατί το ψηφιακό menu κερδίζει το printed.",
    publishedAt: "2026-06-30",
    readingMinutes: 3,
    relatedPaths: ["/digital-menu", "/pricing", "/blog/digital-menu-vs-printed"],
    sections: [
      {
        paragraphs: [
          "Κάθε αλλαγή τιμής στο printed menu σημαίνει νέα εκτύπωση, καθυστέρηση και κόστος. Με ψηφιακό menu αλλάζετε από το κινητό σας και οι πελάτες βλέπουν αμέσως την ενημέρωση.",
        ],
      },
      {
        heading: "Τι μπορείτε να αλλάξετε online",
        paragraphs: [
          "Τιμές, διαθεσιμότητα πιάτων (sold out), νέες κατηγορίες και πιάτα, φωτογραφίες.",
          "Πολλαπλοί κατάλογοι — π.χ. μεσημεριανό και βραδινό menu.",
        ],
      },
      {
        heading: "Πότε αξίζει",
        paragraphs: [
          "Εστιατόρια και bars με εποχικότητα, ξενοδοχεία με room service, beach bars με τουριστική κίνηση.",
          "Η δοκιμή 7 ημερών του MenuOS είναι δωρεάν — δοκιμάστε πριν δεσμευτείτε.",
        ],
      },
    ],
  },
  {
    slug: "allergens-sto-qr-menu",
    title: "Allergens και διατροφικές ετικέτες στο QR menu",
    description:
      "Πώς εμφανίζετε gluten free, vegan και allergens στα πιάτα — για ασφάλεια πελατών και καλύτερη εμπειρία.",
    publishedAt: "2026-06-30",
    readingMinutes: 3,
    relatedPaths: ["/qr-menu", "/estiatorio/qr-menu", "/ypiresies"],
    sections: [
      {
        paragraphs: [
          "Οι πελάτες ρωτούν συχνά για allergens — gluten, γαλακτοκομικά, ξηρούς καρπούς. Στο QR menu μπορούν να τα δουν πριν παραγγείλουν.",
          "Το MenuOS υποστηρίζει ετικέτες πιάτων (vegan, vegetarian, gluten free κ.ά.).",
        ],
      },
      {
        heading: "Γιατί βοηθά στο SEO και στην εμπειρία",
        paragraphs: [
          "Ξεκάθαρο menu μειώνει λάθη και ερωτήσεις στο προσωπικό.",
          "Τουρίστες εκτιμούν menu με αλλεργιογόνα στα Αγγλικά ή στη γλώσσα τους.",
        ],
      },
      {
        heading: "Πρακτικά βήματα",
        paragraphs: [
          "Συμπληρώνετε περιγραφή και ετικέτα σε κάθε πιάτο στη διαχείριση.",
          "Ενημερώνετε sold out πιάτα αμέσως — ο πελάτης δεν παραγγέλνει κάτι που δεν υπάρχει.",
        ],
      },
    ],
  },
  {
    slug: "pool-bar-qr-menu-xenodoxeia",
    title: "Pool bar QR menu — ψηφιακός κατάλογος γύρω από την πισίνα",
    description:
      "QR menu για pool bar σε ξενοδοχεία: ξαπλώστρες, ποτά, snacks, κλήση σερβιτόρου. Πολυγλωσσικό για τουρίστες.",
    publishedAt: "2026-06-30",
    readingMinutes: 4,
    relatedPaths: ["/pool-bar/digital-menu", "/xenodocheio/digital-menu", "/santorini/xenodocheio/digital-menu"],
    sections: [
      {
        paragraphs: [
          "Στο pool bar οι επισκέπτες θέλουν να παραγγέλνουν χωρίς να φεύγουν από την ξαπλώστρα. Το QR menu λύνει ακριβώς αυτό.",
          "Με MenuOS φτιάχνετε ξεχωριστό κατάλογο pool bar — ποτά, cocktails, light meals — με τιμές που ενημερώνονται online.",
        ],
      },
      {
        heading: "Πού μπαίνουν τα QR",
        paragraphs: [
          "Στις ξαπλώστρες γύρω από το pool ή στα τραπέζια του bar.",
          "Κάθε QR μπορεί να έχει αριθμό ξαπλώστρας για κλήση σερβιτόρου.",
        ],
      },
      {
        heading: "Σύνδεση με ξενοδοχείο",
        paragraphs: [
          "Ξεχωριστός κατάλογος από το εστιατόριο και το room service — όλα στο ίδιο dashboard.",
          "Πολλαπλές γλώσσες για διεθνείς επισκέπτες.",
        ],
      },
    ],
  },
  {
    slug: "room-service-qr-menu",
    title: "Room service με QR menu — παραγγελία από το δωμάτιο",
    description:
      "QR ανά δωμάτιο (?room=): ο πελάτης βλέπει menu, παραγγέλνει και καλεί room service χωρίς τηλεφώνημα.",
    publishedAt: "2026-06-30",
    readingMinutes: 4,
    relatedPaths: ["/room-service/qr-menu", "/blog/qr-menu-xenodocheio", "/kriti/xenodocheio/digital-menu"],
    sections: [
      {
        paragraphs: [
          "Το room service με printed φακέλο στο δωμάτιο ξεπερνιέται. Με QR menu ο πελάτης σκανάρει, βλέπει ενημερωμένες τιμές και παραγγέλνει.",
          "Το link περιλαμβάνει αριθμό δωματίου — το προσωπικό ξέρει ακριβώς πού να πάει.",
        ],
      },
      {
        heading: "Τι χρειάζεστε",
        paragraphs: [
          "Ξεχωριστός κατάλογος room service στη διαχείριση MenuOS.",
          "QR card ή sticker στο δωμάτιο με ?room=101 στο link.",
        ],
      },
      {
        heading: "Πλεονεκτήματα",
        paragraphs: [
          "Άμεση ενημέρωση τιμών και διαθεσιμότητας πιάτων.",
          "Πολυγλωσσικό menu — ιδανικό για ξένους επισκέπτες.",
        ],
      },
    ],
  },
  {
    slug: "pos-vazw-qr-sta-trapezia",
    title: "Πού βάζω QR codes στα τραπέζια — πρακτικός οδηγός",
    description:
      "Μέγεθος, υλικό, τοποθέτηση και link με αριθμό τραπεζιού. Tips για εστιατόρια και beach bars.",
    publishedAt: "2026-06-30",
    readingMinutes: 3,
    relatedPaths: ["/pos-leitourgei", "/blog/pws-ftiaxno-qr-menu", "/estiatorio/qr-menu"],
    sections: [
      {
        paragraphs: [
          "Το QR πρέπει να σκανάρεται εύκολα — όχι πολύ μικρό, όχι κρυμμένο κάτω από το τραπέζι.",
          "Από το MenuOS κατεβάζετε έτοιμα PNG/SVG QR codes για κάθε τραπέζι ή χώρο.",
        ],
      },
      {
        heading: "Link με αριθμό τραπεζιού",
        paragraphs: [
          "Προσθέστε ?table=12 στο link — ενεργοποιείται κλήση σερβιτόρου και λογαριασμός από το menu.",
          "Χωρίς table/room parameter τα κουμπιά κλήσης δεν εμφανίζονται (ασφάλεια).",
        ],
      },
      {
        heading: "Υλικά",
        paragraphs: [
          "Εκτύπωση σε ανθεκτικό PVC ή ακρυλικό stand — ιδιαίτερα σε beach bars.",
          "Δοκιμάστε σκανάρισμα από 30–40 cm πριν την μαζική εκτύπωση.",
        ],
      },
    ],
  },
];

export const SEO_BLOG_INDEX = {
  title: "Blog — Οδηγοί QR menu & ψηφιακού καταλόγου",
  description:
    "Άρθρα για QR menu, ψηφιακό κατάλογο, τουρίστες και hospitality. Από την ομάδα MenuOS.",
  path: "/blog",
  breadcrumbLabel: "Blog",
} as const;
