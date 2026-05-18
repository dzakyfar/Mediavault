import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
const router=Router();
router.get('/', auth, asyncHandler(async(req,res)=> res.json({success:true, notifications: await prisma.notification.findMany({where:{userId:req.user.id}, orderBy:{createdAt:'desc'}, take:50})})));
router.patch('/:id/read', auth, asyncHandler(async(req,res)=> res.json({success:true, notification: await prisma.notification.update({where:{id:req.params.id}, data:{isRead:true}})})));
export default router;
