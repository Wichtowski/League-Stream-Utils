import { connectToDatabase } from "./connection";
import { UserModel } from "./models";
import type { User as UserType, UserRegistration, UserQueryResult } from "@lib/types";

export async function createUser(userData: UserRegistration & { passwordHistory?: string[] }): Promise<UserType> {
  await connectToDatabase();

  const newUser = new UserModel({
    username: userData.username,
    password: userData.password,
    passwordHistory: userData.passwordHistory || [],
    email: userData.email,
    isAdmin: false,
    sessionsCreatedToday: 0,
    lastSessionDate: new Date()
  });

  await newUser.save();

  // Re-fetch lean to ensure plain object with correct typing
  const created = await UserModel.findById(newUser._id).lean<UserType>().exec();
  return created as UserType;
}

export async function getUserByUsername(username: string): Promise<UserQueryResult> {
  await connectToDatabase();
  const user = await UserModel.findOne({ username }).lean<UserType>().exec();
  return (user as unknown) as UserQueryResult;
}

export async function getUserById(userId: string): Promise<UserQueryResult> {
  await connectToDatabase();
  const user = await UserModel.findById(userId).lean<UserType>().exec();
  return (user as unknown) as UserQueryResult;
}

export async function getUserByEmail(email: string): Promise<UserQueryResult> {
  await connectToDatabase();
  const user = await UserModel.findOne({ email }).lean<UserType>().exec();
  return (user as unknown) as UserQueryResult;
}

export async function updateUser(userId: string, updates: Partial<UserType>): Promise<UserType | null> {
  await connectToDatabase();
  const updatedUser = await UserModel.findByIdAndUpdate(userId, updates, { new: true }).lean<UserType>().exec();
  return (updatedUser as UserType) || null;
}

export async function deleteUser(userId: string): Promise<boolean> {
  await connectToDatabase();
  const result = await UserModel.findByIdAndDelete(userId);
  return !!result;
}

export async function getAllUsers(): Promise<UserType[]> {
  await connectToDatabase();
  const users = await UserModel.find({}).lean<UserType[]>().exec();
  return users as UserType[];
}

export async function updateUserSessionCount(userId: string): Promise<void> {
  await connectToDatabase();

  const today = new Date();
  const user = await UserModel.findOne({ id: userId }).lean<UserType>().exec();

  if (!user) {
    throw new Error("User not found");
  }

  const isSameDay =
    user.lastSessionDate &&
    new Date(user.lastSessionDate).toDateString() === today.toDateString();

  const nextSessionsCount = isSameDay ? user.sessionsCreatedToday + 1 : 1;

  await UserModel.updateOne(
    { id: userId },
    {
      $set: {
        sessionsCreatedToday: nextSessionsCount,
        lastSessionDate: today
      }
    }
  );
}

export async function canUserCreateSession(userId: string): Promise<boolean> {
  await connectToDatabase();

  const user: UserQueryResult = await UserModel.findOne({ id: userId });

  if (!user) {
    return false;
  }

  if (user.isAdmin) {
    return true;
  }

  const today = new Date();

  if (user.lastSessionDate !== today) {
    return true;
  }

  return user.sessionsCreatedToday < 2;
}

export async function lockUserAccount(userId: string, lockDurationMs: number): Promise<void> {
  await connectToDatabase();

  const lockedUntil = new Date(Date.now() + lockDurationMs);

  await UserModel.updateOne(
    { id: userId },
    {
      $set: {
        isLocked: true,
        lockedUntil: lockedUntil
      }
    }
  );
}

export async function unlockUserAccount(userId: string): Promise<void> {
  await connectToDatabase();

  await UserModel.updateOne(
    { id: userId },
    {
      $unset: {
        isLocked: 1,
        lockedUntil: 1
      }
    }
  );
}

export async function updateUserLoginInfo(userId: string, ip: string): Promise<void> {
  await connectToDatabase();

  await UserModel.updateOne(
    { id: userId },
    {
      $set: {
        lastLoginAt: new Date(),
        lastLoginIP: ip
      }
    }
  );
}
