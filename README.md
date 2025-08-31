# Parking Finder Mashup Application

This application was written as part of a university assignment. It helps users find and compare parking availability and prices near a specified location within the Brisbane City Council area. It was developed as part of an assignment for my university's Cloud Computing unit by combining Google Maps, ArcGIS, and parking company APIs.
Here's the pitch I wrote for the project:

> Finding a good, affordable parking spot near where you need to be can be hard, especially in the city when you and everyone else are rushing to get to work or class on time. It doesn't make it any easier that you have to check multiple parking sites, status pages, or drive around in endless circles just to find a spot in the first place!
>
> This mashup application takes the user's desired search radius from their destination, in combination with the Google Place system to query and aggregate parking data, then displays the most relevant options based on priorities set by the them — do they care about price, distance, or allowed stay length more? — so that they can easily find the best parking spot for them.

## Data Sources

- [Brisbane City Council Parking Meter Locations (ArcGIS Open Data)](https://www.data.brisbane.qld.gov.au/data/dataset/brisbane-parking-meters/resource/c628ca39-6a48-4edf-a6c6-15497e3bd670)
- [Wilson Parking API](https://www.wilsonparking.com.au/api/v2/GetParkingByLocation)*
- [Secure Parking API](https://spa-fa-web-proxy-prd-ae.azurewebsites.net/search/carparks)

The above APIs provide locations, prices, time restrictions, and availability of parking spaces. They are used to supplement information regarding the price and availability of parking that is not available with the Google Places API, and in the case of BCC parking meters, not listed as parking on Google Maps at all.

- [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview)

The Google Places API provides location query autocompletion and location search, and can be used to search for specific locations/categories of data — such as parking.

## Architecture

- AWS DynamoDB is used to store persistence data, and the API/server-side processing is stateless.
- The web client is stateless and used purely to display the results of the server-side data processing, using SSR to avoid any processing having to happen client-side.
- The results from the Google Places API are fed into the data source APIs for more accurate results regarding carpark distance to the users desired location. This determines which parking APIs the server will use for a given query, and the parameters to be fed into the search for those APIs.
- The server makes all requests to the underlying data APIs.
- Map display on the client is done by feeding in GeoJSON coordinates received from the server-side processing.

## User Stories

- As a person who needs to park my vehicle, I want to be presented with parking options across all available parking in an area and see it on a map, so I can quickly park my vehicle there.
- As a person who is concerned about the price of parking, I want to be able to easily compare the costs of all available parking in an area, so I can find the most affordable place to park my vehicle
