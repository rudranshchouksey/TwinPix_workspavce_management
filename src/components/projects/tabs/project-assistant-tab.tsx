"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Activity, AlertTriangle, DollarSign, Clock, Users,
  Megaphone, CheckCircle, FileWarning, FileText, Lightbulb,
  ChevronDown, ChevronUp, Loader2, ShieldAlert, TrendingUp,
  BarChart3, Target, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  analyzeProjectAction,
  generateWeeklyReportAction,
  identifyRisksAction,
  suggestActionsAction,
} from "@/actions/project-assistant";

// ─── Types ─────────────────────────────────────────────────────

interface AnalysisResult {
  healthScore: number;
  healthScoreReason: string;
  riskLevel: string;
  risks: string[];
  budgetForecast: string;
  deadlinePrediction: string;
  teamWorkload: { userId: string; userName: string; taskCount: number; overdueTasks: number; assessment: string }[];
  influencerPerformance: string;
  campaignProgress: { campaignName: string; completionPercent: number; status: string; summary: string }[];
  blockedTasks: { taskTitle: string; reason: string; assignee: string }[];
  missingDeliverables: { influencerName: string; campaignName: string; status: string }[];
  executiveSummary: string;
  suggestedActions: string[];
}

interface RiskResult {
  overallRiskLevel: string;
  risks: { title: string; severity: string; category: string; description: string; impact: string; mitigation: string }[];
}

interface ActionResult {
  actions: { title: string; description: string; priority: string; assignTo: string; dueInDays: number }[];
}

// ─── Component ──────────────────────────────────────────────────

