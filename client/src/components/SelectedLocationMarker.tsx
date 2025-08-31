import { MarkerF, useGoogleMap } from "@react-google-maps/api";
import { useEffect } from "react";
import { CarparkCollection } from "./Map";

export default function SelectedLocationMarker({ location }: SelectedLocationMarkerProps): JSX.Element {
  const map = useGoogleMap();

  useEffect(() => {
    if (!location || !map) return;
    map.panTo(location);
  }, [location]);

  return location ? <MarkerF position={location}></MarkerF> : <></>;
}

export type SelectedLocationMarkerProps = {
  location: google.maps.LatLng | google.maps.LatLngLiteral;
  carparks: CarparkCollection | undefined;
};
