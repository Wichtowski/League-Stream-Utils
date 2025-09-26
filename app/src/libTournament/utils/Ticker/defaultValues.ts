import type { TickerFormData, CarouselItemFormData } from "@libTournament/types";

// Utility function to create default form data
export const createDefaultTickerForm = (): TickerFormData => ({
  title: "",
  titleBackgroundColor: "#1f2937",
  titleTextColor: "#ffffff",
  carouselItems: [],
  carouselSpeed: 50,
  carouselBackgroundColor: "#1f2937"
});

export const createDefaultCarouselItemForm = (): CarouselItemFormData => ({
  text: "",
  backgroundColor: "#1f2937",
  textColor: "#ffffff",
  order: 0
});
