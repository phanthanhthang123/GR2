import React, { useMemo, useState } from 'react'
import { useQuery } from "@tanstack/react-query"
import { fetchData } from "@/lib/fetch-utlis"
import { Loader } from "../../components/loader";
import type { Task, Project } from "@/type";
import { TaskCard } from "../../components/task/task-card";
import { useSearchParams, useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Folder, ChevronDown, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const TASKS_PER_PAGE = 3; // Maximum 3 tasks per page per project

const MyTasks = () => {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');
  const navigate = useNavigate();
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [projectPages, setProjectPages] = useState<Record<string, number>>({});
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  const { data, isPending, error } = useQuery({
    queryKey: ["my-tasks", workspaceId],
    queryFn: async () => {
      try {
        const response = await fetchData(`/task/my-tasks?workspaceId=${workspaceId}`);
        // Check if response has error
        if (response?.err === 1 || response?.err === -1) {
          const errorMsg = response?.msg || 'Failed to fetch tasks';
          console.error("API returned error:", response);
          throw new Error(errorMsg);
        }
        // Ensure response has the expected structure
        if (!response || typeof response !== 'object') {
          throw new Error('Invalid response format from server');
        }
        return response;
      } catch (err: any) {
        console.error("Error fetching tasks:", err);
        // Extract error message from response if available
        let errorMsg = 'Không thể tải tasks';
        if (err?.response?.data?.msg) {
          errorMsg = err.response.data.msg;
        } else if (err?.message) {
          errorMsg = err.message;
        }
        const errorObj = new Error(errorMsg);
        // Preserve original error for debugging
        (errorObj as any).originalError = err;
        (errorObj as any).response = err?.response;
        throw errorObj;
      }
    },
    enabled: !!workspaceId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  }) as {
    data: {
      response: Task[];
    };
    isPending: boolean;
    error: any;
  };

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!data?.response) return [];
    
    if (!taskSearchQuery.trim()) {
      return data.response;
    }
    
    const query = taskSearchQuery.toLowerCase();
    return data.response.filter((task: Task) => {
      const title = (task.title || "").toLowerCase();
      const description = (task.description || "").toLowerCase();
      return title.includes(query) || description.includes(query);
    });
  }, [data?.response, taskSearchQuery]);

  // Group tasks by project
  const tasksByProject = useMemo(() => {
    if (!filteredTasks || filteredTasks.length === 0) return {};
    
    const grouped: Record<string, { project: Project | null; tasks: Task[] }> = {};
    
    filteredTasks.forEach((task: Task) => {
      const project = typeof task.project === 'object' ? task.project : null;
      const projectId = project?.id || 'unknown';
      const projectName = project?.name || 'Không xác định';
      
      if (!grouped[projectId]) {
        grouped[projectId] = {
          project: project,
          tasks: []
        };
      }
      
      grouped[projectId].tasks.push(task);
    });
    
    return grouped;
  }, [filteredTasks]);

  // Initialize all projects as expanded by default and set initial page to 1
  React.useEffect(() => {
    if (filteredTasks && Object.keys(tasksByProject).length > 0) {
      const initialExpanded: Record<string, boolean> = {};
      const initialPages: Record<string, number> = {};
      Object.keys(tasksByProject).forEach((projectId) => {
        initialExpanded[projectId] = true; // Default to expanded
        initialPages[projectId] = 1; // Default to page 1
      });
      setExpandedProjects(initialExpanded);
      setProjectPages(initialPages);
    }
  }, [filteredTasks, tasksByProject]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const setProjectPage = (projectId: string, page: number) => {
    setProjectPages(prev => ({
      ...prev,
      [projectId]: page
    }));
  };

  if (isPending) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Task Của Tôi</h1>
        <Loader />
      </div>
    )
  }

  if (error) {
    const errorMessage = error?.message || error?.response?.data?.msg || 'Không thể tải tasks';
    const errorDetails = error?.response?.data || error?.originalError?.response?.data || {};
    
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Task Của Tôi</h1>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive font-medium">Lỗi khi tải tasks</p>
          <p className="text-xs text-muted-foreground mt-1">{errorMessage}</p>
          {!workspaceId && (
            <p className="text-xs text-muted-foreground mt-2">
              Vui lòng chọn workspace để xem tasks của bạn.
            </p>
          )}
          {Object.keys(errorDetails).length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer">Chi tiết lỗi</summary>
              <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-40">
                {JSON.stringify(errorDetails, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }

  const tasks = data?.response || [];
  const projectEntries = Object.entries(tasksByProject);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Task Của Tôi</h1>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Bạn chưa có task nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className='p-4 bg-muted/30 rounded-lg border'>
            <div className='relative'>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm task..."
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {projectEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {taskSearchQuery ? "Không tìm thấy task nào phù hợp" : "Bạn chưa có task nào"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
          {projectEntries.map(([projectId, { project, tasks: projectTasks }]) => {
            const projectName = project?.name || 'Không xác định';
            const projectIdForNav = project?.id || projectId;
            const isExpanded = expandedProjects[projectId] !== false; // Default to true
            const currentPage = projectPages[projectId] || 1;
            
            // Pagination for this project
            const totalPages = Math.ceil(projectTasks.length / TASKS_PER_PAGE);
            const startIndex = (currentPage - 1) * TASKS_PER_PAGE;
            const endIndex = startIndex + TASKS_PER_PAGE;
            const paginatedTasks = projectTasks.slice(startIndex, endIndex);
            
            return (
              <div key={projectId} className="border rounded-lg overflow-hidden">
                {/* Project Header - Clickable */}
                <div 
                  className="flex items-center gap-2 px-4 py-3 bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                  onClick={() => toggleProject(projectId)}
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                  <Folder className="size-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold flex-1">{projectName}</h2>
                  <Badge variant="outline" className="ml-auto">
                    {projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'}
                  </Badge>
                </div>
                
                {/* Tasks Grid - Collapsible */}
                {isExpanded && (
                  <div className="p-4 pt-3 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                      {paginatedTasks.map((task: Task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={() => {
                            if (workspaceId && projectIdForNav !== 'unknown') {
                              navigate(`/workspaces/${workspaceId}/projects/${projectIdForNav}/tasks/${task.id}`);
                            }
                          }}
                        />
                      ))}
                    </div>

                    {/* Pagination for this project */}
                    {projectTasks.length > 0 && (
                      <div className="flex flex-col items-center gap-3 pt-2 border-t">
                        <Pagination>
                          <PaginationContent className="gap-2">
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation(); // Prevent header toggle
                                  if (currentPage > 1) {
                                    setProjectPage(projectId, currentPage - 1);
                                  }
                                }}
                                className={cn(
                                  "min-w-[100px]",
                                  currentPage === 1 
                                    ? "pointer-events-none opacity-50 cursor-not-allowed" 
                                    : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                )}
                              />
                            </PaginationItem>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              ) {
                                return (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation(); // Prevent header toggle
                                        setProjectPage(projectId, page);
                                      }}
                                      isActive={currentPage === page}
                                      className={cn(
                                        "min-w-[40px] h-10 flex items-center justify-center",
                                        currentPage === page 
                                          ? "bg-primary text-primary-foreground font-semibold" 
                                          : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                      )}
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              } else if (page === currentPage - 2 || page === currentPage + 2) {
                                return (
                                  <PaginationItem key={page}>
                                    <span className="px-2 py-2 text-muted-foreground">...</span>
                                  </PaginationItem>
                                );
                              }
                              return null;
                            })}
                            
                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation(); // Prevent header toggle
                                  if (currentPage < totalPages) {
                                    setProjectPage(projectId, currentPage + 1);
                                  }
                                }}
                                className={cn(
                                  "min-w-[100px]",
                                  currentPage === totalPages 
                                    ? "pointer-events-none opacity-50 cursor-not-allowed" 
                                    : "hover:bg-accent hover:text-accent-foreground transition-colors"
                                )}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                        
                        {/* Results info */}
                        <div className="text-xs text-muted-foreground">
                          Trang {currentPage} / {totalPages} • Hiển thị {startIndex + 1}-{Math.min(endIndex, projectTasks.length)} trong tổng số {projectTasks.length} task
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MyTasks