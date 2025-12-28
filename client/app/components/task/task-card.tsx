import React, { useState } from 'react'
import type { Task } from '@/type';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from "date-fns";

export const TaskCard = ({ task, onClick }: { task: Task; onClick: () => void }) => {
    return (
        <Card
            onClick={onClick}
            className='cursor-pointer hover:shadow-md transition-all duration-300 hover:translate-y-1'
        >
            <CardHeader>
                <div className='flex items-center justify-between'>
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

                    <div className='flex gap-1'>
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

            <CardContent>
                <h4 className='font-medium mt-[-20px]'>{task.title}</h4>
                {
                    task.description && (
                        <p className='text-sm text-muted-foreground line-clamp-2 mb-2'>
                            {task.description}
                        </p>
                    )
                }
                <div className='flex items-center justify-between text-sm'>
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

                    {
                        task.dueDate && (
                            <div className='text-xs text-muted-foreground flex items-center'>
                                <Calendar className='size-3 mr-1' />
                                {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </div>
                        )}
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
