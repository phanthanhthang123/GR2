import React from "react";
import { useAuth } from "@/provider/auth-context";
import {
  useChangePasswordMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
} from "@/hooks/use-auth";
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
import { queryClient } from "@/provider/react-query-provider";

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
  const uploadAvatarMutation = useUploadAvatarMutation();
  const deleteAvatarMutation = useDeleteAvatarMutation();

  const avatarFileInputRef = React.useRef<HTMLInputElement>(null);

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
    <div className="h-full overflow-hidden">
      <Card className="h-full bg-white text-slate-900 border-slate-200 shadow-md overflow-hidden">
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

        <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 pb-3 pt-0 sm:px-6">
          <div className="flex shrink-0 flex-col gap-3 md:flex-row md:items-center">
            <Avatar className="size-12 shrink-0 cursor-pointer" onClick={() => avatarFileInputRef.current?.click()}>
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

          <Separator className="shrink-0 bg-slate-200" />

          <Tabs defaultValue="profile" className="flex min-h-0 w-full flex-1 flex-col gap-0 overflow-hidden">
            <TabsList className="h-9 w-full shrink-0 justify-start bg-slate-100">
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

            <TabsContent
              value="profile"
              className="mt-0 min-h-0 flex-1 overflow-hidden pt-3 outline-none"
            >
              <div className="grid h-full min-h-0 grid-cols-1 items-stretch gap-3 lg:grid-cols-2 lg:gap-3">
                <Card className="flex min-h-0 flex-col gap-0 overflow-hidden border-slate-200 py-0 shadow-sm">
                  <CardHeader className="shrink-0 space-y-1 px-4 py-3 sm:px-5">
                    <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Cập nhật tên hiển thị và giới thiệu ngắn.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex min-h-0 flex-1 flex-col space-y-3 overflow-hidden px-4 pb-3 sm:px-5">
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
                        placeholder="Ví dụ: Leader nhóm UI/UX..."
                        rows={2}
                        className="h-[3rem] min-h-[3rem] resize-none bg-white text-sm leading-snug"
                      />
                    </div>
                    <div className="flex shrink-0 justify-end gap-2 pt-1">
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

                <Card className="flex min-h-0 flex-col gap-0 overflow-hidden border-slate-200 py-0 shadow-sm">
                  <CardHeader className="shrink-0 space-y-1 px-4 py-3 sm:px-5">
                    <CardTitle className="text-base">Ảnh đại diện</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      JPEG, PNG, GIF hoặc WebP, tối đa 5MB (Cloudinary).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex min-h-0 flex-1 flex-col space-y-3 overflow-hidden px-4 pb-3 sm:px-5">
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        if (!user?.id) {
                          toast.error("Không tìm thấy thông tin user.");
                          return;
                        }
                        uploadAvatarMutation.mutate(file, {
                          onSuccess: (res: any) => {
                            if (res?.err !== 0) {
                              toast.error(res?.msg || "Upload thất bại.");
                              return;
                            }
                                const next = { ...(user as any), ...(res?.response || {}) };
                                updateUser(next);
                                queryClient.invalidateQueries();
                                toast.success(res?.msg || "Đã cập nhật ảnh đại diện.");
                          },
                          onError: (err: any) => {
                            toast.error(err?.response?.data?.msg || "Có lỗi khi upload ảnh.");
                          },
                        });
                      }}
                    />
                    <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-snug text-slate-700 sm:text-sm">
                      Ảnh hiển thị trên toàn hệ thống (header, chat, workspace/project). F5 để đồng bộ nếu cần.
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        variant="outline"
                        disabled={uploadAvatarMutation.isPending || !user?.avatarUrl}
                        onClick={() => {
                          if (!user?.id) {
                            toast.error("Không tìm thấy thông tin user.");
                            return;
                          }
                          deleteAvatarMutation.mutate(undefined, {
                            onSuccess: (res: any) => {
                              if (res?.err !== 0) {
                                toast.error(res?.msg || "Xóa ảnh thất bại.");
                                return;
                              }
                              const next = { ...(user as any), ...(res?.response || {}) };
                              updateUser(next);
                              queryClient.invalidateQueries();
                              toast.success(res?.msg || "Đã xóa ảnh đại diện.");
                            },
                            onError: (err: any) => {
                              toast.error(err?.response?.data?.msg || "Có lỗi khi xóa ảnh.");
                            },
                          });
                        }}
                      >
                        {deleteAvatarMutation.isPending ? "Đang xóa..." : "Xóa ảnh"}
                      </Button>
                      <Button
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                        disabled={uploadAvatarMutation.isPending}
                        onClick={() => avatarFileInputRef.current?.click()}
                      >
                        {uploadAvatarMutation.isPending ? "Đang tải lên..." : "Tải ảnh lên"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent
              value="security"
              className="mt-0 min-h-0 flex-1 overflow-hidden pt-3 outline-none"
            >
              <Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden border-slate-200 py-0 shadow-sm">
                <CardHeader className="shrink-0 space-y-1 px-4 py-3 sm:px-5">
                  <CardTitle className="text-base">Đổi mật khẩu</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Mật khẩu mạnh, tối thiểu 8 ký tự.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col space-y-3 overflow-hidden px-4 pb-3 sm:px-5">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-3">
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

                  <div className="flex shrink-0 justify-end gap-2 pt-1">
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

            <TabsContent
              value="notifications"
              className="mt-0 min-h-0 flex-1 overflow-hidden pt-3 outline-none"
            >
              <Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden border-slate-200 py-0 shadow-sm">
                <CardHeader className="shrink-0 space-y-1 px-4 py-3 sm:px-5">
                  <CardTitle className="text-base">Tuỳ chọn thông báo</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Lưu ở localStorage, không cần backend.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col space-y-2 overflow-hidden px-4 pb-3 sm:px-5">
                  <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                    <div className="flex shrink-0 items-start gap-2 rounded-lg border border-slate-200 p-3">
                      <Checkbox
                        checked={prefs.emailNotifications}
                        onCheckedChange={(v) =>
                          setPrefs((p) => ({ ...p, emailNotifications: Boolean(v) }))
                        }
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">Email notifications</p>
                        <p className="text-xs text-slate-600 sm:text-sm">
                          Nhận email khi có cập nhật quan trọng trong workspace/project.
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-start gap-2 rounded-lg border border-slate-200 p-3">
                      <Checkbox
                        checked={prefs.taskReminders}
                        onCheckedChange={(v) =>
                          setPrefs((p) => ({ ...p, taskReminders: Boolean(v) }))
                        }
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">Nhắc việc (Task reminders)</p>
                        <p className="text-xs text-slate-600 sm:text-sm">
                          Nhắc khi task gần tới hạn hoặc bị trễ hạn.
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-start gap-2 rounded-lg border border-slate-200 p-3">
                      <Checkbox
                        checked={prefs.weeklySummary}
                        onCheckedChange={(v) =>
                          setPrefs((p) => ({ ...p, weeklySummary: Boolean(v) }))
                        }
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">Báo cáo tuần (Weekly summary)</p>
                        <p className="text-xs text-slate-600 sm:text-sm">
                          Tổng kết tiến độ theo tuần (nếu hệ thống có job gửi mail).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 justify-end gap-2 pt-1">
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

            <TabsContent
              value="system"
              className="mt-0 min-h-0 flex-1 overflow-hidden pt-3 outline-none"
            >
              <Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden border-slate-200 py-0 shadow-sm">
                <CardHeader className="shrink-0 space-y-1 px-4 py-3 sm:px-5">
                  <CardTitle className="text-base">Thông tin hệ thống</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Debug nhanh khi demo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col space-y-2 overflow-hidden px-4 pb-3 text-sm sm:px-5">
                  <div className="grid shrink-0 grid-cols-1 gap-2 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">User ID</p>
                      <p className="font-medium break-all text-slate-900">{user?.id || "—"}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Vai trò</p>
                      <p className="font-medium text-slate-900">{user?.role || "—"}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 justify-end">
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