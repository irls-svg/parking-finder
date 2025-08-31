import { memo, useCallback, useState } from "react";
import { GoogleMap, InfoWindowF, Libraries, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import Search from "./Search";
import SelectedLocationMarker from "./SelectedLocationMarker";
import axios, { AxiosResponse } from "axios";
import CurrentLocationMarker from "./CurrentLocationMarker";

export default memo(Map);

const libraries: Libraries = ["places", "core"];

const config = {
  id: "google-map-script",
  region: "AU",
  language: "en-AU",
  googleMapsApiKey: import.meta.env.VITE_MAPS_API_KEY,
  libraries: libraries,
};

const containerStyle = {
  width: "40em",
  height: "40em",
};

const center = {
  lat: -27.470125,
  lng: 153.021072,
};

function Map(): JSX.Element {
  const { isLoaded, loadError } = useJsApiLoader(config);
  const [location, setLocation] = useState<google.maps.LatLngLiteral>();
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral>();
  const [carparks, setCarparks] = useState<CarparkCollection>();
  const [carparkInfo, setCarparkInfo] = useState<any | undefined>();

  const onLoad = useCallback(function onLoad(mapInstance: google.maps.Map) {
    // From Google Maps Places API docs
    // https://developers.google.com/maps/documentation/javascript/examples/map-geolocation#maps_map_geolocation-typescript

    if (isLoaded) return;

    // TODO: Add error handling for location permissions denied
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos: GeolocationPosition) => {
          const position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          mapInstance.setCenter(position);
          mapInstance.setZoom(15);
          setCurrentLocation(position);
        },
        (error: GeolocationPositionError) => {
          console.log("location denied:", error);
        }
      );
    }
  }, []);

  const handleSubmit = useCallback(
    async function (selectedLocation: SelectedLocation) {
      if (!selectedLocation) return;
      setLocation({ lat: selectedLocation.latitude, lng: selectedLocation.longitude });
      const carparks: CarparkCollection = await getData(selectedLocation);
      setCarparks(carparks);
    },
    [setLocation, carparks]
  );

  // Wrap element for access to 'window.google'
  const renderMap = (): JSX.Element => {
    const options: google.maps.MapOptions = {
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP,
      },
      fullscreenControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP,
      },
      mapTypeControlOptions: {
        position: google.maps.ControlPosition.LEFT_TOP,
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.HYBRID],
      },
    };

    function handleMarkerClick(carpark: Carpark) {
      console.log(carpark.properties);
      setCarparkInfo({
        ...carpark.properties,
        id: carpark.id,
        position: { lat: carpark.geometry.coordinates[1], lng: carpark.geometry.coordinates[0] },
      });
    }

    return (
      <div className='flex flex-col gap-y-5 max-w-[40em] items-center justify-center'>
        <Search onSubmit={handleSubmit} />

        <GoogleMap
          onLoad={onLoad}
          mapContainerStyle={containerStyle}
          options={options}
          center={currentLocation || center}
          zoom={15}
        >
          <CurrentLocationMarker currentLocation={currentLocation} />
          {location && <SelectedLocationMarker location={location} carparks={carparks} />}
          {carparks &&
            carparks.features.map((carpark: Carpark) => (
              <MarkerF
                key={carpark.id}
                position={{ lat: carpark.geometry.coordinates[1], lng: carpark.geometry.coordinates[0] }}
                icon={"/icon.svg"}
                label={{
                  color: "white",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  text: `$${carpark.properties.price || 0}`,
                }}
                onClick={() => handleMarkerClick(carpark)}
                zIndex={carpark.properties.route.distanceMeters}
              />
            ))}
          {carparkInfo && (
            <InfoWindowF position={carparkInfo.position} onCloseClick={() => setCarparkInfo(undefined)}>
              <div>
                <div className='text-lg font-bold'>{carparkInfo.name}</div>
                <div className='text-sm'>
                  <div>${carparkInfo.price}</div>
                  <div>Features: {carparkInfo.features?.join(", ")}</div>
                </div>
                <div className='block rounded-md text-left bg-gray-100 px-3 py-2 my-3'>
                  <b>Directions:</b>
                  <div className='px-0.5 py-1'>
                    {carparkInfo.route.legs[0].steps.map((leg: any, index: any) => (
                      <div key={index + 1}>
                        {index + 1}. {leg.navigationInstruction.instructions}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
        {carparks ? (
          <div className='rounded-md flex w-full h-80 bg-gray-100 p-6 overflow-scroll'>
            <pre lang='json' className='text-left text-sm'>
              {JSON.stringify(carparks, null, 2)}
            </pre>
          </div>
        ) : (
          <></>
        )}
      </div>
    );
  };

  return !loadError && isLoaded ? renderMap() : <MapError />;
}

function MapError(): JSX.Element {
  return <p>Map cannot be loaded right now.</p>;
}

async function getData(data: SelectedLocation): Promise<CarparkCollection> {
  const response: AxiosResponse<CarparkCollection> = await axios.get(`${import.meta.env.VITE_API_URL}/search`, {
    params: data,
  });
  return response.data;
}

export type SelectedLocation = {
  placeId: string;
  latitude: number;
  longitude: number;
  distance?: number;
  viewport: google.maps.LatLngBounds;
};

type LocalizedText = {
  text: string;
  languageCode?: string;
};

type RouteTravelAdvisory = {
  tollInfo?: object;
  speedReadingIntervals?: object[];
  fuelConsumptionMicroliters?: string;
  routeRestrictionsPartiallyIgnored?: boolean;
  transitFare?: object;
};

type CarparkProperties = {
  name: string | null;
  price: number | null;
  features: string[] | null;
  address?: string | object | null;
  routeMatrix?: RouteMatrixResponse;
  route: RouteMatrixResponse;
};

export type Carpark = {
  type: "Feature";
  id: number;
  properties: CarparkProperties;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};

export type CarparkCollection = {
  type: "FeatureCollection";
  features: Carpark[];
  bbox: [number, number, number, number];
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

export type RequestParams = {
  placeId: string;
  latitude: number;
  longitude: number;
  distance: number;
};
