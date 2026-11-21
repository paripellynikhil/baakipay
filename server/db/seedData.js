// Sample data for the demo shop. Used only by db/seed.js.

const SHOP = {
  email: 'lakshmi@baakipay.in',
  password: 'BaakiPay@2026',
  shopName: 'Sri Lakshmi Kirana & Provisions',
  ownerName: 'Ramesh Rao',
  address: 'Madhapur, Hyderabad',
  upiId: 'srilakshmikirana@testupi',
  cashInHand: 50000,
};

const CUSTOMER_NAMES = [
  ['Rahul Sharma', 15000],
  ['Rahul Verma', 15000],
  ['Srinu Reddy', 15000],
  ['Lakshmi Devi', 15000],
  ['Anil Kumar', 15000],
  ['Meena Rao', 15000],
  ['Suresh Goud', 20000],
  ['Padma Priya', 15000],
  ['Venkat Naidu', 15000],
  ['Sunitha Yadav', 15000],
  ['Imran Ali', 15000],
  ['Kavitha Rani', 10000],
];

const CUSTOMERS = CUSTOMER_NAMES.map(([name, creditLimit], idx) => ({
  name,
  phone: '90000000' + String(idx + 1).padStart(2, '0'),
  upiId: name.toLowerCase().replace(/ /g, '.') + '@testupi',
  creditLimit,
}));

const INVOICES = [
  { c: 0, daysAgo: 84, total: 4200, paid: 4200 },
  { c: 1, daysAgo: 82, total: 5000, paid: 0 },
  { c: 2, daysAgo: 80, total: 3600, paid: 3600 },
  { c: 3, daysAgo: 75, total: 2200, paid: 2200 },
  { c: 4, daysAgo: 70, total: 6100, paid: 1000 },
  { c: 5, daysAgo: 66, total: 1800, paid: 1800 },
  { c: 6, daysAgo: 62, total: 7400, paid: 0 },
  { c: 7, daysAgo: 58, total: 2900, paid: 2900 },
  { c: 8, daysAgo: 55, total: 3300, paid: 0 },
  { c: 9, daysAgo: 50, total: 4800, paid: 4800 },
  { c: 10, daysAgo: 47, total: 2700, paid: 0 },
  { c: 11, daysAgo: 12, total: 1500, paid: 500 },
  { c: 0, daysAgo: 25, total: 10000, paid: 0 },
  { c: 2, daysAgo: 20, total: 2400, paid: 0 },
  { c: 5, daysAgo: 15, total: 900, paid: 900 },
  { c: 3, daysAgo: 8, total: 3000, paid: 0 },
  { c: 7, daysAgo: 4, total: 1750, paid: 0 },
  { c: 10, daysAgo: 1, total: 1100, paid: 0 },
];

const EXPENSES = [
  { title: 'Shop Rent', category: 'Rent', amount: 18000, dueInDays: 5 },
  { title: 'Staff Salary', category: 'Staff', amount: 45000, dueInDays: 10 },
  { title: 'Wholesale Supplier (Distributor)', category: 'Supplier', amount: 30000, dueInDays: 7 },
  { title: 'Electricity Bill', category: 'Utilities', amount: 2500, dueInDays: 12 },
  { title: 'Gas Cylinder', category: 'Utilities', amount: 1800, dueInDays: 20 },
];

module.exports = { SHOP, CUSTOMERS, INVOICES, EXPENSES };
