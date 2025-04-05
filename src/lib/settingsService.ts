import { getSpreadsheetDocument } from "./googleSheetsService";

// Interface for DNA Game Settings
export interface DNAGameSettings {
  numPairs: number;
  helixRadius: number;
  helixHeight: number;
  backboneWidth: number;
  twists: number;
  whitelistedPairs: number[];
  gameTime: number;
  blinkCount: number;
  blinkInterval: number;
  targetPairCount: number;
  maxSelections: number;
  maxAttempts: number;
  winScreenTimer: number;
  defaultCameraPosition: {
    x: number;
    y: number;
    z: number;
  };
  rotationSpeed: number;
  spin: boolean;
  spinSpeed: number;
  winTimeout: number;
  lostTimeout: number;
  // Media settings
  backgroundImage: string;
  introVideo: string;
  winVideo: string;
  textureImage: string;
  matchRatioThreshold: number;
}

// Default settings in case nothing is found in the sheet
const DEFAULT_SETTINGS: DNAGameSettings = {
  numPairs: 21,
  helixRadius: 7.5,
  helixHeight: 38,
  backboneWidth: 0.6,
  twists: 1,
  whitelistedPairs: [0, 1, 2, 7, 8, 9, 10, 11, 12, 13, 18, 19, 20],
  gameTime: 30,
  blinkCount: 14,
  blinkInterval: 500,
  targetPairCount: 3,
  maxSelections: 3,
  maxAttempts: 3,
  winScreenTimer: 11000,
  defaultCameraPosition: {
    x: 0,
    y: 0,
    z: 40,
  },
  rotationSpeed: 0.001,
  spin: true,
  spinSpeed: 0.002,
  winTimeout: 3000,
  lostTimeout: 3000,
  backgroundImage: "",
  introVideo: "",
  winVideo: "",
  textureImage: "",
  matchRatioThreshold: 1,
};

/**
 * Helper function to find or create the Settings sheet
 */
const getSettingsSheet = async () => {
  const doc = await getSpreadsheetDocument();

  // Try to find existing Settings sheet
  const existingSheet = doc.sheetsByTitle["Settings"];

  if (existingSheet) {
    return existingSheet;
  }

  // Create new Settings sheet if it doesn't exist
  console.log("Creating new Settings sheet");
  const newSheet = await doc.addSheet({
    title: "Settings",
    headerValues: ["key", "value", "description"],
  });

  // Add default settings to the new sheet
  const settingsRows = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => {
    const stringValue =
      typeof value === "object" ? JSON.stringify(value) : String(value);

    return {
      key,
      value: stringValue,
      description: `Setting for ${key}`,
    };
  });

  await newSheet.addRows(settingsRows);
  return newSheet;
};

/**
 * Get all DNA game settings from the Settings sheet
 */
export const getGameSettings = async (): Promise<DNAGameSettings> => {
  try {
    const sheet = await getSettingsSheet();
    const rows = await sheet.getRows();

    // Start with default settings
    const settings: Partial<DNAGameSettings> = { ...DEFAULT_SETTINGS };

    // Update with values from the sheet
    rows.forEach((row) => {
      const key = row.get("key");
      const value = row.get("value");

      if (!key || !value) return;

      try {
        if (key === "whitelistedPairs") {
          settings[key as keyof DNAGameSettings] = JSON.parse(value);
        } else if (key === "defaultCameraPosition") {
          settings[key as keyof DNAGameSettings] = JSON.parse(value);
        } else if (key === "spin") {
          settings[key as keyof DNAGameSettings] =
            value.toLowerCase() === "true";
        } else if (
          key === "numPairs" ||
          key === "helixRadius" ||
          key === "helixHeight" ||
          key === "backboneWidth" ||
          key === "twists" ||
          key === "gameTime" ||
          key === "blinkCount" ||
          key === "blinkInterval" ||
          key === "targetPairCount" ||
          key === "maxSelections" ||
          key === "maxAttempts" ||
          key === "winScreenTimer" ||
          key === "rotationSpeed" ||
          key === "spinSpeed" ||
          key === "winTimeout" ||
          key === "lostTimeout" ||
          key === "matchRatioThreshold"
        ) {
          settings[key as keyof DNAGameSettings] = Number(value);
        } else if (
          key === "backgroundImage" ||
          key === "introVideo" ||
          key === "winVideo" ||
          key === "textureImage" // Đảm bảo xử lý trường textureImage
        ) {
          // Xử lý các trường media
          settings[key as keyof DNAGameSettings] = value;
        }
      } catch (error) {
        console.error(`Error parsing setting ${key}:`, error);
      }
    });

    return settings as DNAGameSettings;
  } catch (error) {
    console.error("Error getting game settings:", error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Update DNA game settings in the Settings sheet
 */
export const updateGameSettings = async (
  newSettings: Partial<DNAGameSettings>
): Promise<DNAGameSettings> => {
  try {
    const sheet = await getSettingsSheet();
    const rows = await sheet.getRows();

    // Track which settings were updated
    const updatedSettings: Set<string> = new Set();

    // Update existing rows
    for (const row of rows) {
      const key = row.get("key");

      if (key && key in newSettings) {
        let valueToSave = newSettings[key as keyof DNAGameSettings];

        // Convert objects and arrays to strings for storage
        if (typeof valueToSave === "object") {
          valueToSave = JSON.stringify(valueToSave);
        }

        row.set("value", String(valueToSave));
        updatedSettings.add(key);
        await row.save();
      }
    }

    // Add new settings that didn't exist before
    const newRows = Object.entries(newSettings)
      .filter(([key]) => !updatedSettings.has(key))
      .map(([key, value]) => ({
        key,
        value:
          typeof value === "object" ? JSON.stringify(value) : String(value),
        description: `Setting for ${key}`,
      }));

    if (newRows.length > 0) {
      await sheet.addRows(newRows);
    }

    // Return the updated settings
    return await getGameSettings();
  } catch (error) {
    console.error("Error updating game settings:", error);
    throw error;
  }
};
