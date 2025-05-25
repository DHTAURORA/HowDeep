// Game State Management
class GameState {
    constructor() {
        this.currentLevel = 1;
        this.currentCardIndex = 0;
        this.totalCards = 20;
        this.customQuestions = [];
        this.questions = this.initializeQuestions();
        this.progress = 0;
        this.gameInProgress = false;
    }

    initializeQuestions() {
        return {
            level1: [
                "What's your favorite hobby?",
                "What's something you're passionate about?",
                "What's your favorite memory from childhood?"
            ],
            level2: [
                "What's something you're afraid to tell others?",
                "What's a secret you've never told anyone?",
                "What's your biggest regret?"
            ],
            level3: [
                "What's your biggest fear?",
                "What's your deepest desire?",
                "What's something you've never done but want to?"
            ],
            wildcards: [
                "If you could have dinner with anyone, who would it be?",
                "What's something you've never told anyone?",
                "What's your biggest dream?"
            ]
        };
    }

    getNextQuestion() {
        const level = this.currentLevel;
        const questions = this.questions[`level${level}`];
        const wildcards = this.questions.wildcards;
        
        // 20% chance for wildcard
        if (Math.random() < 0.2) {
            return wildcards[Math.floor(Math.random() * wildcards.length)];
        }
        
        return questions[Math.floor(Math.random() * questions.length)];
    }

    updateProgress() {
        this.progress = (this.currentCardIndex / this.totalCards) * 100;
        document.getElementById('progress').style.width = `${this.progress}%`;
    }
}

// Game UI Management
class GameUI {
    constructor() { 
        this.gameState = new GameState();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('next-card').addEventListener('click', () => this.showNextCard());
        document.getElementById('prev-card').addEventListener('click', () => this.showPreviousCard());
        document.getElementById('save-game').addEventListener('click', () => this.saveGame());
        document.getElementById('end-session').addEventListener('click', () => this.endGame());
        document.getElementById('add-question').addEventListener('click', () => this.addCustomQuestion());
        document.getElementById('game-length').addEventListener('input', (e) => this.updateGameLength(e));
        
        // Touch event handling for mobile swipe
        const card = document.getElementById('game-card');
        let touchStartX = 0;
        let touchEndX = 0;
        const SWIPE_THRESHOLD = 50; // Minimum distance to trigger a swipe

        card.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            e.preventDefault();
        }, { passive: false });

        card.addEventListener('touchmove', (e) => {
            // Prevent scrolling during swipe
            if (Math.abs(e.changedTouches[0].screenX - touchStartX) > 10) {
                e.preventDefault();
            }
        }, { passive: false });

        card.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const swipeDistance = touchEndX - touchStartX;
            
            // Check if swipe distance is significant enough
            if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
                if (swipeDistance > 0) {
                    // Swipe right - go to previous card
                    this.showPreviousCard();
                } else {
                    // Swipe left - go to next card
                    this.showNextCard();
                }
            }
            e.preventDefault();
        }, { passive: false });
        
        // Add event listeners to close modals when clicking outside
        const setupModalClose = (modalId, closeButtonId = null) => {
            const modal = document.getElementById(modalId);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
            
            if (closeButtonId) {
                document.getElementById(closeButtonId).addEventListener('click', () => {
                    modal.classList.remove('active');
                });
            }
        };
        
        // Setup both modals
        setupModalClose('end-session-modal', 'cancel-end');
        setupModalClose('save-game-modal', 'close-save');
    }

    startGame() {
        const welcomeScreen = document.getElementById('welcome-screen');
        const gameScreen = document.getElementById('game-screen');
        
        // Remove active class to trigger wipe down
        welcomeScreen.classList.remove('active');
        
        // Wait for transition to complete before showing new screen
        setTimeout(() => {
            // Add active class to trigger wipe up
            gameScreen.classList.add('active');
            this.gameState.gameInProgress = true;
            this.showCard();
        }, 500); // Match the CSS transition duration
    }

    showCard() {
        this.updateCardContent();
    }

    async showNextCard() {
        if (this.gameState.currentCardIndex < this.gameState.totalCards - 1) {
            const card = document.getElementById('game-card');
            // Add slide-out animation to the left
            card.classList.add('slide-out-left');
            
            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Update card content
            this.gameState.currentCardIndex++;
            this.gameState.updateProgress();
            this.updateCardContent();
            
            // Add slide-in animation from the right
            card.classList.remove('slide-out-left');
            card.classList.add('slide-in-right');
            
            // Clean up after animation
            setTimeout(() => {
                card.classList.remove('slide-in-right');
            }, 500);
        }
    }

    async showPreviousCard() {
        if (this.gameState.currentCardIndex > 0) {
            const card = document.getElementById('game-card');
            // Add slide-out animation to the right
            card.classList.add('slide-out-right');
            
            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Update card content
            this.gameState.currentCardIndex--;
            this.gameState.updateProgress();
            this.updateCardContent();
            
            // Add slide-in animation from the left
            card.classList.remove('slide-out-right');
            card.classList.add('slide-in-left');
            
            // Clean up after animation
            setTimeout(() => {
                card.classList.remove('slide-in-left');
            }, 500);
        }
    }

    updateCardContent() {
        const card = document.getElementById('game-card');
        const front = card.querySelector('.card-front');
        const back = card.querySelector('.card-back');
        
        const question = this.gameState.getNextQuestion();
        
        front.textContent = `Level ${this.gameState.currentLevel}`;
        back.textContent = question;
    }

    saveGame() {
        try {
            // Save game state to local storage
            localStorage.setItem('gameState', JSON.stringify({
                currentLevel: this.gameState.currentLevel,
                currentCardIndex: this.gameState.currentCardIndex,
                totalCards: this.gameState.totalCards,
                progress: this.gameState.progress,
                gameInProgress: this.gameState.gameInProgress
            }));
            
            // Show save confirmation modal
            document.getElementById('save-game-modal').classList.add('active');
            
            // Auto-hide the modal after 2 seconds
            setTimeout(() => {
                document.getElementById('save-game-modal').classList.remove('active');
            }, 2000);
        } catch (error) {
            console.error('Error saving game:', error);
        }
    }

    endGame() {
        const modal = document.getElementById('end-session-modal');
        const gameScreen = document.getElementById('game-screen');
        
        // Add blur effect to game screen
        gameScreen.classList.add('blur');
        modal.classList.add('active');
        
        // Add event listeners for modal buttons
        document.getElementById('confirm-end').addEventListener('click', () => {
            this.gameState.gameInProgress = false;
            gameScreen.classList.remove('active');
            gameScreen.classList.remove('blur');
            document.getElementById('welcome-screen').classList.add('active');
            modal.classList.remove('active');
        });

        document.getElementById('cancel-end').addEventListener('click', () => {
            gameScreen.classList.remove('blur');
            modal.classList.remove('active');
        });
    }

    addCustomQuestion() {
        const question = document.getElementById('custom-question').value;
        if (question.trim()) {
            this.gameState.customQuestions.push(question);
            alert('Custom question added successfully!');
            document.getElementById('custom-question').value = '';
        }
    }

    updateGameLength(e) {
        const value = e.target.value;
        document.getElementById('game-length-value').textContent = value;
        this.gameState.totalCards = parseInt(value);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GameUI();
});
