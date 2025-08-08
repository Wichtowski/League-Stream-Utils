import type { User } from './auth';

// Database document types that extend the base types with MongoDB methods
export interface UserDocument extends User {
    _id: string;
    __v?: number;
    save(): Promise<UserDocument>;
    toObject(): User;
}

// Database query result types (can be null if not found)
export type UserQueryResult = UserDocument | null;
