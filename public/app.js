// ==========================================================================
// APP STATE & STORAGE CONTROLLER
// ==========================================================================
const state = {
  apiKey: localStorage.getItem('study_spark_api_key') || '',
  hasServerEnvKey: false,
  history: JSON.parse(localStorage.getItem('study_spark_history')) || [],
  currentNotes: null,
  activeTab: 'tab-notes',
  activeFlashcardIndex: 0,
  quizAnswers: {} // tracks questionIndex -> { selectedOptionIndex, isCorrect }
};

// DOM Elements
const bodyEl = document.body;
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const apiStatusBadge = document.getElementById('api-status-badge');
const welcomePanel = document.getElementById('welcome-panel');
const loadingPanel = document.getElementById('loading-panel');
const resultPanel = document.getElementById('result-panel');

// Forms & Inputs
const generatorForm = document.getElementById('generator-form');
const topicInput = document.getElementById('topic-input');
const toneSelect = document.getElementById('tone-select');
const levelSelect = document.getElementById('level-select');
const suggestionChips = document.querySelectorAll('.chip');

// History Elements
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const newNotesBtn = document.getElementById('new-notes-btn');

// Settings Modal Elements
const settingsModal = document.getElementById('settings-modal');
const sidebarSettingsBtn = document.getElementById('sidebar-settings-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeySaveBtn = document.getElementById('api-key-save-btn');
const apiKeyClearBtn = document.getElementById('api-key-clear-btn');

// Results Rendering Elements
const resultTopicTitle = document.getElementById('result-topic-title');
const badgeTone = document.getElementById('badge-tone');
const badgeLevel = document.getElementById('badge-level');
const noteDefinition = document.getElementById('note-definition');
const noteConceptsList = document.getElementById('note-concepts-list');
const noteSimpleExplanation = document.getElementById('note-simple-explanation');
const noteAnalogy = document.getElementById('note-analogy');
const noteKeypointsList = document.getElementById('note-keypoints-list');
const noteExamplesList = document.getElementById('note-examples-list');
const noteExamtipsList = document.getElementById('note-examtips-list');

// Tabs Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Flashcard Elements
const flashcardEl = document.getElementById('flashcard-el');
const cardFrontText = document.getElementById('card-front-text');
const cardBackText = document.getElementById('card-back-text');
const prevCardBtn = document.getElementById('prev-card-btn');
const nextCardBtn = document.getElementById('next-card-btn');
const cardCounter = document.getElementById('card-counter');
const resetCardsBtn = document.getElementById('reset-cards-btn');

// Quiz Elements
const quizQuestionsContainer = document.getElementById('quiz-questions-container');
const quizScoreBadge = document.getElementById('quiz-score-badge');
const resetQuizBtn = document.getElementById('reset-quiz-btn');

// Actions
const exportPdfBtn = document.getElementById('export-pdf-btn');
const regenerateNotesBtn = document.getElementById('regenerate-notes-btn');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebarEl = document.querySelector('.sidebar');

// ==========================================================================
// INITIALIZATION & THEME CONTROLLER
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkServerKeyStatus();
  updateApiBadge();
  renderHistory();
  setupEventListeners();
});

function initTheme() {
  const savedTheme = localStorage.getItem('study_spark_theme') || 'dark';
  if (savedTheme === 'light') {
    bodyEl.classList.remove('dark-theme');
    bodyEl.classList.add('light-theme');
  } else {
    bodyEl.classList.add('dark-theme');
    bodyEl.classList.remove('light-theme');
  }
}

function toggleTheme() {
  if (bodyEl.classList.contains('dark-theme')) {
    bodyEl.classList.remove('dark-theme');
    bodyEl.classList.add('light-theme');
    localStorage.setItem('study_spark_theme', 'light');
  } else {
    bodyEl.classList.add('dark-theme');
    bodyEl.classList.remove('light-theme');
    localStorage.setItem('study_spark_theme', 'dark');
  }
}

