import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchData, postData, updateData, deleteData } from "@/lib/fetch-utlis";
import { useAuth } from "@/provider/auth-context";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { User } from "@/type";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function userInitials(name?: string | null) {
  const n = (name || "").trim();
  if (!n) return "U";
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
}

type UsersResponse = {
  err: number;
  msg: string;
  response: Pick<User, "id" | "username" | "email" | "role" | "avatarUrl">[];
};

type AdminCreateUserResponse = {
  err: number;
  msg: string;
  response?: {
    id: string;
    username: string;
    email: string;
    role: User["role"];
    mustChangePassword?: boolean;
    tempPassword?: string;
  };
};

const AccountsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [createdTempPassword, setCreatedTempPassword] = React.useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = React.useState<string | null>(null);
  const [editingUser, setEditingUser] = React.useState<null | {
    id: string;
    username: string;
    email: string;
    role: User["role"];
    avatarUrl?: string | null;
  }>(null);

  // Chỉ Admin được vào trang này
  React.useEffect(() => {
    if (user && user.role !== "Admin") {
      navigate("/dashboard");
      toast.error("Bạn không có quyền truy cập trang quản lý tài khoản.");
    }
  }, [user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      const res = await fetchData<UsersResponse>(`/auth/users`, {
        params: search ? { search } : undefined,
      });
      return res.response || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      username: string;
      email: string;
      role: User["role"];
    }) => postData<AdminCreateUserResponse>("/auth/admin/users", payload),
    onSuccess: (res) => {
      if (res.err === 0) {
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        const temp = res.response?.tempPassword || null;
        setCreatedTempPassword(temp);
        setCreatedEmail(res.response?.email || null);
        setEditingUser(null);
        toast.success("Tạo tài khoản thành công.");
      } else {
        toast.error(res.msg || "Không thể tạo tài khoản");
      }
    },
    onError: () => {
      toast.error("Không thể tạo tài khoản");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      username: string;
      email: string;
      role: User["role"];
    }) => updateData(`/auth/admin/users/${payload.id}`, payload),
    onSuccess: (res: any) => {
      if (res.err === 0) {
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        setIsDialogOpen(false);
        setEditingUser(null);
        toast.success("Cập nhật tài khoản thành công");
      } else {
        toast.error(res.msg || "Không thể cập nhật tài khoản");
      }
    },
    onError: () => {
      toast.error("Không thể cập nhật tài khoản");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteData(`/auth/admin/users/${id}`),
    onSuccess: (res: any) => {
      if (res.err === 0) {
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        toast.success("Xóa tài khoản thành công");
      } else {
        toast.error(res.msg || "Không thể xóa tài khoản");
      }
    },
    onError: () => {
      toast.error("Không thể xóa tài khoản");
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const role = (formData.get("role") || "Member") as User["role"];

    if (!username || !email) {
      toast.error("Vui lòng nhập đầy đủ họ tên và email");
      return;
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, username, email, role });
    } else {
      setCreatedTempPassword(null);
      setCreatedEmail(null);
      createMutation.mutate({ username, email, role });
    }
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setCreatedTempPassword(null);
    setCreatedEmail(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (u: {
    id: string;
    username: string;
    email: string;
    role: User["role"];
    avatarUrl?: string | null;
  }) => {
    setEditingUser(u);
    setCreatedTempPassword(null);
    setCreatedEmail(null);
    setIsDialogOpen(true);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Card sáng, dễ đọc hơn, đồng bộ với nền trắng của dashboard */}
      <Card className="bg-white text-slate-900 border-slate-200 shadow-md">
        <CardHeader className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl md:text-2xl">
              Quản lý tài khoản
            </CardTitle>
            <CardDescription>
              Tạo, chỉnh sửa và xóa tài khoản người dùng trong hệ thống.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-blue-600 hover:bg-blue-500 text-white"
                onClick={openCreateDialog}
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm tài khoản
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Cập nhật thông tin tài khoản và vai trò."
                    : "Hệ thống sẽ tạo mật khẩu ngẫu nhiên cho tài khoản mới."}
                </DialogDescription>
              </DialogHeader>
              {/* After create: show random password clearly */}
              {!editingUser && createdTempPassword ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Tài khoản đã được tạo
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Hãy gửi thông tin này cho người dùng. Khi đăng nhập lần đầu,
                      hệ thống sẽ yêu cầu đổi mật khẩu.
                    </p>
                    <div className="mt-3 space-y-3">
                      <div className="space-y-1">
                        <Label>Email</Label>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={createdEmail || ""}
                            className="bg-white"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                              await navigator.clipboard.writeText(createdEmail || "");
                              toast.success("Đã copy email");
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Mật khẩu random</Label>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={createdTempPassword}
                            className="bg-white"
                          />
                          <Button
                            type="button"
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                            onClick={async () => {
                              await navigator.clipboard.writeText(createdTempPassword);
                              toast.success("Đã copy mật khẩu");
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setCreatedTempPassword(null);
                        setCreatedEmail(null);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      Đóng
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="username">Họ tên</Label>
                    <Input
                      id="username"
                      name="username"
                      defaultValue={editingUser?.username || ""}
                      placeholder="Nhập họ tên"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editingUser?.email || ""}
                      placeholder="Nhập email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vai trò</Label>
                    <Select
                      name="role"
                      defaultValue={editingUser?.role || "Member"}
                    >
                      <SelectTrigger className="min-w-[160px]">
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Leader">Leader</SelectItem>
                        <SelectItem value="Member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingUser(null);
                        setCreatedTempPassword(null);
                        setCreatedEmail(null);
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                      disabled={isSaving}
                    >
                      {isSaving
                        ? "Đang lưu..."
                        : editingUser
                        ? "Cập nhật"
                        : "Tạo tài khoản"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Input
              className="w-full sm:max-w-xs bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Chỉ tài khoản Admin mới có quyền quản lý người dùng.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-700 w-14">
                    Ảnh
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">
                    Họ tên
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">
                    Vai trò
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-slate-700">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      Đang tải danh sách tài khoản...
                    </td>
                  </tr>
                )}
                {!isLoading && (!data || data.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      Chưa có tài khoản nào.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  data &&
                  data.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-slate-100 hover:bg-blue-50"
                    >
                      <td className="px-4 py-2">
                        <Avatar className="size-9">
                          <AvatarImage src={u.avatarUrl || undefined} alt={u.username} />
                          <AvatarFallback className="text-xs font-semibold">
                            {userInitials(u.username)}
                          </AvatarFallback>
                        </Avatar>
                      </td>
                      <td className="px-4 py-2 text-slate-800">{u.username}</td>
                      <td className="px-4 py-2 text-slate-800">{u.email}</td>
                      <td className="px-4 py-2 text-slate-800">{u.role}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              openEditDialog({
                                id: u.id,
                                username: u.username,
                                email: u.email,
                                role: u.role,
                                avatarUrl: u.avatarUrl,
                              })
                            }
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          {user?.id !== u.id && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-red-500/60 text-red-400 hover:bg-red-500/10"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Bạn có chắc chắn muốn xóa tài khoản ${u.email}?`
                                  )
                                ) {
                                  deleteMutation.mutate(u.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountsPage;


