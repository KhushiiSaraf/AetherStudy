// --------------------------------------------------------------------------
// AetherStudy Pomodoro Timer Module
// --------------------------------------------------------------------------

window.PomodoroModule = {
  // Timer Durations (in seconds)
  durations: {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  },
  
  currentMode: 'work', // 'work', 'shortBreak', 'longBreak'
  timeLeft: 25 * 60,
  totalDuration: 25 * 60,
  timerId: null,
  isRunning: false,

  init() {
    this.loadSettingsFromState();
    this.setupEventListeners();
    this.renderView();
    this.updateQuickStatus();
  },

  loadSettingsFromState() {
    // Read durations from inputs if they were edited, or fall back to default
    const savedWork = parseInt(document.getElementById('setting-work').value) || 25;
    const savedShort = parseInt(document.getElementById('setting-short').value) || 5;
    const savedLong = parseInt(document.getElementById('setting-long').value) || 15;
    
    this.durations.work = savedWork * 60;
    this.durations.shortBreak = savedShort * 60;
    this.durations.longBreak = savedLong * 60;
    
    if (!this.isRunning) {
      this.timeLeft = this.durations[this.currentMode];
      this.totalDuration = this.durations[this.currentMode];
    }
  },

  setupEventListeners() {
    // Mode Buttons
    const modeBtns = document.querySelectorAll('.pomo-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isRunning) {
          if (!confirm("A focus session is currently running. Switch modes and reset?")) {
            return;
          }
        }
        
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.currentMode = btn.getAttribute('data-mode');
        this.resetTimer();
      });
    });

    // Start/Pause Button
    const toggleBtn = document.getElementById('timer-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (this.isRunning) {
          this.pauseTimer();
        } else {
          this.startTimer();
        }
      });
    }

    // Reset Button
    const resetBtn = document.getElementById('timer-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetTimer();
      });
    }

    // Skip Button
    const skipBtn = document.getElementById('timer-skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        if (confirm("Skip this timer session?")) {
          this.skipSession();
        }
      });
    }

    // Save durations settings
    const saveSettingsBtn = document.getElementById('save-timer-settings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => {
        this.loadSettingsFromState();
        this.renderView();
        alert("Durations updated successfully!");
      });
    }
  },

  startTimer() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    document.getElementById('timer-toggle-btn').textContent = "Pause Session";
    document.getElementById('timer-toggle-btn').classList.remove('btn-primary');
    document.getElementById('timer-toggle-btn').classList.add('btn-secondary');

    this.timerId = setInterval(() => {
      this.tick();
    }, 1000);
    
    this.updateQuickStatus();
  },

  pauseTimer() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    document.getElementById('timer-toggle-btn').textContent = "Resume Session";
    document.getElementById('timer-toggle-btn').classList.remove('btn-secondary');
    document.getElementById('timer-toggle-btn').classList.add('btn-primary');
    
    clearInterval(this.timerId);
    this.timerId = null;
    
    this.updateQuickStatus();
  },

  resetTimer() {
    this.pauseTimer();
    this.timeLeft = this.durations[this.currentMode];
    this.totalDuration = this.durations[this.currentMode];
    document.getElementById('timer-toggle-btn').textContent = "Start Session";
    
    this.renderView();
    this.updateQuickStatus();
    
    // Reset tab title
    document.title = "AetherStudy - Premium Study Planner";
  },

  skipSession() {
    this.pauseTimer();
    this.timeLeft = 0;
    this.tick(); // Trigger completion immediately
  },

  tick() {
    if (this.timeLeft > 0) {
      this.timeLeft--;
      this.renderView();
      this.updateQuickStatus();
      
      // Update browser tab title
      const modeLabel = this.currentMode === 'work' ? 'Work' : 'Break';
      document.title = `(${this.formatTime(this.timeLeft)}) ${modeLabel} - AetherStudy`;
    } else {
      this.handleCompletion();
    }
  },

  handleCompletion() {
    this.pauseTimer();
    
    // Sound play synth
    const soundType = document.getElementById('setting-sound').value;
    this.synthesizeSound(soundType);

    if (this.currentMode === 'work') {
      alert("Great job! Focus session completed. Take a break!");
      
      // Update state metrics
      window.App.state.pomosCount += 1;
      // Add standard work session length (minutes)
      const minutesSpent = Math.round(this.totalDuration / 60);
      window.App.state.studyTime += minutesSpent;

      // Update today's streak to active/completed
      const todayStr = window.App.getOffsetDate(0);
      window.App.state.studyStreak[todayStr] = true;

      // If active focus task is set, increment tomatoes
      if (window.App.state.focusTaskId) {
        const task = window.App.state.tasks.find(t => t.id === window.App.state.focusTaskId);
        if (task) {
          task.completedPomos = Math.min(task.estPomos, task.completedPomos + 1);
        }
      }

      window.App.saveState();

      // Automatically switch to short break mode
      this.switchModeAuto('shortBreak');
    } else {
      alert("Break is over! Ready to focus?");
      this.switchModeAuto('work');
    }
  },

  switchModeAuto(newMode) {
    this.currentMode = newMode;
    
    // Update tabs toggles
    const modeBtns = document.querySelectorAll('.pomo-mode-btn');
    modeBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-mode') === newMode) {
        btn.classList.add('active');
      }
    });

    this.resetTimer();
  },

  // Sound Synthesizer using Web Audio API
  synthesizeSound(type) {
    if (type === 'none') return;
    
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      
      if (type === 'bell') {
        // Digital alarm triple chime
        const playNote = (time, freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);
          
          gain.gain.setValueAtTime(0.4, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(time);
          osc.stop(time + 0.2);
        };
        
        const now = ctx.currentTime;
        playNote(now, 880);
        playNote(now + 0.25, 880);
        playNote(now + 0.5, 880);
      } else if (type === 'chime') {
        // High quality scale chime
        const now = ctx.currentTime;
        const playBell = (time, freq, dur) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);
          
          gain.gain.setValueAtTime(0.3, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(time);
          osc.stop(time + dur + 0.1);
        };

        playBell(now, 523.25, 0.4); // C5
        playBell(now + 0.2, 659.25, 0.4); // E5
        playBell(now + 0.4, 783.99, 0.8); // G5
      }
    } catch (err) {
      console.warn("Web Audio API not allowed/supported in this state.", err);
    }
  },

  // Format MM:SS helper
  formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  },

  // Fast start clock trigger
  startTimerFromDashboard() {
    this.currentMode = 'work';
    const modeBtns = document.querySelectorAll('.pomo-mode-btn');
    modeBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-mode') === 'work') btn.classList.add('active');
    });
    this.resetTimer();
    this.startTimer();
  },

  // Update views
  renderView() {
    // Labels mapping
    const labels = {
      work: 'Focus Period',
      shortBreak: 'Short Break',
      longBreak: 'Long Break'
    };

    document.getElementById('timer-countdown').textContent = this.formatTime(this.timeLeft);
    document.getElementById('timer-label').textContent = labels[this.currentMode];

    // Circular SVG Progress calculation
    const progressEl = document.getElementById('timer-progress');
    if (progressEl) {
      const percentage = this.timeLeft / this.totalDuration;
      // 628 is perimeter of r=100 circle
      const offset = 628 * (1 - percentage);
      progressEl.style.strokeDashoffset = offset;
      
      // Update accent color of timer depending on mode
      if (this.currentMode === 'work') {
        progressEl.style.stroke = 'var(--accent-purple)';
      } else if (this.currentMode === 'shortBreak') {
        progressEl.style.stroke = 'var(--accent-green)';
      } else {
        progressEl.style.stroke = 'var(--accent-blue)';
      }
    }

    // Current task focus block
    const focusContainer = document.getElementById('pomo-current-task-container');
    const taskNameEl = document.getElementById('pomo-task-name');
    
    if (window.App.state.focusTaskId) {
      const task = window.App.state.tasks.find(t => t.id === window.App.state.focusTaskId);
      if (task) {
        taskNameEl.textContent = task.title;
        focusContainer.classList.remove('hidden');
      } else {
        taskNameEl.textContent = 'No task selected';
      }
    } else {
      taskNameEl.textContent = 'No task selected';
    }

    // Sessions stats display
    document.getElementById('timer-completed-count').textContent = window.App.state.pomosCount;
    document.getElementById('timer-total-today').textContent = `${window.App.state.studyTime} min`;
  },

  // Sync quick header stats bar
  updateQuickStatus() {
    const quickBar = document.getElementById('quick-pomodoro-status');
    const quickText = document.getElementById('quick-timer-text');
    
    if (!quickBar || !quickText) return;

    if (this.isRunning) {
      quickBar.classList.remove('hidden');
      const modeLabel = this.currentMode === 'work' ? 'Focus' : 'Break';
      quickText.textContent = `${modeLabel} - ${this.formatTime(this.timeLeft)}`;
    } else {
      quickBar.classList.add('hidden');
    }
  }
};
