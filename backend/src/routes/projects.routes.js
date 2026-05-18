import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { auth, requireRole } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../utils/errors.js';
const router = Router();
const projectSchema = z.object({
 title:z.string().min(3), description:z.string().min(10), categoryId:z.string().uuid().optional().nullable(),
 budgetMin:z.coerce.number().optional().nullable(), budgetMax:z.coerce.number().optional().nullable(),
 budgetType:z.enum(['FIXED','HOURLY','NEGOTIABLE']).optional().nullable(), locationType:z.enum(['ONSITE','REMOTE','HYBRID']).optional().nullable(),
 locationDetails:z.string().optional().nullable(), deadline:z.string().optional().nullable()
});
router.get('/', asyncHandler(async(req,res)=>{
  const { status='OPEN', mine } = req.query;
  const where = { ...(status ? {status} : {}) };
  if (mine && req.user) where.clientId=req.user.id;
  const projects = await prisma.project.findMany({ where, orderBy:{createdAt:'desc'}, include:{category:true, client:{select:{id:true,name:true}}, freelancer:{select:{id:true,name:true}}, _count:{select:{proposals:true}}} });
  res.json({ success:true, projects });
}));
router.post('/', auth, requireRole('CLIENT','ADMIN'), asyncHandler(async(req,res)=>{
  const data = projectSchema.parse(req.body);
  const project = await prisma.project.create({ data:{ ...data, deadline:data.deadline ? new Date(data.deadline) : null, clientId:req.user.id }});
  res.status(201).json({ success:true, project });
}));
router.get('/:id', asyncHandler(async(req,res)=>{
  const project = await prisma.project.findUnique({ where:{id:req.params.id}, include:{category:true, client:{select:{id:true,name:true}}, freelancer:{select:{id:true,name:true}}, proposals:{include:{freelancer:{select:{id:true,name:true}}}}} });
  if (!project) throw new AppError(404,'Project not found');
  res.json({ success:true, project });
}));
router.patch('/:id', auth, asyncHandler(async(req,res)=>{
  const current = await prisma.project.findUnique({ where:{id:req.params.id} });
  if (!current) throw new AppError(404,'Project not found');
  if (current.clientId !== req.user.id && req.user.role !== 'ADMIN') throw new AppError(403,'Forbidden');
  const data = projectSchema.partial().extend({status:z.enum(['OPEN','NEGOTIATING','IN_PROGRESS','COMPLETED','CANCELLED']).optional()}).parse(req.body);
  const project = await prisma.project.update({ where:{id:req.params.id}, data:{...data, deadline:data.deadline ? new Date(data.deadline) : undefined} });
  res.json({ success:true, project });
}));
router.delete('/:id', auth, asyncHandler(async(req,res)=>{
  const current = await prisma.project.findUnique({ where:{id:req.params.id} });
  if (!current) throw new AppError(404,'Project not found');
  if (current.clientId !== req.user.id && req.user.role !== 'ADMIN') throw new AppError(403,'Forbidden');
  await prisma.project.delete({ where:{id:req.params.id} });
  res.json({ success:true });
}));
router.post('/:id/apply', auth, requireRole('FREELANCER'), asyncHandler(async(req,res)=>{
  const data = z.object({coverLetter:z.string().min(20), bidAmount:z.coerce.number().optional(), estimatedDays:z.coerce.number().int().positive().optional()}).parse(req.body);
  const project = await prisma.project.findUnique({ where:{id:req.params.id} });
  if (!project || project.status !== 'OPEN') throw new AppError(400,'Project is not open');
  if (project.clientId === req.user.id) throw new AppError(400,'Client cannot apply to own project');
  const proposal = await prisma.$transaction(async tx=>{
    const p = await tx.proposal.create({ data:{...data, projectId:req.params.id, freelancerId:req.user.id} });
    await tx.project.update({ where:{id:req.params.id}, data:{ proposalsCount:{increment:1}, status:'NEGOTIATING' }});
    await tx.notification.create({ data:{ userId:project.clientId, type:'PROPOSAL_RECEIVED', title:'Proposal baru', content:`${req.user.name} mengirim proposal untuk ${project.title}`, metadata:{projectId:project.id, proposalId:p.id} }});
    return p;
  });
  res.status(201).json({ success:true, proposal });
}));
router.post('/:projectId/proposals/:proposalId/accept', auth, requireRole('CLIENT','ADMIN'), asyncHandler(async(req,res)=>{
  const project = await prisma.project.findUnique({ where:{id:req.params.projectId} });
  if (!project) throw new AppError(404,'Project not found');
  if (project.clientId !== req.user.id && req.user.role !== 'ADMIN') throw new AppError(403,'Forbidden');
  const proposal = await prisma.proposal.findUnique({ where:{id:req.params.proposalId} });
  if (!proposal || proposal.projectId !== project.id) throw new AppError(404,'Proposal not found');
  await prisma.$transaction([
    prisma.proposal.update({ where:{id:proposal.id}, data:{status:'ACCEPTED'} }),
    prisma.proposal.updateMany({ where:{projectId:project.id, id:{not:proposal.id}}, data:{status:'REJECTED'} }),
    prisma.project.update({ where:{id:project.id}, data:{freelancerId:proposal.freelancerId, status:'IN_PROGRESS'} })
  ]);
  res.json({ success:true });
}));
export default router;
