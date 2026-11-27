import fs from 'fs';
import path from 'path';
import type {
  AuditLogEntry,
  DokoState,
  InventoryItem,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  PaymentMethod,
  ReportsSummary,
  Reservation,
  RestaurantTable,
  RoleType,
} from '../src/types/doko.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'doko-db.json');

function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

function hoursAgo(hrs: number): string {
  return new Date(Date.now() - hrs * 3_600_000).toISOString();
}

function daysAgo(days: number, hour = 14): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 20, 0, 0);
  return d.toISOString();
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const SEED_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-wagyu',
    name: 'لحم واغيو مفروم فاخر',
    category: 'لحوم',
    unit: 'كجم',
    quantity: 24.5,
    minThreshold: 8,
    maxCapacity: 40,
    costPerUnit: 420,
    lastRestockedAt: hoursAgo(6),
  },
  {
    id: 'inv-ribeye',
    name: 'ستيك ريب آي معتق',
    category: 'لحوم',
    unit: 'قطعة',
    quantity: 28,
    minThreshold: 10,
    maxCapacity: 50,
    costPerUnit: 185,
    lastRestockedAt: hoursAgo(6),
  },
  {
    id: 'inv-salmon',
    name: 'فيليه سلمون أطلسي طازج',
    category: 'لحوم',
    unit: 'قطعة',
    quantity: 16,
    minThreshold: 6,
    maxCapacity: 30,
    costPerUnit: 195,
    lastRestockedAt: hoursAgo(4),
  },
  {
    id: 'inv-chicken',
    name: 'صدور دجاج متبلة',
    category: 'لحوم',
    unit: 'كجم',
    quantity: 19,
    minThreshold: 7,
    maxCapacity: 35,
    costPerUnit: 135,
    lastRestockedAt: hoursAgo(8),
  },
  {
    id: 'inv-brioche',
    name: 'خبز بريوش بالسمسم',
    category: 'مخبوزات',
    unit: 'قطعة',
    quantity: 56,
    minThreshold: 20,
    maxCapacity: 100,
    costPerUnit: 14,
    lastRestockedAt: hoursAgo(4),
  },
  {
    id: 'inv-pizza-dough',
    name: 'عجينة بيتزا نابولي مخمرة',
    category: 'مخبوزات',
    unit: 'قطعة',
    quantity: 32,
    minThreshold: 10,
    maxCapacity: 60,
    costPerUnit: 22,
    lastRestockedAt: hoursAgo(5),
  },
  {
    id: 'inv-cheddar',
    name: 'جبنة شيدر وموتزاريلا',
    category: 'أجبان وصلصات',
    unit: 'كجم',
    quantity: 9.2,
    minThreshold: 4,
    maxCapacity: 20,
    costPerUnit: 290,
    lastRestockedAt: hoursAgo(10),
  },
  {
    id: 'inv-burrata',
    name: 'جبنة بوراتا إيطالية',
    category: 'أجبان وصلصات',
    unit: 'قطعة',
    quantity: 9,
    minThreshold: 10,
    maxCapacity: 30,
    costPerUnit: 75,
    lastRestockedAt: hoursAgo(12),
  },
  {
    id: 'inv-chili-glaze',
    name: 'صلصة دوكو الحمراء الحارة',
    category: 'أجبان وصلصات',
    unit: 'لتر',
    quantity: 11.4,
    minThreshold: 4,
    maxCapacity: 20,
    costPerUnit: 110,
    lastRestockedAt: hoursAgo(5),
  },
  {
    id: 'inv-pasta',
    name: 'مكرونة تالياتيلي طازجة',
    category: 'خضروات وباستا',
    unit: 'كجم',
    quantity: 14,
    minThreshold: 5,
    maxCapacity: 25,
    costPerUnit: 95,
    lastRestockedAt: hoursAgo(7),
  },
  {
    id: 'inv-cherry-tomato',
    name: 'طماطم شيري وأعشاب طازجة',
    category: 'خضروات وباستا',
    unit: 'كجم',
    quantity: 12.5,
    minThreshold: 5,
    maxCapacity: 24,
    costPerUnit: 45,
    lastRestockedAt: hoursAgo(3),
  },
  {
    id: 'inv-potato',
    name: 'بطاطس ترافل مقطعة',
    category: 'خضروات وباستا',
    unit: 'كجم',
    quantity: 22,
    minThreshold: 8,
    maxCapacity: 40,
    costPerUnit: 38,
    lastRestockedAt: hoursAgo(5),
  },
  {
    id: 'inv-raspberry',
    name: 'توت أحمر وكريمة ماسكاربوني',
    category: 'مشروبات وحلويات',
    unit: 'حصة',
    quantity: 18,
    minThreshold: 8,
    maxCapacity: 36,
    costPerUnit: 48,
    lastRestockedAt: hoursAgo(4),
  },
  {
    id: 'inv-hibiscus',
    name: 'خلاصة كركديه ورمان فوار',
    category: 'مشروبات وحلويات',
    unit: 'لتر',
    quantity: 16,
    minThreshold: 5,
    maxCapacity: 30,
    costPerUnit: 42,
    lastRestockedAt: hoursAgo(6),
  },
  {
    id: 'inv-espresso',
    name: 'حبوب إسبريسو مختصة وحليب',
    category: 'مشروبات وحلويات',
    unit: 'لتر',
    quantity: 14,
    minThreshold: 5,
    maxCapacity: 25,
    costPerUnit: 65,
    lastRestockedAt: hoursAgo(4),
  },
];

