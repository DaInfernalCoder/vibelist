import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const MetricCard = ({ title, value, change, trend, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-4 w-12" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p
            className={`mt-2 flex items-center text-sm ${
              trend === "increase" ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend === "increase" ? "↑" : "↓"} {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
