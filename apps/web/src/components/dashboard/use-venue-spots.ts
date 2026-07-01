"use client";

import { useCallback, useEffect, useState } from "react";
import type { VenueSpotType } from "@menuos/shared";

export type VenueSpot = { id: string; type: VenueSpotType; label: string };

export function useVenueSpots(venueId: string) {
  const [spots, setSpots] = useState<VenueSpot[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!venueId) {
      setSpots([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/spots`);
      const data = await res.json();
      setSpots(res.ok ? (data.spots ?? []) : []);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { spots, loading, reload, setSpots };
}
