import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ChartLine, ChartPie, BarChart3 } from "lucide-react";
import { ChartContainer } from "../ui/chart";
import { CartesianGrid, LineChart, XAxis, YAxis, Line, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from "recharts";


export const StatisticsCharts = ({
    stats,
    taskTrendsData,
    projectStatusData,
    taskPriorityData,
    workspaceProductivityData,
}: {
    stats: any;
    taskTrendsData: any;
    projectStatusData: any;
    taskPriorityData: any;
    workspaceProductivityData: any;
}) => {
    console.log("taskTrendsData", taskTrendsData);
    console.log("projectStatusData", projectStatusData);

    // Transform data to format date and add day name
    const transformedData = taskTrendsData?.map((item: any) => {
        const date = new Date(item.date);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return {
            ...item,
            name: dayNames[date.getDay()], // Convert date to day name (Sun, Mon, etc.)
            date: item.date
        };
    }) || [];

    // Transform projectStatusData to match PieChart format
    // Map status display names: "Pending" -> "Planning"
    const statusDisplayMap: { [key: string]: string } = {
        'Pending': 'Lên Kế Hoạch',
        'In Progress': 'Đang Thực Hiện',
        'Completed': 'Hoàn Thành'
    };
    
    const statusColorMap: { [key: string]: string } = {
        'Pending': '#f59e0b',      // amber-500 (orange)
        'In Progress': '#3b82f6',  // blue-500
        'Completed': '#10b981',     // green-500
    };

    // Ensure all statuses are included even if backend doesn't send them
    const defaultStatuses = ['Pending', 'In Progress', 'Completed'];
    const statusDataMap = new Map();
    
    // Process data from backend
    projectStatusData?.forEach((item: any) => {
        const status = item.status || item.name;
        statusDataMap.set(status, {
            name: statusDisplayMap[status] || status,
            value: item.count || item.value || 0,
            color: item.color || statusColorMap[status] || '#888888'
        });
    });
    
    // Ensure all default statuses are present
    defaultStatuses.forEach(status => {
        if (!statusDataMap.has(status)) {
            statusDataMap.set(status, {
                name: statusDisplayMap[status],
                value: 0,
                color: statusColorMap[status] || '#888888'
            });
        }
    });
    
    // Convert map to array and maintain order: Planning, In Progress, Completed
    const transformedProjectStatusData = defaultStatuses.map(status => statusDataMap.get(status)).filter(Boolean);

    // Transform taskPriorityData to match PieChart format
    const priorityColorMap: { [key: string]: string } = {
        'High': '#ef4444',      // red-500
        'Medium': '#f59e0b',    // amber-500 (orange)
        'Low': '#6b7280',       // gray-500 (dark grey)
    };
    
    const priorityDisplayMap: { [key: string]: string } = {
        'High': 'Cao',
        'Medium': 'Trung Bình',
        'Low': 'Thấp'
    };

    const defaultPriorities = ['High', 'Medium', 'Low'];
    const priorityDataMap = new Map();
    
    // Process data from backend
    taskPriorityData?.forEach((item: any) => {
        const priority = item.priority || item.name;
        priorityDataMap.set(priority, {
            name: priorityDisplayMap[priority] || priority,
            value: item.count || item.value || 0,
            color: item.color || priorityColorMap[priority] || '#888888'
        });
    });
    
    // Ensure all default priorities are present
    defaultPriorities.forEach(priority => {
        if (!priorityDataMap.has(priority)) {
            priorityDataMap.set(priority, {
                name: priorityDisplayMap[priority] || priority,
                value: 0,
                color: priorityColorMap[priority] || '#888888'
            });
        }
    });
    
    // Convert map to array and maintain order: High, Medium, Low
    const transformedTaskPriorityData = defaultPriorities.map(priority => priorityDataMap.get(priority)).filter(Boolean);
    console.log("workspaceProductivityData",workspaceProductivityData)
    // Transform workspaceProductivityData for BarChart
    const transformedWorkspaceProductivityData = workspaceProductivityData?.map((item: any) => ({
        name: item.projectName || item.name || item.week || 'Unknown',
        completed: item.completed || 0,
        total: item.total || 0
    })) || [];
    
    console.log("transformedWorkspaceProductivityData", transformedWorkspaceProductivityData);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-0.5 ">
                        <CardTitle className="text-base font-medium">Xu Hướng Task</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Thay đổi trạng thái task theo ngày
                        </CardDescription>
                    </div>
                    <ChartLine className="size-5 text-muted-foreground" />
                </CardHeader>

                <CardContent className="w-full overflow-x-auto md:overflow-x-hidden">
                    <div className="min-w-[350px] w-full flex items-center justify-center">
                        <ChartContainer
                            className="h-[300px] w-[80%]"
                            config={{
                                completed: {
                                    label: "Hoàn Thành",
                                    color: "#10b981", // green-500
                                },
                                created: {
                                    label: "Đã Tạo",
                                    color: "#3b82f6", // blue-500
                                },
                            }}>

                            <LineChart
                                data={transformedData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 'dataMax + 1']}
                                    allowDecimals={false}
                                />

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />

                                <Tooltip />
                                <Legend />

                                <Line
                                    type="linear"
                                    dataKey="completed"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    name="Hoàn Thành"
                                />
                                <Line
                                    type="linear"
                                    dataKey="created"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    name="Đã Tạo"
                                />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* project status */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-0.5">
                        <CardTitle className="text-base font-medium">Trạng Thái Dự Án</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Phân tích trạng thái dự án
                        </CardDescription>
                    </div>

                    <ChartPie className="size-5 text-muted-foreground" />
                </CardHeader>

                <CardContent className="w-full overflow-hidden">
                <div className="w-full flex justify-center">
                        <ChartContainer
                            className="h-[300px]"
                            config={{
                                planning: {
                                    label: "Lên Kế Hoạch",
                                    color: "#f59e0b", // amber-500 (orange)
                                },
                                inProgress: {
                                    label: "Đang Thực Hiện",
                                    color: "#3b82f6", // blue-500
                                },
                                completed: {
                                    label: "Hoàn Thành",
                                    color: "#10b981", // green-500
                                },
                            }}>

                            {transformedProjectStatusData && transformedProjectStatusData.length > 0 ? (() => {
                                const total = transformedProjectStatusData.reduce((sum: number, d: any) => sum + d.value, 0);
                                
                                return (
                                    <PieChart>
                                        <Pie
                                            data={transformedProjectStatusData}
                                            cx="50%"
                                            cy="50%"
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            label={({ name, value }) => {
                                                // Only show label on chart for segments with value > 0 to avoid overlapping
                                                if (value === 0) return '';
                                                const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                                                return `${name} (${percentage}%)`;
                                            }}
                                            labelLine={false}
                                        >
                                            {transformedProjectStatusData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value: number, name: string) => [value, name]}
                                        />
                                        <Legend 
                                            formatter={(value: string) => {
                                                const dataEntry = transformedProjectStatusData.find((d: any) => d.name === value);
                                                const percentage = total > 0 && dataEntry
                                                    ? ((dataEntry.value / total) * 100).toFixed(0)
                                                    : 0;
                                                return `${value} (${percentage}%)`;
                                            }}
                                        />
                                    </PieChart>
                                );
                            })() : (
                                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                    Không có dữ liệu dự án
                                </div>
                            )}
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>
            </div>

            {/* Task Priority and Workspace Productivity - Same row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Task priority */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-0.5">
                        <CardTitle className="text-base font-medium">Độ Ưu Tiên Task</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Phân tích độ ưu tiên task
                        </CardDescription>
                    </div>

                    <ChartPie className="size-5 text-muted-foreground" />
                </CardHeader>

                <CardContent className="w-full overflow-hidden">
                    <div className="w-full flex justify-center">
                        <ChartContainer
                            className="h-[300px]"
                            config={{
                                high: {
                                    label: "Cao",
                                    color: "#ef4444", // red-500
                                },
                                medium: {
                                    label: "Trung Bình",
                                    color: "#f59e0b", // amber-500 (orange)
                                },
                                low: {
                                    label: "Thấp",
                                    color: "#6b7280", // gray-500 (dark grey)
                                },
                            }}>

                            {transformedTaskPriorityData && transformedTaskPriorityData.length > 0 ? (() => {
                                const total = transformedTaskPriorityData.reduce((sum: number, d: any) => sum + d.value, 0);
                                
                                return (
                                    <PieChart>
                                        <Pie
                                            data={transformedTaskPriorityData}
                                            cx="50%"
                                            cy="50%"
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            label={({ name, value }) => {
                                                // Only show label on chart for segments with value > 0 to avoid overlapping
                                                if (value === 0) return '';
                                                const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                                                return `${name} (${percentage}%)`;
                                            }}
                                            labelLine={false}
                                        >
                                            {transformedTaskPriorityData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value: number, name: string) => [value, name]}
                                        />
                                        <Legend 
                                            formatter={(value: string) => {
                                                const dataEntry = transformedTaskPriorityData.find((d: any) => d.name === value);
                                                const percentage = total > 0 && dataEntry
                                                    ? ((dataEntry.value / total) * 100).toFixed(0)
                                                    : 0;
                                                return `${value} (${percentage}%)`;
                                            }}
                                        />
                                    </PieChart>
                                );
                            })() : (
                                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                    Không có dữ liệu độ ưu tiên task
                                </div>
                            )}
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Workspace Productivity Chart */}
            <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-0.5">
                        <CardTitle className="text-base font-medium">Năng Suất Không Gian Làm Việc</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Hoàn thành task theo dự án
                        </CardDescription>
                    </div>

                    <BarChart3 className="size-5 text-muted-foreground" />
                </CardHeader>

                <CardContent className="w-full overflow-x-auto md:overflow-x-hidden">
                    <div className="min-w-[350px]">
                        <ChartContainer
                            className="h-[300px]"
                            config={{
                                completed: {
                                    label: "Hoàn Thành",
                                    color: "#000000", // black
                                },
                                total: {
                                    label: "Tổng",
                                    color: "#3b82f6", // blue-500
                                },
                            }}>

                            {transformedWorkspaceProductivityData && transformedWorkspaceProductivityData.length > 0 ? (
                                <BarChart
                                    data={transformedWorkspaceProductivityData}
                                    // Thêm margin để bars không bị cắt
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    barCategoryGap="20%"
                                    barGap={8}
                                >
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />

                                    <Tooltip 
                                        formatter={(value: number, name: string) => {
                                            // Hiển thị rõ ràng trong tooltip
                                            if (name === 'Completed') {
                                                return [`${value} task đã hoàn thành`, 'Hoàn Thành'];
                                            }
                                            return [`${value} tổng task`, 'Tổng'];
                                        }}
                                    />
                                    <Legend />

                                    {/* Completed bar - hiển thị số task đã hoàn thành (màu đen) */}
                                    <Bar
                                        dataKey="completed"
                                        fill="#000000"
                                        name="Hoàn Thành"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={60}
                                    />
                                    {/* Total bar - hiển thị tổng số task (màu xanh)
                                        Để hiển thị rõ cả 2 bars, không dùng stackId để chúng được vẽ riêng biệt */}
                                    <Bar
                                        dataKey="total"
                                        fill="#3b82f6"
                                        name="Tổng"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={60}
                                    />
                                </BarChart>
                            ) : (
                                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                    Không có dữ liệu năng suất
                                </div>
                            )}
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>
            </div>
        </div>
    )
}