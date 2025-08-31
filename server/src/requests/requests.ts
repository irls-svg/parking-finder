import { Feature, FeatureCollection, Id, Point, point } from "@turf/helpers";
import axios, { AxiosResponse } from "axios";
import { ApiError } from "../middleware/middleware";
import {
  RouteMatrixDestination,
  RouteMatrixOrigin,
  RouteMatrixRequest,
  RouteMatrixRequestConfig,
  RouteMatrixResponse,
  Waypoint,
} from "../types/google-maps-api";

const routeRequestConfig: RouteMatrixRequestConfig = {
  travelMode: "DRIVE",
  routingPreference: "TRAFFIC_AWARE_OPTIMAL",
  regionCode: "au",
  languageCode: "en-AU",
  trafficModel: "BEST_GUESS",
};

// TODO: Implement departure time to provide estimates for the future
export async function getRouteMatrixData(
  origin: RouteMatrixOrigin,
  destinations: RouteMatrixDestination[],
  departureTime?: string
) {
  if (!origin.waypoint) throw new ApiError("Invalid location provided", 400);
  if (!destinations.length) throw new ApiError("No matching carparks found", 404);
  const res = await axios.post<RouteMatrixRequest, AxiosResponse<RouteMatrixResponse[]>>(
    "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
    {
      origins: [origin],
      destinations: destinations,
      // departureTime: departureTime || new Date().toISOString(),
      ...routeRequestConfig,
    },
    {
      headers: {
        "X-Goog-FieldMask": "*",
        "X-Goog-Api-Key": process.env.GMAPS_API_KEY,
      },
    }
  );
  return res.data;
}

export async function getRouteData(
  id: Id | undefined,
  origin: Waypoint,
  destination: Waypoint,
  departureTime?: string
) {
  if (!origin) throw new ApiError("Invalid location provided", 400);
  if (!destination) throw new ApiError("No matching carpark", 404);
  const res = await axios.post<any, AxiosResponse<any>>(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      origin: origin,
      destination: destination,
      // departureTime: departureTime || new Date().toISOString(),
      units: "METRIC",
      ...routeRequestConfig,
    },
    {
      headers: {
        "X-Goog-FieldMask": "*",
        "X-Goog-Api-Key": process.env.GMAPS_API_KEY,
      },
    }
  );

  return { id: id, route: res.data.routes[0] };
}

/**
 * Creates a Waypoint object for use in Google Maps API requests from a given latitude and longitude..
 * @param latitude
 * @param longitude
 * @returns Waypoint object
 */
export function createWaypoint(latitude: number, longitude: number): Waypoint {
  return {
    sideOfRoad: true,
    vehicleStopover: false,
    location: { latLng: { longitude: longitude, latitude: latitude } },
  };
}

async function getArcgis<Point, Properties>({
  latitude,
  longitude,
  distance,
  url,
}: ArcgisSearchParams): Promise<FeatureCollection<Point, Properties>> {
  const res: AxiosResponse<FeatureCollection<Point, Properties>> = await axios.get("/query", {
    baseURL: url,
    params: {
      f: "geojson",
      inSR: "4326",
      outSR: "4326",
      outFields: "*",
      returnGeometry: true,
      resultRecordCount: 30,
      units: "esriSRUnit_Meter",
      geometryType: "esriGeometryPoint",
      distance: distance || 1000,
      geometry: `${longitude},${latitude}`,
    },
  });
  return res.data;
}

/**
 * Queries the Brisbane City Council Parking Meter ARCGIS API for on-street carparks within a certain distance of a given latitude and longitude.
 * @param latitude
 * @param longitude
 * @param distance
 * @returns A promise that resolves to an array of Carpark objects with their information and geometries.
 */
export async function getParkingMeters({ latitude, longitude, distance }: ApiSearchParams): Promise<Carpark[]> {
  const data: MeterParkingApiResponse = await getArcgis<Point, MeterParkingProperties>({
    latitude,
    longitude,
    distance,
    url: "https://services2.arcgis.com/dEKgZETqwmDAh1rP/arcgis/rest/services/parking_meters/FeatureServer/0",
  });
  return data.features.map((carpark: Feature<Point, MeterParkingProperties>, index: number): Carpark => {
    return point(
      carpark.geometry.coordinates,
      {
        name: `Meter No. ${carpark.properties.METER_NO}`,
        price: null,
        features: [`Category: ${carpark.properties.CATEGORY}`],
        address: {
          street: carpark.properties.STREET,
          suburb: carpark.properties.SUBURB,
        },
      },
      { id: index + 100 }
    );
  });
}

