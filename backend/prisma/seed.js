import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const categories = [
 ['Wedding','wedding','Camera'], ['Product Photography','product-photography','Package'], ['Fashion','fashion','Shirt'],
 ['Corporate Event','corporate-event','Briefcase'], ['Concert','concert','Music'], ['Real Estate','real-estate','Building'],
 ['Portrait','portrait','User'], ['Commercial Video','commercial-video','Video'], ['Documentary','documentary','FileText'], ['Animation','animation','PenTool']
];
for (const [name, slug, icon] of categories) await prisma.category.upsert({ where:{slug}, update:{name, icon}, create:{name, slug, icon} });
await prisma.$disconnect();