// ==========================================================================
// API KEY & MODAL HANDLERS
// ==========================================================================
async function checkServerKeyStatus() {
  try {
    const res = await fetch('/api/config-status');
    const data = await res.json();
    state.hasServerEnvKey = !!data.hasEnvKey;
  } catch (err) {
    state.hasServerEnvKey = false;
  }
  updateApiBadge();
}

function updateApiBadge() {
  if (state.hasServerEnvKey) {
    apiStatusBadge.className = 'api-badge badge-active';
    apiStatusBadge.querySelector('.badge-label').textContent = 'Server API Key Active';
  } else if (state.apiKey) {
    apiStatusBadge.className = 'api-badge badge-active';
    apiStatusBadge.querySelector('.badge-label').textContent = 'Browser API Key Active';
  } else {
    apiStatusBadge.className = 'api-badge badge-missing';
    apiStatusBadge.querySelector('.badge-label').textContent = 'API Key Required';
  }
}

function openSettingsModal() {
  apiKeyInput.value = state.apiKey;
  settingsModal.classList.add('active');
}

function closeSettingsModal() {
  settingsModal.classList.remove('active');
}

function saveApiKey() {
  const val = apiKeyInput.value.trim();
  if (val) {
    state.apiKey = val;
    localStorage.setItem('study_spark_api_key', val);
  } else {
    state.apiKey = '';
    localStorage.removeItem('study_spark_api_key');
  }
  updateApiBadge();
  closeSettingsModal();
}

function clearApiKey() {
  state.apiKey = '';
  localStorage.removeItem('study_spark_api_key');
  apiKeyInput.value = '';
  updateApiBadge();
  closeSettingsModal();
}

// ==========================================================================
// HISTORY MANAGER
// ==========================================================================
function saveToHistory(notesData) {
  // Check if topic already exists in history, if so delete older entry
  state.history = state.history.filter(item => item.topic.toLowerCase() !== notesData.topic.toLowerCase());
  
  // Add to top of list
  const historyItem = {
    id: Date.now().toString(),
    topic: notesData.topic,
    tone: toneSelect.value,
    level: levelSelect.value,
    data: notesData,
    timestamp: new Date().toLocaleDateString()
  };
  
  state.history.unshift(historyItem);
  
  // Cap history size to 20 entries
  if (state.history.length > 20) {
    state.history.pop();
  }
  
  localStorage.setItem('study_spark_history', JSON.stringify(state.history));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = '';
  
  if (state.history.length === 0) {
    historyList.innerHTML = '<li class="history-empty">No notes generated yet</li>';
    return;
  }
  
  state.history.forEach(item => {
    const li = document.createElement('li');
    li.className = 'history-item';
    if (state.currentNotes && state.currentNotes.topic.toLowerCase() === item.topic.toLowerCase()) {
      li.classList.add('active');
    }
    
    li.innerHTML = `
      <div class="history-item-content">
        <div class="history-item-title">${item.topic}</div>
        <div class="history-item-meta">
          <span>${item.level}</span>
          <span>•</span>
          <span>${item.timestamp}</span>
        </div>
      </div>
      <button class="history-item-delete" title="Delete note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    `;
    
    // Load note on item click
    li.addEventListener('click', (e) => {
      if (e.target.closest('.history-item-delete')) return;
      loadNotesDataset(item.data, item.tone, item.level);
    });
    
    // Delete item click handler
    li.querySelector('.history-item-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteHistoryItem(item.id);
    });
    
    historyList.appendChild(li);
  });
}

function deleteHistoryItem(id) {
  state.history = state.history.filter(item => item.id !== id);
  localStorage.setItem('study_spark_history', JSON.stringify(state.history));
  renderHistory();
  
  // If the deleted item was the currently active notes, reset view to welcome panel
  if (state.history.length === 0 || (state.currentNotes && !state.history.some(item => item.topic.toLowerCase() === state.currentNotes.topic.toLowerCase()))) {
    showPanel(welcomePanel);
    state.currentNotes = null;
    renderHistory();
  }
}

