import { Link } from "react-router-dom";
import { Brain, ArrowRightLeft, Users, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NetworkActivity } from "@/types/sns";
import { getRobotProfile } from "@/data/sns/mockData";

interface ActivityFeedProps {
  activities: NetworkActivity[];
  maxItems?: number;
}

const typeConfig = {
  post: { icon: Brain, color: "text-blue-400", badgeClass: "bg-blue-500/15 text-blue-400" },
  absorption: { icon: ArrowRightLeft, color: "text-purple-400", badgeClass: "bg-purple-500/15 text-purple-400" },
  subscription: { icon: Users, color: "text-green-400", badgeClass: "bg-green-500/15 text-green-400" },
  transaction: { icon: Coins, color: "text-orange-400", badgeClass: "bg-orange-500/15 text-orange-400" },
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ActivityFeed = ({ activities, maxItems = 20 }: ActivityFeedProps) => {
  const items = activities.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {items.map((a) => {
        const cfg = typeConfig[a.type];
        const Icon = cfg.icon;
        const actor = getRobotProfile(a.actor_robot_id);
        const target = a.target_robot_id
          ? getRobotProfile(a.target_robot_id)
          : null;

        return (
          <div
            key={a.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-colors"
          >
            <div className={`mt-0.5 ${cfg.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/robot/${a.actor_robot_id}`}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {actor?.name ?? a.actor_robot_id}
                </Link>
                {target && (
                  <>
                    <span className="text-muted-foreground text-xs">-&gt;</span>
                    <Link
                      to={`/robot/${a.target_robot_id}`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {target.name}
                    </Link>
                  </>
                )}
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.badgeClass} border-0`}>
                  {a.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {a.description}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-1">
              {timeAgo(a.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
