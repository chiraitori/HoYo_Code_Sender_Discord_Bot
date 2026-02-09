/**
 * Icon URL to item name mapping for Hoyolab API
 * Maps icon hash to item details
 */

// Common Genshin Impact items
const GENSHIN_ICON_MAP = {
    // Primogems
    '150a941de99e21fc96dce97cde2dae22': 'Primogem',

    // Mora
    '503abf5f2f2c8b2013dde0f2197fc9ac': 'Mora',

    // Character EXP Materials
    'd3eb1267f27bead29907cb279d4365ab': "Hero's Wit",
    '8d969c016e4f6837ece822c3e4a90bb5': "Adventurer's Experience",
    'b8e7cd836ba730de6f4c220a1f554c54': "Wanderer's Advice",

    // Weapon Enhancement Materials
    '46de1e881b5dff638969aed85850e388': 'Mystic Enhancement Ore',
    'd734ad034c56367824e62f9566c3362f': 'Fine Enhancement Ore',
    '7366f77dd734b34e1cccbae2d001e2f8': 'Enhancement Ore',

    // Talent Materials (common)
    '925bd22be1cf5392c6ea4e0f5ddee24d': 'Guide to Freedom',
    '4b2f24b7f7c5a0e1f77e23e2e67a234a': 'Guide to Resistance',
    '8e2a5c1b4f7d8e9a2b5c3d6e7f8a9b0c': 'Guide to Ballad',
};

// Common HSR items (extracted from V4.0 livestream)
const HSR_ICON_MAP = {
    // Currency
    '77cb5426637574ba524ac458fa963da0': { en: 'Stellar Jade', vi: 'Tinh Thạch', ja: '星玉' },
    '0b12bdf76fa4abc6b4d1fdfc0fb4d6f5': { en: 'Credit', vi: 'Tín Dụng', ja: 'クレジット' },

    // Materials/Items
    '7cb0e487e051f177d3f41de8d4bbc521': { en: "Traveler's Guide", vi: 'Cẩm Nang Du Hành', ja: '旅人のガイド' },
    '508229a94e4fa459651f64c1cd02687a': { en: 'Refined Aether', vi: 'Tinh Chất Dĩ Thái', ja: '精製エーテル' },
};

// Common ZZZ items (extracted from Hoyolab API)
const ZZZ_ICON_MAP = {
    // Currency
    'cd6682dd2d871dc93dfa28c3f281d527': { en: 'Denny', vi: 'Denny', ja: 'デニー' },
    '8609070fe148c0e0e367cda25fdae632': { en: 'Polychrome', vi: 'Polychrome', ja: 'ポリクローム' },

    // Materials
    '6ef3e419022c871257a936b1857ac9d1': { en: 'Senior Investigator Log', vi: 'Nhật Ký Điều Tra Viên Cao Cấp', ja: '上級調査員記録' },
    '86e1f7a5ff283d527bbc019475847174': { en: 'W-Engine Battery', vi: 'Pin W-Engine', ja: 'Wエンジンバッテリー' },
};

// Common Genshin - with i18n
const GENSHIN_ICON_MAP_I18N = {
    '150a941de99e21fc96dce97cde2dae22': { en: 'Primogem', vi: 'Nguyên Thạch', ja: '原石' },
    '503abf5f2f2c8b2013dde0f2197fc9ac': { en: 'Mora', vi: 'Mora', ja: 'モラ' },
    'd3eb1267f27bead29907cb279d4365ab': { en: "Hero's Wit", vi: 'Kiến Thức Anh Hùng', ja: '大英雄の経験' },
    '8d969c016e4f6837ece822c3e4a90bb5': { en: "Adventurer's Experience", vi: 'Kinh Nghiệm Nhà Mạo Hiểm', ja: '冒険者の経験' },
    'b8e7cd836ba730de6f4c220a1f554c54': { en: "Wanderer's Advice", vi: 'Lời Khuyên Du Đãng', ja: '流浪者の経験' },
    '46de1e881b5dff638969aed85850e388': { en: 'Mystic Enhancement Ore', vi: 'Tinh Quặng Ma Thuật', ja: '仕上げ用魔鉱' },
    'd734ad034c56367824e62f9566c3362f': { en: 'Fine Enhancement Ore', vi: 'Tinh Quặng Cường Hóa', ja: '仕上げ用良鉱' },
    '7366f77dd734b34e1cccbae2d001e2f8': { en: 'Enhancement Ore', vi: 'Quặng Cường Hóa', ja: '強化鉱石' },
};

/**
 * Extract icon hash from URL
 */
function getIconHash(url) {
    if (!url) return null;
    const match = url.match(/\/([a-f0-9]{32})_/);
    return match ? match[1] : null;
}

/**
 * Get item name with language support
 */
function getItemName(itemData, lang = 'en') {
    if (!itemData) return null;

    // Handle both old format (string) and new format (object with en/vi)
    if (typeof itemData === 'string') {
        return itemData;
    }

    return itemData[lang] || itemData.en || null;
}

/**
 * Parse icon bonuses to readable text
 * @param {Array} iconBonuses - Array of icon bonus objects
 * @param {string} game - Game identifier (genshin, hkrpg, nap)
 * @param {string} lang - Language code (en, vi)
 */
function parseIconBonuses(iconBonuses, game = 'genshin', lang = 'en') {
    if (!iconBonuses || iconBonuses.length === 0) {
        return lang === 'vi' ? 'Phần thưởng không xác định' : 'Unknown Rewards';
    }

    // Use i18n icon map if available
    const iconMap = game === 'genshin' ? GENSHIN_ICON_MAP_I18N :
        game === 'hkrpg' ? HSR_ICON_MAP :
            ZZZ_ICON_MAP;

    const rewards = [];

    for (const bonus of iconBonuses) {
        const hash = getIconHash(bonus.icon_url);
        const itemData = hash ? iconMap[hash] : null;
        const itemName = getItemName(itemData, lang);

        if (itemName) {
            rewards.push(`${bonus.bonus_num.toLocaleString()} ${itemName}`);
        } else {
            // Unknown item - just show quantity
            const unknownText = lang === 'vi' ? 'Vật phẩm' : 'Unknown Item';
            rewards.push(`${bonus.bonus_num}x ${unknownText}`);
        }
    }

    return rewards.length > 0 ? rewards.join(', ') : (lang === 'vi' ? 'Phần thưởng không xác định' : 'Unknown Rewards');
}

module.exports = {
    GENSHIN_ICON_MAP,
    GENSHIN_ICON_MAP_I18N,
    HSR_ICON_MAP,
    ZZZ_ICON_MAP,
    getIconHash,
    getItemName,
    parseIconBonuses
};
