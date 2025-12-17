import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { useEffect } from "react"


export const StatCard = ({ data }: { data: any }) => {
    // Chỉ log khi data thay đổi, không log mỗi lần render
    useEffect(() => {
        if (data) {
            console.log("StatCard data:", data)
        }
    }, [data])

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data?.totalProjects}</div>
                    <p className="text-xs text-muted-foreground">
                        {data?.totalProjectInProgress} in progress
                    </p>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data?.totalTasks}</div>
                    <p className="text-xs text-muted-foreground">
                        {data?.totalTaskCompleted} completed
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">To Do</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data?.totalTaskToDo}</div>
                    <p className="text-xs text-muted-foreground">
                        Tasks waiting to be done
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data?.totalTaskInProgress}</div>
                    <p className="text-xs text-muted-foreground">
                        Tasks in progress
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}