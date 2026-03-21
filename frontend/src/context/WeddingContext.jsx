import { createContext, useContext, useState, useCallback } from 'react'

const WeddingContext = createContext(null)

// ─── Indian States & Districts ─────────────────────────────────────────────────
export const INDIA_STATES_DISTRICTS = {
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Tirupati","Rajahmundry","Kakinada","Nellore","Kurnool","Kadapa","Anantapur"],
  "Arunachal Pradesh": ["Itanagar","Tawang","Ziro","Pasighat"],
  "Assam": ["Guwahati","Silchar","Dibrugarh","Jorhat","Nagaon","Tezpur","Tinsukia"],
  "Bihar": ["Patna","Gaya","Muzaffarpur","Bhagalpur","Darbhanga","Nalanda","Begusarai","Samastipur"],
  "Chhattisgarh": ["Raipur","Bilaspur","Durg","Bhilai","Korba","Rajnandgaon","Jagdalpur"],
  "Goa": ["Panaji","Margao","Vasco da Gama","Mapusa","Ponda"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Gandhinagar","Anand","Nadiad","Bharuch"],
  "Haryana": ["Faridabad","Gurugram","Ambala","Hisar","Rohtak","Panipat","Karnal","Sonipat","Yamunanagar","Panchkula"],
  "Himachal Pradesh": ["Shimla","Manali","Dharamshala","Solan","Mandi","Kullu","Hamirpur","Una"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro","Deoghar","Hazaribagh","Giridih"],
  "Karnataka": ["Bengaluru","Mysuru","Mangaluru","Hubli","Dharwad","Belagavi","Kalaburagi","Davangere","Ballari","Shivamogga","Tumkur","Udupi"],
  "Kerala": ["Kochi","Thiruvananthapuram","Kozhikode","Thrissur","Kollam","Palakkad","Alappuzha","Kannur","Kottayam","Munnar"],
  "Madhya Pradesh": ["Bhopal","Indore","Jabalpur","Gwalior","Ujjain","Sagar","Satna","Rewa","Dewas","Ratlam"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Thane","Nashik","Aurangabad","Solapur","Kolhapur","Amravati","Nanded","Sangli","Satara"],
  "Manipur": ["Imphal","Churachandpur","Thoubal","Bishnupur"],
  "Meghalaya": ["Shillong","Cherrapunji","Tura","Jowai"],
  "Mizoram": ["Aizawl","Lunglei","Champhai"],
  "Nagaland": ["Kohima","Dimapur","Mokokchung"],
  "Delhi (NCT)": ["Central Delhi","East Delhi","New Delhi","North Delhi","North East Delhi","North West Delhi","Shahdara","South Delhi","South East Delhi","South West Delhi","West Delhi"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Brahmapur","Sambalpur","Puri","Balasore","Baripada"],
  "Punjab": ["Ludhiana","Amritsar","Jalandhar","Patiala","Bathinda","Mohali","Hoshiarpur","Gurdaspur","Moga"],
  "Rajasthan": ["Jaipur","Jodhpur","Udaipur","Kota","Bikaner","Ajmer","Alwar","Bharatpur","Pushkar","Jaisalmer","Mount Abu"],
  "Sikkim": ["Gangtok","Pelling","Ravangla","Namchi"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Salem","Trichy","Erode","Vellore","Tirunelveli","Thoothukudi","Dindigul","Kanchipuram","Thanjavur","Ooty","Kodaikanal"],
  "Telangana": ["Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam","Secunderabad","Nalgonda","Mahbubnagar"],
  "Tripura": ["Agartala","Udaipur","Dharmanagar","Belonia"],
  "Uttar Pradesh": ["Lucknow","Kanpur","Agra","Varanasi","Meerut","Allahabad (Prayagraj)","Ghaziabad","Noida","Mathura","Vrindavan","Aligarh","Gorakhpur","Moradabad","Firozabad"],
  "Uttarakhand": ["Dehradun","Haridwar","Rishikesh","Nainital","Mussoorie","Roorkee","Haldwani","Jim Corbett"],
  "West Bengal": ["Kolkata","Howrah","Durgapur","Asansol","Siliguri","Bardhaman","Darjeeling","Kalimpong","Raiganj"],
  "Jammu & Kashmir": ["Srinagar","Jammu","Anantnag","Baramulla","Gulmarg","Pahalgam","Sonamarg"],
  "Ladakh": ["Leh","Kargil"],
  "Puducherry": ["Puducherry","Karaikal","Mahe","Yanam"],
  "Chandigarh": ["Chandigarh"],
  "Dadra & Nagar Haveli": ["Silvassa"],
  "Lakshadweep": ["Kavaratti","Agatti"],
  "Andaman & Nicobar": ["Port Blair","Havelock Island","Neil Island"],
}

// ─── Popular Mandapams by City ─────────────────────────────────────────────────
export const MANDAPAM_DATA = {
  "Chennai": [
    { id:"narada", name:"Narada Gana Sabha", area:"Alwarpet", capacity:600, cost_per_day:280000, cost_range:"₹2.5L–₹3.5L/day" },
    { id:"music_academy", name:"Music Academy", area:"Anna Salai", capacity:900, cost_per_day:380000, cost_range:"₹3L–₹4.5L/day" },
    { id:"vani_mahal", name:"Vani Mahal", area:"T. Nagar", capacity:800, cost_per_day:220000, cost_range:"₹1.8L–₹2.8L/day" },
    { id:"sathyam", name:"Sathyam Convention Centre", area:"Manapakkam", capacity:2000, cost_per_day:550000, cost_range:"₹4.5L–₹7L/day" },
    { id:"prince", name:"Prince Convention Centre", area:"Poonamallee", capacity:1500, cost_per_day:420000, cost_range:"₹3.5L–₹5.5L/day" },
    { id:"generic_chennai", name:"Generic Mandapam (avg)", area:"Chennai", capacity:500, cost_per_day:180000, cost_range:"₹1.2L–₹2.5L/day" },
  ],
  "Mumbai": [
    { id:"nehru_mumbai", name:"Nehru Centre", area:"Worli", capacity:800, cost_per_day:550000, cost_range:"₹4.5L–₹7L/day" },
    { id:"royal_central", name:"Royal Central Hotel", area:"Andheri", capacity:600, cost_per_day:420000, cost_range:"₹3.5L–₹5L/day" },
    { id:"taj_mumbai", name:"Taj Lands End", area:"Bandra", capacity:1200, cost_per_day:900000, cost_range:"₹8L–₹12L/day" },
    { id:"meluha", name:"Meluha the Fern", area:"Powai", capacity:500, cost_per_day:380000, cost_range:"₹3L–₹5L/day" },
    { id:"generic_mumbai", name:"Generic Banquet Hall (avg)", area:"Mumbai", capacity:400, cost_per_day:280000, cost_range:"₹2L–₹4L/day" },
  ],
  "Delhi": [
    { id:"palace_on_wheels", name:"Palace On Wheels Hotel", area:"New Delhi", capacity:800, cost_per_day:650000, cost_range:"₹5.5L–₹8L/day" },
    { id:"taj_palace_delhi", name:"Taj Palace", area:"Diplomatic Enclave", capacity:1200, cost_per_day:950000, cost_range:"₹8L–₹13L/day" },
    { id:"sirifort", name:"Siri Fort Auditorium", area:"Hauz Khas", capacity:1000, cost_per_day:350000, cost_range:"₹2.8L–₹4.5L/day" },
    { id:"dwarka_convention", name:"Dwarka Convention Centre", area:"Dwarka", capacity:2000, cost_per_day:600000, cost_range:"₹5L–₹8L/day" },
    { id:"generic_delhi", name:"Generic Marriage Hall (avg)", area:"Delhi", capacity:500, cost_per_day:250000, cost_range:"₹1.8L–₹3.5L/day" },
  ],
  "Bengaluru": [
    { id:"taj_west_end", name:"Taj West End", area:"Race Course Road", capacity:800, cost_per_day:750000, cost_range:"₹6L–₹9L/day" },
    { id:"leela_bengaluru", name:"The Leela Palace", area:"HAL Airport Road", capacity:1000, cost_per_day:850000, cost_range:"₹7L–₹11L/day" },
    { id:"vivanta", name:"Vivanta Bengaluru", area:"Residency Road", capacity:600, cost_per_day:480000, cost_range:"₹4L–₹6L/day" },
    { id:"ktpo", name:"KTPO Convention Centre", area:"Whitefield", capacity:3000, cost_per_day:700000, cost_range:"₹5.5L–₹9L/day" },
    { id:"generic_blr", name:"Generic Kalyana Mantapa (avg)", area:"Bengaluru", capacity:400, cost_per_day:200000, cost_range:"₹1.5L–₹3L/day" },
  ],
  "Hyderabad": [
    { id:"hitex", name:"HITEX Exhibition Centre", area:"Madhapur", capacity:5000, cost_per_day:800000, cost_range:"₹6L–₹10L/day" },
    { id:"taj_falaknuma", name:"Taj Falaknuma Palace", area:"Engine Bowli", capacity:200, cost_per_day:1200000, cost_range:"₹10L–₹15L/day" },
    { id:"novatel_hyd", name:"Novotel HICC", area:"Madhapur", capacity:2000, cost_per_day:650000, cost_range:"₹5L–₹8L/day" },
    { id:"generic_hyd", name:"Generic Function Hall (avg)", area:"Hyderabad", capacity:500, cost_per_day:220000, cost_range:"₹1.8L–₹3L/day" },
  ],
  "Kolkata": [
    { id:"taj_bengal", name:"Taj Bengal", area:"Alipore", capacity:700, cost_per_day:580000, cost_range:"₹5L–₹7L/day" },
    { id:"iccr_kolkata", name:"ICCR Rabindranath Sadan", area:"Maidan", capacity:600, cost_per_day:280000, cost_range:"₹2L–₹4L/day" },
    { id:"grand_hotel", name:"The Grand Hotel", area:"Chowringhee", capacity:900, cost_per_day:650000, cost_range:"₹5.5L–₹8L/day" },
    { id:"generic_kol", name:"Generic Marriage Hall (avg)", area:"Kolkata", capacity:400, cost_per_day:180000, cost_range:"₹1.2L–₹2.5L/day" },
  ],
  "Jaipur": [
    { id:"taj_rambagh", name:"Taj Rambagh Palace", area:"Bhawani Singh Marg", capacity:500, cost_per_day:1500000, cost_range:"₹12L–₹20L/day" },
    { id:"jai_mahal", name:"Jai Mahal Palace", area:"Jacob Road", capacity:400, cost_per_day:1000000, cost_range:"₹8L–₹14L/day" },
    { id:"fairmont", name:"Fairmont Hotel", area:"Kukas", capacity:800, cost_per_day:750000, cost_range:"₹6L–₹10L/day" },
    { id:"generic_jaipur", name:"Generic Dharamshala/Hall (avg)", area:"Jaipur", capacity:500, cost_per_day:200000, cost_range:"₹1.5L–₹3L/day" },
  ],
  "Pune": [
    { id:"poona_club", name:"Poona Club", area:"Camp", capacity:600, cost_per_day:420000, cost_range:"₹3.5L–₹5.5L/day" },
    { id:"westin_pune", name:"Westin Pune", area:"Koregaon Park", capacity:800, cost_per_day:650000, cost_range:"₹5.5L–₹8L/day" },
    { id:"generic_pune", name:"Generic Mangal Karyalay (avg)", area:"Pune", capacity:400, cost_per_day:180000, cost_range:"₹1.2L–₹2.5L/day" },
  ],
  "_generic": [
    { id:"generic_any", name:"Generic Mandapam / Banquet Hall", area:"Your City", capacity:500, cost_per_day:200000, cost_range:"₹1.5L–₹3.5L/day" },
    { id:"generic_premium", name:"Premium Banquet Hall", area:"Your City", capacity:800, cost_per_day:400000, cost_range:"₹3L–₹6L/day" },
    { id:"generic_luxury", name:"Luxury Convention Centre", area:"Your City", capacity:1500, cost_per_day:750000, cost_range:"₹6L–₹12L/day" },
  ],
}

export const getMandapams = (district) => {
  const city = Object.keys(MANDAPAM_DATA).find(k =>
    district && (district.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(district.toLowerCase()))
  )
  return MANDAPAM_DATA[city] || MANDAPAM_DATA['_generic']
}

export const ALL_EVENTS = [
  { id: "Engagement",           imageUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400&q=80", emoji: "💍", label: "Engagement" },
  { id: "Haldi",                imageUrl: "https://images.unsplash.com/photo-1595407753234-0882f1e77954?w=400&q=80", emoji: "🌼", label: "Haldi" },
  { id: "Mehendi",              imageUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=80", emoji: "🌿", label: "Mehendi" },
  { id: "Sangeet",              imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80", emoji: "🎵", label: "Sangeet" },
  { id: "Pre Wedding Cocktail", imageUrl: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=400&q=80", emoji: "🥂", label: "Cocktail Party" },
  { id: "Wedding Day Ceremony", imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80", emoji: "💒", label: "Wedding Ceremony" },
  { id: "Reception",            imageUrl: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=400&q=80", emoji: "🎊", label: "Reception" },
  { id: "Others",               imageUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&q=80", emoji: "🌺", label: "Others" },
]

export const WEDDING_TYPES = [
  { id: "Hindu",     imageUrl: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&q=80", emoji: "🪔", label: "Hindu Wedding" },
  { id: "Islam",     imageUrl: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400&q=80", emoji: "☪️",  label: "Islamic Wedding" },
  { id: "Sikh",      imageUrl: "https://images.unsplash.com/photo-1607197399756-51e3de7a5d96?w=400&q=80", emoji: "🏯", label: "Sikh Wedding" },
  { id: "Christian", imageUrl: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=400&q=80", emoji: "⛪",  label: "Christian Wedding" },
  { id: "Buddhist",  imageUrl: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&q=80", emoji: "☸️",  label: "Buddhist Wedding" },
  { id: "Jain",      imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80", emoji: "🕊️",  label: "Jain Wedding" },
  { id: "Generic",   imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80", emoji: "✨",  label: "Generic / Mixed" },
]

export const VENUE_TYPES = [
  { id: "Banquet Hall",    imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=80", emoji: "🏛️", label: "Banquet / Mandapam" },
  { id: "Wedding Lawn",    imageUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80", emoji: "🌳", label: "Lawns & Gardens" },
  { id: "Hotel 3-5 Star",  imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80",   emoji: "🏨", label: "Hotels & Convention" },
  { id: "Resort",          imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80", emoji: "🌴", label: "Resort & Destination" },
  { id: "Heritage Palace", imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80", emoji: "🏰", label: "Heritage & Palace" },
  { id: "Beach Venue",     imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80", emoji: "🏖️", label: "Beach Wedding" },
  { id: "Farmhouse",       imageUrl: "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=400&q=80", emoji: "🌾", label: "Farmhouse & Estate" },
  { id: "Temple",          imageUrl: "https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=400&q=80", emoji: "⛩️",  label: "Temple Venue" },
  { id: "Home Intimate",   imageUrl: "https://images.unsplash.com/photo-1560440021-33f9b867899d?w=400&q=80",   emoji: "🏡", label: "Home / Intimate" },
]

export const HOTEL_TIERS = [
  { id: "5-star Palace", imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80", emoji: "👑", label: "5★ Palace",   desc: "₹25K–₹80K/night",  ppr: 2 },
  { id: "5-star City",   imageUrl: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80", emoji: "🌆", label: "5★ City",     desc: "₹10K–₹30K/night",  ppr: 2 },
  { id: "4-star",        imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80",   emoji: "⭐", label: "4★ Hotel",     desc: "₹5K–₹12K/night",   ppr: 2 },
  { id: "Resort",        imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80", emoji: "🌴", label: "Resort",       desc: "₹8K–₹25K/night",   ppr: 3 },
  { id: "Farmhouse",     imageUrl: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400&q=80", emoji: "🏡", label: "Farmhouse",    desc: "₹3K–₹10K/room",    ppr: 4 },
]

export const FOOD_CATEGORIES = [
  { id: "Veg",    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=250&fit=crop", emoji: "🥦", label: "Vegetarian" },
  { id: "Non-Veg",imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=250&fit=crop", emoji: "🍗", label: "Non-Vegetarian" },
  { id: "Jain",   imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=250&fit=crop",  emoji: "🌿", label: "Jain" },
]

export const FOOD_TIERS = [
  { id: "Extravaganza", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=250&fit=crop",   emoji: "🍽️",  label: "Extravaganza",  desc: "₹400–₹700/plate" },
  { id: "High",         imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=250&fit=crop", emoji: "🥘",  label: "High",           desc: "₹800–₹1,500/plate" },
  { id: "Modern",       imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop", emoji: "👨‍🍳", label: "Modern",         desc: "₹1,500–₹5,000/plate" },
]

export const BAR_TYPES = [
  { id: "Dry Event", imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=250&fit=crop", emoji: "🚫", label: "Dry Event",    cost: "₹0/head" },
  { id: "Beer-Wine", imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=250&fit=crop",   emoji: "🍷", label: "Beer & Wine",  cost: "₹500/head" },
  { id: "Full Bar",  imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=250&fit=crop",  emoji: "🍸", label: "Full Bar",     cost: "₹1,200/head" },
]

export const SPECIALTY_COUNTERS = [
  { id: "Chaat",             imageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=250&fit=crop", emoji: "🥙", label: "Chaat Counter",    cost: "₹70/head",  rate_per_head: 70 },
  { id: "Mocktail",          imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=250&fit=crop",  emoji: "🥤", label: "Mocktail Bar",     cost: "₹90/head",  rate_per_head: 90 },
  { id: "Ice Cream",         imageUrl: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=250&fit=crop",  emoji: "🍦", label: "Ice Cream Station", cost: "₹55/head",  rate_per_head: 55 },
  { id: "Tea-Coffee (24hr)", imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=250&fit=crop",             emoji: "☕", label: "Tea-Coffee 24hr",  cost: "₹35/head",  rate_per_head: 35 },
  { id: "Paan Counter",      imageUrl: "https://images.unsplash.com/photo-1627056604886-ef06a14c1cd3?w=400&h=250&fit=crop", emoji: "🌿", label: "Paan Counter",     cost: "₹45/head",  rate_per_head: 45 },
  { id: "Fruit Station",     imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop", emoji: "🍉", label: "Fruit Station",    cost: "₹65/head",  rate_per_head: 65 },
]

// Generic artist tiers (unnamed bookings)
export const ARTIST_TYPES = [
  { id: "Local DJ",            imageUrl: "https://images.unsplash.com/photo-1571266028243-d220c6a7ce4a?w=400&h=250&fit=crop", emoji: "🎧", label: "Local DJ",              cost: "₹60K–₹2L",    tier: "generic" },
  { id: "Professional DJ",     imageUrl: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=400&h=250&fit=crop", emoji: "🎚️",  label: "Pro DJ",                cost: "₹2.5L–₹6L",   tier: "generic" },
  { id: "Celebrity DJ",        imageUrl: "https://images.unsplash.com/photo-1619983081563-430f63602796?w=400&h=250&fit=crop", emoji: "🎛️",  label: "Celebrity DJ",          cost: "₹8L–₹25L",    tier: "named" },
  { id: "Bollywood Singer A",  imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop", emoji: "🎤", label: "Bollywood Singer A",    cost: "₹10L–₹15L",   tier: "named" },
  { id: "Bollywood Singer B",  imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=250&fit=crop", emoji: "🎶", label: "Bollywood Singer B",    cost: "₹6L–₹10L",    tier: "named" },
  { id: "Bollywood Singer C",  imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=250&fit=crop", emoji: "🎵", label: "Bollywood Singer C",    cost: "₹3L–₹6L",     tier: "named" },
  { id: "Live Band (Local)",   imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=250&fit=crop", emoji: "🎸", label: "Live Band (Local)",     cost: "₹1.5L–₹4L",   tier: "generic" },
  { id: "Live Band (National)",imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=250&fit=crop", emoji: "🎺", label: "Live Band (National)",  cost: "₹6L–₹18L",    tier: "generic" },
  { id: "Folk Artist",         imageUrl: "https://images.unsplash.com/photo-1623952862669-0a3cb0d83c55?w=400&h=250&fit=crop", emoji: "🪘", label: "Folk / Classical Artist",cost: "₹40K–₹1.5L",  tier: "generic" },
  { id: "Sufi Singer",         imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=250&fit=crop", emoji: "🎻", label: "Sufi / Ghazal Singer",  cost: "₹80K–₹3L",    tier: "generic" },
  { id: "Myra Entertainment",  imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=250&fit=crop", emoji: "🎭", label: "Myra Entertainment",    cost: "₹2.5L–₹7L",   tier: "named" },
  { id: "Choreographer",       imageUrl: "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=400&h=250&fit=crop", emoji: "💃", label: "Choreographer",         cost: "₹60K–₹2.5L",  tier: "generic" },
  { id: "Anchor / Emcee",      imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=250&fit=crop", emoji: "🎙️", label: "Anchor / Emcee",        cost: "₹40K–₹2L",    tier: "generic" },
  { id: "Stand-up Comedian",   imageUrl: "https://images.unsplash.com/photo-1584802671793-c60c34bed6c5?w=400&h=250&fit=crop", emoji: "🎤", label: "Stand-up Comedian",     cost: "₹1L–₹5L",     tier: "generic" },
  { id: "Nadaswaram Artist",   imageUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=250&fit=crop", emoji: "🪗", label: "Nadaswaram / Shehnai",  cost: "₹25K–₹80K",   tier: "generic" },
  { id: "Fireworks Display",   imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=250&fit=crop", emoji: "🎆", label: "Fireworks Display",     cost: "₹50K–₹3L",    tier: "generic" },
]

// Named artists with specific fee ranges (admin-maintained)
export const NAMED_ARTISTS = [
  { id: "na_arijit",   name: "Arijit Singh",         genre: "Bollywood",  fee_low: 4000000, fee_high: 7000000 },
  { id: "na_neha",     name: "Neha Kakkar",           genre: "Bollywood",  fee_low: 1500000, fee_high: 3000000 },
  { id: "na_badshah",  name: "Badshah",               genre: "Bollywood",  fee_low: 2000000, fee_high: 4000000 },
  { id: "na_jubin",    name: "Jubin Nautiyal",        genre: "Bollywood",  fee_low: 1200000, fee_high: 2500000 },
  { id: "na_hardy",    name: "Hardy Sandhu",          genre: "Punjabi",    fee_low: 1000000, fee_high: 2000000 },
  { id: "na_kanika",   name: "Kanika Kapoor",         genre: "Bollywood",  fee_low: 800000,  fee_high: 1800000 },
  { id: "na_tony",     name: "Tony Kakkar",           genre: "Bollywood",  fee_low: 600000,  fee_high: 1200000 },
  { id: "na_harrdy",   name: "Harrdy Sandhu",         genre: "Punjabi",    fee_low: 1000000, fee_high: 2000000 },
  { id: "na_djchetas", name: "DJ Chetas",             genre: "DJ",         fee_low: 1500000, fee_high: 3000000 },
  { id: "na_anmol",    name: "Anmol Gagan Maan",      genre: "Punjabi",    fee_low: 500000,  fee_high: 1200000 },
]

export const SFX_ITEMS = [
  { id: "Cold Pyro",       imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=250&fit=crop", emoji: "✨", label: "Cold Pyro",       cost: "₹18K" },
  { id: "Confetti Cannon", imageUrl: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&h=250&fit=crop", emoji: "🎊", label: "Confetti Cannon", cost: "₹10K" },
  { id: "Smoke Machine",   imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=250&fit=crop", emoji: "💨", label: "Smoke Machine",   cost: "₹8K" },
  { id: "Laser Show",      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=250&fit=crop", emoji: "🔴", label: "Laser Show",      cost: "₹30K" },
  { id: "Flower Cannon",   imageUrl: "https://images.unsplash.com/photo-1490750967868-88df5691cc1e?w=400&h=250&fit=crop", emoji: "🌸", label: "Flower Cannon",   cost: "₹12K" },
]

export const BUDGET_TIERS = [
  { id: "Luxury",     imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=250&fit=crop", emoji: "👑", label: "Luxury" },
  { id: "Modest",     imageUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=250&fit=crop", emoji: "🌸", label: "Modest" },
  { id: "Minimalist", imageUrl: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&h=250&fit=crop", emoji: "🌿", label: "Minimalist" },
]

// ─── Food Menus ─────────────────────────────────────────────────────────────────
export const FOOD_MENU = {
  Breakfast: {
    Veg: ["Idli Sambar","Dosa","Upma","Poha","Paratha","Aloo Bhaji","Bread Butter Jam","Fruits","Cornflakes & Milk","Paneer Paratha","Chole Bhatura","Medu Vada"],
    "Non-Veg": ["Egg Bhurji","Omelette","Chicken Keema Paratha","Egg Dosa","Egg Upma"],
    Jain: ["Jain Upma (no potato)","Jain Poha","Fruit Salad","Jain Paratha","Suji Halwa"],
  },
  Lunch: {
    Veg: ["Dal Tadka","Paneer Butter Masala","Veg Biryani","Rajma","Chole","Mixed Veg Sabzi","Kadai Paneer","Palak Paneer","Jeera Rice","Butter Naan","Roti","Raita","Salad","Papad","Pickle","Dal Makhani"],
    "Non-Veg": ["Chicken Biryani","Mutton Curry","Butter Chicken","Fish Fry","Chicken 65","Egg Curry","Seekh Kabab","Tandoori Chicken"],
    Jain: ["Jain Dal","Jain Sabzi (no onion/garlic)","Jain Biryani","Jain Paneer Curry","Plain Rice","Roti"],
  },
  Dinner: {
    Veg: ["Paneer Tikka","Dal Bukhara","Shahi Paneer","Veg Biryani","Jeera Rice","Garlic Naan","Kulcha","Raita","Gulab Jamun","Kheer","Ice Cream","Dal Tadka","Mixed Veg","Veg Manchurian","Pasta"],
    "Non-Veg": ["Chicken Biryani","Mutton Rogan Josh","Butter Chicken","Fish Curry","Prawn Masala","Chicken Seekh","Tandoori Mixed Grill","Chicken 65"],
    Jain: ["Jain Paneer Curry","Jain Dal","Jain Biryani","Jain Khichdi","Raita","Roti","Jain Dessert"],
  },
  Snacks: {
    Veg: ["Samosa","Kachori","Spring Roll","Paneer Tikka","Veg Pakora","Dhokla","Pani Puri","Bhel Puri","Sev Puri","Vada Pav","Bread Pakora","Corn Chaat"],
    "Non-Veg": ["Chicken Tikka","Fish Pakora","Chicken Lollipop","Egg Puff","Mutton Seekh","Prawn Fritters"],
    Jain: ["Jain Samosa","Jain Pakora","Fruit Chaat","Jain Dhokla","Makhana"],
  },
  Beverages: {
    Veg: ["Masala Chai","Filter Coffee","Lassi","Buttermilk","Lemonade","Mango Panna","Rose Sharbat","Coconut Water","Jaljeera","Aam Panna","Thandai"],
    "Non-Veg": ["Same as Veg"],
    Jain: ["Masala Chai (no onion/garlic)","Lemon Juice","Coconut Water","Rose Milk","Thandai"],
  },
}

export const MEAL_TYPES = ["Breakfast","Lunch","Dinner","Snacks","Beverages"]

// ─── Dish Prices (per head, ₹) ─────────────────────────────────────────────────
export const DISH_PRICES = {
  // Breakfast
  "Idli Sambar":45,"Dosa":55,"Upma":40,"Poha":40,"Paratha":50,
  "Aloo Bhaji":35,"Bread Butter Jam":30,"Fruits":65,"Cornflakes & Milk":55,
  "Paneer Paratha":70,"Chole Bhatura":80,"Medu Vada":45,
  "Egg Bhurji":65,"Omelette":60,"Chicken Keema Paratha":100,"Egg Dosa":80,"Egg Upma":70,
  "Jain Upma (no potato)":45,"Jain Poha":45,"Fruit Salad":60,"Jain Paratha":55,"Suji Halwa":40,
  // Lunch
  "Dal Tadka":45,"Paneer Butter Masala":90,"Veg Biryani":100,"Rajma":55,"Chole":60,
  "Mixed Veg Sabzi":50,"Kadai Paneer":90,"Palak Paneer":85,"Jeera Rice":45,
  "Butter Naan":30,"Roti":15,"Raita":20,"Salad":25,"Papad":10,"Pickle":10,
  "Dal Makhani":65,
  "Chicken Biryani":130,"Mutton Curry":170,"Butter Chicken":140,
  "Fish Fry":160,"Chicken 65":120,"Egg Curry":80,"Seekh Kabab":140,"Tandoori Chicken":150,
  "Jain Dal":50,"Jain Sabzi (no onion/garlic)":55,"Jain Biryani":100,"Jain Paneer Curry":85,"Plain Rice":40,
  // Dinner
  "Paneer Tikka":110,"Dal Bukhara":75,"Shahi Paneer":100,"Garlic Naan":35,
  "Kulcha":28,"Gulab Jamun":40,"Kheer":45,"Ice Cream":60,
  "Veg Manchurian":75,"Pasta":80,
  "Mutton Rogan Josh":190,"Fish Curry":170,"Prawn Masala":210,
  "Chicken Seekh":140,"Tandoori Mixed Grill":210,
  "Jain Khichdi":60,"Jain Dessert":50,
  // Snacks
  "Samosa":35,"Kachori":35,"Spring Roll":50,"Veg Pakora":40,"Dhokla":35,
  "Pani Puri":45,"Bhel Puri":40,"Sev Puri":40,"Vada Pav":35,"Bread Pakora":40,"Corn Chaat":45,
  "Chicken Tikka":120,"Fish Pakora":140,"Chicken Lollipop":130,
  "Egg Puff":45,"Mutton Seekh":150,"Prawn Fritters":160,
  "Jain Samosa":35,"Jain Pakora":40,"Fruit Chaat":45,"Jain Dhokla":35,"Makhana":50,
  // Beverages
  "Masala Chai":25,"Filter Coffee":30,"Lassi":55,"Buttermilk":30,"Lemonade":35,
  "Mango Panna":40,"Rose Sharbat":40,"Coconut Water":55,"Jaljeera":30,
  "Aam Panna":38,"Thandai":50,"Same as Veg":0,
  "Masala Chai (no onion/garlic)":25,"Lemon Juice":30,"Rose Milk":40,
}

export const initialWeddingState = {
  // Tab 1
  wedding_date: '',
  is_weekend: false,
  wedding_type: '',
  budget_tier: '',
  events: [],
  // Tab 2
  venue_type: '',
  wedding_state: '',
  wedding_district: '',
  wedding_city: '',
  seating_capacity: 0,
  total_guests: 0,
  outstation_guests: 0,
  num_rooms: 0,          // auto-calculated but editable
  num_rooms_override: false,
  hotel_tier: '',
  mandapam_id: '',
  mandapam_name: '',
  mandapam_cost_per_day: 0,
  num_days: 1,
  bride_state: '',
  bride_district: '',
  bride_hometown: '',
  groom_state: '',
  groom_district: '',
  groom_hometown: '',
  // Tab 3
  decor_total: 0,
  selected_decor: [],
  // Tab 4 – Food
  food_categories: [],
  food_budget_tier: '',
  bar_type: '',
  specialty_counters: [],
  guest_counts_by_event: {},
  food_meals_per_event: {},   // { eventId: [mealType, ...] }
  food_dishes: {},            // { eventId: { mealType: { Veg:[..], Non-Veg:[..], Jain:[..] } } }
  food_covers_per_meal: {},   // { eventId: { mealType: count } }
  food_custom_dishes: {},     // { eventId: { mealType: { cat: [customDish,...] } } }
  custom_events: [],          // [{ id, label, emoji }]
  // Tab 5
  selected_artists: [],
  artists_total: 0,
  artist_events: {},  // { artistId: { event_date, event_id, start_time, duration_hrs, venue_name, audience_count } }
  // Tab 6 (Sundries)
  room_basket_budget: 'standard',
  sundry_overrides: {},
  // Tab 7 – Logistics
  logistics_total: 0,
  ghodi: false,
  dholi_count: 0,
  dholi_hours: 2,
  sfx_items: [],
  transfer_source_type: 'Airport',   // Airport | Railway Station | Bus Stand
  transfer_distance_km: 0,           // manual or from maps
  vehicle_type: 'Innova',            // Innova | Tempo Traveller | Bus
  guests_per_vehicle: 3,             // thumb rule: 1 vehicle per N guests (admin configurable)
  bride_travel_mode: '',             // Air | Train | Car | Other
  bride_travel_cost: 0,
  bride_travel_distance_km: 0,
  groom_travel_mode: '',
  groom_travel_cost: 0,
  groom_travel_distance_km: 0,
  // Budget
  budget_result: null,
}

export function WeddingProvider({ children }) {
  const [wedding, setWedding] = useState(initialWeddingState)

  const update = useCallback((key, value) => {
    setWedding(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateMany = useCallback((updates) => {
    setWedding(prev => ({ ...prev, ...updates }))
  }, [])

  return (
    <WeddingContext.Provider value={{ wedding, update, updateMany }}>
      {children}
    </WeddingContext.Provider>
  )
}

export const useWedding = () => useContext(WeddingContext)

export const formatRupees = (n) => {
  if (!n || n === 0) return '₹0'
  if (n >= 10000000) return `₹${(n/10000000).toFixed(1)}Cr`
  if (n >= 100000)   return `₹${(n/100000).toFixed(1)}L`
  if (n >= 1000)     return `₹${(n/1000).toFixed(0)}K`
  return `₹${Math.round(n)}`
}
