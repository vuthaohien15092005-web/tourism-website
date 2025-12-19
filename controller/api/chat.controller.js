// Use Gemini Generative Language API (models: gemini-1.5-flash-latest is good for chat)
// Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || 'YOUR_KEY_HERE' });
const ChatHistory = require('../../model/ChatHistory');

// Enhanced caching and rate limiting with load balancing
const responseCache = new Map();
const RATE_LIMIT = new Map();
const REQUEST_QUEUE = new Map(); // Queue for handling concurrent requests
const GLOBAL_QUEUE = []; // Global request queue for load balancing
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes (increased for better cache hit)
const RATE_LIMIT_DURATION = 200; // 200ms (reduced for faster response)
const MAX_CONCURRENT_REQUESTS = 8; // Increased concurrent requests per IP
const MAX_GLOBAL_CONCURRENT = 50; // Increased global concurrent requests
const MAX_RETRIES = 2; // Reduced retry attempts for faster failure
const RETRY_DELAY = 500; // 500ms between retries (reduced)
const QUEUE_PROCESSING_INTERVAL = 50; // Process queue every 50ms (faster)

// Global request counter for load balancing
let globalRequestCount = 0;
let isProcessingQueue = false;

// Enhanced system prompts for better responses
const SYSTEM_PROMPTS = {
  default: `ViA - Trợ lý du lịch Hà Nội. QUAN TRỌNG: Trả lời tối đa 3-4 câu, ngắn gọn, có địa chỉ và giá. KHÔNG viết dài, KHÔNG giải thích chi tiết. Chỉ đưa thông tin cần thiết.`,
  
  travel: `Chuyên gia du lịch Hà Nội. Trả lời tối đa 3 câu, có địa chỉ và giá. KHÔNG viết dài. Chỉ đưa thông tin thực tế.`,
  
  food: `Food blogger Hà Nội. Trả lời tối đa 3 câu, có địa chỉ và giá. KHÔNG viết dài. Chỉ đưa thông tin cần thiết.`
};

