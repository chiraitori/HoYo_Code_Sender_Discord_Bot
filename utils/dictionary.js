const rewardDictionary = {
    en: {
      'primogem': 'Primogem',
      'primogems': 'Primogems',
      'stellar jade': 'Stellar Jade',
      'denny': 'Denny',
      'polychrome': 'Polychrome',
      'mora': 'Mora',
      'mystic enhancement ore': 'Mystic Enhancement Ore',
      'hero’s wit': "Hero's Wit",
      'w-engine power supplies': 'W-Engine Power Supply',
      'bangboo algorithm module': 'Bangboo Algorithm Module',
      'official investigator log': 'Official Investigator Log',
      'and': 'and',
      'x': 'x',
      'vayuda turquoise sliver': 'Vayuda Turquoise Sliver',
      'guide to kindling': 'Guide to Kindling',
      'adventurer’s experience': "Adventurer's Experience",
      'fine enhancement ore': 'Fine Enhancement Ore',
      'jueyun chili chicken': 'Jueyun Chili Chicken',
      'stir-fried fish noodles': 'Stir-Fried Fish Noodles',
      'kalpalata lotus': 'Kalpalata Lotus',
      'brilliant chrysanthemums': 'Brilliant Chrysanthemum',
      'one': 'x1',
      'two': 'x2',
      'three': 'x3',
      'four': 'x4',
      'five': 'x5',
      'ten': 'x10',
      'fifteen': 'x15',
      'bottled soda': 'Bottled Soda',
      'condensed aether': 'Condensed Aether',
      'lost gold fragments': 'Lost Gold Fragment',
      'credits': 'Credit',
      'traveler’s guides': "Traveler's Guide",
    },
    jp: {
      'primogem': '原石',
      'primogems': '原石',
      'stellar jade': '星玉',
      'denny': 'デニー',
      'polychrome': 'ポリクローム',
      'mora': 'モラ',
      'mystic enhancement ore': '神秘の強化鉱石',
      'hero’s wit': '大英雄の経験',
      'w-engine power supplies': 'Wエンジン電源',
      'bangboo algorithm module': 'バンブーアルゴリズムモジュール',
      'official investigator log': '公式調査ログ',
      'and': 'と',
      'x': '×',
      'vayuda turquoise sliver': '自由のターコイズ・砕屑',
      'guide to kindling': '「焚燼」の導き',
      'adventurer’s experience': '冒険家の経験',
      'fine enhancement ore': '仕上げ用良鉱',
      'jueyun chili chicken': '椒ジョ椒ジョ鶏ジー',
      'stir-fried fish noodles': '魚肉の焼き麺',
      'kalpalata lotus': 'カルパラタ蓮',
      'brilliant chrysanthemums': 'シャクギク',
      'one': 'x1',
      'two': 'x2',
      'three': 'x3',
      'four': 'x4',
      'five': 'x5',
      'ten': 'x10',
      'fifteen': 'x15',
      'bottled soda': '缶入りカコカーラ',
      'condensed aether': '濃縮エーテル',
      'lost gold fragments': '遺失砕金',
      'credits': '信用ポイント',
      'traveler’s guides': '漫遊指南',
    },
    vi: {
      'primogem': 'Nguyên Thạch',
      'primogems': 'Nguyên Thạch',
      'stellar jade': 'Tinh Thạch',
      'denny': 'Denny',
      'polychrome': 'Film Màu',
      'mora': 'Mora',
      'mystic enhancement ore': 'Quặng Cường Hóa Thần Bí',
      'hero’s wit': 'Kinh Nghiệm Anh Hùng',
      'w-engine power supplies': 'Nguồn Điện W-Engine',
      'bangboo algorithm module': 'Module Thuật Toán Bangboo',
      'official investigator log': 'Nhật Ký Điều Tra Chính Thức',
      'and': 'và',
      'x': 'x',
      'vayuda turquoise sliver': 'Vụn Tùng Thạch Tự Tại',
      'guide to kindling': 'Hướng Dẫn Của "Thiêu Đốt"',
      'adventurer’s experience': 'EXP Nhà Mạo Hiểm',
      'fine enhancement ore': 'Lương Khoáng Tinh Đúc',
      'jueyun chili chicken': 'Gà Cay Thơm Mềm',
      'stir-fried fish noodles': 'Phở Xào Cá',
      'kalpalata lotus': 'Sen Kalpalata',
      'brilliant chrysanthemums': 'Cúc Rực Rỡ',
      'one': 'x1',
      'two': 'x2',
      'three': 'x3',
      'four': 'x4',
      'five': 'x5',
      'ten': 'x10',
      'fifteen': 'x15',
      'bottled soda': 'Nước Vui Vẻ Đóng Hộp',
      'condensed aether': 'Aether Cô Đặc',
      'lost gold fragments': 'Mảnh Vàng Đánh Mất',
      'credits': 'Điểm Tín Dụng',
      'traveler’s guides': 'Hướng Dẫn Dạo Chơi',
    },
  };



function translateReward(reward, language = 'en') {
    if (!reward) return '';
    
    let translatedReward = reward.toLowerCase();
    const dict = rewardDictionary[language] || rewardDictionary.en;
    
    // Replace all dictionary terms with their translations
    Object.entries(dict).forEach(([key, value]) => {
        const regex = new RegExp(key, 'gi');
        translatedReward = translatedReward.replace(regex, value);
    });
    
    // Format numbers and quantities
    translatedReward = translatedReward.replace(/(\d+)\s+([^\d\s]+)/g, '$1 $2');
    
    return translatedReward;
}

module.exports = { translateReward };