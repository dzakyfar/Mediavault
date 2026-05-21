const projectStatusLabel = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  CONFIRMED: 'Confirmed',
  UNDER_REVIEW: 'Under Review',
  WAITING_PAYMENT: 'Waiting Payment',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const statusColor = {
  DRAFT: 'bg-[#888888] text-white',
  OPEN: 'bg-[#22C55E] text-white',
  IN_PROGRESS: 'bg-[#F5C800] text-black',
  CONFIRMED: 'bg-[#3B82F6] text-white',
  UNDER_REVIEW: 'bg-[#3B82F6] text-white',
  WAITING_PAYMENT: 'bg-[#F97316] text-white',
  COMPLETED: 'bg-[#22C55E] text-white',
  CANCELLED: 'bg-[#EF4444] text-white',
};

const projectStages = [
  { status: 'OPEN', label: 'Open', progress: 0 },
  { status: 'IN_PROGRESS', label: 'In Progress', progress: 25 },
  { status: 'UNDER_REVIEW', label: 'Under Review', progress: 60 },
  { status: 'WAITING_PAYMENT', label: 'Waiting Payment', progress: 85 },
  { status: 'COMPLETED', label: 'Completed', progress: 100 },
];

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const formatCurrency = (amount) => {
  if (!amount) return 'Rp 0';
  return currency.format(amount).replace(/\s/g, ' ');
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatDateTime = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const shortName = (fullName) => {
  if (!fullName) return 'Unassigned';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
};

const serializeProject = (project) => ({
  id: project.id,
  title: project.title,
  description: project.description,
  category: project.category,
  serviceType: project.serviceType,
  province: project.province,
  city: project.city,
  district: project.district,
  village: project.village,
  postalCode: project.postalCode,
  address: project.address,
  addressDetail: project.addressDetail,
  latitude: project.latitude,
  longitude: project.longitude,
  locationSource: project.locationSource,
  status: projectStatusLabel[project.status] || project.status,
  rawStatus: project.status,
  statusColor: statusColor[project.status] || statusColor.DRAFT,
  progress: project.progress,
  eventDate: formatDate(project.eventDate),
  due: formatDate(project.deadline),
  files: project.files?._count ?? project._count?.files ?? 0,
  amount: formatCurrency(project.budget),
  freelancer: project.freelancer ? shortName(project.freelancer.fullName) : 'Belum ada freelancer',
  freelancerId: project.freelancerId,
  client: project.client ? shortName(project.client.fullName) : 'Belum ada client',
  clientId: project.clientId,
  pendingOffers: project.applications?.map((application) => ({
    id: application.id,
    message: application.message,
    serviceType: application.serviceType,
    status: application.status,
    freelancerId: application.freelancerId,
    freelancer: application.freelancer ? shortName(application.freelancer.fullName) : 'Freelancer',
    freelancerFullName: application.freelancer?.fullName || 'Freelancer',
    freelancerSpecialty: application.freelancer?.specialty || null,
    freelancerStartingPrice: application.freelancer?.startingPrice || null,
    rating: null,
    createdAt: formatDate(application.createdAt),
  })) || [],
  tracking: projectStages.map((stage) => ({
    ...stage,
    done: project.progress >= stage.progress || project.status === stage.status,
    active: project.status === stage.status,
  })),
  histories: project.histories?.map((history) => ({
    id: history.id,
    title: history.title,
    body: history.body,
    eventType: history.eventType,
    createdAt: formatDate(history.createdAt),
  })) || [],
  submissions: project.submissions?.map((submission) => ({
    id: submission.id,
    comment: submission.comment,
    fileUrl: submission.fileUrl,
    fileName: submission.fileName,
    fileType: submission.fileType,
    fileSize: submission.fileSize,
    status: submission.status,
    reviewComment: submission.reviewComment,
    reviewedAt: submission.reviewedAt ? formatDateTime(submission.reviewedAt) : null,
    createdAt: formatDateTime(submission.createdAt),
    isPending: submission.status === 'PENDING',
  })) || [],
  referenceFiles: project.files?.map((file) => ({
    id: file.id,
    fileName: file.fileName,
    fileUrl: file.fileKey,
    contentType: file.contentType,
    size: file.size,
    createdAt: formatDateTime(file.createdAt),
  })) || [],
  review: project.reviews?.[0] ? {
    id: project.reviews[0].id,
    rating: project.reviews[0].rating,
    comment: project.reviews[0].comment,
    createdAt: formatDateTime(project.reviews[0].createdAt),
  } : null,
});

module.exports = {
  formatCurrency,
  serializeProject,
  shortName,
};
