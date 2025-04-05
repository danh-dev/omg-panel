import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

// Define player data interface
export interface PlayerData {
  Name: string;
  Phone: string;
  Age: number;
  "Target Pairs": string;
  "1st Attempt": string;
  "2nd Attempt": string;
  "3rd Attempt": string;
  Attempts: number;
  Result: string;
  Timestamp: string;
}

// Initialize JWT client for Google API authorization
const initializeJwtClient = () => {
  const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error("Missing Google API credentials in environment variables");
  }

  return new JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
};

// Get Google Spreadsheet
export const getSpreadsheetDocument = async () => {
  const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

  if (!GOOGLE_SHEET_ID) {
    throw new Error("Missing Google Sheet ID in environment variables");
  }

  const jwtClient = initializeJwtClient();
  const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, jwtClient);
  await doc.loadInfo();

  console.log("Sheet loaded successfully, title:", doc.title);
  console.log("Number of sheets:", doc.sheetCount);

  return doc;
};

// Get all player data
export const getAllPlayerData = async (): Promise<PlayerData[]> => {
  try {
    const doc = await getSpreadsheetDocument();
    const sheet = doc.sheetsByIndex[0]; // Assuming first sheet contains player data

    // Load all rows with limit to avoid timeout
    const rows = await sheet.getRows({ limit: 999999 }); // Số đủ lớn để lấy hết dữ liệu

    // Lấy tiêu đề cột từ sheet
    const headers = sheet.headerValues;

    // Convert to PlayerData objects
    return rows.map((row: any) => {
      // Lấy dữ liệu thô từ row
      const rawData = row._rawData;

      // Tạo đối tượng PlayerData từ dữ liệu thô
      const playerData: PlayerData = {
        Name: rawData[headers.indexOf("Name")] || "",
        Phone: rawData[headers.indexOf("Phone")] || "",
        Age: parseInt(rawData[headers.indexOf("Age")]) || 0,
        "Target Pairs": rawData[headers.indexOf("Target Pairs")] || "",
        "1st Attempt": rawData[headers.indexOf("1st Attempt")] || "",
        "2nd Attempt": rawData[headers.indexOf("2nd Attempt")] || "",
        "3rd Attempt": rawData[headers.indexOf("3rd Attempt")] || "",
        Attempts: parseInt(rawData[headers.indexOf("Attempts")]) || 0,
        Result: rawData[headers.indexOf("Result")] || "",
        Timestamp: rawData[headers.indexOf("Timestamp")] || "",
      };

      return playerData;
    });
  } catch (error) {
    console.error("Error fetching player data:", error);
    throw error;
  }
};

// Get paginated player data
export const getPaginatedPlayerData = async (
  page: number,
  pageSize: number
): Promise<{
  data: PlayerData[];
  totalItems: number;
  totalPages: number;
}> => {
  try {
    const doc = await getSpreadsheetDocument();
    const sheet = doc.sheetsByIndex[0];

    // Get total count - Lấy toàn bộ dữ liệu một lần để đảm bảo count chính xác
    const rowsMetadata = await sheet.getRows({ limit: 999999 }); // Hoặc một số lớn đủ để lấy toàn bộ rows
    const totalItems = rowsMetadata.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Get specific range for pagination - lấy dữ liệu theo trang
    const offset = (page - 1) * pageSize;
    const limit = pageSize;
    const pageRows = await sheet.getRows({ offset, limit });

    const data = pageRows.map((row: any) => {
      // Lấy tiêu đề cột từ sheet
      const headers = sheet.headerValues;

      // Lấy dữ liệu thô từ row
      const rawData = row._rawData;

      // Tạo đối tượng PlayerData từ dữ liệu thô
      const playerData: PlayerData = {
        Name: rawData[headers.indexOf("Name")] || "",
        Phone: rawData[headers.indexOf("Phone")] || "",
        Age: parseInt(rawData[headers.indexOf("Age")]) || 0,
        "Target Pairs": rawData[headers.indexOf("Target Pairs")] || "",
        "1st Attempt": rawData[headers.indexOf("1st Attempt")] || "",
        "2nd Attempt": rawData[headers.indexOf("2nd Attempt")] || "",
        "3rd Attempt": rawData[headers.indexOf("3rd Attempt")] || "",
        Attempts: parseInt(rawData[headers.indexOf("Attempts")]) || 0,
        Result: rawData[headers.indexOf("Result")] || "",
        Timestamp: rawData[headers.indexOf("Timestamp")] || "",
      };

      return playerData;
    });

    return {
      data,
      totalItems,
      totalPages,
    };
  } catch (error) {
    console.error("Error fetching paginated data:", error);
    throw error;
  }
};

