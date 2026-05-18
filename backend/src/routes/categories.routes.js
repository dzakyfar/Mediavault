import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/errors.js';
const router=Router();
router.get('/', asyncHandler(async(req,res)=> res.json({success:true, categories: await prisma.category.findMany({orderBy:{name:'asc'}})})));
export default router;
