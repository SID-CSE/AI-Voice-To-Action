import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  Trash2, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { StructuredTask, TaskPriority, TaskStatus } from '../types';

interface TasksPageProps {
  tasks: (StructuredTask & { createdAt?: string; updatedAt?: string })[];
  onAddTask: (task: Partial<StructuredTask>) => Promise<void>;
  onUpdateTask: (task: StructuredTask) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onExportCSV,
  onExportJSON,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<StructuredTask | null>(null);

  // New task form
  const [newTaskForm, setNewTaskForm] = useState({
    task: '',
    owner: '',
    deadline: '',
    priority: 'Medium' as TaskPriority,
  });

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = 
      t.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (t.status || 'Pending') === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.task.trim()) return;
    await onAddTask({
      task: newTaskForm.task,
      owner: newTaskForm.owner || 'Not specified',
      deadline: newTaskForm.deadline || 'Not specified',
      priority: newTaskForm.priority,
      status: 'Pending',
      confidence: 100,
      evidence: 'Created manually by user',
    });
    setNewTaskForm({ task: '', owner: '', deadline: '', priority: 'Medium' });
    setShowAddModal(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    await onUpdateTask(editingTask);
    setEditingTask(null);
  };

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  const getStatusBadgeClass = (status?: TaskStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'In Progress':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            <span>Task Management</span>
          </h2>
          <p className="text-xs text-slate-400">
            View, filter, update, and manage all extracted and manually added tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by task title or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Tasks Table / List */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 border-b border-slate-800 uppercase font-bold text-[10px] text-slate-400 tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Task Description</th>
              <th className="py-3.5 px-4">Owner</th>
              <th className="py-3.5 px-4">Deadline</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No tasks found matching your filters.
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 max-w-sm">
                    <div className="font-semibold text-white">{task.task}</div>
                    {task.evidence && (
                      <div className="text-[10px] text-slate-500 italic truncate max-w-xs mt-0.5">
                        "{task.evidence}"
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-200 font-medium">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      {task.owner}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {task.deadline}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeClass(task.priority)}`}>
                      {task.priority || 'Medium'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1">
                      {(['Pending', 'In Progress', 'Completed'] as TaskStatus[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => onUpdateTask({ ...task, status: st, userEdited: true })}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors cursor-pointer ${
                            task.status === st
                              ? getStatusBadgeClass(st)
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingTask({ ...task })}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Add New Task
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-medium">Task Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Set up payment webhook"
                  value={newTaskForm.task}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, task: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium">Assignee / Owner</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul"
                    value={newTaskForm.owner}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, owner: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Deadline</label>
                  <input
                    type="text"
                    placeholder="e.g. Friday 5 PM"
                    value={newTaskForm.deadline}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, deadline: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium">Priority</label>
                <select
                  value={newTaskForm.priority}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value as any })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Edit Task
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-medium">Task Description</label>
                <input
                  type="text"
                  required
                  value={editingTask.task}
                  onChange={(e) => setEditingTask({ ...editingTask, task: e.target.value, userEdited: true })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium">Assignee</label>
                  <input
                    type="text"
                    value={editingTask.owner}
                    onChange={(e) => setEditingTask({ ...editingTask, owner: e.target.value, userEdited: true })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Deadline</label>
                  <input
                    type="text"
                    value={editingTask.deadline}
                    onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value, userEdited: true })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium">Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any, userEdited: true })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Status</label>
                  <select
                    value={editingTask.status || 'Pending'}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as any, userEdited: true })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
