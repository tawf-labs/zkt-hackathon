export type Campaign = {
  id: number;
  title: string;
  organization: string;
  category: string;
  raised: number;
  goal: number;
  donors: number;
  daysLeft: number;
  image: string;
};

export const campaigns: Campaign[] = [
  {
    id: 1,
    title: "Emergency Relief for Earthquake Victims in Cianjur",
    organization: "Baznas Indonesia",
    category: "Emergency",
    raised: 125000,
    goal: 150000,
    donors: 2500,
    daysLeft: 12,
    image: "https://www.ypp.co.id/site/uploads/slides/6391630281061-header-cianjur-2.jpeg"
  },
  {
    id: 2,
    title: "Build a Clean Water Well for Remote Village",
    organization: "Human Initiative",
    category: "Waqf",
    raised: 8500,
    goal: 12000,
    donors: 170,
    daysLeft: 45,
    image: "https://waterwellsforafrica.org/wp-content/uploads/2023/11/home-helping-kids-02-1200x800-1-768x512.jpg"
  },
  {
    id: 3,
    title: "Scholarship Fund for 100 Orphan Students",
    organization: "Rumah Zakat",
    category: "Zakat",
    raised: 45000,
    goal: 50000,
    donors: 900,
    daysLeft: 5,
    image: "https://orphanlifefoundation.org/wp-content/uploads/2021/07/Children-smiling.png"
  },
  {
    id: 4,
    title: "Food Packages for Families in Need",
    organization: "Dompet Dhuafa",
    category: "Sadaqah",
    raised: 12000,
    goal: 25000,
    donors: 240,
    daysLeft: 20,
    image: "https://www.globalgiving.org/pfil/50448/pict_large.jpg"
  },
  {
    id: 5,
    title: "Medical Aid for Remote Communities",
    organization: "Lazismu",
    category: "Zakat",
    raised: 35000,
    goal: 60000,
    donors: 700,
    daysLeft: 18,
    image: "https://iwifoundation.org/wp-content/uploads/2019/07/Reaching-Rural-Communities.png"
  },
  {
    id: 6,
    title: "Mosque Renovation Project",
    organization: "BWI",
    category: "Waqf",
    raised: 80000,
    goal: 100000,
    donors: 1600,
    daysLeft: 60,
    image: "https://ychef.files.bbci.co.uk/1280x720/p08ytl9r.jpg"
  }
];

export const categories = ["Zakat", "Infaq", "Sadaqah", "Waqf", "Emergency"];
export const locations = ["Indonesia", "Palestine", "Syria", "Yemen", "Global"];
export const organizations = ["Baznas", "Dompet Dhuafa", "Rumah Zakat", "Human Initiative", "Lazismu"];

export const calculateProgress = (raised: number, goal: number) => {
  const progress = (raised / goal) * 100;
  return -((100 - progress));
};

export const formatCurrency = (amount: number) => {
  return `${amount.toLocaleString('id-ID', { maximumFractionDigits: 0 })} IDRX`;
};

export const getCampaignById = (id: number) => {
  return campaigns.find((campaign) => campaign.id === id);
};