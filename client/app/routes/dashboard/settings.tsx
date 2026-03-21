import React from "react";
import { useAuth } from "@/provider/auth-context";
import { useChangePasswordMutation, useUpdateProfileMutation } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, User2, Bell, Settings2 } from "lucide-react";

type Preferences = {
  emailNotifications: boolean;
  taskReminders: boolean;
  weeklySummary: boolean;
};

const DEFAULT_PREFS: Preferences = {
  emailNotifications: true,
  taskReminders: true,
  weeklySummary: false,
};

function getInitials(name?: string | null) {
  const n = (name || "").trim();
  if (!n) return "U";
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
}

const SETTINGS_PREFS_KEY = "settings.preferences";

const SettingPage = () => {
  const { user, updateUser } = useAuth();

  const updateProfileMutation = useUpdateProfileMutation();
  const changePasswordMutation = useChangePasswordMutation();

  const [displayName, setDisplayName] = React.useState(user?.username || "");
  const [bio, setBio] = React.useState("");

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [prefs, setPrefs] = React.useState<Preferences>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_PREFS_KEY);
      return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  React.useEffect(() => {
    setDisplayName(user?.username || "");
  }, [user?.username]);

  const roleVariant =
    user?.role === "Admin" ? "default" : user?.role === "Leader" ? "secondary" : "outline";

  return (
    <div className="space-y-6">
      <Card className="bg-white text-slate-900 border-slate-200 shadow-md">
        <CardHeader className="space-y-1">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl md:text-2xl">Cài đặt</CardTitle>
              <CardDescription>
                Quản lý thông tin cá nhân, bảo mật và tuỳ chọn thông báo.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={roleVariant}>{user?.role || "Member"}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Avatar className="size-12">
              <AvatarImage src={user?.avatarUrl || undefined} alt={user?.username || "User"} />
              <AvatarFallback className="text-sm font-semibold">
                {getInitials(user?.username)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{user?.username || "Người dùng"}</p>
              <p className="text-sm text-slate-600 truncate">{user?.email || "—"}</p>
            </div>
          </div>

          <Separator className="bg-slate-200" />

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="w-full justify-start bg-slate-100">
              <TabsTrigger value="profile" className="gap-2">
                <User2 className="size-4" />
                Hồ sơ
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="size-4" />
                Bảo mật
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="size-4" />
                Thông báo
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-2">
                <Settings2 className="size-4" />
                Hệ thống
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
                    <CardDescription>Cập nhật tên hiển thị và giới thiệu ngắn.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Họ tên</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Nhập họ tên"
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user?.email || ""}
                        readOnly
                        className="bg-slate-50"
                      />
                      <p className="text-xs text-slate-500">
                        Email đang dùng để đăng nhập (không chỉnh sửa ở đây).
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Giới thiệu</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Ví dụ: Leader nhóm UI/UX, thích tối ưu trải nghiệm người dùng..."
                        className="bg-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDisplayName(user?.username || "");
                          setBio("");
                          toast.message("Đã hoàn tác thay đổi.");
                        }}
                      >
                        Hoàn tác
                      </Button>
                      <Button
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                        disabled={updateProfileMutation.isPending}
                        onClick={() => {
                          const username = displayName.trim();
                          if (!username) {
                            toast.error("Vui lòng nhập họ tên.");
                            return;
                          }
                          if (!user?.id) {
                            toast.error("Không tìm thấy thông tin user.");
                            return;
                          }
                          updateProfileMutation.mutate(
                            { id: user.id, username },
                            {
                              onSuccess: (res: any) => {
                                if (res?.err !== 0) {
                                  toast.error(res?.msg || "Cập nhật thất bại.");
                                  return;
                                }
                                const next = { ...(user as any), ...(res?.response || {}) };
                                updateUser(next);
                                toast.success(res?.msg || "Đã lưu thay đổi.");
                              },
                              onError: (err: any) => {
                                toast.error(err?.response?.data?.msg || "Có lỗi khi cập nhật.");
                              },
                            }
                          );
                        }}
                      >
                        {updateProfileMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Ảnh đại diện</CardTitle>
                    <CardDescription>
                      Hiện tại hệ thống đang hiển thị ảnh từ <code>avatarUrl</code>.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      Tính năng upload ảnh có thể làm sau (cần API upload + lưu URL).
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => toast.message("Chưa tích hợp upload ảnh (UI).")}
                      >
                        Tải ảnh lên
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="security" className="pt-4">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Đổi mật khẩu</CardTitle>
                  <CardDescription>
                    Dùng mật khẩu mạnh, tối thiểu 8 ký tự. (Hiện tại là UI; cần API để đổi thật.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Mật khẩu mới</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        toast.message("Đã xoá dữ liệu nhập (UI).");
                      }}
                    >
                      Xoá
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                      disabled={changePasswordMutation.isPending}
                      onClick={() => {
                        if (!newPassword || newPassword.length < 8) {
                          toast.error("Mật khẩu mới tối thiểu 8 ký tự.");
                          return;
                        }
                        if (newPassword !== confirmPassword) {
                          toast.error("Mật khẩu nhập lại không khớp.");
                          return;
                        }
                        if (!user?.id) {
                          toast.error("Không tìm thấy thông tin user.");
                          return;
                        }
                        changePasswordMutation.mutate(
                          { id: user.id, password: currentPassword, newPassword },
                          {
                            onSuccess: (res: any) => {
                              if (res?.err !== 0) {
                                toast.error(res?.msg || "Đổi mật khẩu thất bại.");
                                return;
                              }
                              setCurrentPassword("");
                              setNewPassword("");
                              setConfirmPassword("");
                              toast.success(res?.msg || "Đổi mật khẩu thành công.");
                            },
                            onError: (err: any) => {
                              toast.error(err?.response?.data?.msg || "Có lỗi khi đổi mật khẩu.");
                            },
                          }
                        );
                      }}
                    >
                      {changePasswordMutation.isPending ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="pt-4">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Tuỳ chọn thông báo</CardTitle>
                  <CardDescription>
                    Lưu tuỳ chọn ở localStorage để bạn dùng ngay, không cần backend.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
                      <Checkbox
                        checked={prefs.emailNotifications}
                        onCheckedChange={(v) =>
                          setPrefs((p) => ({ ...p, emailNotifications: Boolean(v) }))
                        }
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">Email notifications</p>
                        <p className="text-sm text-slate-600">
                          Nhận email khi có cập nhật quan trọng trong workspace/project.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
                      <Checkbox
                        checked={prefs.taskReminders}
                        onCheckedChange={(v) =>
                          setPrefs((p) => ({ ...p, taskReminders: Boolean(v) }))
                        }
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">Nhắc việc (Task reminders)</p>
                        <p className="text-sm text-slate-600">
                          Nhắc khi task gần tới hạn hoặc bị trễ hạn.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
                      <Checkbox
                        checked={prefs.weeklySummary}
                        onCheckedChange={(v) =>
                          setPrefs((p) => ({ ...p, weeklySummary: Boolean(v) }))
                        }
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">Báo cáo tuần (Weekly summary)</p>
                        <p className="text-sm text-slate-600">
                          Tổng kết tiến độ theo tuần (nếu hệ thống có job gửi mail).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPrefs(DEFAULT_PREFS);
                        localStorage.removeItem(SETTINGS_PREFS_KEY);
                        toast.message("Đã reset tuỳ chọn (UI).");
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                      onClick={() => {
                        localStorage.setItem(SETTINGS_PREFS_KEY, JSON.stringify(prefs));
                        toast.success("Đã lưu tuỳ chọn.");
                      }}
                    >
                      Lưu tuỳ chọn
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="pt-4">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Thông tin hệ thống</CardTitle>
                  <CardDescription>Thông tin nhanh để debug khi demo/đồ án.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-slate-500">User ID</p>
                      <p className="font-medium text-slate-900 break-all">{user?.id || "—"}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-slate-500">Vai trò</p>
                      <p className="font-medium text-slate-900">{user?.role || "—"}</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(JSON.stringify(user || {}, null, 2));
                          toast.success("Đã copy user JSON.");
                        } catch {
                          toast.error("Không thể copy (trình duyệt chặn).");
                        }
                      }}
                    >
                      Copy user JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingPage;