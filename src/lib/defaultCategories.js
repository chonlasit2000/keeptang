export const defaultCategories = [
  { name: 'อาหาร', icon: 'Utensils', color: 'amber', type: 'expense', grp: 'need' },
  { name: 'เดินทาง', icon: 'Bus', color: 'sky', type: 'expense', grp: 'need' },
  { name: 'ช้อปปิ้ง', icon: 'ShoppingBag', color: 'pink', type: 'expense', grp: 'want' },
  { name: 'บิล/ค่าน้ำค่าไฟ', icon: 'ReceiptText', color: 'mint', type: 'expense', grp: 'need' },
  { name: 'ความบันเทิง', icon: 'Gamepad2', color: 'pink', type: 'expense', grp: 'want' },
  { name: 'สุขภาพ', icon: 'HeartPulse', color: 'mint', type: 'expense', grp: 'need' },
  { name: 'เงินออม/ลงทุน', icon: 'PiggyBank', color: 'sky', type: 'expense', grp: 'saving' },
  { name: 'ของขวัญ/รางวัลตัวเอง', icon: 'Gift', color: 'amber', type: 'expense', grp: 'reward' },
  { name: 'อื่นๆ', icon: 'Circle', color: 'coral', type: 'expense', grp: 'need' },
  { name: 'เงินเดือน', icon: 'WalletCards', color: 'mint', type: 'income', grp: 'need' },
  { name: 'งานเสริม', icon: 'BriefcaseBusiness', color: 'sky', type: 'income', grp: 'need' },
  { name: 'โบนัส', icon: 'Sparkles', color: 'amber', type: 'income', grp: 'reward' },
  { name: 'อื่นๆ', icon: 'CircleDollarSign', color: 'coral', type: 'income', grp: 'need' }
].map((category, index) => ({ ...category, sort_order: index }));