export function ProjectAssistantTab({ project }: { project: any }) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<string | null>(null);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isIdentifyingRisks, setIsIdentifyingRisks] = useState(false);
  const [isSuggestingActions, setIsSuggestingActions] = useState(false);

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    const res = await analyzeProjectAction(project.id);
    if (res.success) {
      setAnalysis(res.data);
    } else {
      setError(res.error || "Analysis failed");
    }
    setIsAnalyzing(false);
  };

  const handleWeeklyReport = async () => {
    setIsGeneratingReport(true);
    setError(null);
    const res = await generateWeeklyReportAction(project.id);
    if (res.success) {
      setWeeklyReport(res.data ?? null);
      setExpandedSection("report");
    } else {
      setError(res.error || "Report generation failed");
    }
    setIsGeneratingReport(false);
  };

  const handleRisks = async () => {
    setIsIdentifyingRisks(true);
    setError(null);
    const res = await identifyRisksAction(project.id);
    if (res.success) {
      setRiskResult(res.data);
      setExpandedSection("risks");
    } else {
      setError(res.error || "Risk analysis failed");
    }
    setIsIdentifyingRisks(false);
  };

  const handleActions = async () => {
    setIsSuggestingActions(true);
    setError(null);
    const res = await suggestActionsAction(project.id);
    if (res.success) {
      setActionResult(res.data);
      setExpandedSection("actions");
    } else {
      setError(res.error || "Action suggestion failed");
    }
    setIsSuggestingActions(false);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return "bg-emerald-50 border-emerald-200";
    if (score >= 50) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "LOW": return "bg-emerald-100 text-emerald-700 border-emerald-300";
      case "MEDIUM": return "bg-amber-100 text-amber-700 border-amber-300";
      case "HIGH": return "bg-orange-100 text-orange-700 border-orange-300";
      case "CRITICAL": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW": return "bg-slate-100 text-slate-600";
      case "MEDIUM": return "bg-blue-100 text-blue-700";
      case "HIGH": return "bg-orange-100 text-orange-700";
      case "URGENT": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const isAnyLoading = isAnalyzing || isGeneratingReport || isIdentifyingRisks || isSuggestingActions;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">AI Project Assistant</h2>
            <p className="text-sm text-muted-foreground">Powered by real-time project data analysis</p>
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Analyze Project
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
        >
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          {error}
        </motion.div>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-gradient-to-br from-violet-50/50 to-purple-50/50 rounded-2xl border-2 border-dashed border-violet-200">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-5">
            <Sparkles className="h-8 w-8 text-violet-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Ready to Analyze</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Click "Analyze Project" to let AI review your project's tasks, campaigns, budgets, and team performance to generate actionable insights.
          </p>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && !analysis && (
        <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-violet-50/50 to-purple-50/50 rounded-2xl border border-violet-200">
          <Loader2 className="h-10 w-10 text-violet-500 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Analyzing Project Data...</h3>
          <p className="text-sm text-muted-foreground mt-1">Reading tasks, campaigns, budgets, and team metrics</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Health Score */}
              <Card className={`border ${getHealthBg(analysis.healthScore)}`}>
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className={`h-4 w-4 ${getHealthColor(analysis.healthScore)}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Health</span>
                  </div>
                  <div className={`text-3xl font-black ${getHealthColor(analysis.healthScore)}`}>
                    {analysis.healthScore}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{analysis.healthScoreReason}</p>
                </CardContent>
              </Card>

              {/* Risk Level */}
              <Card className="border">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk</span>
                  </div>
                  <Badge className={`text-sm font-bold ${getRiskColor(analysis.riskLevel)}`}>{analysis.riskLevel}</Badge>
                  <p className="text-xs text-muted-foreground mt-2">{analysis.risks.length} risk(s) detected</p>
                </CardContent>
              </Card>

              {/* Budget */}
              <Card className="border">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Budget</span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug">{analysis.budgetForecast}</p>
                </CardContent>
              </Card>

              {/* Deadline */}
              <Card className="border">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deadlines</span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug">{analysis.deadlinePrediction}</p>
                </CardContent>
              </Card>
            </div>

            {/* Executive Summary */}
            <Card className="border bg-gradient-to-br from-violet-50/40 to-purple-50/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-violet-600" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed">{analysis.executiveSummary}</p>
              </CardContent>
            </Card>

            {/* Detail Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Risks */}
              {analysis.risks.length > 0 && (
                <Card className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Detected Risks ({analysis.risks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                          <span className="text-foreground">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Blocked Tasks */}
              {analysis.blockedTasks.length > 0 && (
                <Card className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileWarning className="h-4 w-4 text-red-500" />
                      Blocked Tasks ({analysis.blockedTasks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysis.blockedTasks.map((bt, i) => (
                        <li key={i} className="text-sm">
                          <p className="font-medium text-foreground">{bt.taskTitle}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">{bt.reason} — {bt.assignee}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Team Workload */}
              {analysis.teamWorkload.length > 0 && (
                <Card className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      Team Workload
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.teamWorkload.map((member, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{member.userName}</p>
                            <p className="text-xs text-muted-foreground">{member.assessment}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">{member.taskCount} tasks</span>
                            {member.overdueTasks > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold">{member.overdueTasks} overdue</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Campaign Progress */}
              {analysis.campaignProgress.length > 0 && (
                <Card className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-purple-500" />
                      Campaign Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.campaignProgress.map((cp, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-foreground">{cp.campaignName}</p>
                            <span className="text-xs font-bold text-muted-foreground">{cp.completionPercent}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                              style={{ width: `${cp.completionPercent}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{cp.summary}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Missing Deliverables */}
              {analysis.missingDeliverables.length > 0 && (
                <Card className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4 text-orange-500" />
                      Missing Deliverables ({analysis.missingDeliverables.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.missingDeliverables.map((md, i) => (
                        <li key={i} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium text-foreground">{md.influencerName}</p>
                            <p className="text-xs text-muted-foreground">{md.campaignName}</p>
                          </div>
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">{md.status}</Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Influencer Performance */}
              {analysis.influencerPerformance && (
                <Card className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Influencer Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground leading-relaxed">{analysis.influencerPerformance}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Suggested Actions */}
            {analysis.suggestedActions.length > 0 && (
              <Card className="border bg-gradient-to-br from-emerald-50/40 to-green-50/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-emerald-600" />
                    Suggested Next Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {analysis.suggestedActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-foreground">{action}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleWeeklyReport}
                disabled={isAnyLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-sm font-medium text-foreground hover:bg-violet-50 hover:border-violet-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Generate Weekly Report
              </button>
              <button
                onClick={handleRisks}
                disabled={isAnyLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-sm font-medium text-foreground hover:bg-amber-50 hover:border-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isIdentifyingRisks ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                Identify Risks
              </button>
              <button
                onClick={handleActions}
                disabled={isAnyLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-sm font-medium text-foreground hover:bg-emerald-50 hover:border-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSuggestingActions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                Suggest Follow-up Tasks
              </button>
            </div>

            {/* Expandable Results */}
            <AnimatePresence>
              {/* Weekly Report */}
              {weeklyReport && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="border">
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggleSection("report")}
                    >
                      <CardTitle className="text-sm font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-violet-500" />
                          Weekly Executive Report
                        </span>
                        {expandedSection === "report" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </CardTitle>
                    </CardHeader>
                    {expandedSection === "report" && (
                      <CardContent>
                        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{weeklyReport}</div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              )}

              {/* Risk Analysis */}
              {riskResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="border">
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggleSection("risks")}
                    >
                      <CardTitle className="text-sm font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-amber-500" />
                          Detailed Risk Analysis
                          <Badge className={`ml-2 ${getRiskColor(riskResult.overallRiskLevel)}`}>{riskResult.overallRiskLevel}</Badge>
                        </span>
                        {expandedSection === "risks" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </CardTitle>
                    </CardHeader>
                    {expandedSection === "risks" && (
                      <CardContent>
                        <div className="space-y-4">
                          {riskResult.risks.map((risk, i) => (
                            <div key={i} className="p-4 rounded-xl border bg-white">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getRiskColor(risk.severity)}>{risk.severity}</Badge>
                                <Badge variant="outline" className="text-xs">{risk.category}</Badge>
                              </div>
                              <h4 className="font-semibold text-sm text-foreground">{risk.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
                              <div className="grid grid-cols-2 gap-4 mt-3">
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Impact</p>
                                  <p className="text-sm text-foreground mt-0.5">{risk.impact}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mitigation</p>
                                  <p className="text-sm text-foreground mt-0.5">{risk.mitigation}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              )}

              {/* Suggested Actions */}
              {actionResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="border">
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggleSection("actions")}
                    >
                      <CardTitle className="text-sm font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-emerald-500" />
                          Suggested Follow-up Tasks ({actionResult.actions.length})
                        </span>
                        {expandedSection === "actions" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </CardTitle>
                    </CardHeader>
                    {expandedSection === "actions" && (
                      <CardContent>
                        <div className="space-y-3">
                          {actionResult.actions.map((action, i) => (
                            <div key={i} className="p-4 rounded-xl border bg-white">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-sm text-foreground">{action.title}</h4>
                                <Badge className={getPriorityColor(action.priority)}>{action.priority}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{action.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>Assign to: <strong className="text-foreground">{action.assignTo}</strong></span>
                                <span>Due in: <strong className="text-foreground">{action.dueInDays} days</strong></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
