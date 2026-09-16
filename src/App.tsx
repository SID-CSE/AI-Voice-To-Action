import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { VoiceAssistantPage } from './pages/VoiceAssistantPage';
import { TasksPage } from './pages/TasksPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';
import { 
  StructuredTask, 
  AIAnalysisOutput, 
  WorkflowStage, 
  AuditRecord, 
  KnowledgeDocument, 
  EvalTestCase, 
  EvalResult,
  SystemSettings 
} from './types';

const DEMO_TRANSCRIPT = 
  "We discussed the SmartPay project today. Rahul will finish the frontend dashboard by Friday. Ankit needs to complete the backend API by Monday. I will improve the salary prediction model. Let's review the complete system next Tuesday. The exact meeting time will be decided later.";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [apiConnected, setApiConnected] = useState(true);

  // Voice Assistant input state
  const [currentTabInput, setCurrentTabInput] = useState<'voice' | 'text'>('voice');
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisOutput | null>(null);
  const [currentAuditId, setCurrentAuditId] = useState<string | undefined>(undefined);

  // Application Data States
  const [tasks, setTasks] = useState<(StructuredTask & { createdAt?: string; updatedAt?: string })[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [evalTestCases, setEvalTestCases] = useState<EvalTestCase[]>([]);
  const [evalResults, setEvalResults] = useState<Record<string, EvalResult>>({});
  const [isRunningAllEvals, setIsRunningAllEvals] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    modelName: 'gemini-2.5-flash',
    confidenceThreshold: 75,
    groundingEnabled: true,
    guardrailsStrict: true,
    audioSensitivity: 'Normal',
  });

  // Load initial data from backend
  const refreshAllData = useCallback(async () => {
    try {
      const [tasksRes, logsRes, analysesRes, docsRes, evalCasesRes, settingsRes] = await Promise.all([
        api.getTasks().catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getAnalyses().catch(() => []),
        api.getDocuments().catch(() => []),
        api.getEvaluationTestCases().catch(() => []),
        api.getSettings().catch(() => settings),
      ]);

      setTasks(tasksRes);
      setAuditLogs(logsRes);
      setRecentAnalyses(analysesRes);
      setDocuments(docsRes);
      setEvalTestCases(evalCasesRes);
      setSettings(settingsRes);
      setApiConnected(true);
    } catch (err) {
      console.warn('Initial data load warning:', err);
      setApiConnected(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Handle Analysis Workflow
  const handleAnalyze = async (text: string, inputType: 'voice' | 'text' | 'demo') => {
    if (!text || !text.trim()) return;
    setCurrentTab('assistant');
    setAnalysisError(null);
    setIsAnalyzing(true);

    // Initial workflow stages simulation
    const initialStages: WorkflowStage[] = [
      { id: 's1', label: 'Input received', status: 'completed', detail: 'Spoken transcript or text captured.' },
      { id: 's2', label: 'Input validated', status: 'in_progress', detail: 'Checking token boundaries and input safety...' },
      { id: 's3', label: 'Understanding request', status: 'pending' },
      { id: 's4', label: 'Checking relevant context', status: 'pending' },
      { id: 's5', label: 'Extracting tasks', status: 'pending' },
      { id: 's6', label: 'Applying safety checks', status: 'pending' },
      { id: 's7', label: 'Preparing result', status: 'pending' },
    ];
    setStages(initialStages);

    try {
      // Step 2 & 3
      setTimeout(() => {
        setStages((prev) =>
          prev.map((s) => {
            if (s.id === 's2') return { ...s, status: 'completed' };
            if (s.id === 's3' || s.id === 's4') return { ...s, status: 'in_progress', detail: 'Querying RAG knowledge chunk indexes...' };
            return s;
          })
        );
      }, 500);

      const response = await api.analyzeTranscript(text, inputType);

      // Finalize stages
      if (response.stages && response.stages.length > 0) {
        setStages(response.stages);
      } else {
        setStages([
          { id: 's1', label: 'Input received', status: 'completed', detail: 'Transcript captured.' },
          { id: 's2', label: 'Input validated', status: 'completed', detail: 'Integrity checks verified.' },
          { id: 's3', label: 'Understanding request', status: 'completed', detail: 'Classified sprint planning context.' },
          { id: 's4', label: 'Checking relevant context', status: 'completed', detail: 'Knowledge documents grounded.' },
          { id: 's5', label: 'Extracting tasks', status: 'completed', detail: `${response.output.tasks?.length || 0} tasks extracted.` },
          { id: 's6', label: 'Applying safety checks', status: 'completed', detail: `Risk rating: ${response.output.risk_level}.` },
          { id: 's7', label: 'Preparing result', status: 'completed', detail: 'JSON model output formatted with evidence.' },
        ]);
      }

      setAnalysisResult(response.output);
      setCurrentAuditId(response.auditId);

      setCurrentTab('assistant');

      // Refresh supporting lists without hiding a successful analysis result.
      await Promise.all([
        api.getTasks().then(setTasks).catch((err) => console.warn('Task refresh failed:', err)),
        api.getAuditLogs().then(setAuditLogs).catch((err) => console.warn('Audit refresh failed:', err)),
        api.getAnalyses().then(setRecentAnalyses).catch((err) => console.warn('Analysis history refresh failed:', err)),
      ]);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setAnalysisError(err.message || 'Analysis failed. Please try again.');
      setStages((prev) =>
        prev.map((s) => (s.status === 'in_progress' ? { ...s, status: 'failed', detail: err.message } : s))
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Try Demo function (Section 11)
  const handleTryDemo = async () => {
    setCurrentTab('assistant');
    setCurrentTabInput('voice');
    setTranscript(DEMO_TRANSCRIPT);
    await handleAnalyze(DEMO_TRANSCRIPT, 'demo');
  };

  // Handle Result Refinement (Section 27)
  const handleRefine = async (guidance: string) => {
    if (!analysisResult) return;
    setIsRefining(true);
    try {
      const response = await api.refineAnalysis(analysisResult, guidance);
      setAnalysisResult(response.output);
      setCurrentAuditId(response.auditId);

      // Update tasks in state
      const updatedTasks = await api.getTasks();
      setTasks(updatedTasks);
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
      setRecentAnalyses(await api.getAnalyses());
    } catch (err) {
      console.error('Refinement failed:', err);
    } finally {
      setIsRefining(false);
    }
  };

  // Update Task (Card, Table, or Direct inline edit)
  const handleUpdateTask = async (task: StructuredTask) => {
    try {
      const updated = await api.updateTask(task);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));

      if (analysisResult && analysisResult.tasks) {
        setAnalysisResult({
          ...analysisResult,
          tasks: analysisResult.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t)),
        });
      }
    } catch (err) {
      console.error('Update task failed:', err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      if (analysisResult && analysisResult.tasks) {
        setAnalysisResult({
          ...analysisResult,
          tasks: analysisResult.tasks.filter((t) => t.id !== taskId),
        });
      }
    } catch (err) {
      console.error('Delete task failed:', err);
    }
  };

  // Add Task Manually
  const handleAddTask = async (taskData: Partial<StructuredTask>) => {
    try {
      const created = await api.createTask(taskData);
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Add task failed:', err);
    }
  };

  // Guardrail Action Authorization
  const handleConfirmAction = async (actionId: string) => {
    try {
      if (!currentAuditId) throw new Error('No active audit record is available for confirmation.');
      const res = await api.executeAction(actionId, 'CONFIRM', currentAuditId);
      if (analysisResult && analysisResult.proposed_actions) {
        setAnalysisResult({
          ...analysisResult,
          proposed_actions: analysisResult.proposed_actions.map((act) =>
            act.id === actionId
              ? { ...act, status: 'CONFIRMED', executionNote: res.message || 'Demo action authorized and recorded.' }
              : act
          ),
        });
      }
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
      setRecentAnalyses(await api.getAnalyses());
    } catch (err) {
      console.error('Authorize action failed:', err);
    }
  };

  const handleCancelAction = async (actionId: string) => {
    try {
      if (!currentAuditId) throw new Error('No active audit record is available for cancellation.');
      await api.executeAction(actionId, 'CANCEL', currentAuditId);
      if (analysisResult && analysisResult.proposed_actions) {
        setAnalysisResult({
          ...analysisResult,
          proposed_actions: analysisResult.proposed_actions.map((act) =>
            act.id === actionId ? { ...act, status: 'CANCELLED' } : act
          ),
        });
      }
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
      setRecentAnalyses(await api.getAnalyses());
    } catch (err) {
      console.error('Cancel action failed:', err);
    }
  };

  // Export Utilities (Section 28)
  const handleExportJSON = () => {
    const dataToExport = analysisResult || { tasks };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice_to_action_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const list = analysisResult?.tasks && analysisResult.tasks.length > 0 ? analysisResult.tasks : tasks;
    if (list.length === 0) return;

    const headers = ['Task', 'Owner', 'Deadline', 'Priority', 'Status', 'Confidence', 'Evidence'];
    const rows = list.map((t) => [
      `"${(t.task || '').replace(/"/g, '""')}"`,
      `"${(t.owner || '').replace(/"/g, '""')}"`,
      `"${(t.deadline || '').replace(/"/g, '""')}"`,
      `"${(t.priority || 'Medium')}"`,
      `"${(t.status || 'Pending')}"`,
      `"${t.confidence || ''}"`,
      `"${(t.evidence || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Evaluation Suite Handlers
  const handleRunEvaluation = async (testCaseId: string): Promise<EvalResult> => {
    const result = await api.runEvaluation(testCaseId);
    setEvalResults((prev) => ({ ...prev, [testCaseId]: result }));
    return result;
  };

  const handleRunAllEvaluations = async () => {
    setIsRunningAllEvals(true);
    try {
      for (const tc of evalTestCases) {
        await handleRunEvaluation(tc.id);
      }
    } finally {
      setIsRunningAllEvals(false);
    }
  };

  // Knowledge base handlers
  const handleAddDocument = async (doc: { title: string; content: string; category?: string; tags?: string[] }) => {
    const created = await api.addDocument(doc);
    setDocuments((prev) => [created, ...prev]);
  };

  const handleDeleteDocument = async (id: string) => {
    await api.deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSearchKnowledge = async (query: string) => {
    return await api.searchDocuments(query);
  };

  // Clear Audit Logs
  const handleClearAuditLogs = async () => {
    await api.clearAuditLogs();
    setAuditLogs([]);
  };

  // Reset Factory Defaults
  const handleResetData = async () => {
    await api.resetData();
    await refreshAllData();
    setAnalysisResult(null);
    setTranscript('');
    setStages([]);
  };

  // Compute Dashboard Statistics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasksCount = tasks.filter((t) => t.status === 'In Progress').length;
  const pendingTasksCount = tasks.filter((t) => !t.status || t.status === 'Pending').length;
  const pendingConfCount = auditLogs.filter((l) => l.confirmationStatus === 'AWAITING_CONFIRMATION').length;

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'System Overview';
      case 'assistant':
        return 'Voice & Text Assistant';
      case 'tasks':
        return 'Tasks Dashboard';
      case 'knowledge':
        return 'Knowledge Base (RAG)';
      case 'audit':
        return 'Audit Logs';
      case 'evaluation':
        return 'Benchmark Evaluation';
      case 'settings':
        return 'System Settings';
      default:
        return 'AI Voice-to-Action Assistant';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        apiConnected={apiConnected}
        modelName={settings.modelName}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <Header
          onOpenMobileMenu={() => setMobileOpen(true)}
          onTryDemo={handleTryDemo}
          title={getPageTitle()}
          subtitle="ReAct Pattern • RAG Grounding • Consequential Guardrails"
          groundingEnabled={settings.groundingEnabled}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              stats={{
                totalTasks: totalTasksCount,
                completedTasks: completedTasksCount,
                inProgressTasks: inProgressTasksCount,
                pendingTasks: pendingTasksCount,
                pendingConfirmation: pendingConfCount,
                totalAnalyses: recentAnalyses.length,
                totalAuditRecords: auditLogs.length,
              }}
              recentAnalyses={recentAnalyses}
              onNavigateToVoice={() => {
                setCurrentTab('assistant');
                setCurrentTabInput('voice');
              }}
              onNavigateToText={() => {
                setCurrentTab('assistant');
                setCurrentTabInput('text');
              }}
              onTryDemo={handleTryDemo}
              onViewAnalysis={(an) => {
                const out = an.aiOutput || an.output;
                if (out) {
                  setAnalysisResult(out);
                  setTranscript(an.transcript || an.originalInput || '');
                  setCurrentAuditId(an.id);
                  if (out.processing_stages && out.processing_stages.length > 0) {
                    setStages(out.processing_stages);
                  }
                  setCurrentTab('assistant');
                }
              }}
            />
          )}

          {currentTab === 'assistant' && (
            <VoiceAssistantPage
              currentTabInput={currentTabInput}
              setCurrentTabInput={setCurrentTabInput}
              transcript={transcript}
              setTranscript={setTranscript}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              stages={stages}
              analysisResult={analysisResult}
              analysisError={analysisError}
              auditId={currentAuditId}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onRefine={handleRefine}
              isRefining={isRefining}
              onConfirmAction={handleConfirmAction}
              onCancelAction={handleCancelAction}
              onExportJSON={handleExportJSON}
              onExportCSV={handleExportCSV}
              onTryDemo={handleTryDemo}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksPage
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onExportCSV={handleExportCSV}
              onExportJSON={handleExportJSON}
            />
          )}

          {currentTab === 'knowledge' && (
            <KnowledgeBasePage
              documents={documents}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
              onSearch={handleSearchKnowledge}
            />
          )}

          {currentTab === 'audit' && (
            <AuditLogsPage
              logs={auditLogs}
              onClearLogs={handleClearAuditLogs}
              onRefreshLogs={async () => {
                const updated = await api.getAuditLogs();
                setAuditLogs(updated);
              }}
            />
          )}

          {currentTab === 'evaluation' && (
            <EvaluationPage
              evalTestCases={evalTestCases}
              onRunEvaluation={handleRunEvaluation}
              onRunAllEvaluations={handleRunAllEvaluations}
              evalResults={evalResults}
              isRunningAll={isRunningAllEvals}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              settings={settings}
              onUpdateSettings={async (newSet) => {
                const updated = await api.updateSettings(newSet);
                setSettings(updated);
              }}
              onResetData={handleResetData}
              apiConnected={apiConnected}
            />
          )}
        </main>
      </div>
    </div>
  );
}
