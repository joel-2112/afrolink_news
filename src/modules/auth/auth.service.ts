import argon2 from 'argon2';
import prisma from '../../config/database';
import { signToken } from '../../utils/jwt';
import { RegisterInput, LoginInput } from './auth.schema';

export const registerUser = async (input: RegisterInput) => {
  // check duplicate email — story 1 criteria
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    // return structured error — not a throw
    // caller will shape into 409 response
    return { conflict: true } as const;
  }

  // hash password with Argon2 — spec explicitly lists it first
  const hashedPassword = await argon2.hash(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: input.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      // never return password — ever
    },
  });

  return { user };
};

export const loginUser = async (input: LoginInput) => {
  // find user by email
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    return { invalid: true } as const;
  }

  // verify against hashed password — story 2 criteria
  const passwordMatch = await argon2.verify(user.password, input.password);

  if (!passwordMatch) {
    return { invalid: true } as const;
  }

  // sign JWT with sub (userId) + role — exactly as spec requires
  const token = signToken({
    sub: user.id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};