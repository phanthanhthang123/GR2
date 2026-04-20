import React, { useState } from 'react'
import type { Task } from '@/type';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, Calendar, AlertTriangle, Folder } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, differenceInDays, isPast, isToday } from "date-fns";

export const TaskCard = ({ task, onClick }: { task: Task; onClick: () => void }) => {
    // Tính toán trạng thái deadline
    const getDeadlineStatus = () => {
        if (!task.dueDate) return null;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        
        const daysDiff = differenceInDays(dueDate, today);
        
        if (isPast(dueDate) && !isToday(dueDate)) {
            return { status: 'overdue', days: Math.abs(daysDiff), label: 'Quá hạn' };
        } else if (isToday(dueDate)) {
            return { status: 'today', days: 0, label: 'Hôm nay' };
        } else if (daysDiff <= 3) {
            return { status: 'urgent', days: daysDiff, label: `Còn ${daysDiff} ngày` };
        } else {
            return { status: 'normal', days: daysDiff, label: null };
        }
    };

    const deadlineStatus = getDeadlineStatus();

    const getStatusBadgeConfig = () => {
        switch (task.status) {
            case "To Do":
                return {
                    label: "Chưa Làm",
                    className: "bg-slate-100 text-slate-700 border border-slate-200"
                };
            case "In Progress":
                return {
                    label: "Đang Làm",
                    className: "bg-blue-100 text-blue-700 border border-blue-200"
                };
            case "Done":
                return {
                    label: "Hoàn Thành",
                    className: "bg-green-100 text-green-700 border border-green-200"
                };
            default:
                return {
                    label: task.status,
                    className: "bg-muted text-foreground border border-muted-foreground/20"
                };
        }
    };

    const statusBadge = getStatusBadgeConfig();

    const getDifficultyLabel = (difficulty?: string | null) => {
        switch ((difficulty || "").toString()) {
            case "Easy":
                return "Dễ";
            case "Hard":
                return "Khó";
            case "Medium":
            default:
                return "Trung bình";
        }
    };

    return (
        <Card
            onClick={onClick}
            className='cursor-pointer hover:shadow-md transition-all duration-300 hover:translate-y-1 h-full flex flex-col'
        >
            <CardHeader className='flex-shrink-0'>
                <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-2'>
                        <Badge
                            className={
                                task.priority === "High"
                                    ? "bg-red-500 text-white"
                                    : task.priority === "Medium"
                                        ? "bg-yellow-500 text-white"
                                        : "bg-slate-500 text-white"
                            }
                        >
                            {task.priority}
                        </Badge>
                        <Badge
                            variant="outline"
                            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                        >
                            {getDifficultyLabel((task as any).difficulty)}
                        </Badge>
                        {statusBadge && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[11px] font-medium px-2 py-0.5 rounded-full",
                                    statusBadge.className
                                )}
                            >
                                {statusBadge.label}
                            </Badge>
                        )}
                    </div>

                    <div className='flex gap-1 shrink-0'>
                        {
                            task.status !== "To Do" && (
                                <Button
                                    variant={"ghost"}
                                    size={"icon"}
                                    className='size-6'
                                    onClick={() => {
                                        console.log("mark as to do")
                                    }}
                                    title='Đánh dấu là Chưa Làm'
                                >
                                    <AlertCircle className={cn("size-4")} />
                                    <span className='sr-only'>Đánh dấu là Chưa Làm</span>
                                </Button>
                            )
                        }
                        {
                            task.status !== "In Progress" && (
                                <Button
                                    variant={"ghost"}
                                    size={"icon"}
                                    className='size-6'
                                    onClick={() => {
                                        console.log("mark as In Progress")
                                    }}
                                    title='Đánh dấu là Đang Làm'
                                >
                                    <Clock className={cn("size-4")} />
                                    <span className='sr-only'>Đánh dấu là Đang Làm</span>
                                </Button>
                            )
                        }
                        {
                            task.status !== "Done" && (
                                <Button
                                    variant={"ghost"}
                                    size={"icon"}
                                    className='size-6'
                                    onClick={() => {
                                        console.log("mark as Done")
                                    }}
                                    title='Đánh dấu là Hoàn Thành'
                                >
                                    <CheckCircle className={cn("size-4")} />
                                    <span className='sr-only'>Đánh dấu là Hoàn Thành</span>
                                </Button>
                            )
                        }
                    </div>
                </div>
            </CardHeader>

            <CardContent className='flex flex-col flex-grow'>
                <div className='flex items-start justify-between mb-2'>
                    <h4 className='font-medium mt-[-20px] flex-1'>{task.title}</h4>
                    {/* Project name */}
                    {
                        task.project && typeof task.project === 'object' && task.project.name && (
                            <Badge variant="outline" className="ml-2 flex items-center gap-1 text-xs shrink-0">
                                <Folder className='size-3' />
                                <span className='truncate max-w-[100px]'>{task.project.name}</span>
                            </Badge>
                        )
                    }
                </div>
                <div className='flex-grow'>
                    {
                        task.description && (
                            <p className='text-sm text-muted-foreground line-clamp-2 mb-2 min-h-[2.5rem]'>
                                {task.description}
                            </p>
                        )
                    }
                    {/* Deadline hiển thị nổi bật - chỉ hiển thị cho task chưa hoàn thành */}
                    {
                        task.status !== "Done" && task.dueDate && deadlineStatus && (
                            <div className={cn(
                                "mb-2 px-2 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium",
                                deadlineStatus.status === 'overdue' && "bg-red-100 text-red-700 border border-red-300",
                                deadlineStatus.status === 'today' && "bg-orange-100 text-orange-700 border border-orange-300",
                                deadlineStatus.status === 'urgent' && "bg-yellow-100 text-yellow-700 border border-yellow-300",
                                deadlineStatus.status === 'normal' && "bg-blue-50 text-blue-700 border border-blue-200"
                            )}>
                                {deadlineStatus.status === 'overdue' && <AlertTriangle className='size-3.5' />}
                                {deadlineStatus.status === 'today' && <AlertCircle className='size-3.5' />}
                                {deadlineStatus.status === 'urgent' && <Clock className='size-3.5' />}
                                {deadlineStatus.status === 'normal' && <Calendar className='size-3.5' />}
                                <span className="font-semibold">Hạn chót:</span>
                                <span>{format(new Date(task.dueDate), "dd/MM/yyyy")}</span>
                                {deadlineStatus.label && (
                                    <Badge 
                                        variant="outline" 
                                        className={cn(
                                            "ml-auto text-[10px] px-1.5 py-0",
                                            deadlineStatus.status === 'overdue' && "bg-red-200 text-red-800 border-red-400",
                                            deadlineStatus.status === 'today' && "bg-orange-200 text-orange-800 border-orange-400",
                                            deadlineStatus.status === 'urgent' && "bg-yellow-200 text-yellow-800 border-yellow-400"
                                        )}
                                    >
                                        {deadlineStatus.label}
                                    </Badge>
                                )}
                            </div>
                        )
                    }
                </div>
                <div className='flex items-center justify-between text-sm mt-auto pt-2'>
                    <div className='flex items-center gap-2'>
                        {
                            (task as any).assignedUser &&
                            <div className='flex space-x-2'>
                                <Avatar
                                    key={(task as any).assignedUser.id}
                                    className='relative size-6 bg-gray-700 rounded-full border-1 border-background overflow-hidden'
                                    title={(task as any).assignedUser.username}
                                >
                                    <AvatarImage src={(task as any).assignedUser?.avatarUrl || undefined}></AvatarImage>
                                    <AvatarFallback>{(task as any).assignedUser?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>
                        }
                        {
                            Array.isArray(task.assigned_to) && task.assigned_to.length > 5 && (
                                <span className='text-xs text-muted-foreground'>
                                    + {task.assigned_to.length - 5}
                                </span>
                            )
                        }
                    </div>
                </div>
                {/* 5/10 subtask */}
                {
                    task.subtasks && task.subtasks.length > 0 && (
                        <div className='mt-2 text-xs text-muted-foreground'>
                            {task.subtasks.filter((subtask) => subtask.completed).length} / {" "}
                            {task.subtasks.length} công việc con
                        </div>
                    )
                }
            </CardContent>
        </Card>

    )
}
