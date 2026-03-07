import { useState } from "react";
import { X, CheckCircle2, Clock, Calendar, Bot, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type MatchedRobot } from "@/data/robots";
import { addDays, format } from "date-fns";

interface BookingModalProps {
  robot: MatchedRobot;
  detectedTasks: string[];
  onClose: () => void;
}

const BookingModal = ({ robot, detectedTasks, onClose }: BookingModalProps) => {
  const [hours, setHours] = useState(40);
  const [confirmed, setConfirmed] = useState(false);

  const today = new Date();
  const startDate = addDays(today, robot.availableInDays);
  const endDate = addDays(startDate, 30);
  const costPerUnit = hours * robot.hourlyRate;
  const totalCost = costPerUnit * robot.quantity;

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full shadow-card animate-slide-up text-center space-y-6">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
          <div className="space-y-2">
            <h2 className="font-heading font-bold text-2xl text-foreground">派遣依頼を受付しました！</h2>
            <p className="text-muted-foreground">
              <span className="text-foreground font-semibold">{robot.quantity}× {robot.name}</span> の派遣依頼を受け付けました。24時間以内に担当者よりご連絡いたします。
            </p>
          </div>
          <Button variant="hero" className="w-full" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl max-w-lg w-full shadow-card animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-primary" />
            <h2 className="font-heading font-bold text-xl text-foreground">派遣内容の確認</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Robot Info */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-secondary/50 rounded-lg flex items-center justify-center overflow-hidden">
              <img src={robot.image} alt={robot.name} className="h-16 w-auto object-contain" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground">{robot.name}</h3>
              <p className="text-xs text-muted-foreground">{robot.nameJa}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge quantity={robot.quantity} />
              </div>
            </div>
          </div>

          {/* Task Summary */}
          {detectedTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">作業内容</p>
              <p className="text-sm text-muted-foreground">{detectedTasks.join(", ")}</p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Calendar className="w-3.5 h-3.5" /> 派遣開始日
              </div>
              <p className="font-heading font-semibold text-foreground">{format(startDate, "MMM d, yyyy")}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Clock className="w-3.5 h-3.5" /> 派遣期間
              </div>
              <p className="font-heading font-semibold text-foreground">{robot.deploymentDuration}</p>
            </div>
          </div>

          {/* Hours & Cost */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">稼働時間（1台あたり）</label>
              <span className="text-sm text-muted-foreground">${robot.hourlyRate}/hr</span>
            </div>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground font-heading font-bold text-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
            
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Per unit: {hours}hrs × ${robot.hourlyRate}/hr</span>
                <span>${costPerUnit.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Units: ×{robot.quantity}</span>
              </div>
              <div className="border-t border-border pt-2 flex items-center justify-between">
                <span className="text-foreground font-medium">見積もり合計</span>
                <span className="font-heading font-bold text-2xl text-primary">
                  ${totalCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Confirm */}
          <Button variant="hero" size="lg" className="w-full h-14 text-lg" onClick={() => setConfirmed(true)}>
            {robot.quantity}台の派遣を確定する
          </Button>
        </div>
      </div>
    </div>
  );
};

// Simple inline badge for quantity
const Badge = ({ quantity }: { quantity: number }) => (
  <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
    <Users className="w-3 h-3" />
    {quantity} unit{quantity > 1 ? "s" : ""}
  </span>
);

export default BookingModal;
