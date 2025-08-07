import { useState, useEffect } from 'react';
import { Plus, X, Check, Star, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import './WeeklyTodoApp.css';

export default function WeeklyTodoApp() {
  const [tasks, setTasks] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [filter, setFilter] = useState('all');

  const daysOfWeek = [
    { key: 0, name: 'Sunday', short: 'Sun' },
    { key: 1, name: 'Monday', short: 'Mon' },
    { key: 2, name: 'Tuesday', short: 'Tue' },
    { key: 3, name: 'Wednesday', short: 'Wed' },
    { key: 4, name: 'Thursday', short: 'Thu' },
    { key: 5, name: 'Friday', short: 'Fri' },
    { key: 6, name: 'Saturday', short: 'Sat' }
  ];

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('weekly-todo-tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
    
    // Clean up old completed tasks at midnight
    cleanupOldTasks();
  }, []);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem('weekly-todo-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Clean up completed tasks from previous days
  const cleanupOldTasks = () => {
    const today = new Date().toDateString();
    const lastCleanup = localStorage.getItem('last-cleanup-date');
    
    if (lastCleanup !== today) {
      // Remove completed tasks from all days
      setTasks(prevTasks => {
        const cleanedTasks = {};
        Object.keys(prevTasks).forEach(day => {
          cleanedTasks[day] = prevTasks[day].filter(task => !task.completed);
        });
        return cleanedTasks;
      });
      
      localStorage.setItem('last-cleanup-date', today);
    }
  };

  const getTodaysTasks = () => {
    return tasks[selectedDay] || [];
  };

  const addTask = () => {
    if (inputValue.trim() !== '') {
      const newTask = {
        id: Date.now(),
        text: inputValue,
        completed: false,
        priority: false,
        time: selectedTime || null,
        createdAt: new Date().toLocaleDateString()
      };
      
      setTasks(prev => ({
        ...prev,
        [selectedDay]: [...(prev[selectedDay] || []), newTask]
      }));
      setInputValue('');
      setSelectedTime('');
    }
  };

  const deleteTask = (id) => {
    setTasks(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).filter(task => task.id !== id)
    }));
  };

  const toggleComplete = (id) => {
    setTasks(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  const togglePriority = (id) => {
    setTasks(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map(task =>
        task.id === id ? { ...task, priority: !task.priority } : task
      )
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  const getFilteredTasks = () => {
    const dayTasks = getTodaysTasks();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const today = new Date().getDay();
    
    let filtered = dayTasks;
    
    // Filter out completed tasks with past times (only for today)
    if (selectedDay === today) {
      filtered = dayTasks.filter(task => {
        if (!task.completed || !task.time) return true;
        
        const [taskHour, taskMinute] = task.time.split(':').map(Number);
        const taskTimeInMinutes = taskHour * 60 + taskMinute;
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        
        return taskTimeInMinutes >= currentTimeInMinutes;
      });
    }
    
    if (filter === 'active') filtered = filtered.filter(task => !task.completed);
    if (filter === 'completed') filtered = filtered.filter(task => task.completed);
    
    // Sort by time, with timed tasks first, then untimed tasks
    return filtered.sort((a, b) => {
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      return 0;
    });
  };

  const getTaskCountForDay = (day) => {
    const dayTasks = tasks[day] || [];
    return dayTasks.length;
  };

  const getCompletedCountForDay = (day) => {
    const dayTasks = tasks[day] || [];
    return dayTasks.filter(task => task.completed).length;
  };

  const getHiddenCompletedCount = () => {
    const today = new Date().getDay();
    if (selectedDay !== today) return 0;
    
    const dayTasks = getTodaysTasks();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    return dayTasks.filter(task => {
      if (!task.completed || !task.time) return false;
      
      const [taskHour, taskMinute] = task.time.split(':').map(Number);
      const taskTimeInMinutes = taskHour * 60 + taskMinute;
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      
      return taskTimeInMinutes < currentTimeInMinutes;
    }).length;
  };

  const getTotalWeekStats = () => {
    let total = 0;
    let completed = 0;
    let priority = 0;

    Object.values(tasks).forEach(dayTasks => {
      total += dayTasks.length;
      completed += dayTasks.filter(t => t.completed).length;
      priority += dayTasks.filter(t => t.priority && !t.completed).length;
    });

    return { total, completed, priority };
  };

  const todaysTasks = getTodaysTasks();
  const filteredTasks = getFilteredTasks();
  const completedCount = todaysTasks.filter(task => task.completed).length;
  const totalCount = todaysTasks.length;
  const weekStats = getTotalWeekStats();
  const today = new Date().getDay();
  const hiddenCompletedCount = getHiddenCompletedCount();

  // Get available times for time picker (filter past times for current day)
  const getAvailableTimes = () => {
    const times = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // If selected day is today, start from current time + 30 minutes
    // If it's another day, show all times
    const startHour = selectedDay === today ? Math.max(0, currentHour) : 0;
    
    for (let hour = startHour; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip past times for today
        if (selectedDay === today) {
          if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) {
            continue;
          }
        }
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    
    return times;
  };

  const navigateDay = (direction) => {
    if (direction === 'prev') {
      setSelectedDay(selectedDay === 0 ? 6 : selectedDay - 1);
    } else {
      setSelectedDay(selectedDay === 6 ? 0 : selectedDay + 1);
    }
    // Clear selected time when changing days to avoid confusion
    setSelectedTime('');
  };

  const availableTimes = getAvailableTimes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            ✨ Weekly Planner
          </h1>
          <p className="text-gray-600">Organize your week, one day at a time</p>
        </div>

        {/* Week Overview Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 mb-6 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-purple-600" />
              <span className="font-semibold text-gray-700">Week Overview</span>
            </div>
            <div className="text-sm text-gray-600">
              Total: {weekStats.total} tasks • {weekStats.completed} completed
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((day) => {
              const taskCount = getTaskCountForDay(day.key);
              const completedCount = getCompletedCountForDay(day.key);
              const isToday = day.key === today;
              const isSelected = day.key === selectedDay;
              
              return (
                <button
                  key={day.key}
                  onClick={() => setSelectedDay(day.key)}
                  className={`p-3 rounded-xl transition-all duration-200 relative ${
                    isSelected
                      ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg scale-105'
                      : isToday
                      ? 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-800 border-2 border-amber-300'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium">{day.short}</div>
                  <div className="text-xs mt-1">
                    {taskCount > 0 ? (
                      <span className={isSelected ? 'text-white/90' : 'text-gray-500'}>
                        {completedCount}/{taskCount}
                      </span>
                    ) : (
                      <span className={isSelected ? 'text-white/60' : 'text-gray-400'}>
                        -
                      </span>
                    )}
                  </div>
                  {isToday && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Task Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Day Header */}
          <div className="p-6 bg-gradient-to-r from-purple-500 to-blue-500">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateDay('prev')}
                className="p-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl hover:bg-white/30 transition-all duration-200"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">
                  {daysOfWeek[selectedDay].name}
                </h2>
                <p className="text-white/80 text-sm">
                  {selectedDay === today ? 'Today' : daysOfWeek[selectedDay].name}
                </p>
              </div>
              
              <button
                onClick={() => navigateDay('next')}
                className="p-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl hover:bg-white/30 transition-all duration-200"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Add Task Input */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`What's planned for ${daysOfWeek[selectedDay].name}?`}
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30"
                  />
                </div>
                <button
                  onClick={addTask}
                  className="px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 hover:scale-105"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>Time (optional):</span>
                </div>
                {availableTimes.length > 0 ? (
                  <>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30"
                    >
                      <option value="" className="text-gray-800">Select time</option>
                      {availableTimes.map(time => (
                        <option key={time} value={time} className="text-gray-800">
                          {new Date(`2000-01-01T${time}`).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}
                        </option>
                      ))}
                    </select>
                    {selectedTime && (
                      <button
                        onClick={() => setSelectedTime('')}
                        className="text-white/60 hover:text-white text-sm"
                      >
                        Clear
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-white/60 text-sm italic">
                    {selectedDay === today ? 'No more times available today' : 'No times available'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Section */}
          {totalCount > 0 && (
            <div className="px-6 py-4 bg-white/50 border-b border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {daysOfWeek[selectedDay].name}'s Progress
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-700">
                  {completedCount}/{totalCount} completed
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                ></div>
              </div>
              {completedCount === totalCount && totalCount > 0 && (
                <div className="text-center mt-3 text-green-600 font-medium animate-pulse">
                  🎉 {daysOfWeek[selectedDay].name}'s tasks completed!
                </div>
              )}
            </div>
          )}

          {/* Filter Tabs */}
          {totalCount > 0 && (
            <div className="px-6 py-4 bg-white/30 border-b border-gray-100">
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {[
                  { key: 'all', label: 'All', count: totalCount },
                  { key: 'active', label: 'Active', count: totalCount - completedCount },
                  { key: 'completed', label: 'Completed', count: completedCount }
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filter === key
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-purple-600'
                    }`}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="p-6">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                {totalCount === 0 ? (
                  <div className="space-y-3">
                    <div className="text-6xl">📅</div>
                    <p className="text-gray-500 text-lg">No tasks for {daysOfWeek[selectedDay].name}</p>
                    <p className="text-gray-400 text-sm">Add your first task above to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-6xl">
                      {filter === 'completed' ? '✅' : '🔍'}
                    </div>
                    <p className="text-gray-500 text-lg">
                      No {filter} tasks for {daysOfWeek[selectedDay].name}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                      task.completed 
                        ? 'bg-gray-50/80 border-gray-200' 
                        : task.priority
                        ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-purple-200'
                    }`}
                    style={{ 
                      animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          task.completed
                            ? 'bg-green-500 border-green-500 text-white scale-110'
                            : 'border-gray-300 hover:border-green-400 hover:scale-110'
                        }`}
                      >
                        {task.completed && <Check size={14} />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            {task.time && (
                              <div className="text-xs font-semibold text-purple-600 mb-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {new Date(`2000-01-01T${task.time}`).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}
                              </div>
                            )}
                            <span
                              className={`transition-all duration-200 ${
                                task.completed 
                                  ? 'text-gray-500 line-through' 
                                  : 'text-gray-800'
                              }`}
                            >
                              {task.text}
                            </span>
                          </div>
                          {task.priority && !task.completed && (
                            <Star size={14} className="text-amber-500 fill-amber-500 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Added {task.createdAt}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => togglePriority(task.id)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            task.priority
                              ? 'text-amber-500 hover:bg-amber-50'
                              : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                          }`}
                        >
                          <Star size={16} className={task.priority ? 'fill-amber-500' : ''} />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hidden Completed Tasks Counter */}
          {hiddenCompletedCount > 0 && (
            <div className="px-6 py-3 bg-green-50/80 border-t border-green-100">
              <div className="text-center text-sm text-green-600">
                ✅ {hiddenCompletedCount} task{hiddenCompletedCount > 1 ? 's' : ''} completed earlier today
              </div>
            </div>
          )}

          {/* Footer Stats */}
          {totalCount > 0 && (
            <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100">
              <div className="flex justify-center gap-8 text-sm">
                <div className="text-center">
                  <div className="font-bold text-purple-600">{totalCount - completedCount}</div>
                  <div className="text-gray-500">Remaining</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{completedCount}</div>
                  <div className="text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-amber-600">
                    {todaysTasks.filter(t => t.priority && !t.completed).length}
                  </div>
                  <div className="text-gray-500">Priority</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}