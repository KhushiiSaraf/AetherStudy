// --------------------------------------------------------------------------
// AetherStudy Main App Controller & State Manager
// --------------------------------------------------------------------------

// Establish global namespace
window.App = {
  state: {
    theme: 'dark',
    tasks: [],
    focusTaskId: null,
    pomosCount: 0,
    studyTime: 0, // total minutes
    decks: [],
    quizzes: [],
    studyStreak: {} // key: YYYY-MM-DD, value: true/false
  },

  // Storage Key
  STORAGE_KEY: 'aetherstudy_state_data',

  // Initialize Application
  init() {
    this.loadState();
    this.setupTheme();
    this.setupNavigation();
    this.setupModals();
    this.setupDashboardEvents();
    
    // Initialize module scripts if they exist
    if (window.PlannerModule) window.PlannerModule.init();
    if (window.PomodoroModule) window.PomodoroModule.init();
    if (window.FlashcardsModule) window.FlashcardsModule.init();
    if (window.QuizzesModule) window.QuizzesModule.init();
    
    this.renderDashboard();
  },

  // Load from LocalStorage
  loadState() {
    const rawData = localStorage.getItem(this.STORAGE_KEY);
    if (rawData) {
      try {
        this.state = JSON.parse(rawData);
      } catch (e) {
        console.error("Error parsing saved state: ", e);
        this.loadDefaults();
      }
    } else {
      this.loadDefaults();
    }
  },

  // Save to LocalStorage
  saveState() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    this.renderDashboard();
    
    // Also sync the quick timer visibility state
    if (window.PomodoroModule) {
      window.PomodoroModule.updateQuickStatus();
    }
  },

  // Seed default data for first-time use
  loadDefaults() {
    this.state = {
      theme: 'dark',
      tasks: [
        { id: 't1', title: 'Prepare Chemistry formulas cheat sheet', category: 'Study', priority: 'High', estPomos: 2, completedPomos: 1, dueDate: this.getOffsetDate(0), completed: false },
        { id: 't2', title: 'Revise Web design CSS components', category: 'Revise', priority: 'Medium', estPomos: 3, completedPomos: 0, dueDate: this.getOffsetDate(1), completed: false },
        { id: 't3', title: 'Solve CS practice test paper 2', category: 'Exam', priority: 'High', estPomos: 4, completedPomos: 0, dueDate: this.getOffsetDate(2), completed: false }
      ],
      focusTaskId: 't1',
      pomosCount: 3,
      studyTime: 75,
      decks: [
        {
          id: 'd1',
          name: 'JavaScript Fundamentals',
          desc: 'Basic JS terms: scope, closure, hoisting, prototypes, and ES6 functions.',
          cards: [
            { front: 'What is a Closure in JavaScript?', back: 'A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment).' },
            { front: 'Explain Hoisting.', back: 'JavaScript\'s behavior of moving declarations to the top of the current scope (script or function) before code execution.' },
            { front: 'Difference between let and var?', back: 'let is block-scoped, does not hoist initialize, and cannot be re-declared. var is function-scoped and hoists.' },
            { front: 'What is the Event Loop?', back: 'A mechanism that allows JavaScript to perform non-blocking I/O operations by offloading tasks to the system kernel whenever possible.' }
          ]
        },
        {
          id: 'd2',
          name: 'Biology - Cell Division',
          desc: 'Phases of Mitosis and Meiosis, key molecular structures and functions.',
          cards: [
            { front: 'What are the 4 main stages of Mitosis?', back: 'Prophase, Metaphase, Anaphase, Telophase (PMAT).' },
            { front: 'What happens during Metaphase?', back: 'Chromosomes line up along the metaphase plate in the center of the dividing cell.' },
            { front: 'What is Cytokinesis?', back: 'The physical division of the cytoplasm, cell membrane, and organelles into two distinct daughter cells.' }
          ]
        }
      ],
      quizzes: [
        {
          id: 'q1',
          title: 'Computer Science Quiz',
          desc: 'A quick assessment of basic programming paradigms, algorithms, and networks.',
          highScore: 80,
          attempts: 1,
          questions: [
            {
              question: 'Which data structure follows the LIFO (Last In, First Out) principle?',
              options: ['Queue', 'Stack', 'Linked List', 'Binary Tree'],
              correct: 1
            },
            {
              question: 'What is the time complexity of searching a binary search tree in the average case?',
              options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
              correct: 2
            },
            {
              question: 'Which HTTP status code represents a "Not Found" error?',
              options: ['200', '403', '404', '500'],
              correct: 2
            }
          ]
        },
        {
          id: 'q2',
          title: 'World Geography trivia',
          desc: 'Identify world capitals, physical landmarks, and geographical records.',
          highScore: null,
          attempts: 0,
          questions: [
            {
              question: 'What is the capital city of Australia?',
              options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
              correct: 2
            },
            {
              question: 'Which river is the longest in the world?',
              options: ['Amazon River', 'Nile River', 'Yangtze River', 'Mississippi River'],
              correct: 1
            }
          ]
        }
      ],
      studyStreak: {}
    };
    
    // Set a few study streak items for visual presentation
    const today = this.getOffsetDate(0);
    const yesterday = this.getOffsetDate(-1);
    const twoDaysAgo = this.getOffsetDate(-2);
    
    this.state.studyStreak[today] = true;
    this.state.studyStreak[yesterday] = true;
    this.state.studyStreak[twoDaysAgo] = false;
  },

  // Helper to fetch dates
  getOffsetDate(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  },

  // Set Theme (Light vs Dark)
  setupTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    if (this.state.theme === 'light') {
      document.body.classList.add('light-theme');
      themeBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      `;
    }
    
    themeBtn.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme');
      this.state.theme = isLight ? 'light' : 'dark';
      this.saveState();
      
      // Update icon
      if (isLight) {
        themeBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        `;
      } else {
        themeBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        `;
      }
    });
  },

  // Setup tab switches
  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const viewPanes = document.querySelectorAll('.view-pane');
    const titleEl = document.getElementById('page-title');
    const subtitleEl = document.getElementById('page-subtitle');
    
    const subtitles = {
      dashboard: "Welcome back! Let's conquer your study goals.",
      planner: "Track your tasks, categorize subjects, and estimate study goals.",
      pomodoro: "Boost focus and retention using structured productivity blocks.",
      flashcards: "Test your memory with customizable flip card decks.",
      quizzes: "Evaluate your skills and check your grades on study subjects."
    };
    
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        
        // Remove active class from all navs
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        // Hide all views, display selected
        viewPanes.forEach(v => v.classList.remove('active'));
        const activeView = document.getElementById(`${tab}-view`);
        if (activeView) activeView.classList.add('active');
        
        // Update page titles
        titleEl.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
        subtitleEl.textContent = subtitles[tab] || '';
        
        // Trigger specific re-renders
        if (tab === 'dashboard') {
          this.renderDashboard();
        } else if (tab === 'planner' && window.PlannerModule) {
          window.PlannerModule.renderTasks();
        } else if (tab === 'pomodoro' && window.PomodoroModule) {
          window.PomodoroModule.renderView();
        } else if (tab === 'flashcards' && window.FlashcardsModule) {
          window.FlashcardsModule.showDeckList();
        } else if (tab === 'quizzes' && window.QuizzesModule) {
          window.QuizzesModule.showQuizList();
        }
      });
    });
  },

  // Global tab routing programmatically
  switchTab(tabName) {
    const targetNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (targetNav) targetNav.click();
  },

  // Generic modal handles
  setupModals() {
    // Open buttons
    document.querySelectorAll('[id^="open-add-"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.id.replace('open-add-', 'add-').concat('-modal');
        const modal = document.getElementById(targetId);
        if (modal) {
          modal.classList.add('active');
          // Automatically set minimum task date to today
          if (targetId === 'add-task-modal') {
            document.getElementById('task-due-date').value = this.getOffsetDate(0);
          }
        }
      });
    });

    // Close buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
      });
    });

    // Outside overlay click close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });
  },

  // Dash events
  setupDashboardEvents() {
    document.getElementById('dashboard-to-planner-btn').addEventListener('click', () => {
      this.switchTab('planner');
    });
    
    document.getElementById('dashboard-view-tasks-link').addEventListener('click', () => {
      this.switchTab('planner');
    });
  },

  // Render dashboard calculations
  renderDashboard() {
    // Calculations
    const pomosVal = this.state.pomosCount;
    const hoursVal = (this.state.studyTime / 60).toFixed(1);
    
    const completedTasks = this.state.tasks.filter(t => t.completed).length;
    const totalTasks = this.state.tasks.length;
    
    const totalCards = this.state.decks.reduce((sum, d) => sum + d.cards.length, 0);
    const totalDecks = this.state.decks.length;
    
    const quizAttempts = this.state.quizzes.reduce((sum, q) => sum + (q.attempts || 0), 0);
    const highestScoreObj = this.state.quizzes
      .filter(q => q.highScore !== null && q.highScore !== undefined)
      .sort((a, b) => b.highScore - a.highScore)[0];
    const highestScore = highestScoreObj ? `${highestScoreObj.highScore}%` : 'N/A';

    // Set UI values
    document.getElementById('stats-pomos').textContent = pomosVal;
    document.getElementById('stats-hours').textContent = `Total focus: ${hoursVal} hrs`;
    document.getElementById('stats-tasks').textContent = `${completedTasks}/${totalTasks}`;
    document.getElementById('stats-tasks-percentage').textContent = 
      totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}% completion rate` : 'No tasks created';
    
    document.getElementById('stats-cards').textContent = totalCards;
    document.getElementById('stats-decks').textContent = `Across ${totalDecks} card decks`;
    
    document.getElementById('stats-quiz-score').textContent = highestScore;
    document.getElementById('stats-quizzes-taken').textContent = `${quizAttempts} quizzes attempted`;

    // Render active focus spotlight
    this.renderFocusSpotlight();

    // Render study streak grid
    this.renderStreakGrid();

    // Render high priority dashboard task lists
    this.renderPriorityTasks();
  },

  // Focus spotlight UI builder
  renderFocusSpotlight() {
    const focusContainer = document.getElementById('focus-spotlight');
    if (!focusContainer) return;

    if (!this.state.focusTaskId) {
      focusContainer.innerHTML = `
        <div class="empty-focus">
          <p class="text-sub">No task selected for focus.</p>
          <button class="btn btn-primary btn-sm" id="spotlight-pick-btn">Pick a Task</button>
        </div>
      `;
      document.getElementById('spotlight-pick-btn').addEventListener('click', () => this.switchTab('planner'));
      return;
    }

    const task = this.state.tasks.find(t => t.id === this.state.focusTaskId);
    if (!task) {
      this.state.focusTaskId = null;
      this.saveState();
      return;
    }

    const categoryEmoji = {
      'Study': '📚',
      'Revise': '✏️',
      'Exam': '📝',
      'Project': '💻'
    }[task.category] || '🎯';

    let tomatoesHtml = '';
    for (let i = 0; i < task.estPomos; i++) {
      if (i < task.completedPomos) {
        tomatoesHtml += '<span class="tomato-icon">🍅</span>';
      } else {
        tomatoesHtml += '<span class="tomato-icon empty">🍅</span>';
      }
    }

    focusContainer.innerHTML = `
      <div class="active-focus-box">
        <div class="focus-task-info">
          <span class="tag-pill ${task.category.toLowerCase()}">${categoryEmoji} ${task.category}</span>
          <h4 class="focus-task-title">${task.title}</h4>
          <div class="focus-meta">
            <span class="text-sub">Due: ${task.dueDate}</span>
            <span class="text-sub">Priority: ${task.priority}</span>
          </div>
        </div>
        <div class="focus-controls">
          <div class="pomo-tomatoes" style="margin-bottom: 12px; justify-content: flex-end;">
            ${tomatoesHtml}
          </div>
          <button class="btn btn-primary btn-sm" id="spotlight-start-timer-btn">Start Timer</button>
        </div>
      </div>
    `;

    document.getElementById('spotlight-start-timer-btn').addEventListener('click', () => {
      this.switchTab('pomodoro');
      if (window.PomodoroModule) {
        window.PomodoroModule.startTimerFromDashboard();
      }
    });
  },

  // Streak tracker renderer
  renderStreakGrid() {
    const streakContainer = document.getElementById('streak-days');
    if (!streakContainer) return;

    streakContainer.innerHTML = '';
    const daysName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Get last 7 days starting from today backwards
    const todayObj = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(todayObj.getDate() - i);
      last7Days.push(d);
    }

    last7Days.forEach(day => {
      const dateStr = day.toISOString().split('T')[0];
      const dayLabel = daysName[day.getDay()];
      
      const didStudy = this.state.studyStreak[dateStr];
      const isToday = dateStr === todayObj.toISOString().split('T')[0];
      
      let dayClass = 'streak-day';
      if (didStudy) {
        dayClass += ' completed';
      } else if (isToday) {
        dayClass += ' active';
      }

      streakContainer.innerHTML += `
        <div class="${dayClass}" title="Date: ${dateStr}">
          <span class="streak-day-label">${dayLabel}</span>
          <span class="streak-day-dot"></span>
        </div>
      `;
    });
  },

  // Priority dashboard list
  renderPriorityTasks() {
    const listEl = document.getElementById('dashboard-priority-tasks');
    if (!listEl) return;

    // Filter pending high & medium priority tasks, sorted by date
    const pendingPriorityTasks = this.state.tasks
      .filter(t => !t.completed && (t.priority === 'High' || t.priority === 'Medium'))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3); // top 3 only

    if (pendingPriorityTasks.length === 0) {
      listEl.innerHTML = '<p class="empty-text">No urgent tasks. Relax or add new ones!</p>';
      return;
    }

    listEl.innerHTML = '';
    pendingPriorityTasks.forEach(task => {
      const categoryEmoji = {
        'Study': '📚',
        'Revise': '✏️',
        'Exam': '📝',
        'Project': '💻'
      }[task.category] || '🎯';

      listEl.innerHTML += `
        <div class="dash-task-item">
          <div class="dash-task-meta">
            <span class="dash-task-title">${task.title}</span>
            <span class="dash-task-sub text-sub">${categoryEmoji} ${task.category} • Due: ${task.dueDate}</span>
          </div>
          <span class="dash-priority-pill ${task.priority.toLowerCase()}">${task.priority}</span>
        </div>
      `;
    });
  }
};

// Start application when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});
