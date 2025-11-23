import { ProjectSchema, ProjectStatus } from "@/lib/schema";
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type z from "zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
  DialogHeader,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UseCreateProject } from "@/hooks/use-project";

export type CreateProjectFormData = z.infer<typeof ProjectSchema>;

export const CreateProjectDiaLog = ({
  isOpen,
  onOpenChange,
  workspaceId,
  workspaceMembers,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceMembers: any[];
}) => {
  const { mutate: createProject, isPending } = UseCreateProject();
  
  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: ProjectStatus.PENDING,
      startDate: "",
      dueDate: "",
      members: [],
      tags: undefined,
    },
  });

  const onSubmit = (data: CreateProjectFormData) => {
    createProject({ workspaceId, projectData: data },{
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      },
      onError: (error: any) => {
        const errorMessage = (error as any)?.response?.data?.message || "Failed to create project";
        toast.error(errorMessage);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Create a new project in this workspace.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Project Title" {...field} />
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
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Project Description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Status</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Project Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ProjectStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="Tags separated by comma" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="members"
              render={({ field }) => {
                const selectedMembers = field.value || [];

                const getMemberDisplay = () => {
                  if (selectedMembers.length === 0) {
                    return <span className="text-muted-foreground">Select Members</span>;
                  }
                  
                  if (selectedMembers.length <= 2) {
                    return selectedMembers.map((member) => {
                      const workspaceMember = workspaceMembers.find(
                        (m) => m.user.id === member.user
                      );
                      return workspaceMember
                        ? `${workspaceMember.user.username}`
                        : "";
                    }).filter(Boolean).join(", ");
                  }
                  
                  return `${selectedMembers.length} members selected`;
                };

                const toggleMember = (userId: string, role: "Leader" | "member") => {
                  const currentMembers = field.value || [];
                  const memberIndex = currentMembers.findIndex((m) => m.user === userId);
                  
                  let newMembers;
                  if (memberIndex >= 0) {
                    // Remove member if already selected
                    newMembers = currentMembers.filter((m) => m.user !== userId);
                  } else {
                    // Add member
                    newMembers = [...currentMembers, { user: userId, role }];
                  }
                  
                  field.onChange(newMembers);
                };

                const updateMemberRole = (userId: string, role: "Leader" | "member") => {
                  const currentMembers = field.value || [];
                  const newMembers = currentMembers.map((m) =>
                    m.user === userId ? { ...m, role } : m
                  );
                  field.onChange(newMembers);
                };

                const isMemberSelected = (userId: string) => {
                  return selectedMembers.some((m) => m.user === userId);
                };

                const getSelectedRole = (userId: string): "Leader" | "member" => {
                  const member = selectedMembers.find((m) => m.user === userId);
                  if (member) {
                    return member.role as unknown as "Leader" | "member";
                  }
                  // Default role from workspace member or "member"
                  const workspaceMember = workspaceMembers.find((m) => m.user.id === userId);
                  return (workspaceMember?.role as "Leader" | "member") || "member";
                };

                return (
                  <FormItem>
                    <FormLabel>Members</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal min-h-11"
                          >
                            {getMemberDisplay()}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div className="p-2 max-h-60 overflow-y-auto">
                            {workspaceMembers.length === 0 ? (
                              <div className="text-sm text-muted-foreground p-2">
                                No members available
                              </div>
                            ) : (
                              workspaceMembers.map((workspaceMember) => {
                                const isSelected = isMemberSelected(workspaceMember.user.id);
                                const selectedRole = getSelectedRole(workspaceMember.user.id);
                                
                                return (
                                  <div
                                    key={workspaceMember.user.id}
                                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {
                                        if (isSelected) {
                                          toggleMember(
                                            workspaceMember.user.id,
                                            workspaceMember.role as "Leader" | "member"
                                          );
                                        } else {
                                          toggleMember(
                                            workspaceMember.user.id,
                                            workspaceMember.role as "Leader" | "member"
                                          );
                                        }
                                      }}
                                      className="mr-2"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="text-sm flex-1 truncate">
                                      {workspaceMember.user.username}
                                    </span>
                                    {isSelected && (
                                      <Select
                                        value={selectedRole}
                                        onValueChange={(value: "Leader" | "member") => {
                                          updateMemberRole(workspaceMember.user.id, value);
                                        }}
                                      >
                                        <SelectTrigger
                                          className="w-[140px] h-8"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Leader">Leader</SelectItem>
                                          <SelectItem value="member">Member</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <DialogFooter>
              <Button
               variant="default" 
               type="submit" 
               disabled={isPending}
               onClick={() => form.handleSubmit(onSubmit)}
               >{isPending ? "Creating..." : "Create Project"}</Button>
              <Button
               type="button" variant="outline"
               onClick={() => onOpenChange(false)}
               disabled={isPending}
               >{isPending ? "Cancelling..." : "Cancel"}</Button>

            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
