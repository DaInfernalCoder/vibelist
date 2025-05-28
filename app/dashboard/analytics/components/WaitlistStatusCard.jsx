import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const WaitlistStatusCard = ({ waitlist, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!waitlist) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Waitlist Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No waitlist selected</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status, published) => {
    if (published && status === "published") {
      return "bg-green-100 text-green-800";
    } else if (status === "draft") {
      return "bg-yellow-100 text-yellow-800";
    } else {
      return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status, published) => {
    if (published && status === "published") {
      return "Live";
    } else if (status === "draft") {
      return "Draft";
    } else {
      return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waitlist Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold">{waitlist.name}</h3>
            <Badge
              className={getStatusColor(waitlist.status, waitlist.published)}
            >
              {getStatusText(waitlist.status, waitlist.published)}
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Created: {formatDate(waitlist.created_at)}</p>
            {waitlist.published && (
              <p className="text-green-600 font-medium mt-1">
                ✓ Published and accepting signups
              </p>
            )}
            {!waitlist.published && (
              <p className="text-yellow-600 font-medium mt-1">
                ⚠ Not yet published
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WaitlistStatusCard;
