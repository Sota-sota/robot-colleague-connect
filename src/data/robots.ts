import logisticsHumanoid from "@/assets/robots/logistics_humanoid.png";
import positioningHumanoid from "@/assets/robots/positioning_humanoid.png";
import installationHumanoid from "@/assets/robots/installation_humanoid.png";
import finishingHumanoid from "@/assets/robots/finishing_humanoid.png";
import maintenanceHumanoid from "@/assets/robots/maintenance_humanoid.png";
import inspectionHumanoid from "@/assets/robots/inspection_humanoid.png";
import scaffoldingHumanoid from "@/assets/robots/scaffolding_humanoid.png";
import demolitionHumanoid from "@/assets/robots/demolition_humanoid.png";
import patrolHumanoid from "@/assets/robots/patrol_humanoid.png";
import measurementHumanoid from "@/assets/robots/measurement_humanoid.png";

export interface Robot {
  id: string;
  name: string;
  nameJa: string;
  image: string;
  category: string;
  categoryJa: string;
  physicalTasks: string[];
  cognitiveTasks: string[];
  hourlyRate: number;
  availableInDays: number;
  deploymentDuration: string;
  description: string;
  descriptionJa: string;
  hasDemo?: boolean;
  developmentStatus?: "in-development" | "demo-available";
}

export interface MatchedRobot extends Robot {
  matchScore: number;
  matchReason: string;
  quantity: number;
}

