"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VenueSpotType } from "@menuos/shared";

export type VenueSpot = { id: string; type: VenueSpotType; label: string };

export function useVenueSpots(venueId: string) {
  const [spots, setSpots] = useState<VenueSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const loadGenerationRef = useRef(0);

  const reload = useCallback(async () => {
    if (!venueId) {
      setSpots([]);
      return;
    }
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/spots`);
      const data = await res.json();
      if (generation !== loadGenerationRef.current) return;
      setSpots(res.ok ? (data.spots ?? []) : []);
    } finally {
      if (generation === loadGenerationRef.current) setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { spots, loading, reload, setSpots };
}