/**
 * Queries the Brisbane City Council Disabled Parking ARCGIS API for on-street carparks within a certain distance of a given latitude and longitude.
 * @param latitude
 * @param longitude
 * @param distance
 * @returns A promise that resolves to an array of Carpark objects with their information and geometries.
 */
export async function getDisabled({ latitude, longitude, distance }: ApiSearchParams): Promise<Carpark[]> {
  const data: DisabledParkingApiResponse = await getArcgis<Point, DisabledParkingProperties>({
    latitude,
    longitude,
    distance,
    url: "https://services2.arcgis.com/dEKgZETqwmDAh1rP/arcgis/rest/services/Disability_permit_parking/FeatureServer/0",
  });
  return data.features.map((carpark: Feature<Point, DisabledParkingProperties>, index: number): Carpark => {
    return point(
      [carpark.properties.LONGITUDE, carpark.properties.LATITUDE],
      {
        name: carpark.properties.STREET,
        price: null,
        features: [`Bays: ${carpark.properties.BAYS}`],
        address: carpark.properties.STREET,
      },
      { id: index + 200 }
    );
  });
}

// TODO: Include public carparks listed on Google Maps (Places) that may not be listed on other APIs
// export async function getGooglePlaces({ latitude, longitude, distance }: ApiSearchParams) {
//   const url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?type=parking&rankby=distance";
//   const res = await axios.get(url, {
//     params: { location: `${latitude},${longitude}`, key: process.env.GMAPS_API_KEY },
//   });
//   return res.data;
// }

/**
 * Queries the Wilson Parking API for on-street carparks within a certain distance of a given latitude and longitude.
 * @param latitude
 * @param longitude
 * @param distance
 * @returns A promise that resolves to an array of Carpark objects with their information and geometries.
 */
export async function getWilson({ latitude, longitude, distance }: ApiSearchParams): Promise<Carpark[]> {
  const url = "https://www.wilsonparking.com.au/api/v2/GetParkingByLocation";
  const response: AxiosResponse<WilsonParkingApiResponse> = await axios.get(url, {
    params: {
      latitude: latitude,
      longitude: longitude,
      carParkFeature: "12", // necessary for the API but unsure what it is
      distance: distance / 1000, // km
      sort: "distance", // "price|distance|undefined"
      pageid: "48908", // necessary for the API but unsure what it is
    },
  });
  return response.data.carParks.map((carpark: WilsonParkingCarpark, index: number): Carpark => {
    return point(
      [carpark.location.longitude, carpark.location.latitude],
      {
        name: carpark.name,
        price: Number(carpark.fromPrice),
        features: carpark.carParkFeature,
        address: carpark.location.address,
      },
      { id: index + 300 }
    );
  });
}

/**
 * Queries the Secure Park API for carparks within a certain distance of a given latitude and longitude.
 * @param latitude
 * @param longitude
 * @param distance
 * @returns A promise that resolves to an array of Carpark objects with their information and geometries.
 */
export async function getSecure({ latitude, longitude, distance }: ApiSearchParams): Promise<Carpark[]> {
  const requestData: SecureParkApiRequest = {
    categories: ["allday", "hourly", "night"],
    entryDateTime: "2023-08-19T18:00:00+10:00",
    exitDateTime: "2023-08-20T17:00:00+10:00",
    latitude: latitude,
    limit: 30,
    longitude: longitude,
    maxDistance: distance,
  };
  const response: AxiosResponse<SecureParkApiResponse> = await axios.post(
    "https://spa-fa-web-proxy-prd-ae.azurewebsites.net/search/carparks",
    requestData
  );
  return response.data.map((carpark: SecureParkCarpark, index: number): Carpark => {
    return point(
      [carpark.Longitude, carpark.Latitude],
      {
        name: carpark.Name,
        price: carpark.Price,
        features: carpark.Features,
        address: carpark.Address,
      },
      { id: index + 400 } // 4 is secure park's number in the list of apis
    );
  });
}

export type ApiSearchParams = {
  latitude: number;
  longitude: number;
  distance: number;
};

type ArcgisSearchParams = ApiSearchParams & {
  url?: string;
};