export const ROBOTS: Robot[] = [
  {
    id: "logistics_humanoid",
    name: "Logistics Humanoid",
    nameJa: "ロジスティクス・ヒューマノイド",
    image: logisticsHumanoid,
    category: "Logistics / Supply",
    categoryJa: "ロジスティクス・供給",
    physicalTasks: [
      "Drywall, plywood, stud transport",
      "Scaffold & temporary material transport",
      "Fastener & adhesive restocking",
      "Waste collection, sorting & removal",
    ],
    cognitiveTasks: [
      "Material sorting by task/area",
      "Staging location selection",
      "Re-routing based on progress & obstacles",
      "BIM-linked supply optimization",
    ],
    hourlyRate: 40,
    availableInDays: 2,
    deploymentDuration: "Up to 60 days",
    description: "Autonomous material transport and supply chain robot for active construction sites.",
    descriptionJa: "建設現場での資材運搬・供給チェーンを自動化するヒューマノイドロボット。",
  },
  {
    id: "positioning_humanoid",
    name: "Positioning Humanoid",
    nameJa: "位置決め・ヒューマノイド",
    image: positioningHumanoid,
    category: "Positioning / Alignment",
    categoryJa: "位置決め・アライメント",
    physicalTasks: [
      "Drywall positioning",
      "Stud alignment",
      "Ceiling grid positioning",
      "Bracket, frame & rail alignment",
      "Cabinet & fixture positioning",
      "Material holding & support",
    ],
    cognitiveTasks: [
      "Drawing & reference line verification",
      "Fine adjustment judgment",
      "Fit & alignment assistance",
    ],
    hourlyRate: 50,
    availableInDays: 3,
    deploymentDuration: "Up to 30 days",
    description: "Precision positioning and alignment robot for wall, ceiling, and fixture installations.",
    descriptionJa: "壁・天井・器具の精密位置決め・アライメントを行うヒューマノイドロボット。",
  },
  {
    id: "installation_humanoid",
    name: "Installation Humanoid",
    nameJa: "取り付け・ヒューマノイド",
    image: installationHumanoid,
    category: "Installation / Fastening",
    categoryJa: "取り付け・固定",
    physicalTasks: [
      "Drywall screwing",
      "Bracket, frame & rail installation",
      "Cabinet & fixture mounting",
      "Temporary handrail installation",
      "Temporary enclosure setup",
      "Repetitive drilling & anchoring",
    ],
    cognitiveTasks: [
      "Fastening sequence & condition judgment",
      "Visual quality verification",
      "Rework prevention decisions",
    ],
    hourlyRate: 55,
    availableInDays: 3,
    deploymentDuration: "Up to 30 days",
    description: "Fastening and mounting robot for repetitive installation tasks with precision tool operation.",
    descriptionJa: "反復的な取り付け作業を精密な工具操作で行うヒューマノイドロボット。",
  },
  {
    id: "finishing_humanoid",
    name: "Finishing Humanoid",
    nameJa: "仕上げ・ヒューマノイド",
    image: finishingHumanoid,
    category: "Finishing / Surface Treatment",
    categoryJa: "表面処理・仕上げ",
    physicalTasks: [
      "Wall & ceiling painting",
      "Sanding & surface preparation",
      "Caulking & sealing",
      "Taping & mudding",
      "Floor preparation & leveling",
    ],
    cognitiveTasks: [
      "Finish uniformity verification",
      "Drying & curing timing judgment",
    ],
    hourlyRate: 50,
    availableInDays: 4,
    deploymentDuration: "Up to 21 days",
    description: "Surface finishing robot for painting, sanding, caulking, and floor preparation work.",
    descriptionJa: "塗装・研磨・コーキング・床下地処理を行う仕上げヒューマノイドロボット。",
  },
  {
    id: "maintenance_humanoid",
    name: "Site Maintenance Humanoid",
    nameJa: "現場管理・ヒューマノイド",
    image: maintenanceHumanoid,
    category: "Site Preparation & Housekeeping",
    categoryJa: "現場環境の準備・維持",
    physicalTasks: [
      "Pre-work site organization",
      "End-of-day cleaning",
      "Dust & debris removal",
      "Protection sheet setup & removal",
      "Tool cleaning & organization",
    ],
    cognitiveTasks: [
      "Layout decisions for efficiency & safety",
      "Next-phase cleanup planning",
    ],
    hourlyRate: 35,
    availableInDays: 1,
    deploymentDuration: "Up to 60 days",
    description: "Site housekeeping and preparation robot for daily cleaning and organization tasks.",
    descriptionJa: "日常の清掃・整理整頓を行う現場管理ヒューマノイドロボット。",
  },
  {
    id: "inspection_humanoid",
    name: "Inspection Humanoid",
    nameJa: "点検・ヒューマノイド",
    image: inspectionHumanoid,
    category: "Inspection / Vision & NDT",
    categoryJa: "点検・診断・高度検査",
    physicalTasks: [
      "Site & facility patrol",
      "360° camera inspection",
      "Sensor & measurement equipment operation",
      "LiDAR scanning",
    ],
    cognitiveTasks: [
      "Crack detection on exterior walls",
      "Paint degradation visualization",
      "Thermal anomaly detection",
      "Ultrasonic internal defect detection",
      "Historical data comparison",
      "Predictive maintenance",
    ],
    hourlyRate: 70,
    availableInDays: 2,
    deploymentDuration: "Up to 14 days",
    description: "Advanced inspection robot with visual, thermal, and LiDAR sensors for quality and defect detection.",
    descriptionJa: "視覚・熱画像・LiDARセンサーを搭載した高度点検ヒューマノイドロボット。",
  },
  {
    id: "scaffolding_humanoid",
    name: "Scaffolding Humanoid",
    nameJa: "足場・ヒューマノイド",
    image: scaffoldingHumanoid,
    category: "Scaffolding & Elevated Work",
    categoryJa: "足場・高所作業環境",
    physicalTasks: [
      "Scaffold component transport & positioning",
      "Scaffold assembly assistance",
      "Scaffold disassembly assistance",
      "Safety net setup",
      "Temporary handrail installation",
    ],
    cognitiveTasks: [
      "Pre-elevation safety checks",
      "Structural stability verification",
      "Hazard point identification",
    ],
    hourlyRate: 45,
    availableInDays: 5,
    deploymentDuration: "Up to 30 days",
    description: "Scaffolding and elevated work support robot for safe assembly and disassembly at height.",
    descriptionJa: "足場の組立・解体を安全に支援するヒューマノイドロボット。",
  },
  {
    id: "demolition_humanoid",
    name: "Demolition Humanoid",
    nameJa: "解体・ヒューマノイド",
    image: demolitionHumanoid,
    category: "Demolition / Removal",
    categoryJa: "解体・撤去",
    physicalTasks: [
      "Interior wall demolition (drywall, light steel framing)",
      "Nail, screw & anchor removal",
      "Waste sorting & removal",
    ],
    cognitiveTasks: [
      "Structural assessment before removal",
      "Floor integrity verification",
      "Hazard detection in unlearned environments",
    ],
    hourlyRate: 60,
    availableInDays: 5,
    deploymentDuration: "Up to 21 days",
    description: "Interior demolition robot for wall panel removal, fastener extraction, and waste handling.",
    descriptionJa: "内装壁の解体・ファスナー除去・廃材処理を行うヒューマノイドロボット。",
  },
  {
    id: "patrol_humanoid",
    name: "Patrol Humanoid",
    nameJa: "監視・巡回ヒューマノイド",
    image: patrolHumanoid,
    category: "Monitoring & Patrol",
    categoryJa: "監視・巡回",
    physicalTasks: [
      "Night & off-hours patrol",
      "Perimeter monitoring",
    ],
    cognitiveTasks: [
      "Intruder detection",
      "Collapse, fire & water leak early detection",
      "Video & log auto-recording",
    ],
    hourlyRate: 30,
    availableInDays: 1,
    deploymentDuration: "Up to 90 days",
    description: "24/7 autonomous patrol robot for site security, hazard detection, and incident recording.",
    descriptionJa: "現場警備・危険検知・記録を24時間行う巡回ヒューマノイドロボット。",
  },
  {
    id: "measurement_humanoid",
    name: "Measurement Humanoid",
    nameJa: "計測・記録ヒューマノイド",
    image: measurementHumanoid,
    category: "Measurement & Documentation",
    categoryJa: "計測・記録・進捗管理",
    physicalTasks: [
      "Dimension measurement",
      "Vertical & horizontal leveling",
      "Progress photo documentation",
      "LiDAR measurement",
    ],
    cognitiveTasks: [
      "Construction quality visual checks",
      "Correction point marking",
      "Punch list verification",
    ],
    hourlyRate: 55,
    availableInDays: 2,
    deploymentDuration: "Up to 14 days",
    description: "Precision measurement and documentation robot for quality control and progress tracking.",
    descriptionJa: "品質管理・進捗管理のための精密計測・記録ヒューマノイドロボット。",
  },
];
