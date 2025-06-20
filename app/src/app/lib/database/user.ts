import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from './connection';
import { User } from './models';
import type { User as UserType, UserRegistration, UserQueryResult } from '@lib/types';

export async function createUser(userData: UserRegistration): Promise<UserType> {
  await connectToDatabase();

  const hashedPassword = await bcrypt.hash(userData.password, 12);

  const newUser = new User({
    id: uuidv4(),
    username: userData.username,
    password: hashedPassword,
    email: userData.email,
    isAdmin: false,
    sessionsCreatedToday: 0,
    lastSessionDate: '',
  });

  await newUser.save();

  return newUser;
}

export async function getUserByUsername(username: string): Promise<UserQueryResult> {
  await connectToDatabase();
  return await User.findOne({ username });
}

export async function getUserByEmail(email: string): Promise<UserQueryResult> {
  await connectToDatabase();
  return await User.findOne({ email });
}

export async function updateUserSessionCount(userId: string): Promise<void> {
  await connectToDatabase();

  const today = new Date().toDateString();
  const user: UserQueryResult = await User.findOne({ id: userId });

  if (!user) {
    throw new Error('User not found');
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

  const user: UserQueryResult = await User.findOne({ id: userId });

  if (!user) {
    return false;
  }

  if (user.isAdmin) {
    return true;
  }

  const today = new Date().toDateString();

  if (user.lastSessionDate !== today) {
    return true;
  }

  return user.sessionsCreatedToday < 2;
} 