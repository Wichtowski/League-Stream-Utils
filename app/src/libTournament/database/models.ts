import { Schema, models, model, Model, InferSchemaType } from "mongoose";
import { MatchSchema } from "./schemas/match";
import { TournamentSchema } from "./schemas/tournament";
import { CommentatorSchema } from "./schemas/commentator";


const getModel = <T>(name: string, schema: Schema): Model<T> => {
  try {
    if (typeof window !== "undefined" && !models) {
      return model<T>(name, schema);
    }
    const existingModel = models[name] as Model<T> | undefined;
    if (existingModel) {
      return existingModel;
    }
    return model<T>(name, schema);
  } catch (_error) {
    return model<T>(name, schema);
  }
};

export const MatchModel = getModel<MatchDoc>("Match", MatchSchema);
export const TournamentModel = getModel<TournamentDoc>("Tournament", TournamentSchema);
export const CommentatorModel = getModel<CommentatorDoc>("Commentator", CommentatorSchema);


export type MatchDoc = InferSchemaType<typeof MatchSchema>;
export type TournamentDoc = InferSchemaType<typeof TournamentSchema>;
export type CommentatorDoc = InferSchemaType<typeof CommentatorSchema>;

