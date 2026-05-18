import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { asyncHandler, AppError } from '../utils/errors.js';
import { auth } from '../middleware/auth.js';
const router = Router();
const safeUser = { id:true, email:true, name:true, role:true, profilePicture:true, phone:true, bio:true, location:true, isVerified:true };
const registerSchema = z.object({ email:z.string().email().toLowerCase(), password:z.string().min(8), name:z.string().min(2), role:z.enum(['CLIENT','FREELANCER']) });
const loginSchema = z.object({ email:z.string().email().toLowerCase(), password:z.string().min(1) });
function token(user){ return jwt.sign({ sub:user.id, role:user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }); }
router.post('/register', asyncHandler(async(req,res)=>{
  const data = registerSchema.parse(req.body);
  const exists = await prisma.user.findUnique({ where:{ email:data.email }});
  if (exists) throw new AppError(409,'Email already registered');
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.$transaction(async tx => {
    const u = await tx.user.create({ data:{ email:data.email, passwordHash, name:data.name, role:data.role }, select:safeUser });
    if (data.role === 'FREELANCER') await tx.freelancerProfile.create({ data:{ userId:u.id, skills:[] }});
    return u;
  });
  res.status(201).json({ success:true, token:token(user), user });
}));
router.post('/login', asyncHandler(async(req,res)=>{
  const data = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where:{ email:data.email }});
  if (!user || !user.isActive || !(await bcrypt.compare(data.password, user.passwordHash))) throw new AppError(401,'Invalid credentials');
  const { passwordHash, ...clean } = user;
  res.json({ success:true, token:token(user), user:clean });
}));
router.get('/me', auth, asyncHandler(async(req,res)=>{
  const user = await prisma.user.findUnique({ where:{ id:req.user.id }, select:{...safeUser, freelancerProfile:true} });
  res.json({ success:true, user });
}));
export default router;
