declare module 'amadeus' {
  export default class Amadeus {
    constructor(options: { clientId: string; clientSecret: string });
    
    static location: {
      any: string;
      airport: string;
      city: string;
      hotel: string;
    };
    
    shopping: {
      flightOffersSearch: {
        get(params: Record<string, any>): Promise<{ data: any[] }>;
        pricing: {
          post(data: string): Promise<{ data: any }>;
        };
      };
      
      // Updated Hotel APIs as per migration guide
      hotelListings: {
        get(params: Record<string, any>): Promise<{ data: any[] }>;
      };
      
      hotelOffers: {
        get(params: Record<string, any>): Promise<{ data: any[] }>;
      };
    };
    
    referenceData: {
      locations: {
        get(params: { keyword: string; subType: string; page?: { limit: number } }): Promise<{ data: any[] }>;
      };
      airlines: {
        get(params: { airlineCodes: string }): Promise<{ data: any[] }>;
      };
      hotels: {
        get(params: { hotelIds: string | string[] }): Promise<{ data: any[] }>;
      };
    };
  }
}