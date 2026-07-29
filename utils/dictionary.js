const rewardDictionary = {
    en: {
      'primogem': 'Primogem',
      'primogems': 'Primogems',
      'poly': 'Polychrome',
      'stellar jade': 'Stellar Jade',
      'denny': 'Denny',
      'polychrome': 'Polychrome',
      'mora': 'Mora',
      'mystic enhancement ore': 'Mystic Enhancement Ore',
      'hero’s wit': "Hero's Wit",
      'w-engine power supplies': 'W-Engine Power Supply',
      'bangboo algorithm module': 'Bangboo Algorithm Module',
      'official investigator log': 'Official Investigator Log',
      'senior investigator log': 'Senior Investigator Log',
      'w-engine battery': 'W-Engine Battery',
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
      'credit': 'Credit',
      'traveler’s guide': "Traveler's Guide",
      "traveler's guide": "Traveler's Guide",
      'traveler’s guides': "Traveler's Guide",
    },
    jp: {
      'primogem': '原石',
      'primogems': '原石',
      'poly': 'ポリクローム',
      'stellar jade': '星玉',
      'denny': 'デニー',
      'polychrome': 'ポリクローム',
      'mora': 'モラ',
      'mystic enhancement ore': '神秘の強化鉱石',
      'hero’s wit': '大英雄の経験',
      'w-engine power supplies': 'Wエンジン電源',
      'bangboo algorithm module': 'バンブーアルゴリズムモジュール',
      'official investigator log': '公式調査ログ',
      'senior investigator log': '上級調査員記録',
      'w-engine battery': 'Wエンジンバッテリー',
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
      'credit': '信用ポイント',
      'traveler’s guide': '漫遊指南',
      "traveler's guide": '漫遊指南',
      'traveler’s guides': '漫遊指南',
    },
    vi: {
      'primogem': 'Nguyên Thạch',
      'primogems': 'Nguyên Thạch',
      'poly': 'Film Màu',
      'stellar jade': 'Tinh Thạch',
      'denny': 'Denny',
      'polychrome': 'Film Màu',
      'mora': 'Mora',
      'mystic enhancement ore': 'Quặng Cường Hóa Thần Bí',
      'hero’s wit': 'Kinh Nghiệm Anh Hùng',
      'w-engine power supplies': 'Nguồn Điện W-Engine',
      'bangboo algorithm module': 'Module Thuật Toán Bangboo',
      'official investigator log': 'Nhật Ký Điều Tra Chính Thức',
      'senior investigator log': 'Nhật Ký Điều Tra Viên Cao Cấp',
      'w-engine battery': 'Pin W-Engine',
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
      'credit': 'Điểm Tín Dụng',
      'traveler’s guide': 'Hướng Dẫn Dạo Chơi',
      "traveler's guide": 'Hướng Dẫn Dạo Chơi',
      'traveler’s guides': 'Hướng Dẫn Dạo Chơi',
    },
  };



const QUANTITY_WORDS = {
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    ten: '10',
    fifteen: '15'
};

function normalizeRewardName(value) {
    return String(value || '')
        .trim()
        .replace(/[’`]/g, "'")
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function splitRewardParts(reward) {
    return String(reward || '')
        .replace(/\r/g, '\n')
        .split(/;|\n+|\s+\+\s+|,(?=\s*[^\d\s])/)
        .map(part => part.trim())
        .filter(Boolean);
}

function parseRewardItem(part) {
    const text = String(part || '').trim();
    if (!text) return null;

    const amountPattern = '(\\d[\\d,]*(?:\\.\\d+)?)';
    let match = text.match(new RegExp(`^(.+?)\\s*[x×*]\\s*${amountPattern}$`, 'i'));
    if (match) {
        return { name: match[1].trim(), quantity: match[2] };
    }

    match = text.match(new RegExp(`^${amountPattern}\\s*[x×*]?\\s+(.+)$`, 'i'));
    if (match) {
        return { name: match[2].trim(), quantity: match[1] };
    }

    match = text.match(new RegExp(`^(.+?[^\\d\\s])\\s*${amountPattern}$`, 'i'));
    if (match) {
        return { name: match[1].trim(), quantity: match[2] };
    }

    const wordMatch = text.match(/^([a-z]+)\s+(.+)$/i);
    const wordQuantity = wordMatch && QUANTITY_WORDS[wordMatch[1].toLowerCase()];
    if (wordQuantity) {
        return { name: wordMatch[2].trim(), quantity: wordQuantity };
    }

    return { name: text, quantity: null };
}

function parseRewardItems(reward) {
    return splitRewardParts(reward)
        .map(parseRewardItem)
        .filter(Boolean);
}

function translateRewardItem(name, language = 'en') {
    const selectedDictionary = rewardDictionary[language] || rewardDictionary.en;
    const normalizedName = normalizeRewardName(name);
    const dictionaryKey = Object.keys(selectedDictionary).find(
        key => normalizeRewardName(key) === normalizedName
    );

    if (!dictionaryKey) {
        return { text: String(name || '').trim(), known: false };
    }

    return { text: selectedDictionary[dictionaryKey], known: true };
}

function formatQuantity(quantity) {
    if (!quantity) return null;
    const numeric = Number(String(quantity).replace(/,/g, ''));
    return Number.isFinite(numeric)
        ? numeric.toLocaleString('en-US')
        : String(quantity);
}

function formatRewardItems(items) {
    return items.map(item => {
        const quantity = formatQuantity(item.quantity);
        return `${item.name}${quantity ? ` ×${quantity}` : ''}`;
    }).join('; ');
}

function translateReward(reward, language = 'en') {
    const translatedItems = parseRewardItems(reward).map(item => ({
        ...item,
        name: translateRewardItem(item.name, language).text
    }));
    return translatedItems.map(item => {
        const quantity = formatQuantity(item.quantity);
        return `${item.name}${quantity ? ` ×${quantity}` : ''}`;
    }).join('; ');
}

module.exports = {
    formatRewardItems,
    normalizeRewardName,
    parseRewardItems,
    translateReward,
    translateRewardItem
};
