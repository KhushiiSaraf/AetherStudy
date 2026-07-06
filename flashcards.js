// --------------------------------------------------------------------------
// AetherStudy Flashcards Module
// --------------------------------------------------------------------------

window.FlashcardsModule = {
  activeDeckId: null,
  studySession: {
    cards: [],
    currentIndex: 0,
    history: [] // Quality scores for cards
  },

  init() {
    this.setupEventListeners();
    this.renderDeckList();
  },

  setupEventListeners() {
    // Add Deck form submit
    const addDeckForm = document.getElementById('add-deck-form');
    if (addDeckForm) {
      addDeckForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createDeck();
      });
    }

    // Editor: Back to decks list
    document.getElementById('btn-editor-back').addEventListener('click', () => {
      this.showDeckList();
    });

    // Editor: Clear card form
    document.getElementById('btn-cancel-card-edit').addEventListener('click', () => {
      this.clearCardForm();
    });

    // Editor: Save/Submit card
    document.getElementById('card-edit-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveCard();
    });

    // Study: Back to decks list
    document.getElementById('btn-study-back').addEventListener('click', () => {
      if (confirm("Stop studying this deck? Progress will not be saved.")) {
        this.showDeckList();
      }
    });

    // Study: Interactive flip card
    const flipper = document.getElementById('study-card-flipper');
    if (flipper) {
      flipper.addEventListener('click', () => {
        flipper.classList.toggle('flipped');
      });
    }

    // Study: Mastery score feedback buttons
    const feedbackBtns = document.querySelectorAll('.feedback-btn');
    feedbackBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid triggering double flip if button lies on bounds
        const rating = parseInt(btn.getAttribute('data-quality')) || 3;
        this.handleStudyFeedback(rating);
      });
    });
  },

  // Switch back to decks list
  showDeckList() {
    document.getElementById('deck-list-container').classList.remove('hidden');
    document.getElementById('deck-editor-container').classList.add('hidden');
    document.getElementById('deck-study-container').classList.add('hidden');
    
    // Clean states
    this.activeDeckId = null;
    this.renderDeckList();
  },

  // Render decks list grid
  renderDeckList() {
    const grid = document.getElementById('decks-grid');
    if (!grid) return;

    if (window.App.state.decks.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-illustration">📇</div>
          <h3>No card decks created</h3>
          <p class="text-sub">Create your first flashcard deck to start memorizing topics.</p>
          <button class="btn btn-primary btn-sm" id="empty-deck-btn">Create Deck</button>
        </div>
      `;
      document.getElementById('empty-deck-btn').addEventListener('click', () => {
        document.getElementById('open-add-deck-modal').click();
      });
      return;
    }

    grid.innerHTML = '';
    window.App.state.decks.forEach(deck => {
      const card = document.createElement('div');
      card.className = 'deck-card glass-panel animate-fade-in';
      card.innerHTML = `
        <div class="deck-details">
          <h4 class="deck-title">${deck.name}</h4>
          <p class="deck-desc">${deck.desc || 'No description provided.'}</p>
          <span class="deck-card-count">🃏 ${deck.cards.length} cards</span>
        </div>
        <div class="deck-actions">
          <button class="btn btn-primary btn-sm btn-study" data-id="${deck.id}">Study</button>
          <button class="btn btn-secondary btn-sm btn-manage" data-id="${deck.id}">Manage</button>
          <button class="btn btn-danger btn-sm btn-delete-deck" data-id="${deck.id}" style="flex: 0 0 40px; padding: 0;">✕</button>
        </div>
      `;

      // Handlers
      card.querySelector('.btn-study').addEventListener('click', () => this.startStudy(deck.id));
      card.querySelector('.btn-manage').addEventListener('click', () => this.openDeckEditor(deck.id));
      card.querySelector('.btn-delete-deck').addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete deck "${deck.name}"?`)) {
          this.deleteDeck(deck.id);
        }
      });

      grid.appendChild(card);
    });
  },

  // Create empty deck
  createDeck() {
    const name = document.getElementById('deck-title-input').value.trim();
    const desc = document.getElementById('deck-desc-input').value.trim();

    if (!name) return;

    const newDeck = {
      id: 'deck_' + Date.now(),
      name,
      desc,
      cards: []
    };

    window.App.state.decks.push(newDeck);
    window.App.saveState();

    document.getElementById('add-deck-form').reset();
    document.getElementById('add-deck-modal').classList.remove('active');

    this.renderDeckList();
  },

  // Delete entire deck
  deleteDeck(deckId) {
    window.App.state.decks = window.App.state.decks.filter(d => d.id !== deckId);
    window.App.saveState();
    this.renderDeckList();
  },

  /* -------------------------------------------------------------------------
     Deck Editor Panel
     ------------------------------------------------------------------------- */
  openDeckEditor(deckId) {
    const deck = window.App.state.decks.find(d => d.id === deckId);
    if (!deck) return;

    this.activeDeckId = deckId;
    
    document.getElementById('deck-list-container').classList.add('hidden');
    document.getElementById('deck-editor-container').classList.remove('hidden');
    document.getElementById('deck-study-container').classList.add('hidden');

    document.getElementById('editor-deck-title').textContent = `Manage Deck: ${deck.name}`;
    
    this.clearCardForm();
    this.renderEditorCards();
  },

  renderEditorCards() {
    const deck = window.App.state.decks.find(d => d.id === this.activeDeckId);
    const container = document.getElementById('editor-cards-container');
    if (!deck || !container) return;

    if (deck.cards.length === 0) {
      container.innerHTML = '<p class="empty-text">No cards in this deck yet. Add one on the right!</p>';
      return;
    }

    container.innerHTML = '';
    deck.cards.forEach((card, index) => {
      const row = document.createElement('div');
      row.className = 'card-item-row animate-fade-in';
      row.innerHTML = `
        <div class="card-item-txt">
          <span class="card-item-front">${card.front}</span>
          <span class="card-item-back">${card.back}</span>
        </div>
        <div class="task-actions">
          <button class="task-btn edit-card" data-idx="${index}" title="Edit Card">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="task-btn delete-card" data-idx="${index}" title="Delete Card">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;

      row.querySelector('.edit-card').addEventListener('click', () => this.editCard(index));
      row.querySelector('.delete-card').addEventListener('click', () => this.deleteCard(index));

      container.appendChild(row);
    });
  },

  clearCardForm() {
    document.getElementById('card-edit-form').reset();
    document.getElementById('edit-card-index').value = "-1";
    document.getElementById('card-form-title').textContent = "Add New Card";
    document.getElementById('btn-save-card').textContent = "Save Card";
  },

  saveCard() {
    const deck = window.App.state.decks.find(d => d.id === this.activeDeckId);
    if (!deck) return;

    const front = document.getElementById('card-front-input').value.trim();
    const back = document.getElementById('card-back-input').value.trim();
    const index = parseInt(document.getElementById('edit-card-index').value);

    if (!front || !back) return;

    if (index === -1) {
      // Create new
      deck.cards.push({ front, back });
    } else {
      // Edit existing
      deck.cards[index] = { front, back };
    }

    window.App.saveState();
    this.clearCardForm();
    this.renderEditorCards();
  },

  editCard(index) {
    const deck = window.App.state.decks.find(d => d.id === this.activeDeckId);
    if (!deck || !deck.cards[index]) return;

    const card = deck.cards[index];
    document.getElementById('card-front-input').value = card.front;
    document.getElementById('card-back-input').value = card.back;
    document.getElementById('edit-card-index').value = index;
    
    document.getElementById('card-form-title').textContent = "Edit Card";
    document.getElementById('btn-save-card').textContent = "Update Card";
  },

  deleteCard(index) {
    const deck = window.App.state.decks.find(d => d.id === this.activeDeckId);
    if (!deck) return;

    deck.cards.splice(index, 1);
    window.App.saveState();
    
    this.clearCardForm();
    this.renderEditorCards();
  },

  /* -------------------------------------------------------------------------
     Card Study Engine
     ------------------------------------------------------------------------- */
  startStudy(deckId) {
    const deck = window.App.state.decks.find(d => d.id === deckId);
    if (!deck) return;

    if (deck.cards.length === 0) {
      alert("This deck has no cards yet. Add cards in the 'Manage' menu first!");
      return;
    }

    this.activeDeckId = deckId;
    
    // Build flashcards study session array
    this.studySession = {
      cards: [...deck.cards], // Shallow clone
      currentIndex: 0,
      history: []
    };

    // Shuffle study cards for premium experience
    this.studySession.cards.sort(() => Math.random() - 0.5);

    document.getElementById('deck-list-container').classList.add('hidden');
    document.getElementById('deck-editor-container').classList.add('hidden');
    document.getElementById('deck-study-container').classList.remove('hidden');

    document.getElementById('study-deck-name').textContent = `Studying: ${deck.name}`;

    this.renderStudyCard();
  },

  renderStudyCard() {
    const session = this.studySession;
    const flipper = document.getElementById('study-card-flipper');
    if (!flipper) return;

    // Reset rotation before editing content
    flipper.classList.remove('flipped');

    const card = session.cards[session.currentIndex];
    
    document.getElementById('study-progress-count').textContent = `Card ${session.currentIndex + 1} of ${session.cards.length}`;
    
    // Set text elements
    document.getElementById('study-card-front-text').textContent = card.front;
    document.getElementById('study-card-back-text').textContent = card.back;
  },

  handleStudyFeedback(rating) {
    const session = this.studySession;
    session.history.push({ cardIdx: session.currentIndex, rating });

    // Track study streaks and time metrics
    const todayStr = window.App.getOffsetDate(0);
    window.App.state.studyStreak[todayStr] = true;
    
    // Add micro minutes studied for each card reviewed (e.g. 0.25 min / card)
    window.App.state.studyTime = Math.min(window.App.state.studyTime + 0.25, 9999);
    window.App.saveState();

    if (session.currentIndex < session.cards.length - 1) {
      session.currentIndex++;
      // Give a tiny timeout for transition flips to animate out before swapping content
      const flipper = document.getElementById('study-card-flipper');
      if (flipper && flipper.classList.contains('flipped')) {
        flipper.classList.remove('flipped');
        setTimeout(() => {
          this.renderStudyCard();
        }, 300);
      } else {
        this.renderStudyCard();
      }
    } else {
      // Completed reviews
      this.concludeStudy();
    }
  },

  concludeStudy() {
    const session = this.studySession;
    const totalCards = session.cards.length;
    
    // Count rating statistics
    const easyCount = session.history.filter(h => h.rating === 3).length;
    const medCount = session.history.filter(h => h.rating === 2).length;
    const hardCount = session.history.filter(h => h.rating === 1).length;

    alert(`🎉 Deck Review Completed!\n\nSummary:\n- Reviewed: ${totalCards} cards\n- Easy Recall: ${easyCount}\n- Needs Practice: ${medCount}\n- Hard: ${hardCount}`);
    
    this.showDeckList();
  }
};
