import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Bot, ArrowLeft, Clock, Calendar, Zap, Users, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROBOTS, type MatchedRobot } from "@/data/robots";
import BookingModal from "@/components/BookingModal";
import TopNav from "@/components/sns/TopNav";
import { addDays, format } from "date-fns";

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedRobot, setSelectedRobot] = useState<MatchedRobot | null>(null);

  const aiResult = location.state?.aiResult;

  if (!aiResult) {
    navigate("/");
    return null;
  }

  const detectedTasks: string[] = aiResult.detectedTasks || [];
  const aiMatches: { id: string; matchScore: number; matchReason: string; quantity?: number }[] = aiResult.matchedRobots || [];

  const matchedRobots: MatchedRobot[] = (() => {
    if (aiMatches.length > 0) {
      return aiMatches
        .map((match) => {
          const robot = ROBOTS.find((r) => r.id === match.id);
          if (!robot) return null;
          return {
            ...robot,
            matchScore: match.matchScore,
            matchReason: match.matchReason,
            quantity: match.quantity || 1,
          };
        })
        .filter(Boolean) as MatchedRobot[];
    }
    return ROBOTS.map((r) => ({
      ...r,
      matchScore: 70,
      matchReason: "General match based on your job description.",
      quantity: 1,
    }));
  })();

  const totalRobots = matchedRobots.reduce((sum, r) => sum + r.quantity, 0);
  const totalHourlyCost = matchedRobots.reduce((sum, r) => sum + r.hourlyRate * r.quantity, 0);
  const today = new Date();

  return (
    <div className="min-h-screen gradient-navy">
      <TopNav />
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-7 h-7 text-primary" />
            <span className="font-heading font-bold text-lg text-foreground">SynthNet</span>
          </div>
           <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground">
             <ArrowLeft className="w-4 h-4 mr-2" />
             New Request
           </Button>
        </div>
      </div>

      {/* AI Summary */}
      {detectedTasks.length > 0 && (
        <div className="container mx-auto px-4 mb-6">
           <div className="bg-card border border-border rounded-lg p-5 shadow-card">
             <div className="flex items-start gap-3">
               <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
               <div>
                 <p className="font-heading font-semibold text-foreground mb-2">AI Analysis Complete — Dispatch Team Organized</p>
                 <p className="text-muted-foreground text-sm mb-3">
                   Detected Tasks:{" "}
                   {detectedTasks.map((task, i) => (
                     <Badge key={i} variant="secondary" className="mr-1.5 mb-1">
                       {task}
                     </Badge>
                   ))}
                 </p>
               </div>
             </div>
           </div>
        </div>
      )}

       {/* Summary Stats */}
       <div className="container mx-auto px-4 mb-8">
         <div className="grid grid-cols-3 gap-4">
           <div className="bg-card border border-border rounded-lg p-4 text-center shadow-card">
             <p className="text-muted-foreground text-xs mb-1">Robot Types</p>
             <p className="font-heading font-bold text-2xl text-foreground">{matchedRobots.length}</p>
           </div>
           <div className="bg-card border border-border rounded-lg p-4 text-center shadow-card">
             <p className="text-muted-foreground text-xs mb-1">Total Units</p>
             <p className="font-heading font-bold text-2xl text-primary">{totalRobots}</p>
           </div>
           <div className="bg-card border border-border rounded-lg p-4 text-center shadow-card">
             <p className="text-muted-foreground text-xs mb-1">Total $/hr</p>
             <p className="font-heading font-bold text-2xl text-primary">${totalHourlyCost}</p>
           </div>
         </div>
       </div>

       {/* Results Grid */}
       <div className="container mx-auto px-4 pb-20">
         <h2 className="font-heading font-bold text-2xl text-foreground mb-6">
           Dispatch Robot Team
         </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matchedRobots.map((robot, index) => {
            const availDate = addDays(today, robot.availableInDays);
            const endDate = addDays(availDate, 30);

            return (
              <div
                key={robot.id}
                className="bg-card border border-border rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Robot Image */}
                 {robot.demoUrl ? (
                   <div className="relative">
                     <div className="aspect-video">
                       <iframe
                         src={robot.demoUrl.replace('/share/', '/embed/')}
                         className="w-full h-full rounded-t-lg"
                         frameBorder="0"
                         allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                         allowFullScreen
                       />
                     </div>
                     <div className="absolute top-3 left-3">
                       <Badge className="gradient-orange text-primary-foreground font-heading font-bold border-0">
                         {robot.matchScore}% match
                       </Badge>
                     </div>
                     <div className="absolute top-3 right-3">
                       <Badge className="bg-secondary text-foreground font-heading font-bold border border-border">
                         <Users className="w-3 h-3 mr-1" />
                         ×{robot.quantity}
                       </Badge>
                     </div>
                   </div>
                 ) : (
                   <div className="relative h-48 bg-secondary/50 flex items-center justify-center overflow-hidden">
                     <img
                       src={robot.image}
                       alt={robot.name}
                       className="h-40 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                     />
                     <div className="absolute top-3 left-3">
                       <Badge className="gradient-orange text-primary-foreground font-heading font-bold border-0">
                         {robot.matchScore}% match
                       </Badge>
                     </div>
                     <div className="absolute top-3 right-3">
                       <Badge className="bg-secondary text-foreground font-heading font-bold border border-border">
                         <Users className="w-3 h-3 mr-1" />
                         ×{robot.quantity}
                       </Badge>
                     </div>
                   </div>
                 )}

                {/* Content */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-foreground">{robot.name}</h3>
                    <p className="text-xs text-muted-foreground">{robot.nameJa}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {robot.categoryJa}
                      </Badge>
                      {robot.developmentStatus === "demo-available" && (
                        <Badge className="gradient-orange text-primary-foreground font-heading font-bold border-0 text-xs">
                          Demo Available
                        </Badge>
                      )}
                      {robot.developmentStatus === "in-development" && (
                        <Badge variant="secondary" className="text-xs">
                          In Development
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground italic">"{robot.matchReason}"</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-foreground">
                        <span className="font-heading font-bold text-xl text-primary">${robot.hourlyRate}</span>
                        <span className="text-muted-foreground">/hr × {robot.quantity}</span>
                      </div>
                      <span className="font-heading font-bold text-primary">
                        ${robot.hourlyRate * robot.quantity}/hr
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {robot.availableInDays}日後に派遣可能
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(availDate, "MMM d")} – {format(endDate, "MMM d")}
                    </div>
                   </div>

                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={() => setSelectedRobot(robot)}
                    >
                      Request {robot.quantity} Unit{robot.quantity > 1 ? 's' : ''}
                    </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Modal */}
      {selectedRobot && (
        <BookingModal
          robot={selectedRobot}
          detectedTasks={detectedTasks}
          onClose={() => setSelectedRobot(null)}
        />
      )}
    </div>
  );
};

export default ResultsPage;
