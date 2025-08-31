import { MarkerF } from "@react-google-maps/api";

export default function CurrentLocationMarker({ currentLocation }: CurrentLocationMarkerProps) {
  return (
    currentLocation && (
      <MarkerF
        position={currentLocation}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6.25,
          fillColor: "#4285f4",
          fillOpacity: 1,
          strokeColor: "snow",
          strokeWeight: 2,
        }}
        title='Current location'
      >
        <MarkerF
          position={currentLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9.5,
            strokeColor: "#4285f4",
            strokeOpacity: 0.25,
          }}
        />
      </MarkerF>
    )
  );
}

type CurrentLocationMarkerProps = {
  currentLocation: google.maps.LatLngLiteral | undefined;
};
