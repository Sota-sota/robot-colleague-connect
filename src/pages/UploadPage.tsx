import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const UploadPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setIsLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/match-robots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          description: description.trim(),
          hasBlueprint: !!file,
        }),
      });

      if (!response.ok) throw new Error("AI analysis failed");

      const data = await response.json();
      navigate("/results", { state: { aiResult: data } });
    } catch (error) {
      console.error("AI analysis failed, using fallback:", error);
      // Fallback: navigate with no AI result, results page will show all robots
      navigate("/results", {
        state: {
          aiResult: {
            detectedTasks: description.split(",").map((s: string) => s.trim()).filter(Boolean),
            matchedRobots: [],
          },
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 gradient-navy">
        <div className="relative">
          <Bot className="w-16 h-16 text-primary animate-pulse-glow" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-heading font-bold text-foreground">Organizing dispatch team...</h2>
          <p className="text-muted-foreground">AI is selecting the best robots for your project</p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-primary animate-pulse-glow"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-navy">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />

        <div className="relative z-10 container mx-auto px-4 pt-12 pb-8">
          <div className="flex items-center gap-3 mb-12">
            <Bot className="w-8 h-8 text-primary" />
            <span className="font-heading font-bold text-xl text-foreground">RoboHire</span>
          </div>

          <div className="max-w-3xl mx-auto text-center space-y-4 py-12">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground leading-tight">
              Same-day robot{" "}
              <span className="text-gradient-orange">dispatch</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload your blueprint and job description — AI will organize the optimal robot team and dispatch immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="container mx-auto px-4 pb-20 -mt-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* File Dropzone */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? "border-primary bg-primary/5"
                : file
                ? "border-primary/50 bg-card"
                : "border-border bg-card hover:border-muted-foreground"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium text-foreground">Upload blueprint (PDF or image)</p>
                  <p className="text-sm text-muted-foreground">Drag & drop or click to select</p>
                </div>
              </div>
            )}
          </div>

           {/* Task Description */}
           <div className="space-y-2">
             <label className="text-sm font-medium text-foreground">Describe your job scope</label>
             <textarea
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="E.g., material transport, site inspection, scaffolding, drilling, painting, demolition..."
               rows={4}
               className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
             />
           </div>

           {/* CTA */}
           <Button
             variant="hero"
             size="lg"
             className="w-full h-14 text-lg"
             onClick={handleSubmit}
             disabled={!description.trim()}
           >
             <Bot className="w-5 h-5 mr-2" />
             Dispatch Robots
           </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