// Pre-defined template responses for quick questions
const TEMPLATE_RESPONSES = {
  // Chào hỏi và giới thiệu
  "Xin chào ViA": "ViA: Xin chào! Tôi rất vui được hỗ trợ bạn. Bạn muốn hỏi gì?",
  "Chào bạn ViA": "ViA: Chào bạn! Tôi có thể giúp bạn với nhiều chủ đề khác nhau. Bạn cần gì?",
  "Hi trợ lý": "ViA: Chào bạn! Tôi là trợ lý AI ViA, bạn cần gì?",
  "Chào bạn": "ViA: Xin chào! Mình có thể giúp gì cho bạn?",
  "Hello ViA": "ViA: Hello! Tôi có thể giúp bạn với nhiều câu hỏi khác nhau.",
  "ViA ơi": "ViA: Vâng, tôi đây! Bạn cần hỏi gì?",
  "Chào chatbot": "ViA: Xin chào! Tôi là chatbot ViA - trợ lý AI. Bạn muốn hỏi gì?",
  "Bạn là ai?": "ViA: Tôi là ViA, trợ lý AI thông minh. Tôi có thể giúp bạn với nhiều câu hỏi khác nhau.",
  "Tôi cần giúp đỡ": "ViA: Rất vui được giúp bạn! Bạn muốn biết thông tin gì?",
  "Mình muốn hỏi": "ViA: Xin vui lòng nói rõ câu hỏi để tôi hỗ trợ nhé!",
  "Chào buổi tối": "ViA: Chào bạn buổi tối! Tôi có thể giúp gì cho bạn?",
  "Chúc bạn một ngày tốt lành": "ViA: Cảm ơn bạn! Tôi cũng chúc bạn một ngày tốt lành!",
  "Tôi muốn tìm địa điểm ăn uống": "ViA: Tốt quá! Bạn muốn tìm địa điểm ăn uống ở đâu?",
  "Tôi muốn hỏi về khách sạn": "ViA: Được rồi! Bạn cần gợi ý khách sạn ở đâu?",
  "Bạn có thể giúp tôi không?": "ViA: Tất nhiên rồi! Hãy cho tôi biết bạn muốn biết điều gì nhé.",
  
  // Thêm nhiều kiểu chào hỏi khác nhau
  "Hi": "ViA: Hi! Tôi là ViA - trợ lý AI. Bạn cần hỏi gì?",
  "Hey": "ViA: Hey! Tôi là ViA - trợ lý AI. Bạn muốn hỏi gì?",
  "Chào": "ViA: Chào bạn! Tôi là ViA - trợ lý AI. Bạn cần hỏi gì?",
  "Xin chào": "ViA: Xin chào! Tôi là ViA - trợ lý AI. Bạn muốn hỏi gì?",
  "Hello": "ViA: Hello! Tôi là ViA - trợ lý AI. Bạn cần hỏi gì?",
  "Chào buổi sáng": "ViA: Chào buổi sáng! Tôi là ViA - trợ lý AI. Bạn muốn hỏi gì?",
  "Chào buổi chiều": "ViA: Chào buổi chiều! Tôi là ViA - trợ lý AI. Bạn cần hỏi gì?",
  "Good morning": "ViA: Good morning! Tôi là ViA - trợ lý AI. Bạn cần hỏi gì?",
  "Good afternoon": "ViA: Good afternoon! Tôi là ViA - trợ lý AI. Bạn muốn hỏi gì?",
  "Good evening": "ViA: Good evening! Tôi là ViA - trợ lý AI. Bạn cần hỏi gì?",
  "Bạn khỏe không": "ViA: Cảm ơn bạn! Tôi khỏe và sẵn sàng giúp bạn. Bạn muốn hỏi gì?",
  "Bạn thế nào": "ViA: Tôi rất tốt! Sẵn sàng giúp bạn. Bạn cần hỏi gì?",
  "Tôi cần tư vấn": "ViA: Tôi sẵn sàng tư vấn! Tôi là ViA - trợ lý AI. Bạn muốn hỏi gì?",
  "Có thể giúp tôi không": "ViA: Tất nhiên! Tôi là ViA - trợ lý AI. Bạn cần hỏi gì?",
  "Tôi muốn hỏi": "ViA: Tôi sẵn sàng trả lời! Tôi là ViA - trợ lý AI. Bạn muốn hỏi gì?",
  "Tôi có câu hỏi": "ViA: Tôi sẵn sàng trả lời! Tôi là ViA - trợ lý AI. Bạn có câu hỏi gì?",
  "Cảm ơn": "ViA: Không có gì! Tôi luôn sẵn sàng giúp bạn. Bạn còn câu hỏi gì khác không?",
  "Thanks": "ViA: You're welcome! Tôi luôn sẵn sàng giúp bạn. Bạn còn câu hỏi gì khác không?",
  "Thank you": "ViA: You're welcome! Tôi luôn sẵn sàng giúp bạn. Bạn còn câu hỏi gì khác không?",
  "Tạm biệt": "ViA: Tạm biệt! Chúc bạn một ngày tốt lành! Hẹn gặp lại bạn!",
  "Bye": "ViA: Bye! Chúc bạn một ngày tốt lành! Hẹn gặp lại bạn!",
  "Goodbye": "ViA: Goodbye! Chúc bạn một ngày tốt lành! Hẹn gặp lại bạn!",
  "Hẹn gặp lại": "ViA: Hẹn gặp lại! Chúc bạn một ngày tốt lành!",
  
  // Thông tin cơ bản về Hà Nội
  "Hà Nội có gì đặc biệt": "ViA: Hà Nội có 1000 năm lịch sử, phố cổ 36 phố phường, hồ Gươm, Văn Miếu, ẩm thực đặc sản như phở, bún chả, chả cá.",
  "Hà Nội nổi tiếng gì": "ViA: Hà Nội nổi tiếng với phố cổ, hồ Gươm, Văn Miếu, ẩm thực phở/bún chả/chả cá, văn hóa ca trù, múa rối nước.",
  "Đặc sản Hà Nội": "ViA: Phở bò, bún chả, chả cá Lã Vọng, bún thang, cà phê trứng, kem Tràng Tiền, chè bà cốt.",
  
  // Địa điểm du lịch
  "Đi đâu ở Hà Nội": "ViA: Hồ Gươm, Văn Miếu, Phố cổ, Lăng Bác, Chùa Một Cột, Hồ Tây, Cầu Long Biên.",
  "Địa điểm nổi tiếng Hà Nội": "ViA: Hồ Gươm, Văn Miếu, Phố cổ, Lăng Bác, Chùa Một Cột, Hồ Tây, Cầu Long Biên.",
  "Tham quan Hà Nội": "ViA: Hồ Gươm, Văn Miếu, Phố cổ, Lăng Bác, Chùa Một Cột, Hồ Tây, Cầu Long Biên.",
  "Hồ Gươm": "ViA: Hồ Gươm là trái tim Hà Nội, có cầu Thê Húc, đền Ngọc Sơn, tháp Rùa. Miễn phí tham quan, mở 24/7.",
  "Văn Miếu": "ViA: Văn Miếu - Quốc Tử Giám (1070), trường đại học đầu tiên. Vé 30k, mở 8h-17h.",
  "Phố cổ Hà Nội": "ViA: 36 phố phường, mỗi phố bán một mặt hàng. Hàng Bạc, Hàng Thiếc, Hàng Mã, Hàng Tre. Miễn phí tham quan.",
  "Lăng Bác": "ViA: Lăng Chủ tịch Hồ Chí Minh, Quảng trường Ba Đình. Miễn phí, mở 7h30-10h30 (thứ 3,5,7,CN).",
  "Chùa Một Cột": "ViA: Chùa Một Cột (1049), biểu tượng Hà Nội. Miễn phí, mở 8h-17h.",
  "Hồ Tây": "ViA: Hồ Tây rộng lớn, nơi ngắm hoàng hôn đẹp. Có cà phê ven hồ, đạp xe quanh hồ.",
  "Cầu Long Biên": "ViA: Cầu Long Biên bắc qua sông Hồng, nơi ngắm hoàng hôn đẹp. Miễn phí, mở 24/7.",
  
  // Ẩm thực
  "Ăn gì ở Hà Nội": "ViA: Phở bò, bún chả, chả cá, bún thang, cà phê trứng, kem Tràng Tiền, chè bà cốt.",
  "Món ngon Hà Nội": "ViA: Phở bò, bún chả, chả cá, bún thang, cà phê trứng, kem Tràng Tiền, chè bà cốt.",
  "Phở Hà Nội": "ViA: Phở Gia Truyền Bát Đàn (35-45k) - 49 Bát Đàn, Phở Lý Quốc Sư (30-40k) - 10 Lý Quốc Sư.",
  "Bún chả": "ViA: Bún chả Hàng Mành (40-50k) - 1 Hàng Mành, Bún chả Obama (50-60k) - 24 Lê Văn Hưu.",
  "Chả cá": "ViA: Chả cá Lã Vọng (150-200k) - 14 Chả Cá, Chả cá Thăng Long (120-150k) - 21 Đường Thành.",
  "Cà phê Hà Nội": "ViA: Cà phê trứng Giảng (25-35k) - 39 Nguyễn Hữu Huân, Cà phê Dinh (20-30k) - 13 Đinh Tiên Hoàng.",
  "Kem Tràng Tiền": "ViA: Kem Tràng Tiền (15-25k) - 35 Tràng Tiền, kem truyền thống Hà Nội, mở 8h-22h.",
  
  // Lịch trình
  "Lịch trình 1 ngày": "ViA: Sáng: Hồ Gươm → Trưa: Phở Bát Đàn → Chiều: Văn Miếu → Tối: Phố cổ, bún chả Hàng Mành.",
  "Lịch trình 3 ngày": "ViA: Ngày 1: Hồ Gươm, Phố cổ → Ngày 2: Văn Miếu, Lăng Bác → Ngày 3: Hồ Tây, Cầu Long Biên.",
  "Du lịch Hà Nội": "ViA: Hồ Gươm, Văn Miếu, Phố cổ, Lăng Bác, Chùa Một Cột, Hồ Tây, ẩm thực phở/bún chả/chả cá.",
  
  // Phương tiện
  "Đi lại Hà Nội": "ViA: Xe máy (100-150k/ngày), Grab (15-25k/km), xe buýt (7-9k/lượt), xe đạp (30-50k/ngày).",
  "Thuê xe Hà Nội": "ViA: Xe máy 100-150k/ngày, xe đạp 30-50k/ngày. Cần bằng lái xe máy, đội mũ bảo hiểm.",
  "Grab Hà Nội": "ViA: Grab 15-25k/km, rẻ và an toàn. App Grab, không cần bằng lái.",
  "Xe buýt Hà Nội": "ViA: Xe buýt 7-9k/lượt, 100+ tuyến. App BusMap, NextBus để tra cứu.",
  
  // Khách sạn
  "Khách sạn Hà Nội": "ViA: Sofitel Legend (2.5-4M/đêm), Hanoi La Siesta (1.5-2.5M/đêm), Hanoi Central (300k-500k/đêm).",
  "Nơi ở Hà Nội": "ViA: Sofitel Legend (2.5-4M/đêm), Hanoi La Siesta (1.5-2.5M/đêm), Hanoi Central (300k-500k/đêm).",
  "Homestay Hà Nội": "ViA: Hanoi Old Quarter Homestay (200k-350k/đêm) - 50 Hang Be, Little Hanoi Diamond (180k-300k/đêm) - 32 Hang Be.",
  
  // Thời gian và mùa
  "Mùa nào đẹp Hà Nội": "ViA: Mùa thu (9-11) đẹp nhất, mùa xuân (3-4) có hoa, mùa hè (5-8) nóng, mùa đông (12-2) lạnh.",
  "Thời tiết Hà Nội": "ViA: Mùa thu se lạnh đẹp nhất, mùa xuân ấm áp, mùa hè nóng ẩm, mùa đông lạnh khô.",
  "Mùa thu Hà Nội": "ViA: Mùa thu (9-11) đẹp nhất, se lạnh, nắng vàng, hoa sữa thơm, cốm mới Làng Vòng.",
  
  // Văn hóa và lịch sử
  "Lịch sử Hà Nội": "ViA: 1010 Lý Thái Tổ dời đô về Thăng Long, 1802 đổi tên Hà Nội, 1954 giải phóng, 1976 thủ đô.",
  "Văn hóa Hà Nội": "ViA: Ca trù, hát xẩm, múa rối nước, lễ hội Gióng, chùa Hương, tranh Đông Hồ, gốm Bát Tràng.",
  "Truyền thống Hà Nội": "ViA: Ca trù, hát xẩm, múa rối nước, lễ hội Gióng, chùa Hương, tranh Đông Hồ, gốm Bát Tràng.",
  
  // Mua sắm
  "Mua sắm Hà Nội": "ViA: Chợ Đồng Xuân, phố cổ, Lotte Center, Vincom, Big C, Aeon Mall.",
  "Chợ Hà Nội": "ViA: Chợ Đồng Xuân (phố cổ), chợ Hàng Da, chợ Hàng Bè, chợ Hàng Đường.",
  "Quà Hà Nội": "ViA: Cốm Làng Vòng, bánh cốm, tranh Đông Hồ, gốm Bát Tràng, lụa Hà Đông.",
  
  // Giải trí
  "Giải trí Hà Nội": "ViA: Phố đi bộ Hồ Gươm (cuối tuần), Sky Bar, cà phê ven hồ Tây, múa rối nước Thăng Long.",
  "Đêm Hà Nội": "ViA: Phố đi bộ Hồ Gươm (cuối tuần), Sky Bar, cà phê ven hồ Tây, quán bar phố cổ.",
  "Múa rối nước": "ViA: Nhà hát múa rối nước Thăng Long - 57B Đinh Tiên Hoàng, vé 100-200k, diễn 15h-20h.",
  
  // Tips du lịch
  "Mẹo du lịch Hà Nội": "ViA: Mua vé trước, mang nước, kem chống nắng, học vài câu tiếng Việt, đổi tiền, cẩn thận giao thông.",
  "Lưu ý Hà Nội": "ViA: Cẩn thận giao thông, không ăn quán không rõ nguồn gốc, mang nước, kem chống nắng, học vài câu tiếng Việt.",
  "An toàn Hà Nội": "ViA: Cẩn thận giao thông, không ăn quán không rõ nguồn gốc, mang nước, kem chống nắng, học vài câu tiếng Việt.",
  
  // Câu hỏi gốc
  "Gợi ý lịch trình 2 ngày ở Hà Nội?": `🗓️ **Lịch trình 2 ngày Hà Nội:**

**Ngày 1:** Hồ Gươm → Phở Bát Đàn (35-45k) → Phố cổ → Bún chả Hàng Mành (40-50k)

**Ngày 2:** Văn Miếu → Chả cá Lã Vọng (150-200k) → Lăng Bác → Phố đi bộ Hồ Gươm

💡 Mẹo: Mua vé trước, mang nước!`,

  "Ăn gì ngon ở Phố cổ Hà Nội?": `🍜 **Ẩm thực Phố cổ:**

• Phở Bát Đàn (35-45k) - 49 Bát Đàn
• Bún chả Hàng Mành (40-50k) - 1 Hàng Mành  
• Chả cá Lã Vọng (150-200k) - 14 Chả Cá
• Cà phê trứng Giảng (25-35k)
• Kem Tràng Tiền (15-25k)

⏰ Mở: 6h-22h`,

  "Phương tiện di chuyển nào tiện nhất ở Hà Nội?": `🚗 **Phương tiện Hà Nội:**

• **Xe máy** (100-150k/ngày) - Linh hoạt nhất
• **Grab** (15-25k/km) - Rẻ, an toàn
• **Xe buýt** (7-9k/lượt) - 100+ tuyến
• **Xe đạp** (30-50k/ngày) - Dạo phố cổ, hồ Tây
• **Xe ôm** (20-30k/điểm gần) - Đi ngắn

💡 Kết hợp nhiều phương tiện!`,

  "Top điểm check-in đẹp nhất Hà Nội": `📸 **Check-in Hà Nội:**

• **Hồ Gươm** - Cầu Thê Húc, Đền Ngọc Sơn
• **Văn Miếu** - Kiến trúc cổ kính
• **Lăng Bác** - Quảng trường Ba Đình
• **Phố cổ** - 36 phố phường
• **Hồ Tây** - Sunset, cà phê ven hồ
• **Cầu Long Biên** - Hoàng hôn đẹp

📱 **Tips:** 6-8h sáng, 5-7h chiều | #HanoiVibes`,

  "Khách sạn nào tốt gần Hồ Gươm?": `🏨 **Khách sạn gần Hồ Gươm:**

• **Sofitel Legend** - 15 Ngo Quyen (2.5-4M/đêm)
• **Hanoi La Siesta** - 94 Ma May (1.5-2.5M/đêm)
• **Hanoi Elegance** - 85 Ma May (800k-1.2M/đêm)
• **Hanoi Central** - 42 Hang Be (300k-500k/đêm)
• **Hanoi Backpackers** - 48 Ngo Huyen (150k-300k/đêm)

📍 **Vị trí tốt:** Hang Be, Ma May, Hang Trong
💡 **Mẹo:** Đặt trước 1-2 tuần`,

  "Lịch sử và văn hóa Hà Nội": `🏛️ **Lịch sử & Văn hóa Hà Nội:**

• **1010:** Lý Thái Tổ dời đô về Thăng Long
• **Văn Miếu** (1070) - Trường đại học đầu tiên
• **Chùa Một Cột** (1049) - Biểu tượng Hà Nội
• **Lăng Bác** - Nơi an nghỉ của Bác
• **Phố cổ** - 36 phố phường
• **Phở, Bún chả, Chả cá** - Ẩm thực đặc sản
• **Ca trù, Múa rối nước** - Nghệ thuật truyền thống
• **Tranh Đông Hồ, Gốm Bát Tràng** - Nghề thủ công

📚 **Văn học:** Hồ Xuân Hương, Truyện Kiều, Nam Cao`
};

