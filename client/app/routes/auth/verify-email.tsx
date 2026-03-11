import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, MailCheck } from "lucide-react";

const VerifyEmail = () => {
  return (
    <div className="w-full">
      <Card className="w-full max-w-md mx-auto bg-slate-900/80 border-slate-800 text-slate-50 shadow-xl">
        <CardHeader className="flex flex-col items-center gap-2 text-center">
          <MailCheck className="w-10 h-10 text-blue-400" />
          <h1 className="text-xl font-semibold">Xác thực email</h1>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-slate-300">
            Vui lòng kiểm tra hộp thư của bạn để xác nhận địa chỉ email trước
            khi đăng nhập hệ thống.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Nếu không thấy email, hãy kiểm tra thêm thư mục Spam / Quảng cáo.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;