const SEED_MENU: MenuItem[] = [
  {
    id: 'dish-doko-smash',
    name: 'دوكو دبل سماش واغيو',
    description:
      'شريحتان من لحم الواغيو المشوي على الصاج مع شيدر معتق، بصل مكرمل، وصلصة دوكو الحمراء داخل خبز بريوش محمص.',
    category: 'البرجر واللحوم',
    price: 265,
    image: '/src/assets/images/dish_signature_burger_1795810517694.jpg',
    accentKind: 'burger',
    prepMinutes: 14,
    calories: 780,
    available: true,
    featured: true,
    spicyLevel: 1,
    recipe: [
      { inventoryId: 'inv-wagyu', amount: 0.25 },
      { inventoryId: 'inv-brioche', amount: 1 },
      { inventoryId: 'inv-cheddar', amount: 0.06 },
      { inventoryId: 'inv-chili-glaze', amount: 0.04 },
    ],
  },
  {
    id: 'dish-ribeye-fire',
    name: 'ستيك ريب آي على الفحم',
    description:
      'قطعة ريب آي ٣٠٠ جم مشوية على فحم السنديان مع إكليل الجبل، طماطم شيري مشوية، وصوص الفلفل الأحمر المركز.',
    category: 'البرجر واللحوم',
    price: 490,
    image: '/src/assets/images/dish_fire_steak_1795810517458.jpg',
    accentKind: 'steak',
    prepMinutes: 20,
    calories: 840,
    available: true,
    featured: true,
    spicyLevel: 0,
    recipe: [
      { inventoryId: 'inv-ribeye', amount: 1 },
      { inventoryId: 'inv-cherry-tomato', amount: 0.15 },
      { inventoryId: 'inv-chili-glaze', amount: 0.05 },
    ],
  },
  {
    id: 'dish-grilled-salmon',
    name: 'سلمون أطلسي مشوي بالأعشاب',
    description:
      'شريحة سلمون مقرمشة الجلد مشوية بالزبدة والليمون مع الهليون المشوي والطماطم الكرزية وصوص التوت الأحمر.',
    category: 'البرجر واللحوم',
    price: 445,
    image: '/src/assets/images/dish_grilled_salmon_1795811733665.jpg',
    accentKind: 'salmon',
    prepMinutes: 18,
    calories: 620,
    available: true,
    featured: true,
    spicyLevel: 0,
    recipe: [
      { inventoryId: 'inv-salmon', amount: 1 },
      { inventoryId: 'inv-cherry-tomato', amount: 0.12 },
    ],
  },
  {
    id: 'dish-margherita-pizza',
    name: 'بيتزا مارغريتا نابولي بالفرن الحجري',
    description:
      'عجينة نابولي مخمرة ٤٨ ساعة، صلصة طماطم سان مارزانو، موتزاريلا طازجة، وريحان إيطالي وزيت زيتون بكر.',
    category: 'البيتزا',
    price: 220,
    image: '/src/assets/images/dish_margherita_pizza_1795811732685.jpg',
    accentKind: 'pizza',
    prepMinutes: 12,
    calories: 710,
    available: true,
    featured: true,
    spicyLevel: 0,
    recipe: [
      { inventoryId: 'inv-pizza-dough', amount: 1 },
      { inventoryId: 'inv-cheddar', amount: 0.12 },
      { inventoryId: 'inv-cherry-tomato', amount: 0.15 },
    ],
  },
  {
    id: 'dish-harissa-burrata',
    name: 'تالياتيلي الهريسة والبوراتا',
    description:
      'مكرونة تالياتيلي طازجة مطهوة مع صلصة الطماطم المشوية والهريسة الدافئة وتعلوها كرة بوراتا كريمية وريحان طازج.',
    category: 'الباستا',
    price: 245,
    image: '/src/assets/images/dish_truffle_pasta_1795810518197.jpg',
    accentKind: 'pasta',
    prepMinutes: 15,
    calories: 690,
    available: true,
    featured: true,
    spicyLevel: 1,
    recipe: [
      { inventoryId: 'inv-pasta', amount: 0.22 },
      { inventoryId: 'inv-burrata', amount: 1 },
      { inventoryId: 'inv-cherry-tomato', amount: 0.14 },
      { inventoryId: 'inv-chili-glaze', amount: 0.03 },
    ],
  },
  {
    id: 'dish-crispy-crimson',
    name: 'ستربس دوكو المقرمش بالعسل الحار',
    description:
      'شرائح دجاج ذهبية مقرمشة مغلفة بطبقة عسل الفلفل الأحمر والسمسم المحمص مع تغميسة الثوم الكريمية.',
    category: 'المقبلات',
    price: 175,
    image: '/src/assets/images/dish_crispy_chicken_1795810519018.jpg',
    accentKind: 'chicken',
    prepMinutes: 12,
    calories: 560,
    available: true,
    featured: true,
    spicyLevel: 2,
    recipe: [
      { inventoryId: 'inv-chicken', amount: 0.25 },
      { inventoryId: 'inv-chili-glaze', amount: 0.06 },
    ],
  },
  {
    id: 'dish-truffle-fries',
    name: 'بطاطس دوكو بالكمأة والبارميزان',
    description:
      'بطاطس مقرمشة مزدوجة القلي مع رشة زيت الكمأة، جبن معتق، وأعشاب الحديقة مع صوص دوكو المدخن.',
    category: 'المقبلات',
    price: 95,
    image: '/src/assets/images/dish_truffle_fries_1795811733053.jpg',
    accentKind: 'salad',
    prepMinutes: 9,
    calories: 420,
    available: true,
    spicyLevel: 0,
    recipe: [
      { inventoryId: 'inv-potato', amount: 0.3 },
      { inventoryId: 'inv-cheddar', amount: 0.04 },
    ],
  },
  {
    id: 'dish-smoked-slider',
    name: 'سلايدرز اللحم المدخن (٣ قطع)',
    description:
      'ثلاث قطع برجر صغيرة من لحم الواغيو والجبن السائح وصوص الشواء الأحمر الحار في خبز بريوش طازج.',
    category: 'البرجر واللحوم',
    price: 215,
    image: '/src/assets/images/dish_signature_burger_1795810517694.jpg',
    accentKind: 'burger',
    prepMinutes: 13,
    calories: 650,
    available: true,
    spicyLevel: 1,
    recipe: [
      { inventoryId: 'inv-wagyu', amount: 0.18 },
      { inventoryId: 'inv-brioche', amount: 2 },
      { inventoryId: 'inv-cheddar', amount: 0.05 },
    ],
  },
  {
    id: 'dish-millefeuille',
    name: 'ميل فاي التوت الأحمر والماسكاربوني',
    description:
      'طبقات عجين فرنسي مقرمش محشوة بكريمة الفانيليا والماسكاربوني ومربى التوت الأحمر الطازج.',
    category: 'الحلويات',
    price: 155,
    image: '/src/assets/images/dish_red_velvet_dessert_1795810518510.jpg',
    accentKind: 'dessert',
    prepMinutes: 7,
    calories: 460,
    available: true,
    featured: true,
    spicyLevel: 0,
    recipe: [{ inventoryId: 'inv-raspberry', amount: 1 }],
  },
  {
    id: 'dish-crimson-fizz',
    name: 'دوكو روبي فوار (كركديه ورمان)',
    description:
      'مشروب بارد منعش من خلاصة الكركديه الطبيعي وحبيبات الرمان الطازجة مع مياه فوارة وأوراق نعناع.',
    category: 'المشروبات',
    price: 68,
    image: '/src/assets/images/drink_ruby_hibiscus_1795811731690.jpg',
    accentKind: 'drink',
    prepMinutes: 4,
    calories: 110,
    available: true,
    spicyLevel: 0,
    recipe: [{ inventoryId: 'inv-hibiscus', amount: 0.3 }],
  },
  {
    id: 'dish-berry-espresso',
    name: 'موهيتو التوت والأحمر الحامض',
    description:
      'مزيج التوت البري الطازج المهروس مع شرائح الليمون الأخضر والنعناع والثلج المجروش.',
    category: 'المشروبات',
    price: 75,
    image: '/src/assets/images/drink_berry_mojito_1795811731217.jpg',
    accentKind: 'drink',
    prepMinutes: 4,
    calories: 125,
    available: true,
    spicyLevel: 0,
    recipe: [
      { inventoryId: 'inv-hibiscus', amount: 0.25 },
      { inventoryId: 'inv-raspberry', amount: 0.25 },
    ],
  },
  {
    id: 'dish-spanish-latte',
    name: 'آيس سبانش لاتيه دوكو المختص',
    description:
      'شوت إسبريسو مزدوج محمص طازجاً فوق حليب مثلج محلى بنكهة الفانيليا الطبيعية.',
    category: 'المشروبات',
    price: 85,
    image: '/src/assets/images/drink_iced_spanish_latte_1795811732688.jpg',
    accentKind: 'drink',
    prepMinutes: 5,
    calories: 185,
    available: true,
    spicyLevel: 0,
    recipe: [{ inventoryId: 'inv-espresso', amount: 0.25 }],
  },,
  {
    id: 'dish-classic-smash',
    name: 'كلاسيك سماش برجر',
    description: 'برجر لحم بقري مشوي مع شيدر وخس وطماطم وصوص دوكو الخاص.',
    category: 'البرجر واللحوم',
    price: 195,
    accentKind: 'burger',
    prepMinutes: 12,
    calories: 690,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'dish-mushroom-burger',
    name: 'برجر المشروم السويسري',
    description: 'لحم بقري مع مشروم سوتيه وجبنة سويسري وصوص كريمي.',
    category: 'البرجر واللحوم',
    price: 225,
    accentKind: 'burger',
    prepMinutes: 14,
    calories: 740,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'dish-bbq-burger',
    name: 'برجر باربكيو مدخن',
    description: 'برجر مشوي مع جبنة شيدر وبصل مقرمش وصوص باربكيو.',
    category: 'البرجر واللحوم',
    price: 210,
    accentKind: 'burger',
    prepMinutes: 13,
    calories: 720,
    available: true,
    spicyLevel: 1,
    recipe: [],
  },
  {
    id: 'dish-chicken-burger',
    name: 'برجر دجاج كرسبي',
    description: 'صدر دجاج مقرمش مع خس ومايونيز بالليمون داخل خبز بريوش.',
    category: 'البرجر واللحوم',
    price: 185,
    accentKind: 'chicken',
    prepMinutes: 12,
    calories: 650,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'dish-mix-grill',
    name: 'مشاوي دوكو المشكلة',
    description: 'كفتة وكباب وشيش طاووق مع أرز بسمتي وسلطة طحينة.',
    category: 'البرجر واللحوم',
    price: 320,
    accentKind: 'steak',
    prepMinutes: 22,
    calories: 880,
    available: true,
    spicyLevel: 1,
    recipe: [],
  },
  {
    id: 'dish-alfredo-pasta',
    name: 'باستا ألفريدو بالدجاج',
    description: 'مكرونة بصوص ألفريدو الكريمي وقطع الدجاج المشوية.',
    category: 'الباستا',
    price: 220,
    accentKind: 'pasta',
    prepMinutes: 15,
    calories: 760,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'dish-arrabbiata',
    name: 'باستا أرابياتا',
    description: 'مكرونة بصوص الطماطم الحار والثوم والريحان.',
    category: 'الباستا',
    price: 175,
    accentKind: 'pasta',
    prepMinutes: 13,
    calories: 590,
    available: true,
    spicyLevel: 2,
    recipe: [],
  },
  {
    id: 'dish-chicken-pesto',
    name: 'باستا دجاج بيستو',
    description: 'مكرونة بصوص البيستو والبارميزان وشرائح الدجاج.',
    category: 'الباستا',
    price: 235,
    accentKind: 'pasta',
    prepMinutes: 16,
    calories: 720,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'dish-four-cheese',
    name: 'باستا فور تشيز',
    description: 'مكرونة بصوص مزيج أربعة أنواع من الجبن.',
    category: 'الباستا',
    price: 225,
    accentKind: 'pasta',
    prepMinutes: 15,
    calories: 790,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'dish-pepperoni-pizza',
    name: 'بيتزا بيبروني',
    description: 'بيتزا بعجينة مخمرة وصلصة طماطم وموتزاريلا وبيبروني.',
    category: 'البيتزا',
    price: 235,
    accentKind: 'pizza',
    prepMinutes: 14,
    calories: 820,
    available: true,
    spicyLevel: 1,
    recipe: [],
  },
  {
    id: 'dish-chicken-ranch-pizza',
    name: 'بيتزا تشيكن رانش',
    description: 'دجاج مشوي وموتزاريلا وصوص رانش وفلفل ألوان.',
    category: 'البيتزا',
    price: 245,
    accentKind: 'pizza',
    prepMinutes: 16,
    calories: 850,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'dish-veggie-pizza',
    name: 'بيتزا الخضار',
    description: 'موتزاريلا وفلفل ألوان وزيتون ومشروم وطماطم.',
    category: 'البيتزا',
    price: 195,
    accentKind: 'pizza',
    prepMinutes: 13,
    calories: 680,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'dish-bbq-beef-pizza',
    name: 'بيتزا باربكيو بيف',
    description: 'لحم بقري وصوص باربكيو وبصل وموتزاريلا.',
    category: 'البيتزا',
    price: 260,
    accentKind: 'pizza',
    prepMinutes: 16,
    calories: 880,
    available: true,
    spicyLevel: 1,
    recipe: [],
  },
  {
    id: 'dish-mozzarella-sticks',
    name: 'أصابع موزاريلا',
    description: 'أصابع جبنة موزاريلا مقلية تقدم مع صوص مارينارا.',
    category: 'المقبلات',
    price: 110,
    accentKind: 'salad',
    prepMinutes: 8,
    calories: 390,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'dish-onion-rings',
    name: 'حلقات البصل المقرمشة',
    description: 'حلقات بصل ذهبية مع صوص رانش.',
    category: 'المقبلات',
    price: 75,
    accentKind: 'salad',
    prepMinutes: 7,
    calories: 330,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'dish-chicken-wings',
    name: 'أجنحة دجاج حارة',
    description: 'أجنحة دجاج بصوص حار مع صوص الجبن الأزرق.',
    category: 'المقبلات',
    price: 145,
    accentKind: 'chicken',
    prepMinutes: 13,
    calories: 520,
    available: true,
    spicyLevel: 2,
    recipe: [],
  },
  {
    id: 'dish-caesar-salad',
    name: 'سلطة سيزر بالدجاج',
    description: 'خس روماني ودجاج مشوي وبارميزان وخبز محمص.',
    category: 'المقبلات',
    price: 155,
    accentKind: 'salad',
    prepMinutes: 10,
    calories: 410,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'dish-loaded-fries',
    name: 'بطاطس لودد بالجبنة',
    description: 'بطاطس مقلية مع صوص الجبنة وقطع اللحم والبصل الأخضر.',
    category: 'المقبلات',
    price: 135,
    accentKind: 'salad',
    prepMinutes: 9,
    calories: 560,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'dish-chocolate-fondant',
    name: 'مولتن كيك بالشوكولاتة',
    description: 'كيك شوكولاتة دافئ بقلب سائل مع آيس كريم فانيليا.',
    category: 'الحلويات',
    price: 145,
    accentKind: 'dessert',
    prepMinutes: 9,
    calories: 520,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'dish-cheesecake',
    name: 'تشيز كيك نيويورك',
    description: 'تشيز كيك كريمي على قاعدة بسكويت مع صوص الفراولة.',
    category: 'الحلويات',
    price: 135,
    accentKind: 'dessert',
    prepMinutes: 6,
    calories: 430,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'dish-brownie',
    name: 'براوني شوكولاتة',
    description: 'براوني غني بالشوكولاتة يقدم دافئاً مع صوص الشوكولاتة.',
    category: 'الحلويات',
    price: 115,
    accentKind: 'dessert',
    prepMinutes: 7,
    calories: 480,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-fresh-orange',
    name: 'عصير برتقال فريش',
    description: 'عصير برتقال طبيعي طازج.',
    category: 'المشروبات',
    price: 55,
    accentKind: 'drink',
    prepMinutes: 4,
    calories: 115,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-lemon-mint',
    name: 'ليمون بالنعناع',
    description: 'ليمون طازج مع نعناع وثلج.',
    category: 'المشروبات',
    price: 58,
    accentKind: 'drink',
    prepMinutes: 4,
    calories: 95,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-mango',
    name: 'عصير مانجو',
    description: 'مانجو طبيعية مثلجة.',
    category: 'المشروبات',
    price: 65,
    accentKind: 'drink',
    prepMinutes: 4,
    calories: 180,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-strawberry',
    name: 'عصير فراولة',
    description: 'فراولة طازجة مخفوقة.',
    category: 'المشروبات',
    price: 60,
    accentKind: 'drink',
    prepMinutes: 4,
    calories: 150,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-guava',
    name: 'عصير جوافة',
    description: 'جوافة طازجة بالحليب أو بدونه.',
    category: 'المشروبات',
    price: 58,
    accentKind: 'drink',
    prepMinutes: 4,
    calories: 160,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-water',
    name: 'مياه معدنية',
    description: 'زجاجة مياه معدنية باردة.',
    category: 'المشروبات',
    price: 20,
    accentKind: 'drink',
    prepMinutes: 1,
    calories: 0,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-cola',
    name: 'كولا',
    description: 'مشروب غازي بارد.',
    category: 'المشروبات',
    price: 35,
    accentKind: 'drink',
    prepMinutes: 2,
    calories: 140,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-sprite',
    name: 'سبرايت',
    description: 'مشروب ليمون وليمون أخضر غازي.',
    category: 'المشروبات',
    price: 35,
    accentKind: 'drink',
    prepMinutes: 2,
    calories: 135,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-iced-americano',
    name: 'آيس أمريكانو',
    description: 'إسبريسو مزدوج مع ماء وثلج.',
    category: 'المشروبات',
    price: 65,
    accentKind: 'drink',
    prepMinutes: 4,
    calories: 10,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-cappuccino',
    name: 'كابتشينو',
    description: 'إسبريسو مع حليب مبخر ورغوة ناعمة.',
    category: 'المشروبات',
    price: 75,
    accentKind: 'drink',
    prepMinutes: 5,
    calories: 120,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-hot-chocolate',
    name: 'هوت شوكليت',
    description: 'شوكولاتة ساخنة بالحليب.',
    category: 'المشروبات',
    price: 80,
    accentKind: 'drink',
    prepMinutes: 5,
    calories: 260,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-peach-ice-tea',
    name: 'آيس تي خوخ',
    description: 'شاي مثلج بنكهة الخوخ والليمون.',
    category: 'المشروبات',
    price: 60,
    accentKind: 'drink',
    prepMinutes: 4,
    calories: 105,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-pomegranate',
    name: 'عصير رمان',
    description: 'عصير رمان طبيعي منعش.',
    category: 'المشروبات',
    price: 70,
    accentKind: 'drink',
    prepMinutes: 4,
    calories: 150,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-passion-mojito',
    name: 'باشن فروت موهيتو',
    description: 'باشن فروت مع صودا ونعناع وليمون.',
    category: 'المشروبات',
    price: 85,
    accentKind: 'drink',
    prepMinutes: 5,
    calories: 135,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-watermelon',
    name: 'عصير بطيخ',
    description: 'عصير بطيخ طازج مثلج.',
    category: 'المشروبات',
    price: 55,
    accentKind: 'drink',
    prepMinutes: 4,
    calories: 100,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-vanilla-milkshake',
    name: 'ميلك شيك فانيليا',
    description: 'آيس كريم فانيليا مخفوق بالحليب.',
    category: 'المشروبات',
    price: 90,
    accentKind: 'drink',
    prepMinutes: 5,
    calories: 390,
    available: true,
    spicyLevel: 0,
    recipe: [],
  },
  {
    id: 'drink-chocolate-milkshake',
    name: 'ميلك شيك شوكولاتة',
    description: 'آيس كريم شوكولاتة مع الحليب وصوص الشوكولاتة.',
    category: 'المشروبات',
    price: 95,
    accentKind: 'drink',
    prepMinutes: 5,
    calories: 440,
    available: true,
    spicyLevel: 0,
    recipe: [],
  }
];

