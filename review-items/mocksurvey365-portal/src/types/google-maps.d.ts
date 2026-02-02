// Google Maps type declarations
declare namespace google {
  namespace maps {
    namespace places {
      export class AutocompleteService {
        getPlacePredictions(
          request: {
            input: string;
            componentRestrictions?: { country: string };
          },
          callback: (
            predictions: Array<{
              description: string;
              place_id: string;
            }> | null,
            status: PlacesServiceStatus
          ) => void
        ): void;
      }

      export enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        INVALID_REQUEST = 'INVALID_REQUEST',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR',
      }
    }
  }
}

interface Window {
  google?: typeof google;
}