// Get statistics for dashboard
export interface DashboardStats {
  totalPlayers: number;
  winRate: number;
  averageAttempts: number;
  playersByDate: { date: string; count: number }[];
  playersByHour: { hour: string; count: number }[];
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const doc = await getSpreadsheetDocument();
    const sheet = doc.sheetsByIndex[0]; // Assuming first sheet contains player data

    // Lấy dữ liệu từ sheet
    const rows = await sheet.getRows({ limit: 999999 }); // Số đủ lớn để lấy hết dữ liệu
    const headers = sheet.headerValues;

    // Parse dữ liệu thành mảng an toàn
    const allPlayers = rows.map((row: any) => {
      const rawData = row._rawData;

      return {
        Name: rawData[headers.indexOf("Name")] || "",
        Phone: rawData[headers.indexOf("Phone")] || "",
        Age: parseInt(rawData[headers.indexOf("Age")]) || 0,
        "Target Pairs": rawData[headers.indexOf("Target Pairs")] || "",
        "1st Attempt": rawData[headers.indexOf("1st Attempt")] || "",
        "2nd Attempt": rawData[headers.indexOf("2nd Attempt")] || "",
        "3rd Attempt": rawData[headers.indexOf("3rd Attempt")] || "",
        Attempts: parseInt(rawData[headers.indexOf("Attempts")]) || 0,
        Result: rawData[headers.indexOf("Result")] || "",
        Timestamp: rawData[headers.indexOf("Timestamp")] || "",
      };
    });

    // Tính toán các chỉ số thống kê
    const totalPlayers = allPlayers.length;

    // Tính tỷ lệ thắng
    const winners = allPlayers.filter((player) => player.Result === "Win");
    const winRate =
      totalPlayers > 0 ? (winners.length / totalPlayers) * 100 : 0;

    // Tính số lần thử trung bình
    const totalAttempts = allPlayers.reduce(
      (sum, player) => sum + (player.Attempts || 0),
      0
    );
    const averageAttempts = totalPlayers > 0 ? totalAttempts / totalPlayers : 0;

    // Nhóm người chơi theo ngày
    const playersByDateMap = new Map<string, number>();

    allPlayers.forEach((player) => {
      if (!player.Timestamp) return;

      try {
        const date = new Date(player.Timestamp);
        if (isNaN(date.getTime())) return; // Skip invalid dates

        const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD

        playersByDateMap.set(
          dateString,
          (playersByDateMap.get(dateString) || 0) + 1
        );
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Chuyển đổi thành mảng và sắp xếp theo ngày
    const playersByDate = Array.from(playersByDateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Nhóm người chơi theo giờ
    const playersByHourMap = new Map<string, number>();

    // Khởi tạo tất cả giờ là 0
    for (let i = 0; i < 24; i++) {
      playersByHourMap.set(i.toString().padStart(2, "0"), 0);
    }

    allPlayers.forEach((player) => {
      if (!player.Timestamp) return;

      try {
        const date = new Date(player.Timestamp);
        if (isNaN(date.getTime())) return; // Skip invalid dates

        const hour = date.getHours().toString().padStart(2, "0");

        playersByHourMap.set(hour, (playersByHourMap.get(hour) || 0) + 1);
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Chuyển đổi thành mảng và sắp xếp theo giờ
    const playersByHour = Array.from(playersByHourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    return {
      totalPlayers,
      winRate,
      averageAttempts,
      playersByDate,
      playersByHour,
    };
  } catch (error) {
    console.error("Error calculating dashboard stats:", error);
    throw error;
  }
};