function createInitialState(): DokoState {
  const inventory = SEED_INVENTORY.map((i) => ({ ...i }));
  const menu = SEED_MENU.map((m) => ({ ...m }));

  const tables: RestaurantTable[] = [
    { id: 'tbl-1', number: 1, capacity: 2, zone: 'الصالة الرئيسية', status: 'occupied', currentOrderId: 'ord-1043', guestName: 'عمر خالد' },
    { id: 'tbl-2', number: 2, capacity: 4, zone: 'الصالة الرئيسية', status: 'available' },
    { id: 'tbl-3', number: 3, capacity: 4, zone: 'الصالة الرئيسية', status: 'billing', currentOrderId: 'ord-1041', guestName: 'سارة محمود' },
    { id: 'tbl-4', number: 4, capacity: 6, zone: 'قسم العائلات', status: 'reserved', guestName: 'عائلة المنصور' },
    { id: 'tbl-5', number: 5, capacity: 6, zone: 'قسم العائلات', status: 'available' },
    { id: 'tbl-6', number: 6, capacity: 2, zone: 'التراس الخارجي', status: 'occupied', currentOrderId: 'ord-1042', guestName: 'يوسف طارق' },
    { id: 'tbl-7', number: 7, capacity: 4, zone: 'التراس الخارجي', status: 'available' },
    { id: 'tbl-8', number: 8, capacity: 8, zone: 'قسم العائلات', status: 'available' },
  ];

  const reservations: Reservation[] = [
    {
      id: 'res-1',
      customerName: 'أحمد المنصور',
      phone: '01012345678',
      partySize: 6,
      date: todayISO(),
      time: '20:30',
      tableNumber: 4,
      status: 'confirmed',
      notes: 'مناسبة عائلية — يفضل إضاءة هادئة',
      createdAt: hoursAgo(3),
    },
    {
      id: 'res-2',
      customerName: 'نور الهدى',
      phone: '01198765432',
      partySize: 2,
      date: todayISO(),
      time: '21:00',
      status: 'waiting',
      notes: 'تفضل التراس الخارجي إذا أتيحت طاولة',
      createdAt: hoursAgo(1),
    },
    {
      id: 'res-3',
      customerName: 'كريم عبدالعزيز',
      phone: '01233445566',
      partySize: 4,
      date: todayISO(),
      time: '19:30',
      tableNumber: 1,
      status: 'seated',
      createdAt: hoursAgo(4),
    },
  ];

  const calcCost = (items: { menuItemId: string; quantity: number }[]) => {
    let totalCost = 0;
    for (const line of items) {
      const dish = menu.find((m) => m.id === line.menuItemId);
      if (!dish) continue;
      for (const ing of dish.recipe) {
        const inv = inventory.find((i) => i.id === ing.inventoryId);
        if (inv) totalCost += inv.costPerUnit * ing.amount * line.quantity;
      }
    }
    return Math.round(totalCost);
  };

  const makeOrder = (
    id: string,
    num: number,
    type: OrderType,
    status: OrderStatus,
    lines: { menuItemId: string; quantity: number; prepared?: boolean }[],
    paymentMethod: PaymentMethod,
    customerName: string,
    createdAt: string,
    createdByRole: RoleType,
    createdByName: string,
    tableNumber?: number,
    discount = 0
  ): Order => {
    const items: OrderItem[] = lines.map((l) => {
      const m = menu.find((x) => x.id === l.menuItemId)!;
      return {
        menuItemId: m.id,
        name: m.name,
        price: m.price,
        quantity: l.quantity,
        prepared: l.prepared ?? (status === 'ready' || status === 'served' || status === 'completed'),
      };
    });
    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const tax = Math.round(subtotal * 0.14);
    const total = Math.max(0, subtotal + tax - discount);
    return {
      id,
      orderNumber: num,
      type,
      status,
      items,
      subtotal,
      tax,
      discount,
      total,
      estimatedCost: calcCost(lines),
      paymentMethod,
      paymentStatus: paymentMethod === 'unpaid' ? 'unpaid' : 'paid',
      tableNumber,
      customerName,
      createdByRole,
      createdByName,
      createdAt,
      updatedAt: createdAt,
      completedAt: status === 'completed' ? createdAt : undefined,
    };
  };

  const orders: Order[] = [
    makeOrder(
      'ord-1044',
      1044,
      'delivery',
      'pending',
      [
        { menuItemId: 'dish-doko-smash', quantity: 2 },
        { menuItemId: 'dish-crispy-crimson', quantity: 1 },
        { menuItemId: 'dish-crimson-fizz', quantity: 2 },
      ],
      'card',
      'ليلى حسن',
      minutesAgo(4),
      'customer',
      'طلب أونلاين'
    ),
    makeOrder(
      'ord-1043',
      1043,
      'dine_in',
      'preparing',
      [
        { menuItemId: 'dish-ribeye-fire', quantity: 1, prepared: false },
        { menuItemId: 'dish-harissa-burrata', quantity: 1, prepared: true },
        { menuItemId: 'dish-crimson-fizz', quantity: 2, prepared: true },
      ],
      'unpaid',
      'عمر خالد',
      minutesAgo(11),
      'waiter',
      'مازن (جارسون)',
      1
    ),
    makeOrder(
      'ord-1042',
      1042,
      'dine_in',
      'ready',
      [
        { menuItemId: 'dish-doko-smash', quantity: 1 },
        { menuItemId: 'dish-truffle-fries', quantity: 1 },
        { menuItemId: 'dish-millefeuille', quantity: 1 },
      ],
      'unpaid',
      'يوسف طارق',
      minutesAgo(18),
      'waiter',
      'مازن (جارسون)',
      6
    ),
    makeOrder(
      'ord-1041',
      1041,
      'dine_in',
      'served',
      [
        { menuItemId: 'dish-ribeye-fire', quantity: 2 },
        { menuItemId: 'dish-berry-espresso', quantity: 2 },
      ],
      'unpaid',
      'سارة محمود',
      minutesAgo(35),
      'waiter',
      'ياسين (جارسون)',
      3
    ),
    makeOrder(
      'ord-1040',
      1040,
      'takeaway',
      'completed',
      [
        { menuItemId: 'dish-doko-smash', quantity: 2 },
        { menuItemId: 'dish-truffle-fries', quantity: 2 },
        { menuItemId: 'dish-spanish-latte', quantity: 2 },
      ],
      'cash',
      'حسام الدين',
      hoursAgo(1),
      'cashier',
      'زياد (كاشير)'
    ),
    makeOrder(
      'ord-1039',
      1039,
      'dine_in',
      'completed',
      [
        { menuItemId: 'dish-harissa-burrata', quantity: 2 },
        { menuItemId: 'dish-margherita-pizza', quantity: 1 },
        { menuItemId: 'dish-millefeuille', quantity: 2 },
        { menuItemId: 'dish-crimson-fizz', quantity: 2 },
      ],
      'card',
      'مريم فؤاد',
      hoursAgo(2),
      'waiter',
      'مازن (جارسون)',
      2
    ),
    makeOrder(
      'ord-1038',
      1038,
      'delivery',
      'completed',
      [
        { menuItemId: 'dish-smoked-slider', quantity: 2 },
        { menuItemId: 'dish-crispy-crimson', quantity: 2 },
      ],
      'wallet',
      'طارق شريف',
      hoursAgo(3),
      'customer',
      'طلب أونلاين',
      undefined,
      30
    ),
    makeOrder(
      'ord-1037',
      1037,
      'takeaway',
      'completed',
      [
        { menuItemId: 'dish-grilled-salmon', quantity: 1 },
        { menuItemId: 'dish-millefeuille', quantity: 1 },
      ],
      'card',
      'ندى جمال',
      hoursAgo(4),
      'cashier',
      'زياد (كاشير)'
    ),
    makeOrder(
      'ord-1036',
      1036,
      'dine_in',
      'completed',
      [
        { menuItemId: 'dish-doko-smash', quantity: 3 },
        { menuItemId: 'dish-crispy-crimson', quantity: 2 },
        { menuItemId: 'dish-berry-espresso', quantity: 3 },
      ],
      'cash',
      'أحمد راشد',
      daysAgo(1, 20),
      'waiter',
      'ياسين (جارسون)',
      5
    ),
    makeOrder(
      'ord-1035',
      1035,
      'delivery',
      'completed',
      [
        { menuItemId: 'dish-margherita-pizza', quantity: 2 },
        { menuItemId: 'dish-harissa-burrata', quantity: 1 },
        { menuItemId: 'dish-truffle-fries', quantity: 2 },
      ],
      'card',
      'هبة سامي',
      daysAgo(1, 16),
      'customer',
      'طلب أونلاين'
    ),
    makeOrder(
      'ord-1034',
      1034,
      'takeaway',
      'cancelled',
      [{ menuItemId: 'dish-smoked-slider', quantity: 1 }],
      'unpaid',
      'رامي عادل',
      daysAgo(2, 18),
      'cashier',
      'زياد (كاشير)'
    ),
    makeOrder(
      'ord-1033',
      1033,
      'dine_in',
      'completed',
      [
        { menuItemId: 'dish-ribeye-fire', quantity: 2 },
        { menuItemId: 'dish-doko-smash', quantity: 2 },
        { menuItemId: 'dish-millefeuille', quantity: 2 },
      ],
      'card',
      'شركة النيل',
      daysAgo(3, 19),
      'manager',
      'إدارة دوكو',
      8,
      100
    ),
  ];

  const stockMovements = [
    {
      id: 'mov-1',
      itemId: 'inv-wagyu',
      itemName: 'لحم واغيو مفروم فاخر',
      delta: -0.5,
      balanceAfter: 24.5,
      reason: 'خصم تلقائي للطلب #1044',
      actorRole: 'customer' as RoleType,
      createdAt: minutesAgo(4),
    },
    {
      id: 'mov-2',
      itemId: 'inv-ribeye',
      itemName: 'ستيك ريب آي معتق',
      delta: -1,
      balanceAfter: 28,
      reason: 'خصم تلقائي للطلب #1043',
      actorRole: 'waiter' as RoleType,
      createdAt: minutesAgo(11),
    },
    {
      id: 'mov-3',
      itemId: 'inv-burrata',
      itemName: 'جبنة بوراتا إيطالية',
      delta: -1,
      balanceAfter: 9,
      reason: 'خصم تلقائي للطلب #1043 — تنبيه قرب النفاد',
      actorRole: 'waiter' as RoleType,
      createdAt: minutesAgo(11),
    },
  ];

  const auditLogs: AuditLogEntry[] = [
    {
      id: 'aud-1',
      role: 'customer',
      actorName: 'ليلى حسن (عميل)',
      action: 'إنشاء طلب أونلاين #1044',
      details: 'طلب دليفري بقيمة 884 ج.م مع خصم تلقائي من المخزون',
      createdAt: minutesAgo(4),
    },
    {
      id: 'aud-2',
      role: 'waiter',
      actorName: 'مازن (جارسون)',
      action: 'فتح طلب طاولة 1 (#1043)',
      details: 'تم إرسال الطلب مباشرة إلى شاشة المطبخ',
      createdAt: minutesAgo(11),
    },
    {
      id: 'aud-3',
      role: 'chef',
      actorName: 'الشيف طارق',
      action: 'تجهيز الطلب #1042',
      details: 'تم تحويل حالة طاولة 6 إلى جاهز للتقديم',
      createdAt: minutesAgo(12),
    },
    {
      id: 'aud-4',
      role: 'reception',
      actorName: 'سلمى (ريسبشن)',
      action: 'تأكيد حجز طاولة 4',
      details: 'حجز أحمد المنصور لعدد 6 ضيوف الساعة 20:30',
      createdAt: hoursAgo(3),
    },
  ];

  return {
    menu,
    inventory,
    stockMovements,
    orders,
    tables,
    reservations,
    auditLogs,
    nextOrderNumber: 1045,
  };
}

