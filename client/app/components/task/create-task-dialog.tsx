import type { ProjectMemberRole, TaskStatus } from "@/type";
import type { User } from "@/type";
import { CreateTaskSchema } from "@/lib/schema";
import type z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UseCreateTaskMutation } from "@/hooks/use-task";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { Checkbox } from "../ui/checkbox";
import { queryClient } from "@/provider/react-query-provider";

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    projectMembers: { user: User | string; role: ProjectMemberRole }[];
}

export type CreateTaskDialogFormData = z.infer<typeof CreateTaskSchema>;

export const CreateTaskDialog = ({
    open,
    onOpenChange,
    projectId,
    projectMembers,
}: CreateTaskDialogProps) => {
    const form = useForm<CreateTaskDialogFormData>({
        resolver: zodResolver(CreateTaskSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            status: "To Do" as unknown as TaskStatus,
            priority: "Medium",
            dueDate: "",
            assignees: [],
        },
    });

    const { mutate, isPending } = UseCreateTaskMutation();

    const onSubmit = (data: CreateTaskDialogFormData) => {
        console.log("data Task", data);
        mutate({projectId, taskData: data}, 
        {
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
                queryClient.invalidateQueries({ queryKey: ["project", projectId] });
            },
            onError: (error: any) => {
                const errorMessage = (error as any)?.response?.data?.msg || "Không thể tạo task";
                toast.error(errorMessage);
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tạo Task Mới</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="gird gap-2 lg:gap-4 py-4">
                            <div className="grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tiêu đề</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Nhập tiêu đề task" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mô tả</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder="Nhập mô tả task" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid gap-2 md:grid-cols-2 lg:gap-4">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Trạng thái</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Chọn trạng thái" />
                                                        </SelectTrigger>
                                                    </FormControl>

                                                    <SelectContent>
                                                        <SelectItem value="To Do">Chưa làm</SelectItem>
                                                        <SelectItem value="In Progress">Đang làm</SelectItem>
                                                        <SelectItem value="Done">Hoàn thành</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="priority"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Độ ưu tiên</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Chọn độ ưu tiên" />
                                                        </SelectTrigger>
                                                    </FormControl>

                                                    <SelectContent>
                                                        <SelectItem value="Low">Thấp</SelectItem>
                                                        <SelectItem value="Medium">Trung bình</SelectItem>
                                                        <SelectItem value="High">Cao</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                </div>

                                <FormField
                                    control={form.control}
                                    name="dueDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ngày hết hạn</FormLabel>
                                            <FormControl>
                                                <Popover modal={true}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={"w-full justify-start text-left font-normal" +
                                                                (!field.value ? "text-muted-foreground" : "")
                                                            }
                                                        >
                                                            <CalendarIcon className="mr-2 size-4" />
                                                            {field.value ?
                                                                format(new Date(field.value), "PPP"
                                                                ) : (
                                                                    <span>Chọn ngày</span>)
                                                            }

                                                        </Button>
                                                    </PopoverTrigger>

                                                    <PopoverContent>
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value) : undefined}
                                                            onSelect={(date) => {
                                                                field.onChange(date ? date.toISOString() : "");
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="assignees"
                                    render={({ field }) => {
                                        const selectedMembers = field.value || [];
                                        console.log("selectedMembers", selectedMembers);
                                        console.log("projectMembers", projectMembers);
                                        
                                        // Helper function to get user ID from member.user (can be User object or string)
                                        const getUserId = (user: User | string): string => {
                                            return typeof user === 'string' ? user : user.id;
                                        };
                                        
                                        // Helper function to get user object from member.user
                                        const getUserObject = (user: User | string): User | null => {
                                            return typeof user === 'object' ? user : null;
                                        };
                                        
                                        return (
                                            <FormItem>
                                                <FormLabel>Người được giao</FormLabel>
                                                <FormControl>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                className="w-full justify-start text-left font-normal min-h-11"
                                                            >
                                                                {
                                                                    selectedMembers.length === 0 ? (
                                                                        <span className="text-muted-foreground">Chọn người được giao</span>
                                                                    ) : selectedMembers.length <= 2 ? (
                                                                        selectedMembers.map((m) => {
                                                                            const member = projectMembers.find(
                                                                                (wm) => getUserId(wm.user) === m
                                                                            );
                                                                            const userObj = member ? getUserObject(member.user) : null;
                                                                            return userObj ? userObj.username : m;
                                                                        }).join(", ")
                                                                    ) : (
                                                                        `${selectedMembers.length} người được chọn`
                                                                    )
                                                                }
                                                            </Button>
                                                        </PopoverTrigger>

                                                        <PopoverContent
                                                            className="w-sm max-h-60 overflow-y-auto p-2"
                                                            align="start">
                                                            <div className="space-y-2">
                                                                {
                                                                    projectMembers.map((member) => {
                                                                        const userId = getUserId(member.user);
                                                                        const userObj = getUserObject(member.user);
                                                                        const selectedMember = selectedMembers.find(
                                                                            (m) => m === userId
                                                                        )

                                                                        return (
                                                                            <div
                                                                                key={userId}
                                                                                className="flex items-center gap-2 p-2 border rounded-md"
                                                                            >
                                                                                <Checkbox
                                                                                    checked={!!selectedMember}
                                                                                    onCheckedChange={(checked) => {
                                                                                        if (checked) {
                                                                                            field.onChange([...selectedMembers, userId]);
                                                                                        } else {
                                                                                            field.onChange(
                                                                                                selectedMembers.filter(
                                                                                                    (m) => m !== userId)
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                    id={`member-${userId}`}
                                                                                />
                                                                                <span className="flex-1 truncate">
                                                                                    {userObj ? userObj.username : userId}
                                                                                </span>
                                                                            </div>
                                                                        )
                                                                    })
                                                                }
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </FormControl>
                                            </FormItem>
                                        )
                                    }}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isPending} onClick={() => form.handleSubmit(onSubmit)}>
                                {isPending ? "Đang tạo..." : "Tạo Task"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>

            </DialogContent>
        </Dialog>
    )
}