import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/errors.js';
export async function auth(req,res,next){
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
    if (!token) throw new AppError(401,'Unauthorized');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findFirst({ where:{ id: payload.sub, isActive:true }, select:{id:true,email:true,name:true,role:true} });
    if (!user) throw new AppError(401,'Unauthorized');
    req.user = user; next();
  } catch(e){ next(e.status ? e : new AppError(401,'Invalid or expired token')); }
}
export const requireRole = (...roles)=>(req,res,next)=> roles.includes(req.user.role) ? next() : next(new AppError(403,'Forbidden'));
