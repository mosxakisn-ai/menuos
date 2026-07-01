/** Prisma-style filter: which pass signals belong on this station screen. */
export type PassSignalStationScreenScope = {
  stationScreenId: string | null | undefined;
  /** Lowest sortOrder screen for the station — also receives legacy null screenId rows. */
  isPrimaryScreen: boolean;
};

export type PassSignalStationScreenWhere =
  | Record<string, never>
  | { stationScreenId: string }
  | { OR: Array<{ stationScreenId: string | null }> };

export function passSignalStationScreenWhere(
  scope: PassSignalStationScreenScope,
): PassSignalStationScreenWhere {
  const id = scope.stationScreenId?.trim();
  if (!id) return {};
  if (scope.isPrimaryScreen) {
    return { OR: [{ stationScreenId: id }, { stationScreenId: null }] };
  }
  return { stationScreenId: id };
}

export function isPrimaryStationScreen(
  stationScreenId: string | null | undefined,
  primaryStationScreenId: string | null | undefined,
): boolean {
  const id = stationScreenId?.trim();
  if (!id) return true;
  const primaryId = primaryStationScreenId?.trim();
  if (!primaryId) return true;
  return id === primaryId;
}
