export const serviceCatalog = [
  {
    category: 'Wedding',
    services: ['Wedding Photography', 'Wedding Videography', 'Photo + Video Wedding', 'Prewedding Shoot'],
  },
  {
    category: 'Product',
    services: ['Product Shoot', 'Food Photography', 'Catalog Photo', 'Commercial Editing'],
  },
  {
    category: 'Fashion',
    services: ['Fashion Editorial', 'Lookbook Shoot', 'Model Portfolio', 'Beauty Shoot'],
  },
  {
    category: 'Corporate',
    services: ['Corporate Event', 'Company Profile Video', 'Headshot Session', 'Brand Campaign'],
  },
  {
    category: 'Concert',
    services: ['Concert Documentation', 'Stage Photography', 'Aftermovie', 'Live Highlight'],
  },
  {
    category: 'Real Estate',
    services: ['Real Estate Shoot', 'Property Video', 'Interior Photography', 'Drone Property'],
  },
];

export const getServicesForCategory = (category: string) => (
  serviceCatalog.find((item) => item.category === category)?.services || []
);
