import { z } from 'zod';

export const RoleSchema = z.enum(['USER', 'ADMIN', 'SYSTEM']);
export type Role = z.infer<typeof RoleSchema>;

export const OAuthProviderSchema = z.enum(['LOCAL', 'GOOGLE', 'GITHUB']);
export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
  oauthProvider: OAuthProviderSchema.nullable(),
  emailVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type User = z.infer<typeof UserSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
