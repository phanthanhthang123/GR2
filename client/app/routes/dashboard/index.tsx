import React from 'react'
import { useNavigate, useSearchParams } from 'react-router';
import { useGetWorkspaceStatsQuery } from '@/hooks/use-workspace';
import { Loader } from '@/components/loader';
import { NoDataFound } from '@/components/workspace/no-data-found';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatisticsCharts } from '@/components/dashboard/statistics-charts';

const DashBoard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const savedWorkspaceId =
    typeof window !== "undefined" ? localStorage.getItem("selectedWorkspaceId") || "" : "";
  const workspaceId = searchParams.get('workspaceId') || savedWorkspaceId;

  const { data, isLoading } = useGetWorkspaceStatsQuery(workspaceId);

  if (!workspaceId) {
    return (
      <NoDataFound
        title="Chưa chọn không gian làm việc"
        description="Hãy chọn một workspace ở thanh trên để xem thống kê."
        buttonText="Đi tới không gian làm việc"
        buttonAction={() => navigate("/workspaces")}
      />
    );
  }

  if (isLoading) {
    return <Loader />
  }
  // Type assertion for workspace stats response
  type WorkspaceStatsData = {
    stats?: any;
    taskTrendsData?: any[];
    projectStatusData?: any[];
    taskPriorityData?: any[];
    workspaceProductivityData?: any[];
    upcomingTasks?: any[];
    recentTasks?: any[];
    recentProjects?: any[];
  };
  
  const statsData = (data as WorkspaceStatsData | undefined);
  
  return (
    <div className='space-y-8 2xl:space-y-12'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl md:text-4xl font-bold'>Bảng Điều Khiển</h1>
      </div>

      <StatCard data={statsData?.stats}/>

      {/* TODO: Import and add StatisticsCharts component */}
      {statsData && (
        <StatisticsCharts
          stats={statsData?.stats}
          taskTrendsData={statsData?.taskTrendsData}
          projectStatusData={statsData?.projectStatusData}
          taskPriorityData={statsData?.taskPriorityData}
          workspaceProductivityData={statsData?.workspaceProductivityData}
        />
      )}
    </div>
  )
}

export default DashBoard