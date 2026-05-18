import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { auth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
const router=Router();
router.get('/freelancers', asyncHandler(async(req,res)=>{
  const freelancers = await prisma.user.findMany({ where:{role:'FREELANCER', isActive:true}, select:{id:true,name:true,bio:true,location:true,profilePicture:true,freelancerProfile:true, portfolioItems:{take:6, orderBy:{createdAt:'desc'}}} });
  res.json({success:true, freelancers});
}));
router.patch('/me/freelancer', auth, requireRole('FREELANCER'), asyncHandler(async(req,res)=>{
  const data=z.object({headline:z.string().optional(), hourlyRate:z.coerce.number().optional(), experienceYears:z.coerce.number().int().optional(), skills:z.array(z.string()).optional(), portfolioUrl:z.string().url().optional().nullable(), instagramHandle:z.string().optional().nullable(), websiteUrl:z.string().url().optional().nullable()}).parse(req.body);
  const profile=await prisma.freelancerProfile.upsert({ where:{userId:req.user.id}, update:data, create:{userId:req.user.id, skills:data.skills||[], ...data} });
  res.json({success:true, profile});
}));
router.post('/me/portfolio', auth, requireRole('FREELANCER'), asyncHandler(async(req,res)=>{
  const data=z.object({title:z.string().min(3), description:z.string().optional(), mediaUrls:z.array(z.string()).default([]), thumbnailUrl:z.string().optional(), category:z.string().optional(), projectUrl:z.string().optional()}).parse(req.body);
  const item=await prisma.portfolioItem.create({ data:{...data, freelancerId:req.user.id} });
  res.status(201).json({success:true,item});
}));
export default router;
