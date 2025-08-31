import {
  Carpark,
  getRouteData,
  getRouteMatrixData,
  createWaypoint,
  getDisabled,
  getParkingMeters,
  getSecure,
  getWilson,
  RoutesResponse,
} from "../requests/requests";
import { Response } from "express";
import { wrapper } from "../middleware/middleware";
import { featureCollection } from "@turf/helpers";
import { RouteMatrixDestination, RouteMatrixResponse } from "../types/google-maps-api";
import bbox from "@turf/bbox";

export const handleSearch = wrapper(async (req: any, res: Response) => {
  console.log(req.query);
  const fetchedCarparks = await Promise.allSettled([
    getParkingMeters(req.query),
    getDisabled(req.query),
    getWilson(req.query),
    getSecure(req.query),
  ]);

  const carparks: Carpark[] = filterSettledPromises(fetchedCarparks);
  const routes = await computeRoutes(carparks, req.query);
  // const routeMatrix = computeRouteMatrix(carparks, req.query);

  const updatedCarparks: Carpark[] = appendCarparkRoutes(carparks, routes);
  const carparkGeoJson = featureCollection(updatedCarparks);
  const boundingBox = bbox(carparkGeoJson);
  carparkGeoJson.bbox = boundingBox;

  res.status(200).send(carparkGeoJson);
});

// async function computeRouteMatrix(
//   carparks: Carpark[],
//   query: any,
//   departureTime?: string
// ): Promise<RouteMatrixResponse[]> {
//   const matrixData: RouteMatrixResponse[] = await getRouteMatrixData(
//     { waypoint: createWaypoint(query.latitude, query.longitude) },
//     carparks.map(
//       (carpark): RouteMatrixDestination => ({
//         waypoint: createWaypoint(carpark.geometry.coordinates[1], carpark.geometry.coordinates[0]),
//       })
//     )
//   );

//   return matrixData.sort((a, b) => a.destinationIndex - b.destinationIndex);
// }

async function computeRoutes(carparks: Carpark[], query: any) {
  const routesResponse: PromiseSettledResult<RoutesResponse>[] = await Promise.allSettled(
    carparks.map(
      (carpark: Carpark): Promise<RoutesResponse> =>
        getRouteData(
          carpark.id,
          createWaypoint(query.latitude, query.longitude),
          createWaypoint(carpark.geometry.coordinates[1], carpark.geometry.coordinates[0])
        )
    )
  );

  return filterSettledPromises(routesResponse);
}

/**
 * Removes any rejected promises from a list of settled promises, and flattens any arrays in the fulfilled promises.
 * @param settled
 * @returns An array of fulfilled promise values, flattened if they were in nested arrays.
 */
function filterSettledPromises(settled: any): any[] {
  return settled.reduce((acc: any[] | [], cur: PromiseSettledResult<any>): any[] => {
    if (cur.status !== "fulfilled") return [...acc];
    if (Array.isArray(cur.value)) return [...cur.value, ...acc];
    return [cur.value, ...acc];
  }, []);
}

function appendCarparkRoutes(carparks: Carpark[], routes: any[]) {
  return carparks.map((carpark: Carpark): Carpark => {
    const route = routes.find((route) => route.id === carpark.id);
    return {
      ...carpark,
      properties: {
        ...carpark.properties,
        // routeMatrix: routeMatrices[index],
        route: route.route, // Exclude duplicate ID
      },
    };
  });
}
