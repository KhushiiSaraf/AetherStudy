// --------------------------------------------------------------------------
// AetherStudy Planner Module
// --------------------------------------------------------------------------

window.PlannerModule = {
  activeFilter: 'all',

  init() {
    this.setupEventListeners();
    this.renderTasks();
  },

  setupEventListeners() {
    // Add task submit form
    const form = document.getElementById('add-task-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addTask();
      });
    }

    // Filters buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.getAttribute('data-filter');
        this.renderTasks();
      });
    });

    // Create first task placeholder helper
    const emptyBtn = document.getElementById('create-first-task-btn');
    if (emptyBtn) {
      emptyBtn.addEventListener('click', () => {
        document.getElementById('open-add-task-modal').click();
      });
    }
  },

  // Create task helper
  addTask() {
    const title = document.getElementById('task-title').value.trim();
    const category = document.getElementById('task-category').value;
    const priority = document.getElementById('task-priority').value;
    const estPomos = parseInt(document.getElementById('task-est-pomos').value) || 1;
    const dueDate = document.getElementById('task-due-date').value;

    if (!title || !dueDate) return;

    const newTask = {
      id: 'task_' + Date.now(),
      title,
      category,
      priority,
      estPomos,
      completedPomos: 0,
      dueDate,
      completed: false
    };

    // Save to App State
    window.App.state.tasks.push(newTask);
    
    // Set focus if it's the first task
    if (window.App.state.tasks.length === 1 || !window.App.state.focusTaskId) {
      window.App.state.focusTaskId = newTask.id;
    }

    window.App.saveState();

    // Reset Form and Modal
    document.getElementById('add-task-form').reset();
    document.getElementById('add-task-modal').classList.remove('active');

    // Refresh display
    this.renderTasks();
  },

  // Complete status toggle
  toggleTaskStatus(taskId) {
    const task = window.App.state.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      window.App.saveState();
      this.renderTasks();
    }
  },

  // Focus ID toggler
  setFocusTask(taskId) {
    // If clicking the current focus, toggle it off. Else toggle it on.
    if (window.App.state.focusTaskId === taskId) {
      window.App.state.focusTaskId = null;
    } else {
      window.App.state.focusTaskId = taskId;
    }
    
    window.App.saveState();
    this.renderTasks();
  },

  // Delete task helper
  deleteTask(taskId) {
    window.App.state.tasks = window.App.state.tasks.filter(t => t.id !== taskId);
    
    // Reset focus pointer if deleted focus task
    if (window.App.state.focusTaskId === taskId) {
      window.App.state.focusTaskId = null;
    }

    window.App.saveState();
    this.renderTasks();
  },

  // Main tasks template builder
  renderTasks() {
    const listContainer = document.getElementById('tasks-list');
    if (!listContainer) return;

    const filtered = window.App.state.tasks.filter(task => {
      if (this.activeFilter === 'pending') return !task.completed;
      if (this.activeFilter === 'completed') return task.completed;
      return true;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-illustration">📅</div>
          <h3>No tasks found</h3>
          <p class="text-sub">No study tasks fit the active criteria. Add one below!</p>
          <button class="btn btn-primary btn-sm" id="empty-add-btn">Add New Task</button>
        </div>
      `;
      document.getElementById('empty-add-btn').addEventListener('click', () => {
        document.getElementById('open-add-task-modal').click();
      });
      return;
    }

    listContainer.innerHTML = '';
    filtered.forEach(task => {
      const categoryEmoji = {
        'Study': '📚',
        'Revise': '✏️',
        'Exam': '📝',
        'Project': '💻'
      }[task.category] || '🎯';

      // Generate tomato display indicators
      let tomatoesHtml = '';
      for (let i = 0; i < task.estPomos; i++) {
        if (i < task.completedPomos) {
          tomatoesHtml += '<span class="tomato-icon" title="Pomo session completed">🍅</span>';
        } else {
          tomatoesHtml += '<span class="tomato-icon empty" title="Pomo session estimated">🍅</span>';
        }
      }

      // Check if task is active study focus
      const isFocused = window.App.state.focusTaskId === task.id;

      const card = document.createElement('div');
      card.className = `task-card glass-panel animate-fade-in ${task.completed ? 'completed' : ''}`;
      
      card.innerHTML = `
        <div class="task-checkbox-wrapper">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
        </div>
        <div class="task-title-text" title="${task.title}">${task.title}</div>
        <div>
          <span class="tag-pill ${task.category.toLowerCase()}">${categoryEmoji} ${task.category}</span>
        </div>
        <div class="pomo-tomatoes">
          ${tomatoesHtml}
        </div>
        <div class="task-due-date">📅 ${task.dueDate}</div>
        <div class="task-actions">
          <button class="task-btn focus ${isFocused ? 'active-focus' : ''}" data-id="${task.id}" title="${isFocused ? 'Remove focus spotlight' : 'Select as study focus'}">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="${isFocused ? 'currentColor' : 'none'}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
          <button class="task-btn delete" data-id="${task.id}" title="Delete task">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      `;

      // Set event listeners
      card.querySelector('.task-checkbox').addEventListener('change', () => {
        this.toggleTaskStatus(task.id);
      });

      card.querySelector('.task-btn.focus').addEventListener('click', () => {
        this.setFocusTask(task.id);
      });

      card.querySelector('.task-btn.delete').addEventListener('click', () => {
        this.deleteTask(task.id);
      });

      listContainer.appendChild(card);
    });
  }
};
