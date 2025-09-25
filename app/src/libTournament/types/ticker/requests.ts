import { CarouselItem, Ticker } from "./";

export interface CreateTickerRequest {
  title: string;
  titleBackgroundColor?: string;
  titleTextColor?: string;
  carouselItems: Omit<CarouselItem, "_id">[];
  carouselSpeed: number;
  carouselBackgroundColor?: string;
}

export interface UpdateTickerRequest extends Partial<CreateTickerRequest> {
  _id: string;
}

export interface TickerAPIResponse {
  success: boolean;
  Ticker?: Ticker;
  error?: string;
}