// Add variations for better matching
const TEMPLATE_VARIATIONS = {
  // Lịch trình 2 ngày
  "Gợi ý lịch trình 2 ngày ở Hà Nội": TEMPLATE_RESPONSES["Gợi ý lịch trình 2 ngày ở Hà Nội?"],
  "Lịch trình 2 ngày ở Hà Nội": TEMPLATE_RESPONSES["Gợi ý lịch trình 2 ngày ở Hà Nội?"],
  "2 ngày ở Hà Nội": TEMPLATE_RESPONSES["Gợi ý lịch trình 2 ngày ở Hà Nội?"],
  
  // Ẩm thực Phố cổ
  "Ăn gì ngon ở Phố cổ Hà Nội": TEMPLATE_RESPONSES["Ăn gì ngon ở Phố cổ Hà Nội?"],
  "Ăn gì ở Phố cổ": TEMPLATE_RESPONSES["Ăn gì ngon ở Phố cổ Hà Nội?"],
  "Món ngon Phố cổ": TEMPLATE_RESPONSES["Ăn gì ngon ở Phố cổ Hà Nội?"],
  
  // Phương tiện di chuyển
  "Phương tiện di chuyển nào tiện nhất ở Hà Nội": TEMPLATE_RESPONSES["Phương tiện di chuyển nào tiện nhất ở Hà Nội?"],
  "Phương tiện di chuyển Hà Nội": TEMPLATE_RESPONSES["Phương tiện di chuyển nào tiện nhất ở Hà Nội?"],
  "Đi lại ở Hà Nội": TEMPLATE_RESPONSES["Phương tiện di chuyển nào tiện nhất ở Hà Nội?"],
  
  // Điểm check-in
  "Top điểm check-in đẹp nhất Hà Nội": TEMPLATE_RESPONSES["Top điểm check-in đẹp nhất Hà Nội"],
  "Điểm check-in Hà Nội": TEMPLATE_RESPONSES["Top điểm check-in đẹp nhất Hà Nội"],
  "Chụp ảnh đẹp Hà Nội": TEMPLATE_RESPONSES["Top điểm check-in đẹp nhất Hà Nội"],
  
  // Khách sạn
  "Khách sạn nào tốt gần Hồ Gươm": TEMPLATE_RESPONSES["Khách sạn nào tốt gần Hồ Gươm?"],
  "Khách sạn gần Hồ Gươm": TEMPLATE_RESPONSES["Khách sạn nào tốt gần Hồ Gươm?"],
  "Nơi ở gần Hồ Gươm": TEMPLATE_RESPONSES["Khách sạn nào tốt gần Hồ Gươm?"],
  
  // Văn hóa
  "Lịch sử và văn hóa Hà Nội": TEMPLATE_RESPONSES["Lịch sử và văn hóa Hà Nội"],
  "Văn hóa Hà Nội": TEMPLATE_RESPONSES["Lịch sử và văn hóa Hà Nội"],
  "Lịch sử Hà Nội": TEMPLATE_RESPONSES["Lịch sử và văn hóa Hà Nội"]
};

