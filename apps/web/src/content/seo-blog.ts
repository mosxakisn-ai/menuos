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
          "Δημιουργείτε λογαριασμό με email και OTP επιβεβαίωση. Μπαίνετε αμέσως στο online panel σας.",
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
          "Κατεβάζετε QR codes από το panel και τους τοποθετείτε σε τραπέζια ή δωμάτια.",
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
          "Συμπληρώνετε τα κείμενα μία φορά στο panel — ο πελάτης επιλέγει γλώσσα στο κινητό.",
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
      "Χωρίς κάρτα: εγγραφή με email, OTP, δημιουργία καταλόγου και QR. Τι περιλαμβάνει η δοκιμή και τι γίνεται μετά.",
    publishedAt: "2026-06-28",
    readingMinutes: 3,
    relatedPaths: ["/pricing", "/register", "/pws-ftiaxno-qr-menu"],
    sections: [
      {
        paragraphs: [
          "Η δοκιμή 7 ημερών σας δίνει πρόσβαση στο panel: 1 κατάστημα, 1 κατάλογος, έως 50 πιάτα.",
          "Δεν χρειάζεται πιστωτική κάρτα — μόνο email και κωδικός OTP για επιβεβαίωση.",
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
];

export const SEO_BLOG_INDEX = {
  title: "Blog — Οδηγοί QR menu & ψηφιακού καταλόγου",
  description:
    "Άρθρα για QR menu, ψηφιακό κατάλογο, τουρίστες και hospitality. Από την ομάδα MenuOS.",
  path: "/blog",
  breadcrumbLabel: "Blog",
} as const;
