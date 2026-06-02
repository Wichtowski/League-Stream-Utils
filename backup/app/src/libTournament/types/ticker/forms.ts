export interface CarouselItemFormData {
  text: string;
  backgroundColor: string;
  textColor: string;
  order: number;
}

export interface TickerFormData {
  title: string;
  titleBackgroundColor: string;
  titleTextColor: string;
  carouselItems: CarouselItemFormData[];
  carouselSpeed: number;
  carouselBackgroundColor: string;
}