function clearAllHistory() {
  if (confirm('Are you sure you want to clear all saved study notes?')) {
    state.history = [];
    localStorage.removeItem('study_spark_history');
    state.currentNotes = null;
    renderHistory();
    showPanel(welcomePanel);
  }
}

// ==========================================================================
// API CLIENT & LOGIC (GENERATOR)
// ==========================================================================
async function generateNotes(topic, tone, level) {
  if (!topic) return;
  
  // If no api key is active and server env key is also missing, prompt user
  if (!state.apiKey && !state.hasServerEnvKey) {
    openSettingsModal();
    return;
  }
  
  // Enter loading state
  showPanel(loadingPanel);
  document.getElementById('loading-topic').textContent = `Synthesizing "${topic}"...`;
  
  // Reset step animations
  const steps = [
    document.getElementById('step-1'),
    document.getElementById('step-2'),
    document.getElementById('step-3'),
    document.getElementById('step-4')
  ];
  
  steps.forEach(step => step.className = 'step');
  steps[0].classList.add('active');
  
  // Simulate step upgrades during API request to keep the user excited
  let currentStep = 0;
  const stepInterval = setInterval(() => {
    if (currentStep < 3) {
      steps[currentStep].classList.remove('active');
      steps[currentStep].classList.add('completed');
      currentStep++;
      steps[currentStep].classList.add('active');
    }
  }, 2200);
  
  try {
    const response = await fetch('/api/generate-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': state.apiKey
      },
      body: JSON.stringify({ topic, tone, level })
    });
    
    clearInterval(stepInterval);
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to generate notes.');
    }
    
    const notesData = await response.json();
    
    // Save to history and load
    saveToHistory(notesData);
    loadNotesDataset(notesData, tone, level);
    
  } catch (error) {
    clearInterval(stepInterval);
    console.error(error);
    alert(`Error: ${error.message}`);
    showPanel(welcomePanel);
  }
}

function loadNotesDataset(notesData, tone, level) {
  state.currentNotes = notesData;
  state.activeFlashcardIndex = 0;
  state.quizAnswers = {};
  
  // Render views
  renderNotesView(notesData, tone, level);
  renderFlashcardsView();
  renderQuizView();
  
  // Show result panel
  showPanel(resultPanel);
  switchTab('tab-notes');
  renderHistory();
  
  // Close sidebar on mobile if open
  sidebarEl.classList.remove('mobile-active');
}

// ==========================================================================
// RENDERERS (DOM GENERATORS)
// ==========================================================================
function renderNotesView(notesData, tone, level) {
  // Topic Headers
  resultTopicTitle.textContent = notesData.topic;
  badgeTone.textContent = `Tone: ${capitalizeFirstLetter(tone)}`;
  badgeLevel.textContent = `Level: ${capitalizeFirstLetter(level)}`;
  
  // Definition
  noteDefinition.textContent = notesData.definition;
  
  // Key Concepts List
  noteConceptsList.innerHTML = '';
  notesData.concepts.forEach(concept => {
    const item = document.createElement('div');
    item.className = 'concept-item';
    item.innerHTML = `
      <h3 class="concept-title">${concept.title}</h3>
      <p class="concept-explanation">${concept.explanation}</p>
    `;
    noteConceptsList.appendChild(item);
  });
  
  // Simple Explanation & Analogy
  noteSimpleExplanation.textContent = notesData.simpleExplanation;
  noteAnalogy.textContent = notesData.analogy;
  
  // Key Points Checklist
  noteKeypointsList.innerHTML = '';
  notesData.keyPoints.forEach(point => {
    const li = document.createElement('li');
    li.className = 'keypoint-item';
    li.textContent = point;
    noteKeypointsList.appendChild(li);
  });
  
  // Real World Examples
  noteExamplesList.innerHTML = '';
  notesData.realWorldExamples.forEach(ex => {
    const div = document.createElement('div');
    div.className = 'example-item';
    div.textContent = ex;
    noteExamplesList.appendChild(div);
  });
  
  // Exam Tips
  noteExamtipsList.innerHTML = '';
  notesData.examTips.forEach(tip => {
    const li = document.createElement('li');
    li.className = 'examtip-item';
    li.textContent = tip;
    noteExamtipsList.appendChild(li);
  });
}

