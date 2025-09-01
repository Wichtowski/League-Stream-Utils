import { Schema, models, model, Model, InferSchemaType } from "mongoose";
import { TeamSchema } from "@libTeam/database/schemas";

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

export type TeamDoc = InferSchemaType<typeof TeamSchema>;
export const TeamModel = getModel<TeamDoc>("Team", TeamSchema);
