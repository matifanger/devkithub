import {
  ClipboardList,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Textarea } from '../components/ui/textarea';

type TimerMode = 'work' | 'short-break' | 'long-break';

interface Task {
  id: string;
  title: string;
  notes: string;
  pomodorosRequired: number;
  pomodorosCompleted: number;
}

const DEFAULT_TIMES = {
  work: 25 * 60, // 25 minutes
  'short-break': 5 * 60, // 5 minutes
  'long-break': 15 * 60, // 15 minutes
};

// This will be replaced with actual audio files from the public folder
const AVAILABLE_SOUNDS = [
  { id: 'bell', name: 'Bell', url: 'static://assets/sounds/bell.mp3' },
  { id: 'assistant', name: 'Assistant', url: 'static://assets/sounds/assistant.mp3' },
  { id: 'hong-kong', name: 'Hong Kong', url: 'static://assets/sounds/hong-kong.mp3' },
  { id: 'notification', name: 'Notification', url: 'static://assets/sounds/soft.mp3' },
  { id: 'level-up', name: 'Level Up', url: 'static://assets/sounds/level-up.mp3' },
  { id: 'tokyo', name: 'Tokyo', url: 'static://assets/sounds/tokyo.mp3' },
  { id: 'three', name: 'Three', url: 'static://assets/sounds/three.mp3' },
  { id: 'among-us', name: 'Among Us', url: 'static://assets/sounds/among-us.mp3' },
];

