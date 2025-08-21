import type { Document } from "mongoose";

export const transformDoc = <T, R = Omit<T, "_id" | "__v"> & { id: string }>(
  doc: Document & T
): R => {
  const obj = doc.toObject();
  const { _id, __v, ...rest } = obj;
  return {
    ...rest,
    id: _id?.toString() || obj.id
  } as R;
};
