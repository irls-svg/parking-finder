export type LatLng = {
  latitude: number;
  longitude: number;
};

export type Location = {
  latLng: LatLng;
  /**
   * The compass heading associated with the direction of the flow of traffic. This value specifies the side of the road for pickup and drop-off. Heading values can be from 0 to 360, where 0 specifies a heading of due North, 90 specifies a heading of due East, and so on. You can use this field only for DRIVE and TWO_WHEELER RouteTravelMode.
   */
  heading?: number;
};

type LocalizedText = {
  text: string;
  languageCode?: string;
};

export type Waypoint = {
  via?: boolean;
  vehicleStopover?: boolean;
  sideOfRoad: boolean;
  location?: Location;
  placeId?: string;
  address?: string;
};

export type RouteMatrixOrigin = {
  waypoint: Waypoint;
  route_modifiers?: object;
};

export type RouteMatrixDestination = {
  waypoint: Waypoint;
};

export type RouteMatrixRequestConfig = {
  travelMode?: "DRIVE";
  routingPreference?: "TRAFFIC_AWARE_OPTIMAL" | "TRAFFIC_AWARE";
  departureTime?: string;
  regionCode?: "au" | string;
  languageCode?: "en-AU" | string;
  extraComputations?: ["TOLLS"];
  trafficModel?: "BEST_GUESS" | "PESSIMISTIC" | "OPTIMISTIC";
};

export type RouteMatrixRequest = {
  origins: RouteMatrixOrigin[];
  destinations: RouteMatrixDestination[];
} & RouteMatrixRequestConfig;

type RouteTravelAdvisory = {
  tollInfo?: object;
  speedReadingIntervals?: object[];
  fuelConsumptionMicroliters?: string;
  routeRestrictionsPartiallyIgnored?: boolean;
  transitFare?: object;
};

export type RouteMatrixResponse = {
  originIndex: number;
  destinationIndex: number;
  status: object;
  distanceMeters?: number;
  duration?: string;
  staticDuration?: string;
  travelAdvisory?: RouteTravelAdvisory;
  fallbackInfo?: {
    routingMode?: "FALLBACK_ROUTING_MODE_UNSPECIFIED" | "FALLBACK_TRAFFIC_UNAWARE" | "FALLBACK_TRAFFIC_AWARE";
    reason?: "FALLBACK_REASON_UNSPECIFIED" | "SERVER_ERROR" | "LATENCY_EXCEEDED";
  };
  condition: "ROUTE_EXISTS" | "ROUTE_NOT_FOUND" | "ROUTE_MATRIX_ELEMENT_CONDITION_UNSPECIFIED";
  localizedValues?: {
    distance?: LocalizedText;
    duration?: LocalizedText;
    staticDuration?: LocalizedText;
    transitFare?: LocalizedText;
  };
};
