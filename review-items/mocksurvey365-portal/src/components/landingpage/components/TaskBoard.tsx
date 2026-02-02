
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { Task } from './TaskCard';
import type { Column } from './TaskColumn';
import TaskColumn from './TaskColumn';

// Initial data for the task board
const initialColumns: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    color: 'muted',
    tasks: [
      {
        id: 't1',
        title: 'Review nurse schedule for next week',
        description: 'Check staffing levels and identify potential shortages',
        tag: { color: 'purple', label: 'Scheduling' },
        dueDate: 'May 20',
        assignees: 2,
        progress: { completed: 3, total: 5 }
      },
      {
        id: 't2',
        title: 'Update credential expiration dates',
        description: 'Review and update nurse licenses and certifications',
        tag: { color: 'accent', label: 'Compliance' },
        dueDate: 'May 22',
        assignees: 1,
        progress: { completed: 0, total: 4 }
      },
      {
        id: 't3',
        title: 'Process float pool requests',
        description: 'Review and approve float nurse assignments',
        tag: { color: 'blue', label: 'Staffing' },
        dueDate: 'May 24',
        assignees: 2,
        progress: { completed: 0, total: 6 }
      },
      {
        id: 't4',
        title: 'Update unit policies',
        description: 'Review and revise unit-specific procedures',
        tag: { color: 'purple', label: 'Administration' },
        dueDate: 'May 25',
        assignees: 1,
        progress: { completed: 0, total: 3 }
      }
    ]
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: 'blue',
    tasks: [
      {
        id: 't5',
        title: 'Patient census review',
        description: 'Analyze current patient levels and acuity scores',
        tag: { color: 'blue', label: 'Patient Care' },
        dueDate: 'May 18',
        assignees: 1,
        progress: { completed: 2, total: 3 }
      },
      {
        id: 't6',
        title: 'Shift handoff documentation',
        description: 'Complete patient handoff notes for next shift',
        tag: { color: 'accent', label: 'Nursing' },
        dueDate: 'May 19',
        assignees: 2,
        progress: { completed: 5, total: 8 }
      },
      {
        id: 't7',
        title: 'Staff training coordination',
        description: 'Schedule mandatory training sessions for nursing staff',
        tag: { color: 'purple', label: 'HR' },
        dueDate: 'May 17',
        assignees: 1,
        progress: { completed: 3, total: 4 }
      }
    ]
  },
  {
    id: 'in-review',
    title: 'In Review',
    color: 'amber',
    tasks: [
      {
        id: 't8',
        title: 'Quality assurance audit',
        description: 'Review patient care standards and compliance',
        tag: { color: 'accent', label: 'Quality' },
        dueDate: 'May 15',
        assignees: 1,
        progress: { completed: 4, total: 5 }
      },
      {
        id: 't9',
        title: 'Budget allocation review',
        description: 'Review department budgets and resource allocation',
        tag: { color: 'blue', label: 'Finance' },
        dueDate: 'May 16',
        assignees: 2,
        progress: { completed: 6, total: 6 }
      },
      {
        id: 't10',
        title: 'Emergency response protocols',
        description: 'Update emergency procedures and staff training',
        tag: { color: 'purple', label: 'Safety' },
        dueDate: 'May 14',
        assignees: 1,
        progress: { completed: 12, total: 12 }
      }
    ]
  },
  {
    id: 'completed',
    title: 'Completed',
    color: 'accent',
    tasks: [
      {
        id: 't11',
        title: 'Monthly staff meeting',
        description: 'Conducted department-wide staff meeting and updates',
        tag: { color: 'purple', label: 'Administration' },
        dueDate: 'May 10',
        assignees: 1,
        progress: { completed: 5, total: 5 }
      },
      {
        id: 't12',
        title: 'Equipment inventory check',
        description: 'Completed quarterly medical equipment inventory',
        tag: { color: 'blue', label: 'Facilities' },
        dueDate: 'May 9',
        assignees: 1,
        progress: { completed: 4, total: 4 }
      },
      {
        id: 't13',
        title: 'Patient satisfaction survey',
        description: 'Analyzed patient feedback and satisfaction scores',
        tag: { color: 'accent', label: 'Quality' },
        dueDate: 'May 8',
        assignees: 2,
        progress: { completed: 7, total: 7 }
      }
    ]
  }
];

interface TaskBoardProps {
  className?: string;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ className }) => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [, setDragSourceColumn] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTaskDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id);
    setDraggedTask(task);
    
    // Find source column
    const sourceColumn = columns.find(col => 
      col.tasks.some((t: Task) => t.id === task.id)
    );
    
    if (sourceColumn) {
      setDragSourceColumn(sourceColumn.id);
      e.dataTransfer.setData('sourceColumnId', sourceColumn.id);
    }
  };

  const handleTaskDragEnd = () => {
    setDraggedTask(null);
    setDragSourceColumn(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (_e: React.DragEvent) => {
    // Handle drag leave logic if needed
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    
    const taskId = e.dataTransfer.getData('taskId');
    const sourceColumnId = e.dataTransfer.getData('sourceColumnId');
    
    if (!taskId || !sourceColumnId || sourceColumnId === targetColumnId) {
      return;
    }
    
    // Update columns state
    const newColumns = columns.map(column => {
      // Remove task from source column
      if (column.id === sourceColumnId) {
        return {
          ...column,
          tasks: column.tasks.filter((task: Task) => task.id !== taskId)
        };
      }
      
      // Add task to target column
      if (column.id === targetColumnId) {
        const taskToMove = columns.find(col => col.id === sourceColumnId)?.tasks.find((task: Task) => task.id === taskId);
        if (taskToMove) {
          return {
            ...column,
            tasks: [...column.tasks, taskToMove]
          };
        }
      }
      
      return column;
    });
    
    setColumns(newColumns);
    
    // Show a toast notification
    const targetColumn = columns.find(col => col.id === targetColumnId);
    if (targetColumn && draggedTask) {
      toast({
        title: "Task moved",
        description: `${draggedTask.title} moved to ${targetColumn.title}`,
      });
    }
  };

  const handleStatusChange = (_taskId: string, _newStatus: string) => {
    // This function can be used for programmatic status changes (not used in this implementation)
  };

  return (
    <div className={`flex gap-4 overflow-x-auto pb-4 ${className}`}>
      {columns.map(column => (
        <TaskColumn
          key={column.id}
          column={column}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onTaskDragStart={handleTaskDragStart}
          onTaskDragEnd={handleTaskDragEnd}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
};

export default TaskBoard;