function renderFlashcardsView() {
  if (!state.currentNotes || !state.currentNotes.flashcards || state.currentNotes.flashcards.length === 0) {
    return;
  }
  
  // Remove flipped class
  flashcardEl.classList.remove('flipped');
  
  const currentCard = state.currentNotes.flashcards[state.activeFlashcardIndex];
  cardFrontText.textContent = currentCard.front;
  cardBackText.textContent = currentCard.back;
  
  cardCounter.textContent = `${state.activeFlashcardIndex + 1} of ${state.currentNotes.flashcards.length}`;
  
  // Disable navigation buttons if at boundaries
  prevCardBtn.disabled = state.activeFlashcardIndex === 0;
  nextCardBtn.disabled = state.activeFlashcardIndex === state.currentNotes.flashcards.length - 1;
}

function renderQuizView() {
  if (!state.currentNotes || !state.currentNotes.quiz || state.currentNotes.quiz.length === 0) {
    return;
  }
  
  quizQuestionsContainer.innerHTML = '';
  
  // Render total score
  updateQuizScore();
  
  state.currentNotes.quiz.forEach((q, qIndex) => {
    const card = document.createElement('div');
    card.className = 'quiz-question-card';
    card.setAttribute('data-q-index', qIndex);
    
    // Header
    const questionTitle = document.createElement('h3');
    questionTitle.className = 'quiz-question-title';
    questionTitle.textContent = `${qIndex + 1}. ${q.question}`;
    card.appendChild(questionTitle);
    
    // Options
    const optionsList = document.createElement('ul');
    optionsList.className = 'quiz-options';
    
    const letters = ['A', 'B', 'C', 'D'];
    q.options.forEach((opt, optIndex) => {
      const li = document.createElement('li');
      li.className = 'quiz-option';
      li.innerHTML = `
        <span class="option-letter">${letters[optIndex]}</span>
        <span class="option-text">${opt}</span>
      `;
      
      // If quiz has already been answered, render selection states
      const savedAns = state.quizAnswers[qIndex];
      if (savedAns !== undefined) {
        li.classList.add('disabled');
        if (optIndex === q.correctIndex) {
          li.classList.add('reveal-correct');
        }
        if (savedAns.selectedIndex === optIndex) {
          if (savedAns.isCorrect) {
            li.classList.add('selected-correct');
          } else {
            li.classList.add('selected-incorrect');
          }
        }
      } else {
        // Bind selection event
        li.addEventListener('click', () => submitQuizAnswer(qIndex, optIndex));
      }
      
      optionsList.appendChild(li);
    });
    
    card.appendChild(optionsList);
    
    // Feedback Box
    const feedbackBox = document.createElement('div');
    feedbackBox.className = 'quiz-feedback';
    
    const savedAns = state.quizAnswers[qIndex];
    if (savedAns !== undefined) {
      feedbackBox.classList.add('show');
      if (savedAns.isCorrect) {
        feedbackBox.classList.add('correct');
        feedbackBox.innerHTML = `
          <div class="feedback-header">Correct Answer!</div>
          <div>${q.explanation}</div>
        `;
      } else {
        feedbackBox.classList.add('incorrect');
        feedbackBox.innerHTML = `
          <div class="feedback-header">Incorrect. The correct answer is option ${letters[q.correctIndex]}.</div>
          <div>${q.explanation}</div>
        `;
      }
    }
    
    card.appendChild(feedbackBox);
    quizQuestionsContainer.appendChild(card);
  });
}

function submitQuizAnswer(qIndex, optIndex) {
  const q = state.currentNotes.quiz[qIndex];
  const isCorrect = optIndex === q.correctIndex;
  
  state.quizAnswers[qIndex] = {
    selectedIndex: optIndex,
    isCorrect: isCorrect
  };
  
  // Re-render quiz view to update styles, feedback, and score
  renderQuizView();
}

