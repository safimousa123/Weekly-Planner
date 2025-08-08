import { useState, useEffect } from 'react';
import { Plus, X, Check, Star, Calendar, ChevronLeft, ChevronRight, Grid3X3, List } from 'lucide-react';

export default function WeeklyTodoApp() {
  const [tasks, setTasks] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' or 'monthly'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalDate, setModalDate] = useState(null); // For modal popup
  const [modalInputValue, setModalInputValue] = useState('');
  const [modalSelectedTime, setModalSelectedTime] = useState('');

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
      setTasks(prevTasks => {
        const cleanedTasks = {};
        Object.keys(prevTasks).forEach(dateKey => {
          cleanedTasks[dateKey] = prevTasks[dateKey].filter(task => !task.completed);
        });
        return cleanedTasks;
      });
      
      localStorage.setItem('last-cleanup-date', today);
    }
  };

  // Get date key for storing tasks (YYYY-MM-DD format)
  const getDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Check if a date is in the past
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get selected date based on view mode
  const getSelectedDate = () => {
    if (viewMode === 'weekly') {
      const today = new Date();
      const currentDay = today.getDay();
      const daysUntilSelected = selectedDay - currentDay;
      const selectedDate = new Date();
      selectedDate.setDate(today.getDate() + daysUntilSelected);
      return selectedDate;
    }
    return currentDate;
  };

  const getTasksForDate = (date) => {
    const dateKey = getDateKey(date);
    return tasks[dateKey] || [];
  };

  const addTask = () => {
    if (inputValue.trim() !== '') {
      const targetDate = getSelectedDate();
      
      // Prevent adding tasks to past dates
      if (isPastDate(targetDate)) {
        return;
      }

      const newTask = {
        id: Date.now(),
        text: inputValue,
        completed: false,
        priority: false,
        time: selectedTime || null,
        createdAt: targetDate.toLocaleDateString(),
        dateKey: getDateKey(targetDate)
      };
      
      const dateKey = getDateKey(targetDate);
      setTasks(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), newTask]
      }));
      setInputValue('');
      setSelectedTime('');
    }
  };

  const addModalTask = () => {
    if (modalInputValue.trim() !== '' && modalDate) {
      // Prevent adding tasks to past dates
      if (isPastDate(modalDate)) {
        return;
      }

      const newTask = {
        id: Date.now(),
        text: modalInputValue,
        completed: false,
        priority: false,
        time: modalSelectedTime || null,
        createdAt: modalDate.toLocaleDateString(),
        dateKey: getDateKey(modalDate)
      };
      
      const dateKey = getDateKey(modalDate);
      setTasks(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), newTask]
      }));
      setModalInputValue('');
      setModalSelectedTime('');
    }
  };

  const handleModalKeyPress = (e) => {
    if (e.key === 'Enter') {
      addModalTask();
    }
  };

  const openDayModal = (date) => {
    setModalDate(date);
    setModalInputValue('');
    setModalSelectedTime('');
  };

  const closeDayModal = () => {
    setModalDate(null);
    setModalInputValue('');
    setModalSelectedTime('');
  };

  // Get available times for modal
  const getModalAvailableTimes = () => {
    if (!modalDate) return [];
    
    const times = [];
    const now = new Date();
    const isTargetToday = isToday(modalDate);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const startHour = isTargetToday ? Math.max(0, currentHour) : 0;
    
    for (let hour = startHour; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (isTargetToday && (hour < currentHour || (hour === currentHour && minute <= currentMinute))) {
          continue;
        }
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    
    return times;
  };

  const deleteTask = (id, dateKey) => {
    setTasks(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter(task => task.id !== id)
    }));
  };

  const toggleComplete = (id, dateKey) => {
    setTasks(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  const togglePriority = (id, dateKey) => {
    setTasks(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).map(task =>
        task.id === id ? { ...task, priority: !task.priority } : task
      )
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  // Get available times for time picker
  const getAvailableTimes = () => {
    const times = [];
    const targetDate = getSelectedDate();
    const now = new Date();
    const isTargetToday = isToday(targetDate);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const startHour = isTargetToday ? Math.max(0, currentHour) : 0;
    
    for (let hour = startHour; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (isTargetToday && (hour < currentHour || (hour === currentHour && minute <= currentMinute))) {
          continue;
        }
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    
    return times;
  };

  // Monthly view functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateDay = (direction) => {
    if (direction === 'prev') {
      setSelectedDay(selectedDay === 0 ? 6 : selectedDay - 1);
    } else {
      setSelectedDay(selectedDay === 6 ? 0 : selectedDay + 1);
    }
    setSelectedTime('');
  };

  const renderMonthlyView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/50 rounded-lg"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = getDateKey(date);
      const dayTasks = tasks[dateKey] || [];
      const isPast = isPastDate(date);
      const isCurrentDay = isToday(date);
      
      days.push(
        <button
          key={day}
          onClick={() => openDayModal(date)}
          className={`h-24 p-2 rounded-lg border transition-all duration-200 hover:shadow-md ${
            isCurrentDay
              ? 'bg-gradient-to-br from-purple-100 to-blue-100 border-purple-300 shadow-md'
              : isPast
              ? 'bg-gray-50/80 border-gray-200 hover:bg-gray-100/80'
              : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-purple-200'
          }`}
        >
          <div className={`text-sm font-medium ${isCurrentDay ? 'text-purple-700' : isPast ? 'text-gray-500' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="mt-1 space-y-1">
            {dayTasks.slice(0, 2).map(task => (
              <div
                key={task.id}
                className={`text-xs p-1 rounded truncate ${
                  task.completed
                    ? 'bg-green-100 text-green-700 line-through'
                    : task.priority
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {task.time && <span className="font-medium">{task.time} </span>}
                {task.text}
              </div>
            ))}
            {dayTasks.length > 2 && (
              <div className="text-xs text-gray-500">+{dayTasks.length - 2} more</div>
            )}
          </div>
        </button>
      );
    }
    
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Month Header */}
        <div className="p-6 bg-gradient-to-r from-purple-500 to-blue-500">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl hover:bg-white/30 transition-all duration-200"
            >
              <ChevronLeft size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-white">{monthYear}</h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl hover:bg-white/30 transition-all duration-200"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {daysOfWeek.map(day => (
              <div key={day.key} className="text-center text-sm font-medium text-gray-500 py-2">
                {day.short}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {days}
          </div>
        </div>
      </div>
    );
  };

  const renderWeeklyView = () => {
    const selectedDate = getSelectedDate();
    const selectedTasks = getTasksForDate(selectedDate);
    const filteredTasks = selectedTasks.filter(task => {
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    }).sort((a, b) => {
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return 0;
    });

    const completedCount = selectedTasks.filter(task => task.completed).length;
    const totalCount = selectedTasks.length;
    const isPastDay = isPastDate(selectedDate);
    const availableTimes = getAvailableTimes();

    return (
      <>
        {/* Week Overview Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 mb-6 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-purple-600" />
              <span className="font-semibold text-gray-700">Week Overview</span>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((day) => {
              const dayDate = new Date();
              const today = new Date();
              const currentDay = today.getDay();
              const daysUntilDay = day.key - currentDay;
              dayDate.setDate(today.getDate() + daysUntilDay);
              
              const dayTasks = getTasksForDate(dayDate);
              const taskCount = dayTasks.length;
              const completedCount = dayTasks.filter(task => task.completed).length;
              const isCurrentDay = day.key === today.getDay();
              const isSelected = day.key === selectedDay;
              
              return (
                <button
                  key={day.key}
                  onClick={() => setSelectedDay(day.key)}
                  className={`p-3 rounded-xl transition-all duration-200 relative ${
                    isSelected
                      ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg scale-105'
                      : isCurrentDay
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
                  {isCurrentDay && (
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
                  {selectedDate.toLocaleDateString()}
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
              {isPastDay ? (
                <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-center">
                  <p className="text-white/80 text-sm">📅 Cannot add tasks to past days</p>
                  <p className="text-white/60 text-xs mt-1">You can only view existing tasks for this day</p>
                </div>
              ) : (
                <>
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
                        No times available
                      </span>
                    )}
                  </div>
                </>
              )}
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
                    <p className="text-gray-500 text-lg">
                      No tasks for {daysOfWeek[selectedDay].name}
                    </p>
                    {!isPastDay && (
                      <p className="text-gray-400 text-sm">Add your first task above to get started!</p>
                    )}
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
                        onClick={() => toggleComplete(task.id, task.dateKey)}
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
                          onClick={() => togglePriority(task.id, task.dateKey)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            task.priority
                              ? 'text-amber-500 hover:bg-amber-50'
                              : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                          }`}
                        >
                          <Star size={16} className={task.priority ? 'fill-amber-500' : ''} />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id, task.dateKey)}
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
                    {selectedTasks.filter(t => t.priority && !t.completed).length}
                  </div>
                  <div className="text-gray-500">Priority</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            ✨ {viewMode === 'weekly' ? 'Weekly Planner' : 'Monthly Planner'}
          </h1>
          <p className="text-gray-600">
            {viewMode === 'weekly' ? 'Organize your week, one day at a time' : 'Plan your entire month at a glance'}
          </p>
          
          {/* View Mode Toggle */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-white/20">
              <button
                onClick={() => setViewMode('weekly')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'weekly'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                <List size={16} />
                Weekly View
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'monthly'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                <Grid3X3 size={16} />
                Monthly View
              </button>
            </div>
          </div>
        </div>

        {/* Render appropriate view */}
        {viewMode === 'weekly' ? renderWeeklyView() : renderMonthlyView()}

        {/* Day Modal */}
        {modalDate && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeDayModal}
          >
            <div 
              className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-purple-500 to-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center flex-1">
                    <h2 className="text-2xl font-bold text-white">
                      {modalDate.toLocaleDateString('en-US', { weekday: 'long' })}
                    </h2>
                    <p className="text-white/80 text-sm">
                      {modalDate.toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={closeDayModal}
                    className="p-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl hover:bg-white/30 transition-all duration-200"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Add Task Input */}
                <div className="space-y-3">
                  {isPastDate(modalDate) ? (
                    <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-center">
                      <p className="text-white/80 text-sm">📅 Cannot add tasks to past days</p>
                      <p className="text-white/60 text-xs mt-1">You can only view existing tasks for this day</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={modalInputValue}
                            onChange={(e) => setModalInputValue(e.target.value)}
                            onKeyPress={handleModalKeyPress}
                            placeholder={`What's planned for ${modalDate.toLocaleDateString('en-US', { weekday: 'long' })}?`}
                            className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30"
                          />
                        </div>
                        <button
                          onClick={addModalTask}
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
                        {getModalAvailableTimes().length > 0 ? (
                          <>
                            <select
                              value={modalSelectedTime}
                              onChange={(e) => setModalSelectedTime(e.target.value)}
                              className="px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30"
                            >
                              <option value="" className="text-gray-800">Select time</option>
                              {getModalAvailableTimes().map(time => (
                                <option key={time} value={time} className="text-gray-800">
                                  {new Date(`2000-01-01T${time}`).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}
                                </option>
                              ))}
                            </select>
                            {modalSelectedTime && (
                              <button
                                onClick={() => setModalSelectedTime('')}
                                className="text-white/60 hover:text-white text-sm"
                              >
                                Clear
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-white/60 text-sm italic">
                            No times available
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Modal Task List */}
              <div className="p-6 max-h-96 overflow-y-auto">
                {(() => {
                  const dayTasks = getTasksForDate(modalDate);
                  const completedCount = dayTasks.filter(task => task.completed).length;
                  const totalCount = dayTasks.length;

                  return (
                    <>
                      {/* Progress Section */}
                      {totalCount > 0 && (
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
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
                        </div>
                      )}

                      {dayTasks.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-3">📅</div>
                          <p className="text-gray-500">No tasks for this day</p>
                          {!isPastDate(modalDate) && (
                            <p className="text-gray-400 text-sm mt-1">Add your first task above!</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {dayTasks.map((task, index) => (
                            <div
                              key={task.id}
                              className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                                task.completed 
                                  ? 'bg-gray-50/80 border-gray-200' 
                                  : task.priority
                                  ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-sm'
                                  : 'bg-white border-gray-200 hover:border-purple-200'
                              }`}
                            >
                              <div className="flex items-center gap-4 p-4">
                                <button
                                  onClick={() => toggleComplete(task.id, task.dateKey)}
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
                                </div>
                                
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <button
                                    onClick={() => togglePriority(task.id, task.dateKey)}
                                    className={`p-2 rounded-lg transition-all duration-200 ${
                                      task.priority
                                        ? 'text-amber-500 hover:bg-amber-50'
                                        : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                                    }`}
                                  >
                                    <Star size={16} className={task.priority ? 'fill-amber-500' : ''} />
                                  </button>
                                  <button
                                    onClick={() => deleteTask(task.id, task.dateKey)}
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
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
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