// --------------------------------------------------------------------------
// AetherStudy Quizzes Module
// --------------------------------------------------------------------------

window.QuizzesModule = {
  activeQuizId: null,
  activeQuiz: null,
  
  // Game Play states
  playSession: {
    currentQuestionIndex: 0,
    selectedOptionIndex: null,
    correctAnswersCount: 0,
    startTime: null,
    timerIntervalId: null,
    secondsElapsed: 0
  },

  init() {
    this.setupEventListeners();
    this.showQuizList();
  },

  setupEventListeners() {
    // Open Creator Screen
    const openBtn = document.getElementById('open-add-quiz-modal');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        this.openQuizCreator();
      });
    }

    // Creator: Cancel Back
    document.getElementById('btn-creator-back').addEventListener('click', () => {
      this.showQuizList();
    });

    // Creator: Add question button
    document.getElementById('btn-add-creator-question').addEventListener('click', () => {
      this.addCreatorQuestion();
    });

    // Creator: Clear form
    document.getElementById('btn-reset-quiz-form').addEventListener('click', () => {
      if (confirm("Reset quiz creator form?")) {
        this.resetCreatorForm();
      }
    });

    // Creator: Form Submit
    document.getElementById('quiz-create-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveQuiz();
    });

    // Taker: Exit Quiz
    document.getElementById('btn-quiz-quit').addEventListener('click', () => {
      if (confirm("Quit quiz? Progress will be lost.")) {
        this.quitQuiz();
      }
    });

    // Taker: Submit single question answer
    document.getElementById('btn-submit-answer').addEventListener('click', () => {
      this.submitAnswer();
    });

    // Taker: Advance to next question
    document.getElementById('btn-next-question').addEventListener('click', () => {
      this.advanceQuestion();
    });

    // Results: Back to List
    document.getElementById('btn-results-to-list').addEventListener('click', () => {
      this.showQuizList();
    });

    // Results: Retry active quiz
    document.getElementById('btn-results-retry').addEventListener('click', () => {
      this.startQuiz(this.activeQuizId);
    });
  },

  // Main list navigator
  showQuizList() {
    document.getElementById('quiz-list-container').classList.remove('hidden');
    document.getElementById('quiz-creator-container').classList.add('hidden');
    document.getElementById('quiz-play-container').classList.add('hidden');
    document.getElementById('quiz-results-container').classList.add('hidden');
    
    this.renderQuizList();
  },

  renderQuizList() {
    const grid = document.getElementById('quizzes-grid');
    if (!grid) return;

    grid.innerHTML = '';
    window.App.state.quizzes.forEach(quiz => {
      const qCount = quiz.questions.length;
      const hScore = quiz.highScore !== null ? `${quiz.highScore}%` : 'Not tested';
      
      const card = document.createElement('div');
      card.className = 'quiz-card glass-panel animate-fade-in';
      card.innerHTML = `
        <div class="quiz-details">
          <h4 class="quiz-title">${quiz.title}</h4>
          <p class="quiz-desc">${quiz.desc || 'No description provided.'}</p>
          <div class="quiz-meta-info">
            <span class="quiz-badge">📋 ${qCount} Questions</span>
            <span class="quiz-badge">🏆 Best: ${hScore}</span>
            <span class="quiz-badge">Attempts: ${quiz.attempts || 0}</span>
          </div>
        </div>
        <div class="deck-actions">
          <button class="btn btn-primary btn-sm btn-play-quiz" data-id="${quiz.id}">Start Quiz</button>
          <button class="btn btn-danger btn-sm btn-delete-quiz" data-id="${quiz.id}" style="flex: 0 0 40px; padding: 0;">✕</button>
        </div>
      `;

      card.querySelector('.btn-play-quiz').addEventListener('click', () => this.startQuiz(quiz.id));
      card.querySelector('.btn-delete-quiz').addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete quiz "${quiz.title}"?`)) {
          this.deleteQuiz(quiz.id);
        }
      });

      grid.appendChild(card);
    });
  },

  deleteQuiz(quizId) {
    window.App.state.quizzes = window.App.state.quizzes.filter(q => q.id !== quizId);
    window.App.saveState();
    this.renderQuizList();
  },

  /* -------------------------------------------------------------------------
     Quiz Builder Interface
     ------------------------------------------------------------------------- */
  openQuizCreator() {
    document.getElementById('quiz-list-container').classList.add('hidden');
    document.getElementById('quiz-creator-container').classList.remove('hidden');
    document.getElementById('quiz-play-container').classList.add('hidden');
    document.getElementById('quiz-results-container').classList.add('hidden');
    
    this.resetCreatorForm();
    
    // Auto insert one question to start with
    this.addCreatorQuestion();
  },

  resetCreatorForm() {
    document.getElementById('quiz-create-form').reset();
    document.getElementById('creator-questions-list').innerHTML = '';
  },

  addCreatorQuestion() {
    const list = document.getElementById('creator-questions-list');
    const qCount = list.children.length;
    
    const qBox = document.createElement('div');
    qBox.className = 'creator-question-box animate-fade-in';
    qBox.innerHTML = `
      <div class="creator-question-header">
        <h5 class="sub-panel-title">Question ${qCount + 1}</h5>
        <button type="button" class="btn-remove-question">Remove</button>
      </div>
      <div class="form-group">
        <input type="text" class="question-text-input" placeholder="Enter question description" required>
      </div>
      
      <div class="creator-options-grid">
        <div class="form-group"><label>Options (select the circle next to the correct answer)</label></div>
        ${[0, 1, 2, 3].map(idx => `
          <div class="creator-option-row">
            <input type="radio" name="correct_opt_${qCount}" class="option-correct-checkbox" ${idx === 0 ? 'checked' : ''} value="${idx}">
            <input type="text" class="option-text-input" placeholder="Option ${String.fromCharCode(65 + idx)}" required>
          </div>
        `).join('')}
      </div>
    `;

    // Hook delete button
    qBox.querySelector('.btn-remove-question').addEventListener('click', () => {
      qBox.remove();
      this.reindexCreatorQuestions();
    });

    list.appendChild(qBox);
  },

  reindexCreatorQuestions() {
    const boxes = document.querySelectorAll('.creator-question-box');
    boxes.forEach((box, qIdx) => {
      box.querySelector('.sub-panel-title').textContent = `Question ${qIdx + 1}`;
      
      // Update radio names to avoid collision
      const radios = box.querySelectorAll('.option-correct-checkbox');
      radios.forEach(radio => {
        radio.setAttribute('name', `correct_opt_${qIdx}`);
      });
    });
  },

  saveQuiz() {
    const title = document.getElementById('quiz-title-input').value.trim();
    const desc = document.getElementById('quiz-desc-input').value.trim();
    
    const questionBoxes = document.querySelectorAll('.creator-question-box');
    if (questionBoxes.length === 0) {
      alert("Please add at least one question to save the quiz.");
      return;
    }

    const questions = [];
    
    try {
      questionBoxes.forEach((box, idx) => {
        const questionText = box.querySelector('.question-text-input').value.trim();
        if (!questionText) throw new Error("Question text cannot be empty");

        const optionInputs = box.querySelectorAll('.option-text-input');
        const options = Array.from(optionInputs).map(opt => opt.value.trim());
        
        // Find checked option
        const checkedRadio = box.querySelector('.option-correct-checkbox:checked');
        const correct = parseInt(checkedRadio.value);

        questions.push({
          question: questionText,
          options,
          correct
        });
      });
    } catch (e) {
      alert(e.message);
      return;
    }

    const newQuiz = {
      id: 'quiz_' + Date.now(),
      title,
      desc,
      highScore: null,
      attempts: 0,
      questions
    };

    window.App.state.quizzes.push(newQuiz);
    window.App.saveState();
    
    this.showQuizList();
  },

  /* -------------------------------------------------------------------------
     Quiz Taking Engine
     ------------------------------------------------------------------------- */
  startQuiz(quizId) {
    const quiz = window.App.state.quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    this.activeQuizId = quizId;
    this.activeQuiz = quiz;

    // Reset Play session values
    this.playSession = {
      currentQuestionIndex: 0,
      selectedOptionIndex: null,
      correctAnswersCount: 0,
      startTime: Date.now(),
      secondsElapsed: 0,
      timerIntervalId: null
    };

    document.getElementById('quiz-list-container').classList.add('hidden');
    document.getElementById('quiz-creator-container').classList.add('hidden');
    document.getElementById('quiz-play-container').classList.remove('hidden');
    document.getElementById('quiz-results-container').classList.add('hidden');

    document.getElementById('play-quiz-title').textContent = quiz.title;
    
    // Start countdown timer
    this.startQuizTimer();
    this.renderQuestion();
  },

  startQuizTimer() {
    const timerEl = document.getElementById('play-quiz-timer');
    timerEl.textContent = 'Timer: 00:00';
    
    this.playSession.timerIntervalId = setInterval(() => {
      this.playSession.secondsElapsed++;
      
      const min = Math.floor(this.playSession.secondsElapsed / 60);
      const sec = this.playSession.secondsElapsed % 60;
      
      timerEl.textContent = `Timer: ${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }, 1000);
  },

  stopQuizTimer() {
    if (this.playSession.timerIntervalId) {
      clearInterval(this.playSession.timerIntervalId);
      this.playSession.timerIntervalId = null;
    }
  },

  renderQuestion() {
    const qIndex = this.playSession.currentQuestionIndex;
    const questions = this.activeQuiz.questions;
    
    if (qIndex >= questions.length) {
      this.finishQuiz();
      return;
    }

    const question = questions[qIndex];
    
    // Progress
    const progressPerc = ((qIndex) / questions.length) * 100;
    document.getElementById('quiz-progress-fill').style.width = `${progressPerc}%`;
    document.getElementById('quiz-progress-text').textContent = `Question ${qIndex + 1} of ${questions.length}`;

    // Question
    document.getElementById('play-question-text').textContent = question.question;

    // Options list
    const optionsContainer = document.getElementById('play-options-list');
    optionsContainer.innerHTML = '';
    
    this.playSession.selectedOptionIndex = null;
    
    // Disable submit button by default until selection
    document.getElementById('btn-submit-answer').disabled = true;
    document.getElementById('btn-submit-answer').classList.remove('hidden');
    document.getElementById('btn-next-question').classList.add('hidden');

    question.options.forEach((optText, oIdx) => {
      const letter = String.fromCharCode(65 + oIdx);
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.innerHTML = `
        <span class="quiz-option-letter">${letter}</span>
        <span class="quiz-option-val">${optText}</span>
      `;

      btn.addEventListener('click', () => {
        // Toggle selection classes
        document.querySelectorAll('.quiz-option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        this.playSession.selectedOptionIndex = oIdx;
        document.getElementById('btn-submit-answer').disabled = false;
      });

      optionsContainer.appendChild(btn);
    });
  },

  submitAnswer() {
    const qIndex = this.playSession.currentQuestionIndex;
    const question = this.activeQuiz.questions[qIndex];
    const userSelection = this.playSession.selectedOptionIndex;
    const correctSelection = question.correct;

    const btns = document.querySelectorAll('.quiz-option-btn');
    
    // Style feedback
    btns.forEach((btn, idx) => {
      // Disable clicks
      btn.style.pointerEvents = 'none';

      if (idx === correctSelection) {
        btn.classList.add('correct');
      } else if (idx === userSelection) {
        btn.classList.add('incorrect');
      }
    });

    if (userSelection === correctSelection) {
      this.playSession.correctAnswersCount++;
    }

    // Toggle button views
    document.getElementById('btn-submit-answer').classList.add('hidden');
    document.getElementById('btn-next-question').classList.remove('hidden');
  },

  advanceQuestion() {
    this.playSession.currentQuestionIndex++;
    this.renderQuestion();
  },

  quitQuiz() {
    this.stopQuizTimer();
    this.showQuizList();
  },

  finishQuiz() {
    this.stopQuizTimer();
    
    const scoreVal = this.playSession.correctAnswersCount;
    const totalQ = this.activeQuiz.questions.length;
    const percentage = Math.round((scoreVal / totalQ) * 100);
    
    // Record attempts
    this.activeQuiz.attempts = (this.activeQuiz.attempts || 0) + 1;
    
    // Save high score
    if (this.activeQuiz.highScore === null || percentage > this.activeQuiz.highScore) {
      this.activeQuiz.highScore = percentage;
    }

    // Add study consistency statistics
    const todayStr = window.App.getOffsetDate(0);
    window.App.state.studyStreak[todayStr] = true;
    
    // Add time studied based on quiz length (e.g. 2 mins per question)
    const minutesAdded = Math.round(this.playSession.secondsElapsed / 60) || 1;
    window.App.state.studyTime += minutesAdded;

    window.App.saveState();

    // Show results views
    document.getElementById('quiz-play-container').classList.add('hidden');
    document.getElementById('quiz-results-container').classList.remove('hidden');

    // UI elements
    document.getElementById('results-percentage').textContent = `${percentage}%`;
    document.getElementById('results-correct-count').textContent = scoreVal;
    
    // Display textual headline based on percentage
    let headline = 'Excellent!';
    if (percentage < 50) headline = 'Keep Practicing!';
    else if (percentage < 80) headline = 'Good Effort!';
    document.getElementById('results-headline').textContent = headline;

    document.getElementById('results-summary-text').textContent = `You got ${scoreVal} out of ${totalQ} questions correct.`;

    const min = Math.floor(this.playSession.secondsElapsed / 60);
    const sec = this.playSession.secondsElapsed % 60;
    document.getElementById('results-time-spent').textContent = `${min}m ${sec}s`;
  }
};