// Merge original templates with variations
Object.assign(TEMPLATE_RESPONSES, TEMPLATE_VARIATIONS);

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.trim() }))
    .slice(-30); // Increased context window
}

// Enhanced rate limiting with global load balancing
function checkRateLimit(clientIP) {
  const now = Date.now();
  
  // Check global load
  if (globalRequestCount >= MAX_GLOBAL_CONCURRENT) {
    return false;
  }
  
  if (RATE_LIMIT.has(clientIP)) {
    const lastRequest = RATE_LIMIT.get(clientIP);
    if (now - lastRequest < RATE_LIMIT_DURATION) {
      return false;
    }
  }
  
  // Check concurrent requests per IP
  const currentRequests = REQUEST_QUEUE.get(clientIP) || 0;
  if (currentRequests >= MAX_CONCURRENT_REQUESTS) {
    return false;
  }
  
  RATE_LIMIT.set(clientIP, now);
  REQUEST_QUEUE.set(clientIP, currentRequests + 1);
  globalRequestCount++;
  return true;
}

// Enhanced queue processing for better concurrency
function processQueue() {
  if (isProcessingQueue || GLOBAL_QUEUE.length === 0) return;
  
  isProcessingQueue = true;
  
  // Process up to 5 requests at once
  const batchSize = Math.min(5, GLOBAL_QUEUE.length);
  const batch = GLOBAL_QUEUE.splice(0, batchSize);
  
  batch.forEach(request => {
    if (request && typeof request === 'function') {
      setImmediate(request);
    }
  });
  
  isProcessingQueue = false;
}