type MeterParkingProperties = {
  ObjectId: number;
  METER_NO: string | null;
  CATEGORY: string | null;
  STREET: string | null;
  SUBURB: string | null;
  MAX_STAY_HRS: string | null;
  RESTRICTIONS: string | null;
  OPERATIONAL_DAY: string | null;
  OPERATIONAL_TIME: string | null;
  TAR_ZONE: string | null;
  TAR_RATE_WEEKDAY: number | null;
  TAR_RATE_AH_WE: string | null;
  LOC_DESC: string | null;
  VEH_BAYS: number | null;
  MC_BAYS: number | null;
  MC_RATE: string | null;
  LONGITUDE: number | null;
  LATITUDE: number | null;
  MOBILE_ZONE: string | null;
  MAX_CAP_CHG: string | null;
};

type MeterParkingApiResponse = FeatureCollection<Point, MeterParkingProperties>;

type DisabledParkingProperties = {
  ZONE_ID: number;
  TYPE: string;
  OPERATING_TIMES: string;
  LATITUDE: number;
  LONGITUDE: number;
  BAYS: number;
  PARKING_LIMIT: string;
  STREET: string;
  ObjectId: number;
};

type DisabledParkingApiResponse = FeatureCollection<Point, DisabledParkingProperties>;

type WilsonParkingCarpark = {
  name: string;
  bookText: string | null;
  canBookABay: boolean;
  selectedFeatures: string;
  carParkFeature: [];
  services: [];
  carParkName: string;
  carParkNumber: number;
  carParkPhoto: string | null;
  category: string;
  costCenter: number;
  direction: string;
  heightRestriction: number;
  information: string;
  isWilsonOne: boolean;
  legacyID: number;
  monthlyParkingServiceIsAvailable: boolean;
  evChargerIsAvailable: boolean;
  disabledParkingIsAvailable: boolean;
  phoneNumber: string;
  products: [];
  staticMapPhoto: string | null;
  streetViewHeading: string;
  streetViewLocation: string;
  rates: [];
  fromText: string;
  fromPrice: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  openingTimes: [];
  url: string;
  serviceConfiguration: object;
  state: string;
  imgUrl: string;
  price: string | null;
  status: string | null;
  cpmsCarparkCode: unknown | null;
  externalCarParkInfo: unknown | null;
  featuredIndex: number;
};

type WilsonParkingApiResponse = {
  centerPoint: {
    latitude: number;
    longitude: number;
    distance: number;
  };
  carParks: WilsonParkingCarpark[];
  filters: Array<{ filtered: boolean; key: string; name: string }>;
  sort: Array<{ key: string; name: string; selected: boolean }>;
};

export type SecureParkCarpark = {
  Name: string;
  Alias: string;
  ReferenceNumber: string;
  Address: {
    Street: string;
    Suburb: string;
    PostCode: string;
    State: string;
  };
  Latitude: number;
  Longitude: number;
  Distance: number;
  CarParkId: string;
  ProductCategory: string;
  ProductId: string;
  ProductName: string;
  ProductDescription: string;
  ProductInstanceId: string;
  ProductRateId: string;
  Price: number;
  BookedPercentage: number;
  IsHardLimit: boolean;
  Features: string[];
  IsOffline: boolean;
  IsEndNextDay: boolean;
  StartTime: unknown | null;
  EndTime: unknown | null;
  IsBluetoothGate: boolean;
  StartTimeFrom: string;
  EndTimeFrom: string | null;
  StartTimeTo: string | null;
  EndTimeTo: string;
  IsRangeStart: boolean;
  IsRangeEnd: boolean;
  IsMultiDay: boolean;
  PriceLessFees: number;
  BookingFee: number;
};

type SecureParkApiRequest = {
  carparkId?: unknown | null;
  categories: string[];
  entryDateTime: string;
  exitDateTime: string;
  exitTimeMinutes?: number;
  isEarlybird?: boolean | null;
  isOvernight?: boolean | null;
  latitude: number;
  limit: number;
  longitude: number;
  maxDistance: number;
  onlineOnly?: boolean;
  primaryCategory?: "hourly";
  services?: Array<unknown>;
  showAllResults?: boolean;
  term?: string;
};

export type SecureParkApiResponse = SecureParkCarpark[];

type CarparkProperties = {
  name: string | null;
  price: number | null;
  features: string[] | null;
  address?: string | object | null;
  routeMatrix?: RouteMatrixResponse;
  route?: object;
};

export type Carpark = Feature<Point, CarparkProperties>;

export type RoutesResponse = {
  id: Id | undefined;
  route: object;
};
