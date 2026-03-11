import React, { useState, useMemo } from "react";
import { NoDataFound } from "./no-data-found";
import ProjectCard from "../project/project-card";
import { getProjectProgress } from "@/lib";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 6; // 3 columns x 2 rows

const ProjectList = (props: {
  workspaceId: string;
  projects: any[];
  isOpen: boolean;
  onCreateProject: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return props.projects || [];
    }
    const query = searchQuery.toLowerCase();
    return (props.projects || []).filter((project) => {
      const name = (project.name || "").toLowerCase();
      const description = (project.description || "").toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [props.projects, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Dự Án</h3>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            type="text"
            placeholder="Tìm kiếm dự án..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <NoDataFound
          title={searchQuery ? "Không tìm thấy dự án phù hợp" : "Không tìm thấy dự án"}
          description={searchQuery ? "Thử tìm kiếm với từ khóa khác" : "Tạo một dự án mới để bắt đầu"}
          buttonText="Tạo Dự Án"
          buttonAction={props.onCreateProject}
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {paginatedProjects.map((project) => {
              // Calculate progress from tasks if available
              const tasks = project.tasks || [];
              const projectProgess = tasks.length > 0 
                ? getProjectProgress(tasks) 
                : (project.progress || 0);
              
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  progess={projectProgess}
                  workspaceId={props.workspaceId}
                />
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <Pagination>
                <PaginationContent className="gap-2">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
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
                    // Show first page, last page, current page, and pages around current
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
                              setCurrentPage(page);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
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
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
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
              <div className="text-sm text-muted-foreground">
                Trang {currentPage} / {totalPages} • Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredProjects.length)} trong tổng số {filteredProjects.length} dự án
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
};

export default ProjectList;
