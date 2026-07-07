/** Shared OG image markup for Stripe Checkout branding assets. */

export function CheckoutLogoImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 8px",
        background: "#FFFFFF",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 40,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        M
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          style={{
            display: "flex",
            fontSize: 44,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: -1,
          }}
        >
          <span style={{ color: "#0F172A" }}>Menu</span>
          <span style={{ color: "#2563EB" }}>OS</span>
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#64748B",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Scan. Browse. Enjoy.
        </div>
      </div>
    </div>
  );
}

export function CheckoutBrandImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
        borderRadius: 96,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 320,
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 88,
            height: 88,
            borderRadius: 16,
            background: "rgba(255,255,255,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#2563EB" }} />
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 88,
            height: 88,
            borderRadius: 16,
            background: "rgba(255,255,255,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#06B6D4" }} />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 88,
            height: 88,
            borderRadius: 16,
            background: "rgba(255,255,255,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#06B6D4" }} />
        </div>
        <div
          style={{
            color: "white",
            fontSize: 148,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: -4,
          }}
        >
          M
        </div>
      </div>
    </div>
  );
}
