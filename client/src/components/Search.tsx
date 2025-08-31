import { Autocomplete } from "@react-google-maps/api";
import { ChangeEvent, useState } from "react";
import { SelectedLocation } from "./Map";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

export default function Search({ onSubmit }: Search): JSX.Element {
  const [searchResult, setSearchResult] = useState<google.maps.places.Autocomplete>();
  const [distance, setDistance] = useState<Distance>(0.25);
  const [place, setPlace] = useState<AutocompleteResult>();

  function handleLoad(autocomplete: google.maps.places.Autocomplete) {
    setSearchResult(autocomplete);
  }

  function handleSubmit(event: any) {
    event.preventDefault();

    if (!place?.placeId || !place.geometry?.location || !place.geometry.viewport) {
      console.error("No place selected");
      return;
    }

    const selectedLocation: SelectedLocation = {
      distance: distance * 1000 || 1000,
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
      viewport: place.geometry.viewport,
      placeId: place.placeId,
    };

    onSubmit(selectedLocation);
  }

  function handleChangeDistance(event: ChangeEvent<HTMLInputElement>) {
    const distance: Distance = Number(event.target.value);
    console.log(distance, "distance");
    if (distance >= 0.25 && distance <= 10) setDistance(distance); // enforce minimum and maximum distance
  }

  function handleChangePlace() {
    if (searchResult != null) {
      const placeDetails = searchResult.getPlace();
      setPlace({ placeId: placeDetails.place_id, geometry: placeDetails.geometry });
    }
  }

  return (
    <form className='mt-6 flex items-center max-w-md gap-x-4 lg:basis-1/3' onSubmit={handleSubmit}>
      <label htmlFor='input' className='sr-only'>
        Location
      </label>
      <Autocomplete
        onLoad={handleLoad}
        onPlaceChanged={handleChangePlace}
        fields={["place_id", "geometry", "name"]}
        restrictions={{ country: "au" }}
      >
        <input
          id='place'
          name='location'
          type='search'
          required
          className='block w-72 rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 sm:text-sm sm:leading-6'
          placeholder='Select location...'
        />
      </Autocomplete>
      <div className='relative rounded-md shadow-sm'>
        <label htmlFor='distance' className='sr-only'>
          Distance
        </label>
        <input
          id='distance'
          name='distance'
          type='number'
          min={0.25}
          max={10}
          step={0.25}
          value={distance}
          inputMode='decimal'
          required
          onChange={handleChangeDistance}
          className='block w-28 rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 sm:text-sm sm:leading-6'
        />
        <span id='currency' className='absolute flex items-center inset-y-0 right-10 text-gray-500 sm:text-sm'>
          km
        </span>
      </div>
      <button
        type='submit'
        className='rounded-md border-0 px-2.5 py-2 text-sm font-bold text-white shadow-sm bg-pink-500 hover:bg-pink-400 active:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-500 focus-visible:bg-pink-400'
      >
        {/* Sourced from Hero Icons https://heroicons.com/ */}
        <MagnifyingGlassIcon className='h-5 w-5' />
      </button>
    </form>
  );
}

type AutocompleteResult = {
  placeId: string | undefined;
  geometry: google.maps.places.PlaceGeometry | undefined;
};

type Search = {
  onSubmit: any;
};

/** Distance in kilometres. */
type Distance = number;
