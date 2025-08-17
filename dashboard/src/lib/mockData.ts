// Mock data for testing when external API is unavailable
export const mockGameCodes = {
  genshin: [
    {
      code: "GENSHINGIFT",
      isExpired: false,
      timestamp: "2024-12-01T00:00:00Z"
    },
    {
      code: "PRIMOGEMS100",
      isExpired: false,
      timestamp: "2024-12-01T00:00:00Z"
    },
    {
      code: "OLDCODE123",
      isExpired: true,
      timestamp: "2024-11-01T00:00:00Z"
    }
  ],
  hkrpg: [
    {
      code: "STARRAIL50",
      isExpired: false,
      timestamp: "2024-12-01T00:00:00Z"
    },
    {
      code: "TRAILBLAZER",
      isExpired: false,
      timestamp: "2024-12-01T00:00:00Z"
    }
  ],
  nap: [
    {
      code: "ZENLESS100",
      isExpired: false,
      timestamp: "2024-12-01T00:00:00Z"
    }
  ]
};

export const gameApiMapping = {
  'genshin': 'genshin',
  'hsr': 'hkrpg',
  'zzz': 'nap'
};
