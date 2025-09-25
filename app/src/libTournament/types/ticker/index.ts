
export interface CarouselItem {
  _id?: string; // MongoDB auto-generated ID
  text: string;
  backgroundColor?: string; // Default: "#1f2937"
  textColor?: string; // Default: "#ffffff"
  order: number; // Default: 0
}

export interface Ticker {
  _id: string;
  title: string;
  titleBackgroundColor?: string; // Default: "#1f2937"
  titleTextColor?: string; // Default: "#ffffff"
  carouselItems: CarouselItem[]; // Default: []
  carouselSpeed: number; // pixels per second for carousel, Default: 50
  carouselBackgroundColor?: string; // Default: "#1f2937"
  createdAt: Date;
  updatedAt: Date;
}

export type EmbeddedTicker = Omit<Ticker, '_id'>;

export type { CarouselItemFormData, TickerFormData } from "./forms";
export type { CreateTickerRequest, UpdateTickerRequest, TickerAPIResponse } from "./requests";