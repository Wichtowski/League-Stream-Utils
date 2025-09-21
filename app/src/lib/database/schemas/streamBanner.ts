import { Schema } from "mongoose";

export const CarouselItemSchema = new Schema({
    text: { type: String, required: true },
    backgroundColor: { type: String, default: "#1f2937" },
    textColor: { type: String, default: "#ffffff" },
    order: { type: Number, default: 0 }
});

export const StreamBannerSchema = new Schema({
    title: { type: String, required: true },
    carouselItems: { type: [CarouselItemSchema], default: [] },
    displayDuration: { type: Number, default: 5 },
    carouselSpeed: { type: Number, default: 50 },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});