export function PomodoroTimerPage() {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMES[mode]);
  const [isRunning, setIsRunning] = useState(false);
  const [workTime, setWorkTime] = useState(25);
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  const [selectedSound, setSelectedSound] = useState(AVAILABLE_SOUNDS[0].id);
  const [volume, setVolume] = useState(0.5);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: '', notes: '', pomodorosRequired: 1 });
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Calculate finish time
  const calculateFinishTime = () => {
    if (!currentTaskId) return null;
    const currentTask = tasks.find((t) => t.id === currentTaskId);
    if (!currentTask) return null;

    const remainingPomodoros = currentTask.pomodorosRequired - currentTask.pomodorosCompleted;
    const totalMinutes = remainingPomodoros * workTime + (remainingPomodoros - 1) * shortBreakTime;
    const finishTime = new Date(Date.now() + totalMinutes * 60 * 1000);
    return finishTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      const sound = AVAILABLE_SOUNDS.find((s) => s.id === selectedSound);
      if (sound) {
        const audio = new Audio(sound.url);
        audio.volume = volume;
        audio.play().catch((error) => {
          console.error('Error playing sound:', error);
        });
      }
      setIsRunning(false);

      // Update task completion if in work mode
      if (mode === 'work' && currentTaskId) {
        setTasks(
          tasks.map((task) =>
            task.id === currentTaskId
              ? { ...task, pomodorosCompleted: task.pomodorosCompleted + 1 }
              : task
          )
        );
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, selectedSound, volume, mode, currentTaskId, tasks]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(DEFAULT_TIMES[newMode]);
    setIsRunning(false);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTimeLeft(DEFAULT_TIMES[mode]);
    setIsRunning(false);
  };

  const updateTimes = () => {
    const newTimes = {
      work: workTime * 60,
      'short-break': shortBreakTime * 60,
      'long-break': longBreakTime * 60,
    };
    DEFAULT_TIMES.work = newTimes.work;
    DEFAULT_TIMES['short-break'] = newTimes['short-break'];
    DEFAULT_TIMES['long-break'] = newTimes['long-break'];
    setTimeLeft(DEFAULT_TIMES[mode]);
    setIsSettingsOpen(false);
  };

  const addTask = () => {
    if (newTask.title.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.title,
        notes: newTask.notes,
        pomodorosRequired: newTask.pomodorosRequired,
        pomodorosCompleted: 0,
      };
      setTasks([...tasks, task]);
      setNewTask({ title: '', notes: '', pomodorosRequired: 1 });
      setIsAddTaskOpen(false);
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
    if (currentTaskId === taskId) {
      setCurrentTaskId(null);
    }
  };

  const playSound = (soundId: string) => {
    const sound = AVAILABLE_SOUNDS.find((s) => s.id === soundId);
    if (sound) {
      const audio = new Audio(sound.url);
      audio.volume = volume;
      audio.play().catch((error) => {
        console.error('Error playing sound:', error);
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Pomodoro Timer</h1>
        <p className="text-muted-foreground">
          Stay focused and productive with the Pomodoro Technique
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Timer</CardTitle>
            <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 mt-36" side="left">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Timer Settings</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure timer duration and sound options
                    </p>
                  </div>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="work-time">Work Time (minutes)</Label>
                        <Input
                          id="work-time"
                          type="number"
                          value={workTime}
                          onChange={(e) => setWorkTime(parseInt(e.target.value))}
                          min="1"
                          max="60"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="short-break-time">Short Break (minutes)</Label>
                        <Input
                          id="short-break-time"
                          type="number"
                          value={shortBreakTime}
                          onChange={(e) => setShortBreakTime(parseInt(e.target.value))}
                          min="1"
                          max="30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="long-break-time">Long Break (minutes)</Label>
                        <Input
                          id="long-break-time"
                          type="number"
                          value={longBreakTime}
                          onChange={(e) => setLongBreakTime(parseInt(e.target.value))}
                          min="1"
                          max="60"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sound-select">Timer Sound</Label>
                      <Select
                        value={selectedSound}
                        onValueChange={(value) => {
                          setSelectedSound(value);
                          playSound(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a sound" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_SOUNDS.map((sound) => (
                            <SelectItem key={sound.id} value={sound.id}>
                              {sound.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="volume-slider">Volume</Label>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(volume * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <Slider
                          id="volume-slider"
                          value={[volume * 100]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={([value]) => {
                            setVolume(value / 100);
                          }}
                          onValueCommit={([value]) => {
                            playSound(selectedSound);
                          }}
                        />
                      </div>
                    </div>
                    <Button onClick={updateTimes}>Save Settings</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-4">
              <Button
                variant={mode === 'work' ? 'default' : 'outline'}
                onClick={() => handleModeChange('work')}
              >
                Work
              </Button>
              <Button
                variant={mode === 'short-break' ? 'default' : 'outline'}
                onClick={() => handleModeChange('short-break')}
              >
                Short Break
              </Button>
              <Button
                variant={mode === 'long-break' ? 'default' : 'outline'}
                onClick={() => handleModeChange('long-break')}
              >
                Long Break
              </Button>
            </div>

            <div className="text-center">
              <div className="text-6xl font-bold mb-8">{formatTime(timeLeft)}</div>
              <div className="flex justify-center gap-4">
                <Button onClick={toggleTimer} size="lg">
                  {isRunning ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                  {isRunning ? 'Pause' : 'Start'}
                </Button>
                <Button onClick={resetTimer} variant="outline" size="lg">
                  <RotateCcw className="mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Tasks</CardTitle>
            <Button onClick={() => setIsAddTaskOpen(true)} size="sm">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No tasks yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first task to start tracking your pomodoros
                  </p>
                  <Button onClick={() => setIsAddTaskOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Task
                  </Button>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border ${
                      currentTaskId === task.id ? 'bg-primary/10 border-primary' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground">{task.notes}</div>
                        <div className="text-sm">
                          Progress: {task.pomodorosCompleted}/{task.pomodorosRequired} pomodoros
                        </div>
                        {currentTaskId === task.id && (
                          <div className="text-sm text-primary">
                            Estimated finish: {calculateFinishTime()}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {currentTaskId === task.id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentTaskId(null);
                              setIsRunning(false);
                            }}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentTaskId(task.id)}
                          >
                            Start
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-notes">Notes</Label>
              <Textarea
                id="task-notes"
                value={newTask.notes}
                onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                placeholder="Add any notes..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pomodoros-required">Required Pomodoros</Label>
              <Input
                id="pomodoros-required"
                type="number"
                value={newTask.pomodorosRequired}
                onChange={(e) =>
                  setNewTask({ ...newTask, pomodorosRequired: parseInt(e.target.value) })
                }
                min="1"
                max="10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addTask}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