function updateQuizScore() {
  const total = state.currentNotes.quiz.length;
  const answered = Object.keys(state.quizAnswers).length;
  const correct = Object.values(state.quizAnswers).filter(ans => ans.isCorrect).length;
  
  quizScoreBadge.textContent = `${correct} / ${answered} (${total} total)`;
}

function resetQuiz() {
  state.quizAnswers = {};
  renderQuizView();
}

// ==========================================================================
// TABS CONTROLLER & UTILS
// ==========================================================================
function switchTab(tabId) {
  state.activeTab = tabId;
  
  // Update nav buttons
  tabBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Update panes
  tabPanes.forEach(pane => {
    if (pane.id === tabId) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });
  
  // Refresh card layout if entering flashcards
  if (tabId === 'tab-flashcards') {
    renderFlashcardsView();
  }
}

function showPanel(panelEl) {
  [welcomePanel, loadingPanel, resultPanel].forEach(p => p.classList.remove('active'));
  panelEl.classList.add('active');
}

function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==========================================================================
// EVENT LISTENERS BINDINGS
// ==========================================================================
function setupEventListeners() {
  // Theme Toggle
  themeToggleBtn.addEventListener('click', toggleTheme);
  
  // Welcome Submit
  generatorForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const topic = topicInput.value.trim();
    const tone = toneSelect.value;
    const level = levelSelect.value;
    generateNotes(topic, tone, level);
  });
  
  // Suggestion Chips
  suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const topic = chip.getAttribute('data-topic');
      topicInput.value = topic;
      generateNotes(topic, toneSelect.value, levelSelect.value);
    });
  });
  
  // New Notes Sidebar Button
  newNotesBtn.addEventListener('click', () => {
    topicInput.value = '';
    showPanel(welcomePanel);
    
    // Close sidebar on mobile
    sidebarEl.classList.remove('mobile-active');
  });
  
  // API settings indicators
  apiStatusBadge.addEventListener('click', openSettingsModal);
  sidebarSettingsBtn.addEventListener('click', openSettingsModal);
  modalCloseBtn.addEventListener('click', closeSettingsModal);
  apiKeySaveBtn.addEventListener('click', saveApiKey);
  apiKeyClearBtn.addEventListener('click', clearApiKey);
  
  // Close modal when clicking background
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettingsModal();
  });
  
  // History clearing
  clearHistoryBtn.addEventListener('click', clearAllHistory);
  
  // Tabs Navigation
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });
  
  // Flashcard flipping
  flashcardEl.addEventListener('click', () => {
    flashcardEl.classList.toggle('flipped');
  });
  
  // Flashcard Deck Navigation
  prevCardBtn.addEventListener('click', () => {
    if (state.activeFlashcardIndex > 0) {
      state.activeFlashcardIndex--;
      renderFlashcardsView();
    }
  });
  
  nextCardBtn.addEventListener('click', () => {
    if (state.currentNotes && state.activeFlashcardIndex < state.currentNotes.flashcards.length - 1) {
      state.activeFlashcardIndex++;
      renderFlashcardsView();
    }
  });
  
  resetCardsBtn.addEventListener('click', () => {
    state.activeFlashcardIndex = 0;
    renderFlashcardsView();
  });
  
  // Quiz resetting
  resetQuizBtn.addEventListener('click', resetQuiz);
  
  // Regenerate Notes Button
  regenerateNotesBtn.addEventListener('click', () => {
    if (state.currentNotes) {
      const currentItem = state.history.find(item => item.topic.toLowerCase() === state.currentNotes.topic.toLowerCase());
      const tone = currentItem ? currentItem.tone : toneSelect.value;
      const level = currentItem ? currentItem.level : levelSelect.value;
      generateNotes(state.currentNotes.topic, tone, level);
    }
  });
  
  // Export PDF (window print triggers styled CSS)
  exportPdfBtn.addEventListener('click', () => {
    window.print();
  });
  
  // Mobile menu sidebar toggle
  mobileMenuBtn.addEventListener('click', () => {
    sidebarEl.classList.toggle('mobile-active');
  });
}
