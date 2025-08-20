import { v4 as uuidv4 } from "uuid";
import { connectToDatabase } from "./connection";
import { UserModel } from "./models";
import type { User as UserType, UserRegistration, UserQueryResult } from "@lib/types";
import { transformDoc } from "./transformDoc";

export async function createUser(userData: UserRegistration & { passwordHistory?: string[] }): Promise<UserType> {
  await connectToDatabase();

  const newUser = new UserModel({
    id: uuidv4(),
    username: userData.username,
    password: userData.password,
    passwordHistory: userData.passwordHistory || [],
    email: userData.email,
    isAdmin: false,
    sessionsCreatedToday: 0,
    lastSessionDate: ""
  });

  await newUser.save();

  return transformDoc(newUser);
}

export async function getUserByUsername(username: string): Promise<UserQueryResult> {
  await connectToDatabase();
  return await UserModel.findOne({ username });
}

export async function getUserByEmail(email: string): Promise<UserQueryResult> {
  await connectToDatabase();
  return await UserModel.findOne({ email });
}

export async function updateUserSessionCount(userId: string): Promise<void> {
  await connectToDatabase();

  const today = new Date();
  const user: UserQueryResult = await UserModel.findOne({ id: userId });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.lastSessionDate !== today) {
    user.sessionsCreatedToday = 1;
    user.lastSessionDate = today;
  } else {
    user.sessionsCreatedToday += 1;
  }

  await user.save();
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
