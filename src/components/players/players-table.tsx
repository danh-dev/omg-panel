"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { PlayerData } from "@/lib/googleSheetsService";

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function PlayersTable() {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch players data
  const fetchPlayers = async (page: number, pageSize: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/players?page=${page}&pageSize=${pageSize}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Lỗi không xác định");
      }

      setPlayers(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
      console.error("Error fetching players:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPlayers(pagination.page, pagination.pageSize);
  }, []);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchPlayers(newPage, pagination.pageSize);
  };

  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value);
    fetchPlayers(1, newPageSize);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy HH:mm:ss");
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người chơi</CardTitle>
          <CardDescription className="text-red-500">
            Lỗi: {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center p-8">
            Không thể tải dữ liệu người chơi. Vui lòng thử lại sau.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách người chơi</CardTitle>
        <CardDescription>
          Danh sách đã có {pagination.totalItems} người tham gia
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Họ tên</TableHead>
                    <TableHead className="font-medium">SĐT</TableHead>
                    <TableHead className="font-medium">Tuổi</TableHead>
                    <TableHead className="font-medium">Số lần thử</TableHead>
                    <TableHead className="font-medium">Kết quả</TableHead>
                    <TableHead className="font-medium">Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.length > 0 ? (
                    players.map((player, index) => (
                      <TableRow key={index}>
                        <TableCell>{player.Name}</TableCell>
                        <TableCell>{player.Phone}</TableCell>
                        <TableCell>{player.Age}</TableCell>
                        <TableCell>{player.Attempts}</TableCell>
                        <TableCell>
                          <span
                            className={
                              player.Result === "Win"
                                ? "text-green-500 font-medium"
                                : "text-red-500 font-medium"
                            }
                          >
                            {player.Result === "Win" ? "Thắng" : "Thua"}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(player.Timestamp)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Không có dữ liệu người chơi
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">Hiển thị</p>
                <Select
                  value={pagination.pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={pagination.pageSize.toString()} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 20, 50, 100].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">trên mỗi trang</p>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                <p className="text-sm text-muted-foreground">
                  Trang {pagination.page} / {pagination.totalPages}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
