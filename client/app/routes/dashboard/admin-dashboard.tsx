import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useGetAdminGlobalStatsQuery } from "@/hooks/use-workspace";
import { Loader } from "@/components/loader";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateData } from "@/lib/fetch-utlis";
import { toast } from "sonner";
import {
  Building2,
  Users,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  Search,
  ChevronRight,
  Server,
  Activity,
  UserCheck,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  Lock,
  Unlock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChartContainer } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 6;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: globalStats, isLoading } = useGetAdminGlobalStatsQuery();
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const queryClient = useQueryClient();

  const toggleStatusMutation = useMutation({
    mutationFn: (payload: { id: string; isActive: boolean }) =>
      updateData<any>(`/auth/admin/users/${payload.id}/toggle-status`, { isActive: payload.isActive }),
    onSuccess: (res: any, variables) => {
      if (res.err === 0) {
        queryClient.invalidateQueries({ queryKey: ["admin-global-stats"] });
        toast.success(res.msg || "Cập nhật trạng thái tài khoản thành công");
        if (selectedUser && selectedUser.id === variables.id) {
          setSelectedUser((prev: any) => ({ ...prev, isActive: variables.isActive }));
        }
      } else {
        toast.error(res.msg || "Không thể cập nhật trạng thái tài khoản");
      }
    },
    onError: (error: unknown) => {
      const ax = error as {
        response?: { data?: { msg?: string; message?: string } };
        message?: string;
      };
      const msg =
        ax?.response?.data?.msg ||
        ax?.response?.data?.message ||
        ax?.message ||
        "Lỗi khi cập nhật trạng thái";
      toast.error(msg);
    },
  });

  // Tab control State
  const [activeTab, setActiveTab] = useState<"workspaces" | "users" | "projects" | "tasks" | "completion">("workspaces");
  
  // Search States
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");

  // Pagination States
  const [workspacePage, setWorkspacePage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [projectPage, setProjectPage] = useState(1);
  
  // Workspace Explorer State
  const [selectedExploreWorkspaceId, setSelectedExploreWorkspaceId] = useState<string>("");

  if (isLoading) {
    return <Loader />;
  }

  const stats = (globalStats as any)?.stats || {};
  const workspaceTableData = (globalStats as any)?.workspaceTableData || [];
  const roleDistribution = (globalStats as any)?.roleDistribution || [];
  const taskDistributionByWorkspace = (globalStats as any)?.taskDistributionByWorkspace || [];
  const recentUsers = (globalStats as any)?.recentUsers || [];
  const recentWorkspaces = (globalStats as any)?.recentWorkspaces || [];
  const allProjectsData = (globalStats as any)?.allProjectsData || [];
  const allUsersData = (globalStats as any)?.allUsersData || [];
  const systemStatus = (globalStats as any)?.systemStatus || {};
  const systemAuditLogs = (globalStats as any)?.systemAuditLogs || [];

  const formatUptime = (seconds: number) => {
    if (!seconds) return "—";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}g ${mins}ph`;
    return `${mins}ph`;
  };

  const getRelativeTime = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHrs < 24) return `${diffHrs} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  // 1. Workspaces Pagination
  const filteredWorkspaces = workspaceTableData.filter((ws: any) =>
    ws.name.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
    (ws.owner?.username || "").toLowerCase().includes(workspaceSearch.toLowerCase())
  );
  const workspaceTotalPages = Math.max(1, Math.ceil(filteredWorkspaces.length / ITEMS_PER_PAGE));
  const activeWorkspacePage = Math.min(Math.max(workspacePage, 1), workspaceTotalPages);
  const paginatedWorkspaces = filteredWorkspaces.slice(
    (activeWorkspacePage - 1) * ITEMS_PER_PAGE,
    activeWorkspacePage * ITEMS_PER_PAGE
  );

  // 2. Users Pagination
  const filteredUsers = allUsersData.filter((u: any) =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const activeUserPage = Math.min(Math.max(userPage, 1), userTotalPages);
  const paginatedUsers = filteredUsers.slice(
    (activeUserPage - 1) * ITEMS_PER_PAGE,
    activeUserPage * ITEMS_PER_PAGE
  );

  // 3. Projects Pagination
  const filteredProjects = allProjectsData.filter((p: any) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.workspaceName.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.leaderName.toLowerCase().includes(projectSearch.toLowerCase())
  );
  const projectTotalPages = Math.max(1, Math.ceil(filteredProjects.length / ITEMS_PER_PAGE));
  const activeProjectPage = Math.min(Math.max(projectPage, 1), projectTotalPages);
  const paginatedProjects = filteredProjects.slice(
    (activeProjectPage - 1) * ITEMS_PER_PAGE,
    activeProjectPage * ITEMS_PER_PAGE
  );

  // Selected workspace details for Explorer
  const selectedWorkspaceDetails = workspaceTableData.find((ws: any) => ws.id === selectedExploreWorkspaceId);
  const exploreProjects = allProjectsData.filter((p: any) => p.workspaceId === selectedExploreWorkspaceId);

  const getInitials = (name: string) => {
    if (!name) return "";
    return name.trim().split(" ").pop()?.charAt(0).toUpperCase() || "";
  };

  const roleColors: Record<string, string> = {
    Admin: "#be123c",
    Leader: "#0d9488",
    Member: "#475569",
  };

  const roleChartData = roleDistribution.map((r: any) => ({
    name: r.role,
    value: r.count,
    color: roleColors[r.role] || "#888888",
  }));

  // Project Risk Pie Chart Data
  const riskChartData = [
    { name: "Nguy cơ cao (High)", value: stats.highRiskProjectsCount || 0, color: "#be123c" },
    { name: "Trung bình (Medium)", value: stats.mediumRiskProjectsCount || 0, color: "#d97706" },
    { name: "An toàn (Low)", value: stats.lowRiskProjectsCount || 0, color: "#0d9488" },
  ].filter(item => item.value > 0);

  // Dynamic system audit logs loaded from backend

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tổng Quan Hệ Thống</h1>
        <p className="text-sm text-muted-foreground">Bảng quản trị hệ thống, giám sát hiệu suất dự án và tình trạng của các workspace.</p>
      </div>

      {/* Stats Cards Grid (Clickable) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Tổng Workspace"
          value={stats.totalWorkspaces ?? 0}
          description="Nhấp để xem chi tiết"
          icon={Building2}
          isActive={activeTab === "workspaces"}
          onClick={() => setActiveTab("workspaces")}
        />
        <StatCard
          title="Thành viên"
          value={stats.totalUsers ?? 0}
          description={`${stats.activeUsers ?? 0} hoạt động · ${stats.lockedUsers ?? 0} khóa`}
          icon={Users}
          isActive={activeTab === "users"}
          onClick={() => setActiveTab("users")}
        />
        <StatCard
          title="Tổng Dự án"
          value={stats.totalProjects ?? 0}
          description={`${stats.highRiskProjectsCount ?? 0} dự án nguy cơ cao`}
          icon={FolderKanban}
          isActive={activeTab === "projects"}
          onClick={() => setActiveTab("projects")}
        />
        <StatCard
          title="Tổng Công việc"
          value={stats.totalTasks ?? 0}
          description={`${stats.totalTaskInProgress ?? 0} đang làm · ${stats.totalTaskToDo ?? 0} chờ`}
          icon={CheckSquare}
          isActive={activeTab === "tasks"}
          onClick={() => setActiveTab("tasks")}
        />
        <StatCard
          title="Tỷ lệ hoàn thành"
          value={`${stats.completionRate ?? 0}%`}
          description={`${stats.totalTaskCompleted ?? 0} công việc đã xong`}
          icon={TrendingUp}
          isActive={activeTab === "completion"}
          onClick={() => setActiveTab("completion")}
        />
      </div>

      {/* Dynamic Detail Card based on activeTab */}
      <div className="transition-all duration-300">
        {activeTab === "workspaces" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    Danh Sách Workspace Hệ Thống
                  </CardTitle>
                  <CardDescription>Quản lý các không gian làm việc và xem thông số rủi ro của từng nơi.</CardDescription>
                </div>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Tìm workspace..."
                    className="pl-8"
                    value={workspaceSearch}
                    onChange={(e) => {
                      setWorkspaceSearch(e.target.value);
                      setWorkspacePage(1);
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b text-muted-foreground font-medium">
                      <th className="p-3">Tên Workspace</th>
                      <th className="p-3">Trưởng nhóm</th>
                      <th className="p-3 text-center">Thành viên</th>
                      <th className="p-3 text-center">Dự án</th>
                      <th className="p-3 text-center">Rủi ro (High/Med)</th>
                      <th className="p-3 text-center">Công việc</th>
                      <th className="p-3 text-center">Tiến độ</th>
                      <th className="p-3 text-center">Trạng thái</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedWorkspaces.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                          Không tìm thấy workspace nào.
                        </td>
                      </tr>
                    ) : (
                      paginatedWorkspaces.map((ws: any) => {
                        const taskDonePercent = ws.taskCount > 0
                          ? Math.round((ws.taskCompleted / ws.taskCount) * 100)
                          : 0;
                        return (
                          <tr
                            key={ws.id}
                            onClick={() => navigate(`/workspaces/${ws.id}`)}
                            className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm shrink-0"
                                  style={{ backgroundColor: ws.color || "#3b82f6" }}
                                >
                                  {ws.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-foreground">{ws.name}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={ws.owner?.avatarUrl || undefined} />
                                  <AvatarFallback className="text-[10px]">
                                    {getInitials(ws.owner?.username || "") || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate max-w-[120px]">{ws.owner?.username || "—"}</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">{ws.memberCount}</td>
                            <td className="p-3 text-center">{ws.projectCount}</td>
                            <td className="p-3 text-center">
                              {ws.highRiskProjects > 0 ? (
                                <span className="text-red-500 font-bold">{ws.highRiskProjects}</span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                              <span className="text-muted-foreground"> / </span>
                              <span>{ws.mediumRiskProjects}</span>
                            </td>
                            <td className="p-3 text-center">
                              {ws.taskCompleted} / {ws.taskCount}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                                  <div
                                    className="h-full bg-teal-600 dark:bg-teal-500 rounded-full"
                                    style={{ width: `${taskDonePercent}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-8 text-right">
                                  {taskDonePercent}%
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant={ws.status === "Active" ? "default" : "secondary"}>
                                {ws.status === "Active" ? "Hoạt động" : ws.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Workspace Pagination */}
              {workspaceTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-end px-4">
                  <Pagination>
                    <PaginationContent className="gap-1 sm:gap-2">
                      <PaginationItem>
                        <button
                          onClick={() => activeWorkspacePage > 1 && setWorkspacePage(activeWorkspacePage - 1)}
                          disabled={activeWorkspacePage <= 1}
                          className={`flex items-center gap-1 text-sm font-medium px-2 py-1.5 rounded-md transition-colors ${
                            activeWorkspacePage <= 1
                              ? "text-slate-300 cursor-not-allowed select-none"
                              : "text-slate-700 hover:bg-slate-100 cursor-pointer"
                          }`}
                        >
                          <ChevronRight className="h-4 w-4 rotate-180" />
                          Trước
                        </button>
                      </PaginationItem>
                      
                      {Array.from({ length: workspaceTotalPages }, (_, i) => i + 1).map((p) => {
                        if (p === 1 || p === workspaceTotalPages || (p >= activeWorkspacePage - 1 && p <= activeWorkspacePage + 1)) {
                          const isActive = p === activeWorkspacePage;
                          return (
                            <PaginationItem key={p}>
                              <button
                                onClick={() => setWorkspacePage(p)}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                  isActive
                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                    : "text-slate-700 hover:bg-slate-100 cursor-pointer"
                                }`}
                              >
                                {p}
                              </button>
                            </PaginationItem>
                          );
                        }
                        if (p === activeWorkspacePage - 2 || p === activeWorkspacePage + 2) {
                          return (
                            <PaginationItem key={p}>
                              <span className="w-9 h-9 flex items-center justify-center text-slate-400 select-none">
                                ...
                              </span>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <button
                          onClick={() => activeWorkspacePage < workspaceTotalPages && setWorkspacePage(activeWorkspacePage + 1)}
                          disabled={activeWorkspacePage >= workspaceTotalPages}
                          className={`flex items-center gap-1 text-sm font-medium px-2 py-1.5 rounded-md transition-colors ${
                            activeWorkspacePage >= workspaceTotalPages
                              ? "text-slate-300 cursor-not-allowed select-none"
                              : "text-slate-700 hover:bg-slate-100 cursor-pointer"
                          }`}
                        >
                          Sau
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    Danh Sách Thành Viên Hệ Thống
                  </CardTitle>
                  <CardDescription>Danh sách toàn bộ tài khoản người dùng trên MentorHub.</CardDescription>
                </div>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Tìm thành viên..."
                    className="pl-8"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b text-muted-foreground font-medium">
                      <th className="p-3">Thành viên</th>
                      <th className="p-3">Email</th>
                      <th className="p-3 text-center">Vai trò</th>
                      <th className="p-3 text-center">Ngày tham gia</th>
                      <th className="p-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          Không tìm thấy thành viên nào.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((u: any) => (
                        <tr
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={u.avatarUrl || undefined} />
                                <AvatarFallback>{getInitials(u.username) || "U"}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground">{u.username}</span>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">{u.email}</td>
                          <td className="p-3 text-center">
                            <Badge variant={u.role === "Admin" ? "destructive" : u.role === "Leader" ? "default" : "secondary"}>
                              {u.role}
                            </Badge>
                          </td>
                          <td className="p-3 text-center text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="p-3 text-center">
                            <Badge className={`${u.isActive ? "bg-teal-600 hover:bg-teal-700" : "bg-rose-600 hover:bg-rose-700"} text-white border-none`}>
                              {u.isActive ? "Đang hoạt động" : "Bị khóa"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Users Pagination */}
              {userTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-end px-4">
                  <Pagination>
                    <PaginationContent className="gap-1 sm:gap-2">
                      <PaginationItem>
                        <button
                          onClick={() => activeUserPage > 1 && setUserPage(activeUserPage - 1)}
                          disabled={activeUserPage <= 1}
                          className={`flex items-center gap-1 text-sm font-medium px-2 py-1.5 rounded-md transition-colors ${
                            activeUserPage <= 1
                              ? "text-slate-300 cursor-not-allowed select-none"
                              : "text-slate-700 hover:bg-slate-100 cursor-pointer"
                          }`}
                        >
                          <ChevronRight className="h-4 w-4 rotate-180" />
                          Trước
                        </button>
                      </PaginationItem>
                      
                      {Array.from({ length: userTotalPages }, (_, i) => i + 1).map((p) => {
                        if (p === 1 || p === userTotalPages || (p >= activeUserPage - 1 && p <= activeUserPage + 1)) {
                          const isActive = p === activeUserPage;
                          return (
                            <PaginationItem key={p}>
                              <button
                                onClick={() => setUserPage(p)}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                  isActive
                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                    : "text-slate-700 hover:bg-slate-100 cursor-pointer"
                                }`}
                              >
                                {p}
                              </button>
                            </PaginationItem>
                          );
                        }
                        if (p === activeUserPage - 2 || p === activeUserPage + 2) {
                          return (
                            <PaginationItem key={p}>
                              <span className="w-9 h-9 flex items-center justify-center text-slate-400 select-none">
                                ...
                              </span>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <button
                          onClick={() => activeUserPage < userTotalPages && setUserPage(activeUserPage + 1)}
                          disabled={activeUserPage >= userTotalPages}
                          className={`flex items-center gap-1 text-sm font-medium px-2 py-1.5 rounded-md transition-colors ${
                            activeUserPage >= userTotalPages
                              ? "text-slate-300 cursor-not-allowed select-none"
                              : "text-slate-700 hover:bg-slate-100 cursor-pointer"
                          }`}
                        >
                          Sau
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "projects" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    Danh Sách Dự Án Hệ Thống
                  </CardTitle>
                  <CardDescription>Chi tiết và cấp độ rủi ro trễ hạn của các dự án đang triển khai.</CardDescription>
                </div>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Tìm kiếm dự án..."
                    className="pl-8"
                    value={projectSearch}
                    onChange={(e) => {
                      setProjectSearch(e.target.value);
                      setProjectPage(1);
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b text-muted-foreground font-medium">
                      <th className="p-3">Tên Dự Án</th>
                      <th className="p-3">Workspace</th>
                      <th className="p-3">Trưởng nhóm (Leader)</th>
                      <th className="p-3 text-center">Tiến độ</th>
                      <th className="p-3 text-center">Nguy cơ trễ hạn (AI)</th>
                      <th className="p-3 text-center">Dự kiến hoàn thành</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          Không tìm thấy dự án nào.
                        </td>
                      </tr>
                    ) : (
                      paginatedProjects.map((p: any) => {
                        const donePercent = p.taskCount > 0 ? Math.round((p.taskCompleted / p.taskCount) * 100) : 0;
                        return (
                          <tr
                            key={p.id}
                            onClick={() => navigate(`/workspaces/${p.workspaceId}/projects/${p.id}`)}
                            className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <td className="p-3 font-medium text-foreground">{p.name}</td>
                            <td className="p-3 text-muted-foreground">{p.workspaceName}</td>
                            <td className="p-3 font-medium text-foreground">{p.leaderName}</td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                                  <div className="h-full bg-teal-600 dark:bg-teal-500 rounded-full" style={{ width: `${donePercent}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground">{donePercent}%</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <Badge
                                variant={p.riskLevel === "High" ? "destructive" : p.riskLevel === "Medium" ? "secondary" : "default"}
                                className={p.riskLevel === "Medium" ? "bg-amber-500 hover:bg-amber-600 text-white border-none" : ""}
                              >
                                {p.riskLevel}
                              </Badge>
                            </td>
                            <td className="p-3 text-center text-muted-foreground">
                              {new Date(p.estimatedCompletion).toLocaleDateString("vi-VN")}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Projects Pagination */}
              {projectTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-end px-4">
                  <Pagination>
                    <PaginationContent className="gap-1 sm:gap-2">
                      <PaginationItem>
                        <button
                          onClick={() => activeProjectPage > 1 && setProjectPage(activeProjectPage - 1)}
                          disabled={activeProjectPage <= 1}
                          className={`flex items-center gap-1 text-sm font-medium px-2 py-1.5 rounded-md transition-colors ${
                            activeProjectPage <= 1
                              ? "text-slate-300 cursor-not-allowed select-none"
                              : "text-slate-700 hover:bg-slate-100 cursor-pointer"
                          }`}
                        >
                          <ChevronRight className="h-4 w-4 rotate-180" />
                          Trước
                        </button>
                      </PaginationItem>
                      
                      {Array.from({ length: projectTotalPages }, (_, i) => i + 1).map((p) => {
                        if (p === 1 || p === projectTotalPages || (p >= activeProjectPage - 1 && p <= activeProjectPage + 1)) {
                          const isActive = p === activeProjectPage;
                          return (
                            <PaginationItem key={p}>
                              <button
                                onClick={() => setProjectPage(p)}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                  isActive
                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                    : "text-slate-700 hover:bg-slate-100 cursor-pointer"
                                }`}
                              >
                                {p}
                              </button>
                            </PaginationItem>
                          );
                        }
                        if (p === activeProjectPage - 2 || p === activeProjectPage + 2) {
                          return (
                            <PaginationItem key={p}>
                              <span className="w-9 h-9 flex items-center justify-center text-slate-400 select-none">
                                ...
                              </span>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <button
                          onClick={() => activeProjectPage < projectTotalPages && setProjectPage(activeProjectPage + 1)}
                          disabled={activeProjectPage >= projectTotalPages}
                          className={`flex items-center gap-1 text-sm font-medium px-2 py-1.5 rounded-md transition-colors ${
                            activeProjectPage >= projectTotalPages
                              ? "text-slate-300 cursor-not-allowed select-none"
                              : "text-slate-700 hover:bg-slate-100 cursor-pointer"
                          }`}
                        >
                          Sau
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "tasks" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Thống Kê Công Việc Hệ Thống
              </CardTitle>
              <CardDescription>Chi tiết cấu trúc và trạng thái xử lý công việc.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-muted/10 text-center">
                  <span className="text-xs text-muted-foreground uppercase font-medium">Chờ thực hiện (To Do)</span>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.totalTaskToDo ?? 0}</p>
                </div>
                <div className="border rounded-lg p-4 bg-muted/10 text-center">
                  <span className="text-xs text-muted-foreground uppercase font-medium">Đang làm (In Progress)</span>
                  <p className="text-3xl font-bold text-teal-600 dark:text-teal-400 mt-1">{stats.totalTaskInProgress ?? 0}</p>
                </div>
                <div className="border rounded-lg p-4 bg-muted/10 text-center">
                  <span className="text-xs text-muted-foreground uppercase font-medium">Đã hoàn thành (Done)</span>
                  <p className="text-3xl font-bold text-teal-600 dark:text-teal-400 mt-1">{stats.totalTaskCompleted ?? 0}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-3">Thông tin Công việc & Phân bổ</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hệ thống ghi nhận tổng số <span className="font-semibold text-foreground">{stats.totalTasks ?? 0} công việc</span> đang được phân bổ trong các workspace. 
                  Trung bình tỷ lệ hoàn thành đạt <span className="font-semibold text-teal-600 dark:text-teal-400">{stats.completionRate ?? 0}%</span>. 
                  Hãy đảm bảo rằng các Leader đang phân bổ công việc đều đặn và đóng các công việc đã quá hạn.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "completion" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Phân Tích Tiến Độ Hoàn Thành & Hiệu Suất
              </CardTitle>
              <CardDescription>Hiệu suất hoạt động tổng thể của hệ thống.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 space-y-4">
                  <div className="bg-muted/10 border rounded-lg p-4">
                    <h3 className="font-semibold text-sm text-foreground">Tổng kết hiệu suất</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Hiện tại tỷ lệ hoàn thành công việc chung là <span className="font-semibold text-teal-600 dark:text-teal-400">{stats.completionRate}%</span>. 
                      Hệ thống ghi nhận tổng số <span className="font-semibold text-foreground">{stats.highRiskProjectsCount ?? 0} dự án</span> có nguy cơ trễ hạn cao.
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg p-4 w-full md:w-80 bg-muted/10 space-y-3">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Tóm tắt phân tích trễ hạn</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-rose-600 dark:text-rose-400 font-medium">Nguy cơ cao (High):</span>
                    <span className="font-bold">{stats.highRiskProjectsCount ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-600 dark:text-amber-400 font-medium">Trung bình (Medium):</span>
                    <span className="font-bold">{stats.mediumRiskProjectsCount ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-teal-600 dark:text-teal-400 font-medium">An toàn (Low):</span>
                    <span className="font-bold">{stats.lowRiskProjectsCount ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Display list of High Risk Projects */}
              {stats.highRiskProjectsCount > 0 && (
                <div className="border border-rose-200 dark:border-rose-900 rounded-lg p-4 bg-rose-50/5 space-y-3">
                  <h3 className="font-semibold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Dự Án Nguy Cơ Trễ Hạn Cao Cần Lưu Ý
                  </h3>
                  <div className="space-y-2">
                    {allProjectsData
                      .filter((p: any) => p.riskLevel === "High")
                      .map((p: any) => (
                        <div
                          key={p.id}
                          onClick={() => navigate(`/workspaces/${p.workspaceId}/projects/${p.id}`)}
                          className="text-xs border rounded p-3 bg-background flex flex-col md:flex-row md:items-center justify-between gap-2 cursor-pointer hover:bg-muted/40 transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-foreground">{p.name}</p>
                            <p className="text-muted-foreground mt-0.5">Workspace: {p.workspaceName} · Leader: {p.leaderName}</p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Dự kiến: {new Date(p.estimatedCompletion).toLocaleDateString("vi-VN")}
                            </span>
                            <Badge variant="destructive">High Risk</Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 3: Workspace Explorer + System Server Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Workspace Quick Explorer (Admin-only feature) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Khảo Sát Nhanh Workspace
            </CardTitle>
            <CardDescription>
              Xem chi tiết thành viên và các dự án của từng workspace ngay lập tức.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <label htmlFor="explore-ws-select" className="text-sm font-medium text-muted-foreground">Chọn Workspace:</label>
              <select
                id="explore-ws-select"
                value={selectedExploreWorkspaceId}
                onChange={(e) => setSelectedExploreWorkspaceId(e.target.value)}
                className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">-- Chọn một không gian làm việc --</option>
                {workspaceTableData.map((ws: any) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} ({ws.projectCount} Dự án · {ws.memberCount} Thành viên)
                  </option>
                ))}
              </select>
            </div>

            {selectedExploreWorkspaceId ? (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedWorkspaceDetails?.color || "#3b82f6" }} />
                    {selectedWorkspaceDetails?.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Trưởng nhóm: <span className="font-medium text-foreground">{selectedWorkspaceDetails?.owner?.username || "Chưa rõ"}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Explore Projects */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dự án & Rủi ro trễ hạn</h4>
                    {exploreProjects.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Không có dự án nào.</p>
                    ) : (
                      <div className="space-y-2">
                        {exploreProjects.map((p: any) => (
                          <div
                            key={p.id}
                            onClick={() => navigate(`/workspaces/${p.workspaceId}/projects/${p.id}`)}
                            className="text-xs border rounded p-2 bg-background flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors"
                          >
                            <span className="font-medium truncate max-w-[150px]">{p.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">{p.taskCompleted}/{p.taskCount} tasks</span>
                              <Badge
                                className={`text-[9px] px-1.5 py-0.5 ${p.riskLevel === "Medium" ? "bg-amber-500 hover:bg-amber-600 text-white border-none" : ""}`}
                                variant={
                                  p.riskLevel === "High" ? "destructive" : p.riskLevel === "Medium" ? "secondary" : "default"
                                }
                              >
                                Risk: {p.riskLevel}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Explore Details Summary */}
                  <div className="space-y-3 text-xs">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thông tin tóm tắt</h4>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <div className="bg-background border rounded p-2 text-center">
                        <p className="font-semibold text-foreground text-sm">{selectedWorkspaceDetails?.projectCount || 0}</p>
                        <p className="text-[10px]">Tổng số dự án</p>
                      </div>
                      <div className="bg-background border rounded p-2 text-center">
                        <p className="font-semibold text-foreground text-sm">{selectedWorkspaceDetails?.memberCount || 0}</p>
                        <p className="text-[10px]">Tổng thành viên</p>
                      </div>
                      <div className="bg-background border rounded p-2 text-center">
                        <p className="font-semibold text-foreground text-sm text-rose-600 dark:text-rose-400">{selectedWorkspaceDetails?.highRiskProjects || 0}</p>
                        <p className="text-[10px]">Dự án nguy cơ cao</p>
                      </div>
                      <div className="bg-background border rounded p-2 text-center">
                        <p className="font-semibold text-foreground text-sm text-teal-600 dark:text-teal-400">
                          {selectedWorkspaceDetails?.taskCount > 0 ? Math.round((selectedWorkspaceDetails?.taskCompleted / selectedWorkspaceDetails?.taskCount) * 100) : 0}%
                        </p>
                        <p className="text-[10px]">Tiến độ công việc</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t text-xs">
                  <button
                    onClick={() => navigate(`/workspaces/${selectedExploreWorkspaceId}`)}
                    className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    Xem Chi Tiết Đầy Đủ <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground text-sm">
                Vui lòng chọn một workspace từ danh sách ở trên để xem nhanh thông tin quản trị.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Server & System Health Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Server className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Tình Trạng Hệ Thống
            </CardTitle>
            <CardDescription>Giám sát hạ tầng kỹ thuật thời gian thực từ máy chủ.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <HealthBar label="Tải CPU" percentage={systemStatus.cpuUsage ?? 12} status={systemStatus.cpuUsage > 75 ? "Quá tải" : "An toàn"} color={systemStatus.cpuUsage > 75 ? "bg-rose-600" : "bg-teal-600"} />
              <HealthBar label="Sử dụng RAM" percentage={systemStatus.ramUsage ?? 40} status={systemStatus.ramUsage > 80 ? "Cao" : "Bình thường"} color={systemStatus.ramUsage > 80 ? "bg-amber-600" : "bg-teal-600"} />
              <HealthBar label="Thời gian chạy (Uptime)" percentage={100} value={formatUptime(systemStatus.uptime)} status="Hoạt động" color="bg-slate-600" />
              <HealthBar label="Kết nối WebSocket" percentage={100} value={`${systemStatus.socketConnections ?? 0} client`} status="Hoạt động" color="bg-teal-600" />
            </div>

            <div className="pt-3 border-t grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${systemStatus.dbConnected ? "bg-teal-600" : "bg-rose-600"}`} />
                <span className="text-muted-foreground">Database:</span>
                <span className="font-medium">{systemStatus.dbConnected ? "Kết nối" : "Mất kết nối"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-600" />
                <span className="text-muted-foreground">Độ trễ API:</span>
                <span className="font-medium">~45ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid for Distribution Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Workspace Tasks distribution chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Phân Bố Công Việc</CardTitle>
            <CardDescription>Top workspace có số lượng công việc nhiều nhất.</CardDescription>
          </CardHeader>
          <CardContent className="w-full overflow-x-auto">
            <div className="min-w-[400px]">
              <ChartContainer
                className="h-[300px]"
                config={{
                  completed: { label: "Hoàn thành", color: "#0d9488" },
                  total: { label: "Tổng số", color: "#475569" },
                }}
              >
                {taskDistributionByWorkspace.length > 0 ? (
                  <BarChart
                    data={taskDistributionByWorkspace}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#0d9488" name="Hoàn thành" radius={[2, 2, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="total" fill="#475569" name="Tổng số" radius={[2, 2, 0, 0]} maxBarSize={40} />
                  </BarChart>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Không có dữ liệu thống kê.
                  </div>
                )}
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Delay Risk Pie Chart (Admin-specific) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Cảnh Báo Dự Án Trễ Hạn</CardTitle>
            <CardDescription>Tỷ lệ dự án theo các mức nguy cơ trễ hạn (AI dự báo).</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer
              className="h-[300px] w-full"
              config={{
                high: { label: "Cao", color: "#ef4444" },
                medium: { label: "Trung bình", color: "#f59e0b" },
                low: { label: "Thấp", color: "#10b981" },
              }}
            >
              {riskChartData.length > 0 ? (() => {
                const total = riskChartData.reduce((acc: number, item: any) => acc + item.value, 0);
                return (
                  <PieChart>
                    <Pie
                      data={riskChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => {
                        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                        return `${pct}%`;
                      }}
                      labelLine={false}
                    >
                      {riskChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, "Dự án"]} />
                    <Legend />
                  </PieChart>
                );
              })() : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Không có dự án dự báo rủi ro.
                </div>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Grid for System Audit Log & Role distribution */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* System audit log trail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Lịch Sử Hoạt Động Hệ Thống
            </CardTitle>
            <CardDescription>Các sự kiện và hành động quản trị gần đây.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
              {systemAuditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Chưa có hoạt động nào ghi nhận.</p>
              ) : (
                systemAuditLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 text-xs border-b pb-3 last:border-0 last:pb-0">
                    <div className="mt-0.5">
                      {log.type === "system" ? (
                        <Server className="h-4 w-4 text-amber-500" />
                      ) : log.type === "user" ? (
                        <UserCheck className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Building2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{log.action}</p>
                      <p className="text-muted-foreground mt-0.5">{log.detail}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{getRelativeTime(log.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Roles distribution summary list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Cơ Cấu Người Dùng</CardTitle>
            <CardDescription>Chi tiết số lượng tài khoản theo phân quyền hệ thống.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {roleChartData.map((role: any) => {
                const totalUsers = roleChartData.reduce((acc: number, r: any) => acc + r.value, 0);
                const pct = totalUsers > 0 ? Math.round((role.value / totalUsers) * 100) : 0;
                return (
                  <div key={role.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: role.color }} />
                      <span className="text-sm font-medium text-foreground">{role.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{role.value} người</span>
                      <span className="text-xs text-muted-foreground w-12 text-right">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t">
              <button
                onClick={() => navigate("/accounts")}
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium flex items-center gap-1"
              >
                Quản lý danh sách tài khoản <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog for User */}
      <Dialog open={selectedUser !== null} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
        <DialogContent className="max-w-md w-[96vw]">
          <DialogHeader>
            <DialogTitle>Chi tiết tài khoản</DialogTitle>
            <DialogDescription>
              Xem thông tin thành viên và quản lý trạng thái kích hoạt tài khoản.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6 pt-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatarUrl || undefined} />
                  <AvatarFallback className="text-xl">
                    {getInitials(selectedUser.username) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">{selectedUser.username}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedUser.role === "Admin" ? "destructive" : selectedUser.role === "Leader" ? "default" : "secondary"}>
                      {selectedUser.role}
                    </Badge>
                    <Badge className={selectedUser.isActive ? "bg-teal-600 hover:bg-teal-700 text-white border-none" : "bg-rose-600 hover:bg-rose-700 text-white border-none"}>
                      {selectedUser.isActive ? "Đang hoạt động" : "Bị khóa"}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Detail fields */}
              <div className="border rounded-lg divide-y bg-muted/10 text-sm">
                <div className="p-3 flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-foreground">{selectedUser.email}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-muted-foreground">Ngày tham gia:</span>
                  <span className="font-medium text-foreground">
                    {new Date(selectedUser.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-muted-foreground">Mã ID tài khoản:</span>
                  <span className="font-mono text-xs text-muted-foreground select-all">{selectedUser.id}</span>
                </div>
              </div>
              
              {/* Lock/Unlock Actions */}
              <div className="border border-amber-200 dark:border-amber-900 bg-amber-50/5 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  Quyền quản trị tài khoản
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Khi tài khoản bị khóa, thành viên đó sẽ không thể đăng nhập hoặc thực hiện bất kỳ hành động nào trong các workspace của hệ thống.
                </p>
                <div className="pt-2 flex justify-end">
                  {selectedUser.role === "Admin" ? (
                    <p className="text-xs text-rose-500 font-medium">Không thể khóa tài khoản Admin chính hệ thống.</p>
                  ) : (
                    <Button
                      type="button"
                      disabled={toggleStatusMutation.isPending}
                      onClick={() => {
                        const nextState = !selectedUser.isActive;
                        if (
                          window.confirm(
                            `Bạn có chắc chắn muốn ${nextState ? "mở khóa" : "khóa"} tài khoản của ${selectedUser.username}?`
                          )
                        ) {
                          toggleStatusMutation.mutate({ id: selectedUser.id, isActive: nextState });
                        }
                      }}
                      className={`${selectedUser.isActive ? "bg-rose-600 hover:bg-rose-500 text-white" : "bg-teal-600 hover:bg-teal-500 text-white"}`}
                    >
                      {toggleStatusMutation.isPending ? (
                        "Đang xử lý..."
                      ) : selectedUser.isActive ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" /> Khóa tài khoản
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 mr-2" /> Mở khóa tài khoản
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* Reusable simple HealthBar component for Server health */
const HealthBar = ({
  label,
  percentage,
  value,
  status,
  color,
}: {
  label: string;
  percentage: number;
  value?: string;
  status: string;
  color: string;
}) => (
  <div className="space-y-1 text-xs">
    <div className="flex justify-between font-medium">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value || `${percentage}%`} ({status})</span>
    </div>
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
    </div>
  </div>
);

/* Reusable simple StatCard component */
const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  isActive,
  onClick,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  isActive?: boolean;
  onClick?: () => void;
}) => (
  <Card
    onClick={onClick}
    className={`transition-all duration-300 shadow-sm border border-slate-200/80 dark:border-slate-800/80 hover:shadow-md ${
      onClick ? "cursor-pointer hover:border-teal-400 dark:hover:border-teal-700" : ""
    } ${
      isActive
        ? "border-teal-600 ring-2 ring-teal-600/20 bg-teal-50/5 dark:bg-teal-950/5"
        : ""
    }`}
  >
    <CardContent className="p-4 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-extrabold text-foreground tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className={`p-2.5 rounded-lg transition-colors ${isActive ? "bg-teal-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
        <Icon className="h-5 w-5" />
      </div>
    </CardContent>
  </Card>
);

export default AdminDashboard;