// Release rate limit with global counter
function releaseRateLimit(clientIP) {
  const currentRequests = REQUEST_QUEUE.get(clientIP) || 0;
  if (currentRequests > 0) {
    REQUEST_QUEUE.set(clientIP, currentRequests - 1);
  }
  if (globalRequestCount > 0) {
    globalRequestCount--;
  }
}

// Enhanced retry logic for API calls
async function callGeminiWithRetry(payload, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: payload.contents,
        generationConfig: payload.generationConfig
      });
      
      if (response && response.text) {
        return { success: true, data: response.text };
      }
      
      throw new Error('Empty response from Gemini');
    } catch (error) {
      console.error(`Gemini API attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        return { success: false, error: error.message };
      }
      
      // Exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Smart prompt selection based on user input
function selectSystemPrompt(userMessage) {
  const message = userMessage.toLowerCase();
  
  if (message.includes('ăn') || message.includes('món') || message.includes('quán') || 
      message.includes('nhà hàng') || message.includes('cafe') || message.includes('đồ uống')) {
    return SYSTEM_PROMPTS.food;
  }
  
  if (message.includes('đi đâu') || message.includes('thăm quan') || message.includes('du lịch') ||
      message.includes('lịch trình') || message.includes('tour') || message.includes('địa điểm')) {
    return SYSTEM_PROMPTS.travel;
  }
  
  return SYSTEM_PROMPTS.default;
}

exports.handleChatCompletion = async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  try {
    const { messages, user_id, session_id } = req.body || {};
    const history = normalizeMessages(messages);
    
    // Enhanced rate limiting with queue management
    if (!checkRateLimit(clientIP)) {
      return res.json({ 
        role: 'assistant', 
        content: 'ViA: Hệ thống đang bận, vui lòng thử lại sau vài giây.',
        meta: { type: 'rate_limit' }
      });
    }
    
    const now = Date.now();
    
    // Enhanced cache check with better key generation
    const cacheKey = JSON.stringify({ 
      messages: history.slice(-3), // Only cache last 3 messages for better hit rate
      user_id: user_id || 'anonymous'
    });
    
    if (responseCache.has(cacheKey)) {
      const cached = responseCache.get(cacheKey);
      if (now - cached.timestamp < CACHE_DURATION) {
        releaseRateLimit(clientIP);
        return res.json(cached.response);
      } else {
        responseCache.delete(cacheKey);
      }
    }

    // Get the last user message for smart prompt selection
    const lastUserMessage = history.findLast ? history.findLast(m => m.role === 'user') : [...history].reverse().find(m => m.role === 'user');
    
    // Check if this is a template question first
    if (lastUserMessage) {
      const userMessage = lastUserMessage.content.trim();
      console.log('🔍 Checking template for:', userMessage);
      
      // Off-topic filtering removed - chatbot can now answer any question
      
      // Try exact match first
      if (TEMPLATE_RESPONSES[userMessage]) {
        console.log('🎯 Exact template match found');
        const templateResponse = TEMPLATE_RESPONSES[userMessage];
        const responseData = { role: 'assistant', content: templateResponse };
        
        // Save chat history asynchronously
        if (user_id && session_id) {
          setImmediate(() => saveChatHistory(user_id, session_id, history, responseData));
        }
        
        releaseRateLimit(clientIP);
        return res.json(responseData);
      }
      
      // Try fuzzy matching for common variations
      const templateKeys = Object.keys(TEMPLATE_RESPONSES);
      const matchedKey = templateKeys.find(key => {
        // Normalize both strings: remove extra spaces, convert to lowercase, remove punctuation
        const normalize = (str) => str.toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/[.,!?;:]/g, '')
          .trim();
        
        const normalizedKey = normalize(key);
        const normalizedMessage = normalize(userMessage);
        
        console.log('Comparing:', normalizedKey, 'vs', normalizedMessage);
        
        return normalizedKey === normalizedMessage || 
               normalizedMessage.includes(normalizedKey) ||
               normalizedKey.includes(normalizedMessage);
      });
      
      if (matchedKey) {
        const templateResponse = TEMPLATE_RESPONSES[matchedKey];
        const responseData = { role: 'assistant', content: templateResponse };
        
        // Save chat history asynchronously
        if (user_id && session_id) {
          setImmediate(() => saveChatHistory(user_id, session_id, history, responseData));
        }
        
        releaseRateLimit(clientIP);
        return res.json(responseData);
      }
    }
    
    const systemPreamble = lastUserMessage ? selectSystemPrompt(lastUserMessage.content) : SYSTEM_PROMPTS.default;

    // Convert to Gemini's content format with better structure
    const contents = history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const payload = {
      contents: [
        { role: 'user', parts: [{ text: systemPreamble }] },
        ...contents
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 300, // Reduced to 300 tokens for shorter responses
        candidateCount: 1
      }
    };
    
    // If no API key, gracefully degrade with local reply
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_KEY_HERE') {
      releaseRateLimit(clientIP);
      const fallback = lastUserMessage && lastUserMessage.content
        ? `ViA: (Chế độ demo) Bạn hỏi: "${lastUserMessage.content}". Hiện chưa cấu hình khóa AI, vui lòng liên hệ quản trị viên.`
        : 'ViA: (Chế độ demo) Xin chào! Tôi là ViA - trợ lý du lịch Hà Nội. Bạn muốn hỏi gì?';
      return res.json({ role: 'assistant', content: fallback });
    }
    
    // Call Gemini with enhanced retry logic
    const result = await callGeminiWithRetry(payload);
    
    if (result.success) {
      const responseData = { role: 'assistant', content: result.data };
      
      // Enhanced caching with TTL
      responseCache.set(cacheKey, {
        response: responseData,
        timestamp: now
      });
      
      // Clean old cache entries periodically
      if (Math.random() < 0.1) { // 10% chance to clean
        cleanOldCache();
      }
      
      // Save chat history asynchronously (don't block response)
      if (user_id && session_id) {
        setImmediate(() => saveChatHistory(user_id, session_id, history, responseData));
      }
      
      releaseRateLimit(clientIP);
      return res.json(responseData);
    } else {
      releaseRateLimit(clientIP);
      console.error('Gemini API failed after retries:', result.error);
      
      // Enhanced fallback responses based on error type
      let fallbackMessage = 'ViA: Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.';
      
      if (result.error.includes('quota') || result.error.includes('limit') || result.error.includes('overloaded')) {
        fallbackMessage = 'ViA: Hệ thống đang quá tải, vui lòng thử lại sau ít phút. Trong khi chờ, bạn có thể hỏi về: địa điểm Hà Nội, ẩm thực, lịch trình du lịch.';
      } else if (result.error.includes('network') || result.error.includes('timeout') || result.error.includes('503')) {
        fallbackMessage = 'ViA: Kết nối mạng không ổn định, vui lòng thử lại. Bạn có thể hỏi về: Hồ Gươm, Văn Miếu, Phố cổ, ẩm thực Hà Nội.';
      } else if (result.error.includes('unavailable') || result.error.includes('503')) {
        fallbackMessage = 'ViA: Dịch vụ tạm thời không khả dụng. Bạn có thể hỏi về: lịch trình du lịch, địa điểm nổi tiếng, món ăn ngon Hà Nội.';
      }
      
      return res.json({ 
        role: 'assistant', 
        content: fallbackMessage,
        meta: { type: 'api_error', retry: true }
      });
    }
    
  } catch (err) {
    releaseRateLimit(clientIP);
    console.error('Chat completion error:', err);
    
    // Always return 200 to avoid client errors
    res.json({ 
      role: 'assistant', 
      content: 'ViA: Xin lỗi, đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.',
      meta: { type: 'system_error', error: err.message }
    });
  }
};

// Enhanced cache management with memory optimization
function cleanOldCache() {
  const now = Date.now();
  const keysToDelete = [];
  
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      keysToDelete.push(key);
    }
  }
  
  // Batch delete for better performance
  keysToDelete.forEach(key => responseCache.delete(key));
  
  // If cache is still too large, remove oldest entries
  if (responseCache.size > 1000) {
    const entries = Array.from(responseCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, Math.floor(entries.length * 0.2)); // Remove 20% oldest
    toRemove.forEach(([key]) => responseCache.delete(key));
  }
}

// Periodic cache cleanup and queue processing
setInterval(cleanOldCache, 5 * 60 * 1000); // Every 5 minutes
setInterval(processQueue, QUEUE_PROCESSING_INTERVAL); // Process queue every 50ms

// Memory usage monitoring
function getCacheStats() {
  return {
    cacheSize: responseCache.size,
    globalRequests: globalRequestCount,
    queueSize: GLOBAL_QUEUE.length,
    memoryUsage: process.memoryUsage()
  };
}

// Function để lưu lịch sử chat
async function saveChatHistory(user_id, session_id, history, responseData) {
  try {
    // Tìm session hiện tại hoặc tạo mới
    let chatHistory = await ChatHistory.findOne({
      user_id: user_id,
      session_id: session_id,
      is_active: true
    });

    if (!chatHistory) {
      chatHistory = new ChatHistory({
        user_id: user_id,
        session_id: session_id,
        messages: []
      });
    }

    // Chỉ thêm tin nhắn mới nhất từ history (tránh trùng lặp)
    const lastUserMessage = history[history.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
      // Kiểm tra xem tin nhắn này đã được lưu chưa
      const lastSavedMessage = chatHistory.messages[chatHistory.messages.length - 1];
      if (!lastSavedMessage || lastSavedMessage.content !== lastUserMessage.content) {
        chatHistory.messages.push({
          role: lastUserMessage.role,
          content: lastUserMessage.content,
          timestamp: new Date()
        });
      }
    }

    // Thêm phản hồi từ AI
    chatHistory.messages.push({
      role: responseData.role,
      content: responseData.content,
      timestamp: new Date()
    });
    
    // Giới hạn số lượng tin nhắn để tránh quá tải
    if (chatHistory.messages.length > 100) {
      chatHistory.messages = chatHistory.messages.slice(-100);
    }

    await chatHistory.save();
    console.log('✅ Chat history saved successfully');
  } catch (error) {
    console.error('❌ Error saving chat history:', error);
  }
}

// Function để lấy lịch sử chat của user
exports.getChatHistory = async (req, res) => {
  try {
    const { user_id, session_id, limit = 50 } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    let query = { user_id: user_id, is_active: true };
    
    if (session_id) {
      query.session_id = session_id;
    }

    const chatHistories = await ChatHistory.find(query)
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .select('session_id messages created_at updated_at');

    res.json({
      success: true,
      data: chatHistories
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function để lấy tất cả session của user
exports.getUserSessions = async (req, res) => {
  try {
    const { user_id, limit = 20 } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const sessions = await ChatHistory.find({ 
      user_id: user_id, 
      is_active: true 
    })
    .sort({ updated_at: -1 })
    .limit(parseInt(limit))
    .select('session_id messages created_at updated_at created_at');

    // Chỉ lấy tin nhắn đầu tiên của mỗi session để preview
    const sessionsWithPreview = sessions.map(session => ({
      session_id: session.session_id,
      created_at: session.created_at,
      updated_at: session.updated_at,
      preview: session.messages.length > 0 ? session.messages[0].content.substring(0, 100) + '...' : '',
      message_count: session.messages.length
    }));

    res.json({
      success: true,
      data: sessionsWithPreview
    });
  } catch (error) {
    console.error('Error getting user sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function để xóa session
exports.deleteSession = async (req, res) => {
  try {
    const { user_id, session_id } = req.body;
    
    if (!user_id || !session_id) {
      return res.status(400).json({ error: 'user_id and session_id are required' });
    }

    await ChatHistory.findOneAndUpdate(
      { user_id: user_id, session_id: session_id },
      { is_active: false, updated_at: new Date() }
    );

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function để monitor hệ thống chatbot
exports.getSystemStats = async (req, res) => {
  try {
    const stats = getCacheStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        geminiModel: GEMINI_MODEL,
        hasApiKey: !!(GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_KEY_HERE'),
        templateCount: Object.keys(TEMPLATE_RESPONSES).length,
        availableTemplates: Object.keys(TEMPLATE_RESPONSES)
      }
    });
  } catch (error) {
    console.error('Error getting system stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function để test template matching
exports.testTemplateMatching = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const userMessage = message.trim();
    console.log('🧪 Testing template matching for:', userMessage);
    
    // Try exact match
    const exactMatch = TEMPLATE_RESPONSES[userMessage];
    if (exactMatch) {
      return res.json({
        success: true,
        matchType: 'exact',
        template: userMessage,
        response: exactMatch
      });
    }
    
    // Try fuzzy matching
    const templateKeys = Object.keys(TEMPLATE_RESPONSES);
    const matchedKey = templateKeys.find(key => {
      // Normalize both strings: remove extra spaces, convert to lowercase, remove punctuation
      const normalize = (str) => str.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[.,!?;:]/g, '')
        .trim();
      
      const normalizedKey = normalize(key);
      const normalizedMessage = normalize(userMessage);
      
      return normalizedKey === normalizedMessage || 
             normalizedMessage.includes(normalizedKey) ||
             normalizedKey.includes(normalizedMessage);
    });
    
    if (matchedKey) {
      return res.json({
        success: true,
        matchType: 'fuzzy',
        template: matchedKey,
        response: TEMPLATE_RESPONSES[matchedKey]
      });
    }
    
    return res.json({
      success: false,
      matchType: 'none',
      message: 'No template match found',
      availableTemplates: templateKeys
    });
    
  } catch (error) {
    console.error('Error testing template matching:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


