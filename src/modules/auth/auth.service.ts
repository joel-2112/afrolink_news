import argon2 from 'argon2';
import prisma from '../../config/database';
import { signToken } from '../../utils/jwt';
import { RegisterInput, LoginInput } from './auth.schema';

export const registerUser = async (input: RegisterInput) => {
  
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    
    
    return { conflict: true } as const;
  }

  
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
      
    },
  });

  return { user };
};

export const loginUser = async (input: LoginInput) => {
  
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    return { invalid: true } as const;
  }

  
  const passwordMatch = await argon2.verify(user.password, input.password);

  if (!passwordMatch) {
    return { invalid: true } as const;
  }

  
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