class DokoStore {
  private state: DokoState;
  private listeners: Set<(state: DokoState) => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DokoState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DokoState;
        if (parsed && Array.isArray(parsed.menu) && Array.isArray(parsed.inventory)) {
          this.syncSeedCatalog(parsed);
          this.saveState(parsed);
          return parsed;
        }
      }
    } catch {
      // Fallback to fresh seed
    }
    const fresh = createInitialState();
    this.saveState(fresh);
    return fresh;
  }

  // Ensures new seed items and newly generated drink/food images merge cleanly into persisted DB
  private syncSeedCatalog(state: DokoState) {
    for (const seedInv of SEED_INVENTORY) {
      if (!state.inventory.some((i) => i.id === seedInv.id)) {
        state.inventory.push({ ...seedInv });
      }
    }
    for (const seedDish of SEED_MENU) {
      const existing = state.menu.find((m) => m.id === seedDish.id);
      if (!existing) {
        state.menu.push({ ...seedDish });
      } else {
        if (!existing.image && seedDish.image) existing.image = seedDish.image;
        if (seedDish.accentKind) existing.accentKind = seedDish.accentKind;
      }
    }
  }

  private saveState(state: DokoState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.error('Failed to persist store:', err);
    }
  }

  private commit() {
    this.recomputeMenuAvailability();
    this.saveState(this.state);
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private recomputeMenuAvailability() {
    for (const dish of this.state.menu) {
      if (dish.recipe.length === 0) continue;
      const hasStock = dish.recipe.every((req) => {
        const inv = this.state.inventory.find((i) => i.id === req.inventoryId);
        return inv ? inv.quantity >= req.amount : false;
      });
      if (!hasStock && dish.available) {
        dish.available = false;
      }
    }
  }

  subscribe(listener: (state: DokoState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): DokoState {
    return this.state;
  }

  private addAudit(role: RoleType, actorName: string, action: string, details: string) {
    this.state.auditLogs.unshift({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role,
      actorName,
      action,
      details,
      createdAt: new Date().toISOString(),
    });
    if (this.state.auditLogs.length > 80) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 80);
    }
  }

  createOrder(payload: {
    type: OrderType;
    items: { menuItemId: string; quantity: number; notes?: string }[];
    paymentMethod: PaymentMethod;
    tableNumber?: number;
    customerName: string;
    customerPhone?: string;
    address?: string;
    discount?: number;
    createdByRole: RoleType;
    createdByName: string;
  }): { order?: Order; error?: string } {
    if (!payload.items || payload.items.length === 0) {
      return { error: 'يجب اختيار صنف واحد على الأقل لإتمام الطلب.' };
    }

    const orderItems: OrderItem[] = [];
    let subtotal = 0;
    let estimatedCost = 0;

    const requiredDeductions = new Map<string, number>();

    for (const line of payload.items) {
      const dish = this.state.menu.find((m) => m.id === line.menuItemId);
      if (!dish) {
        return { error: 'أحد الأصناف المختارة غير موجود بالمنيو.' };
      }
      if (!dish.available) {
        return { error: `الصنف "${dish.name}" غير متوفر حالياً.` };
      }
      const qty = Math.max(1, Math.floor(line.quantity));
      orderItems.push({
        menuItemId: dish.id,
        name: dish.name,
        price: dish.price,
        quantity: qty,
        notes: line.notes,
        prepared: false,
      });
      subtotal += dish.price * qty;

      for (const req of dish.recipe) {
        const needed = Number((req.amount * qty).toFixed(3));
        requiredDeductions.set(
          req.inventoryId,
          Number(((requiredDeductions.get(req.inventoryId) || 0) + needed).toFixed(3))
        );
      }
    }

    for (const [invId, needed] of requiredDeductions.entries()) {
      const inv = this.state.inventory.find((i) => i.id === invId);
      if (!inv || inv.quantity < needed) {
        return {
          error: `الكمية المتوفرة من "${inv?.name ?? invId}" غير كافية لإتمام هذا الطلب.`,
        };
      }
    }

    const orderNumber = this.state.nextOrderNumber++;
    const now = new Date().toISOString();

    for (const [invId, needed] of requiredDeductions.entries()) {
      const inv = this.state.inventory.find((i) => i.id === invId)!;
      inv.quantity = Number(Math.max(0, inv.quantity - needed).toFixed(2));
      estimatedCost += inv.costPerUnit * needed;
      this.state.stockMovements.unshift({
        id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        itemId: inv.id,
        itemName: inv.name,
        delta: -needed,
        balanceAfter: inv.quantity,
        reason: `خصم لحظي للطلب #${orderNumber}`,
        actorRole: payload.createdByRole,
        createdAt: now,
      });
    }
    if (this.state.stockMovements.length > 120) {
      this.state.stockMovements = this.state.stockMovements.slice(0, 120);
    }

    const discount = Math.max(0, Math.min(subtotal, Math.round(payload.discount || 0)));
    const tax = Math.round(subtotal * 0.14);
    const total = Math.max(0, subtotal + tax - discount);

    const newOrder: Order = {
      id: `ord-${orderNumber}`,
      orderNumber,
      type: payload.type,
      status: 'pending',
      items: orderItems,
      subtotal,
      tax,
      discount,
      total,
      estimatedCost: Math.round(estimatedCost),
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentMethod === 'unpaid' ? 'unpaid' : 'paid',
      tableNumber: payload.tableNumber,
      customerName: payload.customerName.trim() || 'ضيف دوكو',
      customerPhone: payload.customerPhone?.trim(),
      address: payload.address?.trim(),
      createdByRole: payload.createdByRole,
      createdByName: payload.createdByName,
      createdAt: now,
      updatedAt: now,
    };

    this.state.orders.unshift(newOrder);

    if (payload.type === 'dine_in' && payload.tableNumber) {
      const table = this.state.tables.find((t) => t.number === payload.tableNumber);
      if (table) {
        table.status = 'occupied';
        table.currentOrderId = newOrder.id;
        table.guestName = newOrder.customerName;
      }
    }

    this.addAudit(
      payload.createdByRole,
      payload.createdByName,
      `إنشاء طلب جديد #${orderNumber}`,
      `الإجمالي ${total} ج.م — تم خصم المكونات لحظياً من المخزون`
    );

    this.commit();
    return { order: newOrder };
  }

  updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    actorRole: RoleType,
    actorName: string
  ): { order?: Order; error?: string } {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return { error: 'الطلب غير موجود.' };

    const prevStatus = order.status;
    order.status = status;
    order.updatedAt = new Date().toISOString();

    if (status === 'ready' || status === 'served' || status === 'completed') {
      order.items.forEach((it) => {
        it.prepared = true;
      });
    }
    if (status === 'completed') {
      order.completedAt = order.updatedAt;
      if (order.paymentStatus === 'unpaid') {
        order.paymentStatus = 'paid';
        if (order.paymentMethod === 'unpaid') order.paymentMethod = 'cash';
      }
      if (order.tableNumber) {
        const tbl = this.state.tables.find((t) => t.number === order.tableNumber);
        if (tbl && tbl.currentOrderId === order.id) {
          tbl.status = 'available';
          tbl.currentOrderId = undefined;
          tbl.guestName = undefined;
        }
      }
    }

    if (status === 'cancelled' && prevStatus === 'pending') {
      for (const line of order.items) {
        const dish = this.state.menu.find((m) => m.id === line.menuItemId);
        if (!dish) continue;
        for (const req of dish.recipe) {
          const inv = this.state.inventory.find((i) => i.id === req.inventoryId);
          if (inv) {
            const restoreQty = Number((req.amount * line.quantity).toFixed(2));
            inv.quantity = Number((inv.quantity + restoreQty).toFixed(2));
            this.state.stockMovements.unshift({
              id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              itemId: inv.id,
              itemName: inv.name,
              delta: restoreQty,
              balanceAfter: inv.quantity,
              reason: `استرجاع تلقائي لإلغاء الطلب #${order.orderNumber}`,
              actorRole,
              createdAt: order.updatedAt,
            });
          }
        }
      }
      if (order.tableNumber) {
        const tbl = this.state.tables.find((t) => t.number === order.tableNumber);
        if (tbl && tbl.currentOrderId === order.id) {
          tbl.status = 'available';
          tbl.currentOrderId = undefined;
          tbl.guestName = undefined;
        }
      }
    }

    this.addAudit(
      actorRole,
      actorName,
      `تحديث حالة الطلب #${order.orderNumber}`,
      `تغيرت الحالة إلى: ${status}`
    );
    this.commit();
    return { order };
  }

  toggleOrderItemPrepared(
    orderId: string,
    menuItemId: string,
    actorRole: RoleType,
    actorName: string
  ): { order?: Order; error?: string } {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return { error: 'الطلب غير موجود.' };
    const item = order.items.find((i) => i.menuItemId === menuItemId);
    if (!item) return { error: 'الصنف غير موجود بالطلب.' };

    item.prepared = !item.prepared;
    order.updatedAt = new Date().toISOString();
    if (order.status === 'pending' && item.prepared) {
      order.status = 'preparing';
    }
    this.addAudit(
      actorRole,
      actorName,
      `تجهيز صنف في الطلب #${order.orderNumber}`,
      `${item.name}: ${item.prepared ? 'جاهز' : 'قيد التحضير'}`
    );
    this.commit();
    return { order };
  }

  payOrder(
    orderId: string,
    paymentMethod: PaymentMethod,
    discount: number,
    actorRole: RoleType,
    actorName: string
  ): { order?: Order; error?: string } {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return { error: 'الطلب غير موجود.' };
    const safeDiscount = Math.max(0, Math.min(order.subtotal, Math.round(discount || 0)));
    order.discount = safeDiscount;
    order.total = Math.max(0, order.subtotal + order.tax - safeDiscount);
    order.paymentMethod = paymentMethod;
    order.paymentStatus = 'paid';
    order.status = 'completed';
    order.completedAt = new Date().toISOString();
    order.updatedAt = order.completedAt;

    if (order.tableNumber) {
      const tbl = this.state.tables.find((t) => t.number === order.tableNumber);
      if (tbl && tbl.currentOrderId === order.id) {
        tbl.status = 'available';
        tbl.currentOrderId = undefined;
        tbl.guestName = undefined;
      }
    }

    this.addAudit(
      actorRole,
      actorName,
      `تحصيل فاتورة الطلب #${order.orderNumber}`,
      `تم الدفع (${paymentMethod}) بمبلغ ${order.total} ج.م`
    );
    this.commit();
    return { order };
  }

  adjustInventory(
    itemId: string,
    delta: number,
    reason: string,
    actorRole: RoleType,
    actorName: string
  ): { item?: InventoryItem; error?: string } {
    const item = this.state.inventory.find((i) => i.id === itemId);
    if (!item) return { error: 'الصنف غير موجود في المخزون.' };
    const nextQty = Number(Math.max(0, item.quantity + delta).toFixed(2));
    item.quantity = nextQty;
    if (delta > 0) {
      item.lastRestockedAt = new Date().toISOString();
      for (const dish of this.state.menu) {
        if (!dish.available && dish.recipe.some((r) => r.inventoryId === itemId)) {
          const ok = dish.recipe.every((r) => {
            const inv = this.state.inventory.find((x) => x.id === r.inventoryId);
            return inv ? inv.quantity >= r.amount : false;
          });
          if (ok) dish.available = true;
        }
      }
    }

    this.state.stockMovements.unshift({
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      itemId: item.id,
      itemName: item.name,
      delta,
      balanceAfter: item.quantity,
      reason: reason || (delta >= 0 ? 'توريد مخزون' : 'تسوية / هدر'),
      actorRole,
      createdAt: new Date().toISOString(),
    });

    this.addAudit(
      actorRole,
      actorName,
      `تعديل المخزون: ${item.name}`,
      `${delta >= 0 ? '+' : ''}${delta} ${item.unit} (${reason})`
    );
    this.commit();
    return { item };
  }

  addInventoryItem(
    payload: Omit<InventoryItem, 'id' | 'lastRestockedAt'>,
    actorRole: RoleType,
    actorName: string
  ): InventoryItem {
    const item: InventoryItem = {
      ...payload,
      id: `inv-${Date.now()}`,
      lastRestockedAt: new Date().toISOString(),
    };
    this.state.inventory.unshift(item);
    this.state.stockMovements.unshift({
      id: `mov-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      delta: item.quantity,
      balanceAfter: item.quantity,
      reason: 'إضافة صنف مخزني جديد',
      actorRole,
      createdAt: item.lastRestockedAt,
    });
    this.addAudit(actorRole, actorName, `إضافة مادة للمخزون: ${item.name}`, `رصيد مبدئي ${item.quantity} ${item.unit}`);
    this.commit();
    return item;
  }

  updateMenuItem(
    menuId: string,
    patch: Partial<Pick<MenuItem, 'price' | 'available' | 'featured' | 'name' | 'description'>>,
    actorRole: RoleType,
    actorName: string
  ): { item?: MenuItem; error?: string } {
    const item = this.state.menu.find((m) => m.id === menuId);
    if (!item) return { error: 'الصنف غير موجود بالمنيو.' };
    Object.assign(item, patch);
    this.addAudit(actorRole, actorName, `تحديث المنيو: ${item.name}`, JSON.stringify(patch));
    this.commit();
    return { item };
  }

  addMenuItem(
    payload: Omit<MenuItem, 'id'>,
    actorRole: RoleType,
    actorName: string
  ): MenuItem {
    const dish: MenuItem = {
      ...payload,
      id: `dish-${Date.now()}`,
    };
    this.state.menu.unshift(dish);
    this.addAudit(actorRole, actorName, `إضافة طبق جديد للمنيو`, `${dish.name} — ${dish.price} ج.م`);
    this.commit();
    return dish;
  }

  updateTableStatus(
    tableId: string,
    status: RestaurantTable['status'],
    guestName: string | undefined,
    actorRole: RoleType,
    actorName: string
  ): { table?: RestaurantTable; error?: string } {
    const table = this.state.tables.find((t) => t.id === tableId);
    if (!table) return { error: 'الطاولة غير موجودة.' };
    table.status = status;
    table.guestName = status === 'available' ? undefined : guestName ?? table.guestName;
    if (status === 'available') table.currentOrderId = undefined;
    this.addAudit(actorRole, actorName, `تحديث طاولة ${table.number}`, `الحالة: ${status}`);
    this.commit();
    return { table };
  }

  createReservation(
    payload: Omit<Reservation, 'id' | 'status' | 'createdAt'>,
    actorRole: RoleType,
    actorName: string
  ): Reservation {
    const res: Reservation = {
      ...payload,
      id: `res-${Date.now()}`,
      status: actorRole === 'customer' ? 'waiting' : 'confirmed',
      createdAt: new Date().toISOString(),
    };
    this.state.reservations.unshift(res);
    if (res.tableNumber && res.status === 'confirmed') {
      const tbl = this.state.tables.find((t) => t.number === res.tableNumber);
      if (tbl && tbl.status === 'available') {
        tbl.status = 'reserved';
        tbl.guestName = res.customerName;
      }
    }
    this.addAudit(
      actorRole,
      actorName,
      `حجز طاولة جديد`,
      `${res.customerName} (${res.partySize} أفراد) — ${res.date} ${res.time}`
    );
    this.commit();
    return res;
  }

  updateReservation(
    resId: string,
    patch: { status?: Reservation['status']; tableNumber?: number },
    actorRole: RoleType,
    actorName: string
  ): { reservation?: Reservation; error?: string } {
    const res = this.state.reservations.find((r) => r.id === resId);
    if (!res) return { error: 'الحجز غير موجود.' };
    if (patch.tableNumber !== undefined) res.tableNumber = patch.tableNumber;
    if (patch.status) res.status = patch.status;

    if (res.tableNumber) {
      const tbl = this.state.tables.find((t) => t.number === res.tableNumber);
      if (tbl) {
        if (res.status === 'seated') {
          tbl.status = 'occupied';
          tbl.guestName = res.customerName;
        } else if (res.status === 'confirmed') {
          tbl.status = 'reserved';
          tbl.guestName = res.customerName;
        } else if (res.status === 'cancelled' && tbl.status === 'reserved') {
          tbl.status = 'available';
          tbl.guestName = undefined;
        }
      }
    }

    this.addAudit(
      actorRole,
      actorName,
      `تحديث حجز ${res.customerName}`,
      `الحالة: ${res.status}${res.tableNumber ? ` · طاولة ${res.tableNumber}` : ''}`
    );
    this.commit();
    return { reservation: res };
  }

  getReports(range: 'today' | '7d' | 'all' = 'all', channel: 'all' | OrderType = 'all'): ReportsSummary {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const filtered = this.state.orders.filter((o) => {
      if (channel !== 'all' && o.type !== channel) return false;
      const t = new Date(o.createdAt).getTime();
      if (range === 'today') return t >= startOfToday.getTime();
      if (range === '7d') return now - t <= 7 * 86_400_000;
      return true;
    });

    const validOrders = filtered.filter((o) => o.status !== 'cancelled');
    const completedOrders = filtered.filter((o) => o.status === 'completed').length;
    const cancelledOrders = filtered.filter((o) => o.status === 'cancelled').length;
    const activeOrders = filtered.filter(
      (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready' || o.status === 'served'
    ).length;

    const grossRevenue = validOrders.reduce((s, o) => s + o.total, 0);
    const totalCost = validOrders.reduce((s, o) => s + o.estimatedCost, 0);
    const netProfit = Math.max(0, grossRevenue - totalCost);
    const avgOrderValue = validOrders.length > 0 ? Math.round(grossRevenue / validOrders.length) : 0;
    const completionRate =
      filtered.length > 0 ? Math.round((completedOrders / filtered.length) * 100) : 0;

    const channelMap: Record<OrderType, { label: string; count: number; revenue: number }> = {
      dine_in: { label: 'طلبات الصالة', count: 0, revenue: 0 },
      takeaway: { label: 'تيك أواي', count: 0, revenue: 0 },
      delivery: { label: 'دليفري', count: 0, revenue: 0 },
    };
    for (const o of validOrders) {
      channelMap[o.type].count += 1;
      channelMap[o.type].revenue += o.total;
    }

    const paymentMap: Record<PaymentMethod, { label: string; count: number; revenue: number }> = {
      cash: { label: 'نقدي (كاش)', count: 0, revenue: 0 },
      card: { label: 'بطاقة بنكية', count: 0, revenue: 0 },
      wallet: { label: 'محفظة إلكترونية', count: 0, revenue: 0 },
      unpaid: { label: 'حساب مفتوح', count: 0, revenue: 0 },
    };
    for (const o of validOrders) {
      paymentMap[o.paymentMethod].count += 1;
      paymentMap[o.paymentMethod].revenue += o.total;
    }

    const buckets = [12, 14, 16, 18, 20, 22];
    const hourlyTrend = buckets.map((h) => {
      const matching = validOrders.filter((o) => {
        const hr = new Date(o.createdAt).getHours();
        return hr >= h && hr < h + 2;
      });
      return {
        hourLabel: `${h}:00`,
        orders: matching.length,
        revenue: matching.reduce((s, o) => s + o.total, 0),
      };
    });

    // Daily trend over last 7 days
    const dailyTrend = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      const key = d.toISOString().slice(0, 10);
      const dayOrders = validOrders.filter((o) => o.createdAt.slice(0, 10) === key);
      const rev = dayOrders.reduce((s, o) => s + o.total, 0);
      const cost = dayOrders.reduce((s, o) => s + o.estimatedCost, 0);
      return {
        dateLabel: d.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' }),
        orders: dayOrders.length,
        revenue: rev,
        profit: Math.max(0, rev - cost),
      };
    });

    const dishStats = new Map<
      string,
      { menuItemId: string; name: string; category: string; quantitySold: number; revenue: number; cost: number }
    >();
    for (const o of validOrders) {
      for (const line of o.items) {
        const menuDish = this.state.menu.find((m) => m.id === line.menuItemId);
        let unitCost = 0;
        if (menuDish) {
          for (const req of menuDish.recipe) {
            const inv = this.state.inventory.find((i) => i.id === req.inventoryId);
            if (inv) unitCost += inv.costPerUnit * req.amount;
          }
        }
        const cur = dishStats.get(line.menuItemId) || {
          menuItemId: line.menuItemId,
          name: line.name,
          category: menuDish?.category ?? 'أطباق رئيسية',
          quantitySold: 0,
          revenue: 0,
          cost: 0,
        };
        cur.quantitySold += line.quantity;
        cur.revenue += line.price * line.quantity;
        cur.cost += Math.round(unitCost * line.quantity);
        dishStats.set(line.menuItemId, cur);
      }
    }

    const topDishes = Array.from(dishStats.values())
      .map((d) => ({ ...d, profit: Math.max(0, d.revenue - d.cost) }))
      .sort((a, b) => b.quantitySold - a.quantitySold);

    const roleLabels: Record<RoleType, string> = {
      customer: 'الموقع (العملاء)',
      cashier: 'الكاشير',
      waiter: 'الجارسون',
      manager: 'المدير',
      chef: 'الشيف',
      reception: 'الريسبشن',
    };
    const roleMap = new Map<RoleType, { ordersCount: number; revenue: number }>();
    for (const o of validOrders) {
      const cur = roleMap.get(o.createdByRole) || { ordersCount: 0, revenue: 0 };
      cur.ordersCount += 1;
      cur.revenue += o.total;
      roleMap.set(o.createdByRole, cur);
    }
    const byRole = Array.from(roleMap.entries()).map(([role, stats]) => ({
      role,
      label: roleLabels[role],
      ordersCount: stats.ordersCount,
      revenue: stats.revenue,
    }));

    const lowStockCount = this.state.inventory.filter((i) => i.quantity <= i.minThreshold).length;
    const totalInventoryValue = Math.round(
      this.state.inventory.reduce((s, i) => s + i.quantity * i.costPerUnit, 0)
    );

    return {
      range,
      channel,
      totalOrders: filtered.length,
      completedOrders,
      cancelledOrders,
      activeOrders,
      grossRevenue,
      totalCost,
      netProfit,
      avgOrderValue,
      completionRate,
      byChannel: (Object.keys(channelMap) as OrderType[]).map((type) => ({
        type,
        ...channelMap[type],
      })),
      byPayment: (Object.keys(paymentMap) as PaymentMethod[]).map((method) => ({
        method,
        ...paymentMap[method],
      })),
      hourlyTrend,
      dailyTrend,
      topDishes,
      byRole,
      lowStockCount,
      totalInventoryValue,
      recentOrders: filtered.slice(0, 25),
    };
  }
}

export const dokoStore = new DokoStore();
