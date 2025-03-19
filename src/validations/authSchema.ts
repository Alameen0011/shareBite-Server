import { z } from "zod";

export const signupSchema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
    role: z.string()
});

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
    
});