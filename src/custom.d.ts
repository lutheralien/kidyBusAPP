export interface ApiErrorResponse {
    success: false;
    message: string;
    data?: any;
    code?: number | string;
  }
  
  // Define a success response interface
 export interface ApiSuccessResponse {
    success: true;
    data: any;
  }

  export interface ILocation {
    type: string;
    coordinates: number[];
    place: string;
  }