import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Edit, Calendar as CalendarIcon, AlertTriangle, AlertCircle, Clock } from "lucide-react";
import { useUpdateTaskDueDateMutation } from "@/hooks/use-task";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";

export const TaskDueDate = ({ dueDate, taskId }: { dueDate: Date | string | null, taskId: string }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        dueDate ? new Date(dueDate) : undefined
    );

    // Sync state with prop when dueDate changes
    useEffect(() => {
        if (dueDate) {
            setSelectedDate(new Date(dueDate));
        } else {
            setSelectedDate(undefined);
        }
    }, [dueDate]);

    const { mutate, isPending } = useUpdateTaskDueDateMutation();

    // Tính toán trạng thái deadline
    const getDeadlineStatus = () => {
        if (!dueDate) return null;
        const dueDateObj = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDateObj.setHours(0, 0, 0, 0);
        
        const daysDiff = differenceInDays(dueDateObj, today);
        
        if (isPast(dueDateObj) && !isToday(dueDateObj)) {
            return { status: 'overdue', days: Math.abs(daysDiff), label: 'Quá hạn' };
        } else if (isToday(dueDateObj)) {
            return { status: 'today', days: 0, label: 'Hôm nay' };
        } else if (daysDiff <= 3) {
            return { status: 'urgent', days: daysDiff, label: `Còn ${daysDiff} ngày` };
        } else {
            return { status: 'normal', days: daysDiff, label: null };
        }
    };

    const deadlineStatus = getDeadlineStatus();

    const updateDueDate = () => {
        const dateToSend = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
        mutate({ taskId, dueDate: dateToSend }, {
            onSuccess: () => {
                setIsEditing(false);
            },
            onError: () => {
                // Error is already handled in the hook
            }
        });
    };

    const handleRemoveDueDate = () => {
        mutate({ taskId, dueDate: null }, {
            onSuccess: () => {
                setIsEditing(false);
                setSelectedDate(undefined);
            },
            onError: () => {
                // Error is already handled in the hook
            }
        });
    };

    if (!dueDate && !isEditing) {
        return (
            <div className="mt-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                >
                    <CalendarIcon className="size-4" />
                    Thêm hạn chót
                </Button>
            </div>
        );
    }

    return (
        <div className="mt-3">
            {isEditing ? (
                <div className="space-y-3">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Chọn ngày"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={updateDueDate}
                            disabled={isPending}
                        >
                            Lưu
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setIsEditing(false);
                                setSelectedDate(dueDate ? new Date(dueDate) : undefined);
                            }}
                            disabled={isPending}
                        >
                            Hủy
                        </Button>
                        {dueDate && (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleRemoveDueDate}
                                disabled={isPending}
                            >
                                Xóa
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <div className={cn(
                    "px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium border flex-nowrap",
                    deadlineStatus?.status === 'overdue' && "bg-red-50 text-red-700 border-red-300",
                    deadlineStatus?.status === 'today' && "bg-orange-50 text-orange-700 border-orange-300",
                    deadlineStatus?.status === 'urgent' && "bg-yellow-50 text-yellow-700 border-yellow-300",
                    deadlineStatus?.status === 'normal' && "bg-blue-50 text-blue-700 border-blue-200"
                )}>
                    {deadlineStatus?.status === 'overdue' && <AlertTriangle className='size-5 text-red-600' />}
                    {deadlineStatus?.status === 'today' && <AlertCircle className='size-5 text-orange-600' />}
                    {deadlineStatus?.status === 'urgent' && <Clock className='size-5 text-yellow-600' />}
                    {deadlineStatus?.status === 'normal' && <CalendarIcon className='size-5 text-blue-600' />}
                    <div className="flex-1 min-w-0">
                        <div className="text-base font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                            Hạn chót: {format(new Date(dueDate!), "dd/MM/yyyy")}
                        </div>
                    </div>
                    {deadlineStatus?.label && (
                        <Badge 
                            variant="outline" 
                            className={cn(
                                "text-xs px-2 py-1 font-semibold",
                                deadlineStatus.status === 'overdue' && "bg-red-100 text-red-800 border-red-400",
                                deadlineStatus.status === 'today' && "bg-orange-100 text-orange-800 border-orange-400",
                                deadlineStatus.status === 'urgent' && "bg-yellow-100 text-yellow-800 border-yellow-400"
                            )}
                        >
                            {deadlineStatus.label}
                        </Badge>
                    )}
                    <Edit 
                        className="size-4 cursor-pointer text-muted-foreground hover:text-foreground transition-colors" 
                        onClick={() => setIsEditing(true)} 
                    />
                </div>
            )}
        </div>
    );
};

