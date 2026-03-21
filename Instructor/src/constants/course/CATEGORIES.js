import { CATEGORY_MAP } from './CATEGORY_MAP.js';

const toHumanReadable = (value = '') => value
  .split('_')
  .filter(Boolean)
  .map((token) => {
    const upperToken = token.toUpperCase();
    const preservedUpperCase = new Set([
      'AI', 'ML', 'UI', 'UX', 'SEO', 'SEM', 'API', 'AWS', 'GCP', 'SQL', 'NLP',
      'OS', 'DBT', 'IOS', 'MFA', 'JWT', 'CMS', 'PWA', 'SSR', 'SSG', 'RAG',
      'ETL', 'BGP', 'OSPF', 'RIP', 'VLANS', 'GST', 'JEE', 'NEET', 'UPSC',
      'CAT', 'XAT', 'MAT', 'CMAT', 'GATE', 'SSC', 'RRB', 'NDA', 'CLAT',
      'NSE', 'BSE', 'TOEFL', 'IELTS', 'DAW', 'NFT', 'DAO', 'IPFS', 'VBA',
      'APA', 'MLA', 'KPI', 'CV', 'CICD', 'DEVOPS', 'QA', 'LFI', 'RFI',
      'XSS', 'CSRF', 'XXE', 'GDPR', 'CCPA', 'CEH', 'OSCP', 'CCNA', 'CCNP',
      'MERN', 'MEAN', 'PERN', 'T3', 'LAMP', 'JAMSTACK', 'MVC', 'MVP',
      'MVVM', 'CQRS', 'CAP', 'PACSLESE', 'SIEM', 'RTS', 'FPS', 'MOBA'
    ]);

    if (preservedUpperCase.has(upperToken)) return upperToken;
    if (/^[a-z]$/.test(token)) return token.toUpperCase();
    if (/^\d/.test(token)) return token.toUpperCase();
    return token.charAt(0).toUpperCase() + token.slice(1);
  })
  .join(' ');

export const CATEGORIES = Object.keys(CATEGORY_MAP).map((category) => ({
  value: category,
  label: toHumanReadable(category),
}));

export const getSubCategoriesByCategory = (category) => {
  const subcategories = CATEGORY_MAP[category] || [];
  return subcategories.map((subcategory) => ({
    value: subcategory,
    label: toHumanReadable(subcategory),
  }));
};

export const formatCategoryLabel = toHumanReadable;
