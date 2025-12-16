// ===== ОСНОВНОЙ КЛАСС ИГРЫ =====
class SudokuGame {
    constructor() {
        // Состояние игры
        this.state = {
            mode: 'career',
            difficulty: 'medium',
            level: 15,
            lives: 3,
            hints: 3,
            score: 0,
            time: 0,
            timerInterval: null,
            mistakes: 0,
            usedHints: 0,
            careerProgress: 15,
            
            board: [],
            solution: [],
            prefilled: [],
            history: [],
            activeCell: null,
            isSolving: false
        };
        
        // Настройки сложности
        this.difficultySettings = {
            easy: { filled: 35 },
            medium: { filled: 30 },
            hard: { filled: 25 },
            expert: { filled: 20 }
        };
        
        this.init();
    }
    
    init() {
        this.createFallingDigits();
        this.cacheElements();
        this.setupEventListeners();
        this.createNumberPad();
        this.loadState();
        
        console.log('🎮 SUDO.ME запущен');
    }
    
    createFallingDigits() {
        const container = document.getElementById('fallingDigits');
        const digits = '123456789';
        
        // Создаем 20 падающих цифр
        for (let i = 0; i < 20; i++) {
            const digit = document.createElement('div');
            digit.className = 'digit';
            digit.textContent = digits[Math.floor(Math.random() * digits.length)];
            
            // Случайная позиция
            digit.style.left = Math.random() * 100 + 'vw';
            
            // Случайная скорость
            const duration = 10 + Math.random() * 20;
            const delay = Math.random() * 5;
            
            digit.style.animation = `fall ${duration}s linear ${delay}s infinite`;
            
            container.appendChild(digit);
        }
    }
    
    cacheElements() {
        // Экраны
        this.screens = {
            main: document.getElementById('mainScreen'),
            difficulty: document.getElementById('difficultyScreen'),
            game: document.getElementById('gameScreen')
        };
        
        // Кнопки
        this.buttons = {
            career: document.getElementById('careerMode'),
            free: document.getElementById('freeMode'),
            back: document.getElementById('backBtn'),
            gameBack: document.getElementById('gameBackBtn')
        };
        
        // Элементы сложности
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');
        
        // Игровые элементы
        this.elements = {
            grid: document.getElementById('sudokuGrid'),
            numberPad: document.getElementById('numberPad'),
            currentMode: document.getElementById('currentMode'),
            currentLevel: document.getElementById('currentLevel'),
            gameTimer: document.getElementById('gameTimer'),
            livesStat: document.getElementById('livesStat').querySelector('.stat-value'),
            hintsStat: document.getElementById('hintsStat').querySelector('.stat-value'),
            
            hintBtn: document.getElementById('hintBtn'),
            checkBtn: document.getElementById('checkBtn'),
            undoBtn: document.getElementById('undoBtn'),
            clearBtn: document.getElementById('clearBtn')
        };
        
        // Модальные окна
        this.modals = {
            levelComplete: document.getElementById('levelCompleteModal'),
            hint: document.getElementById('hintModal')
        };
        
        // Кнопки модалок
        this.modalButtons = {
            nextLevel: document.getElementById('nextLevelBtn'),
            menu: document.getElementById('menuBtn'),
            cancelHint: document.getElementById('cancelHintBtn'),
            confirmHint: document.getElementById('confirmHintBtn')
        };
        
        // Уведомления
        this.toast = document.getElementById('toast');
    }
    
    setupEventListeners() {
        // Навигация
        this.buttons.career.addEventListener('click', () => this.selectMode('career'));
        this.buttons.free.addEventListener('click', () => this.selectMode('free'));
        this.buttons.back.addEventListener('click', () => this.goBack());
        this.buttons.gameBack.addEventListener('click', () => this.goBack());
        
        // Выбор сложности
        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const difficulty = e.currentTarget.dataset.difficulty;
                this.state.difficulty = difficulty;
                this.startGame();
            });
        });
        
        // Игровые кнопки
        this.elements.hintBtn.addEventListener('click', () => this.showHintModal());
        this.elements.checkBtn.addEventListener('click', () => this.checkSolution());
        this.elements.undoBtn.addEventListener('click', () => this.undoMove());
        this.elements.clearBtn.addEventListener('click', () => this.clearCell());
        
        // Модальные окна
        this.modalButtons.nextLevel.addEventListener('click', () => this.nextLevel());
        this.modalButtons.menu.addEventListener('click', () => this.returnToMenu());
        this.modalButtons.cancelHint.addEventListener('click', () => this.hideModal('hint'));
        this.modalButtons.confirmHint.addEventListener('click', () => this.useHint());
        
        // Клавиатура
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Закрытие модальных окон
        Object.values(this.modals).forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Ресайз окна
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => this.handleResize());
    }
    
    handleResize() {
        // Обновляем размер клеток при изменении размера окна
        const cellSize = Math.min(40, window.innerWidth / 10);
        document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
    }
    
    // ===== НАВИГАЦИЯ =====
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }
    
    goBack() {
        if (this.screens.difficulty.classList.contains('active')) {
            this.showScreen('main');
        } else if (this.screens.game.classList.contains('active')) {
            this.showScreen(this.state.mode === 'career' ? 'main' : 'difficulty');
        }
    }
    
    // ===== ВЫБОР РЕЖИМА =====
    selectMode(mode) {
        this.state.mode = mode;
        this.state.lives = 3;
        this.state.hints = 3;
        
        if (mode === 'career') {
            this.startGame();
        } else {
            this.showScreen('difficulty');
        }
    }
    
    startGame() {
        this.resetGameState();
        
        this.elements.currentMode.textContent = this.state.mode === 'career' ? 'Карьера' : 'Свободная игра';
        this.elements.currentLevel.textContent = this.state.mode === 'career' 
            ? `Уровень ${this.state.level}`
            : this.getDifficultyName(this.state.difficulty);
        
        this.generateSudoku();
        this.startTimer();
        this.showScreen('game');
        
        // Обновляем размер клеток
        this.handleResize();
    }
    
    resetGameState() {
        this.state.board = [];
        this.state.solution = [];
        this.state.prefilled = [];
        this.state.history = [];
        this.state.activeCell = null;
        this.state.mistakes = 0;
        this.state.usedHints = 0;
        this.state.time = 0;
        this.state.isSolving = false;
        
        this.stopTimer();
        this.updateGameUI();
    }
    
    // ===== ГЕНЕРАЦИЯ СУДОКУ =====
    generateSudoku() {
        this.elements.grid.innerHTML = '';
        
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            cell.dataset.index = i;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 1;
            input.className = 'cell-input';
            input.dataset.index = i;
            input.readOnly = true;
            
            cell.appendChild(input);
            cell.addEventListener('click', () => this.selectCell(cell));
            
            this.elements.grid.appendChild(cell);
            this.state.board.push(0);
        }
        
        this.generateSolution();
        this.removeCells();
        this.renderBoard();
    }
    
    generateSolution() {
        const board = Array(81).fill(0);
        
        // Заполняем диагональные блоки
        for (let block = 0; block < 3; block++) {
            this.fillDiagonalBlock(block, board);
        }
        
        // Решаем остальную часть
        this.solveBoard(board);
        
        this.state.solution = [...board];
        this.state.board = [...board];
    }
    
    fillDiagonalBlock(block, board) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.shuffleArray(numbers);
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const row = block * 3 + i;
                const col = block * 3 + j;
                const index = row * 9 + col;
                board[index] = numbers[i * 3 + j];
            }
        }
    }
    
    removeCells() {
        const settings = this.difficultySettings[this.state.difficulty];
        const cellsToRemove = 81 - settings.filled;
        const removed = new Set();
        
        // Удаляем клетки симметрично
        while (removed.size < cellsToRemove) {
            const index = Math.floor(Math.random() * 81);
            
            if (!removed.has(index)) {
                const row = Math.floor(index / 9);
                const col = index % 9;
                const symmetricIndex = (8 - row) * 9 + (8 - col);
                
                this.state.board[index] = 0;
                removed.add(index);
                
                if (removed.size < cellsToRemove && index !== symmetricIndex && !removed.has(symmetricIndex)) {
                    this.state.board[symmetricIndex] = 0;
                    removed.add(symmetricIndex);
                }
            }
        }
        
        this.state.prefilled = this.state.board.map(val => val !== 0);
    }
    
    // ===== ПАНЕЛЬ ЦИФР =====
    createNumberPad() {
        this.elements.numberPad.innerHTML = '';
        
        // Цифры 1-9
        for (let i = 1; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.className = 'number-btn';
            btn.textContent = i;
            btn.dataset.number = i;
            
            btn.addEventListener('click', () => {
                if (this.state.activeCell) {
                    this.inputNumber(i);
                }
            });
            
            this.elements.numberPad.appendChild(btn);
        }
        
        // Кнопка очистки
        const clearBtn = document.createElement('button');
        clearBtn.className = 'number-btn clear';
        clearBtn.innerHTML = '⌫';
        clearBtn.title = 'Очистить';
        
        clearBtn.addEventListener('click', () => {
            if (this.state.activeCell) {
                this.inputNumber(0);
            }
        });
        
        this.elements.numberPad.appendChild(clearBtn);
    }
    
    // ===== ИГРОВАЯ ЛОГИКА =====
    selectCell(cell) {
        document.querySelectorAll('.sudoku-cell').forEach(c => {
            c.classList.remove('active');
        });
        
        cell.classList.add('active');
        this.state.activeCell = cell;
    }
    
    inputNumber(number) {
        if (!this.state.activeCell || this.state.isSolving) return;
        
        const index = parseInt(this.state.activeCell.dataset.index);
        
        // Нельзя менять предзаполненные клетки
        if (this.state.prefilled[index]) {
            this.showToast('Эта клетка предзаполнена', 'warning');
            return;
        }
        
        // Сохраняем в историю
        const previousValue = this.state.board[index];
        this.state.history.push({ index, previousValue, newValue: number });
        
        // Обновляем доску
        this.state.board[index] = number;
        
        // Обновляем отображение
        const input = this.state.activeCell.querySelector('.cell-input');
        
        if (number === 0) {
            input.value = '';
            this.state.activeCell.classList.remove('user-input');
        } else {
            input.value = number;
            this.state.activeCell.classList.add('user-input');
            
            // Проверяем на ошибки
            this.checkForErrors(index, number);
            
            // Проверяем завершение
            if (this.isPuzzleComplete()) {
                this.completeLevel();
            }
        }
        
        // Ограничиваем историю
        if (this.state.history.length > 50) {
            this.state.history.shift();
        }
    }
    
    checkForErrors(index, number) {
        if (number === 0) return;
        
        const row = Math.floor(index / 9);
        const col = index % 9;
        let hasError = false;
        
        // Проверка строки
        for (let c = 0; c < 9; c++) {
            const checkIndex = row * 9 + c;
            if (checkIndex !== index && this.state.board[checkIndex] === number) {
                this.markError(checkIndex);
                hasError = true;
            }
        }
        
        // Проверка столбца
        for (let r = 0; r < 9; r++) {
            const checkIndex = r * 9 + col;
            if (checkIndex !== index && this.state.board[checkIndex] === number) {
                this.markError(checkIndex);
                hasError = true;
            }
        }
        
        // Проверка блока 3x3
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        
        for (let r = startRow; r < startRow + 3; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
                const checkIndex = r * 9 + c;
                if (checkIndex !== index && this.state.board[checkIndex] === number) {
                    this.markError(checkIndex);
                    hasError = true;
                }
            }
        }
        
        // Если есть ошибка, помечаем текущую ячейку и уменьшаем жизни
        if (hasError) {
            this.markError(index);
            this.loseLife();
        }
    }
    
    markError(index) {
        const cell = this.elements.grid.children[index];
        cell.classList.add('error');
        
        setTimeout(() => {
            cell.classList.remove('error');
        }, 1500);
    }
    
    loseLife() {
        this.state.mistakes++;
        this.state.lives--;
        this.updateGameUI();
        
        if (this.state.lives <= 0) {
            setTimeout(() => this.gameOver(), 500);
        }
    }
    
    // ===== ПОДСКАЗКИ =====
    showHintModal() {
        if (this.state.hints <= 0) {
            this.showToast('Подсказки закончились', 'warning');
            return;
        }
        
        if (!this.state.activeCell) {
            this.showToast('Выберите клетку', 'info');
            return;
        }
        
        const index = parseInt(this.state.activeCell.dataset.index);
        if (this.state.board[index] !== 0) {
            this.showToast('Клетка уже заполнена', 'info');
            return;
        }
        
        document.getElementById('hintsRemaining').textContent = this.state.hints;
        this.showModal('hint');
    }
    
    useHint() {
        if (!this.state.activeCell || this.state.hints <= 0) return;
        
        const index = parseInt(this.state.activeCell.dataset.index);
        const correctValue = this.state.solution[index];
        
        this.inputNumber(correctValue);
        
        this.state.hints--;
        this.state.usedHints++;
        this.updateGameUI();
        
        this.hideModal('hint');
        this.showToast('Подсказка использована', 'success');
    }
    
    // ===== ПРОВЕРКА РЕШЕНИЯ =====
    checkSolution() {
        let hasErrors = false;
        
        for (let i = 0; i < 81; i++) {
            if (this.state.board[i] !== 0 && this.state.board[i] !== this.state.solution[i]) {
                this.elements.grid.children[i].classList.add('error');
                hasErrors = true;
            }
        }
        
        if (!hasErrors) {
            this.showToast('Все верно! Продолжайте', 'success');
        } else {
            this.showToast('Есть ошибки', 'error');
        }
    }
    
    // ===== ОТМЕНА ХОДА =====
    undoMove() {
        if (this.state.history.length === 0) {
            this.showToast('Нет ходов для отмены', 'info');
            return;
        }
        
        const lastMove = this.state.history.pop();
        const index = lastMove.index;
        
        this.state.board[index] = lastMove.previousValue;
        
        const cell = this.elements.grid.children[index];
        const input = cell.querySelector('.cell-input');
        
        if (lastMove.previousValue === 0) {
            input.value = '';
            cell.classList.remove('user-input');
        } else {
            input.value = lastMove.previousValue;
            cell.classList.add('user-input');
        }
        
        cell.classList.remove('error');
        
        this.showToast('Ход отменен', 'info');
    }
    
    clearCell() {
        if (this.state.activeCell) {
            this.inputNumber(0);
        }
    }
    
    // ===== ЗАВЕРШЕНИЕ УРОВНЯ =====
    isPuzzleComplete() {
        for (let i = 0; i < 81; i++) {
            if (this.state.board[i] === 0 || this.state.board[i] !== this.state.solution[i]) {
                return false;
            }
        }
        return true;
    }
    
    completeLevel() {
        this.stopTimer();
        
        // Расчет очков
        const timeBonus = Math.max(1000 - this.state.time * 2, 100);
        const mistakePenalty = this.state.mistakes * 50;
        const hintPenalty = this.state.usedHints * 100;
        const difficultyMultiplier = {
            easy: 1,
            medium: 1.5,
            hard: 2,
            expert: 3
        }[this.state.difficulty];
        
        const levelScore = Math.floor(
            (timeBonus - mistakePenalty - hintPenalty) * difficultyMultiplier
        );
        
        this.state.score += Math.max(levelScore, 100);
        
        // Обновление статистики в модальном окне
        document.getElementById('completeTime').textContent = this.formatTime(this.state.time);
        document.getElementById('completeMistakes').textContent = this.state.mistakes;
        document.getElementById('completeHints').textContent = this.state.usedHints;
        document.getElementById('completeScore').textContent = levelScore;
        
        // Для карьерного режима
        if (this.state.mode === 'career') {
            this.state.level++;
            this.state.careerProgress = Math.max(this.state.careerProgress, this.state.level);
        }
        
        // Сохранение
        this.saveState();
        
        // Показ модального окна
        setTimeout(() => {
            this.showModal('levelComplete');
        }, 500);
    }
    
    gameOver() {
        this.stopTimer();
        this.showToast('Игра окончена!', 'error');
        
        setTimeout(() => {
            this.restartGame();
        }, 2000);
    }
    
    nextLevel() {
        this.hideModal('levelComplete');
        
        // Сброс статистики уровня
        this.state.lives = 3;
        this.state.hints = 3;
        this.state.time = 0;
        this.state.mistakes = 0;
        this.state.usedHints = 0;
        
        // Генерация нового судоку
        this.generateSudoku();
        
        // Обновление UI
        this.updateGameUI();
        this.elements.currentLevel.textContent = this.state.mode === 'career' 
            ? `Уровень ${this.state.level}`
            : this.getDifficultyName(this.state.difficulty);
        
        // Запуск таймера
        this.startTimer();
    }
    
    restartGame() {
        this.state.lives = 3;
        this.state.hints = 3;
        this.state.time = 0;
        this.state.mistakes = 0;
        this.state.usedHints = 0;
        
        this.generateSudoku();
        this.updateGameUI();
        this.startTimer();
    }
    
    returnToMenu() {
        this.hideAllModals();
        this.showScreen('main');
    }
    
    // ===== ТАЙМЕР =====
    startTimer() {
        this.stopTimer();
        
        this.state.timerInterval = setInterval(() => {
            this.state.time++;
            this.elements.gameTimer.textContent = this.formatTime(this.state.time);
        }, 1000);
    }
    
    stopTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // ===== РЕНДЕРИНГ ДОСКИ =====
    renderBoard() {
        for (let i = 0; i < 81; i++) {
            const cell = this.elements.grid.children[i];
            const input = cell.querySelector('.cell-input');
            const value = this.state.board[i];
            
            cell.className = 'sudoku-cell';
            
            if (value !== 0) {
                input.value = value;
                if (this.state.prefilled[i]) {
                    cell.classList.add('prefilled');
                } else {
                    cell.classList.add('user-input');
                }
            } else {
                input.value = '';
            }
        }
    }
    
    // ===== АЛГОРИТМ РЕШЕНИЯ СУДОКУ =====
    solveBoard(board) {
        return this.solve(board);
    }
    
    solve(board) {
        const emptyIndex = this.findEmptyCell(board);
        if (emptyIndex === -1) return true;
        
        const row = Math.floor(emptyIndex / 9);
        const col = emptyIndex % 9;
        
        for (let num = 1; num <= 9; num++) {
            if (this.isValidPlacement(board, row, col, num)) {
                board[emptyIndex] = num;
                
                if (this.solve(board)) {
                    return true;
                }
                
                board[emptyIndex] = 0;
            }
        }
        
        return false;
    }
    
    findEmptyCell(board) {
        for (let i = 0; i < 81; i++) {
            if (board[i] === 0) return i;
        }
        return -1;
    }
    
    isValidPlacement(board, row, col, num) {
        // Проверка строки
        for (let c = 0; c < 9; c++) {
            if (board[row * 9 + c] === num) return false;
        }
        
        // Проверка столбца
        for (let r = 0; r < 9; r++) {
            if (board[r * 9 + col] === num) return false;
        }
        
        // Проверка блока 3x3
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        
        for (let r = startRow; r < startRow + 3; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
                if (board[r * 9 + c] === num) return false;
            }
        }
        
        return true;
    }
    
    // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    getDifficultyName(difficulty) {
        const names = {
            easy: 'Легкая',
            medium: 'Средняя',
            hard: 'Сложная',
            expert: 'Эксперт'
        };
        return names[difficulty] || difficulty;
    }
    
    showModal(modalName) {
        const modal = this.modals[modalName];
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    hideModal(modalName) {
        const modal = this.modals[modalName];
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    hideAllModals() {
        Object.values(this.modals).forEach(modal => {
            modal.classList.remove('active');
        });
    }
    
    showToast(message, type = 'info') {
        const toast = this.toast;
        toast.textContent = message;
        toast.className = 'toast';
        toast.classList.add(type, 'show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    updateGameUI() {
        this.elements.livesStat.textContent = this.state.lives;
        this.elements.hintsStat.textContent = this.state.hints;
        this.elements.gameTimer.textContent = this.formatTime(this.state.time);
    }
    
    // ===== СОХРАНЕНИЕ СОСТОЯНИЯ =====
    saveState() {
        const saveData = {
            careerProgress: this.state.careerProgress,
            level: this.state.level,
            score: this.state.score
        };
        localStorage.setItem('sudoMeState', JSON.stringify(saveData));
    }
    
    loadState() {
        const saved = localStorage.getItem('sudoMeState');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.state.careerProgress = data.careerProgress || 15;
                this.state.level = data.level || 15;
                this.state.score = data.score || 0;
            } catch (e) {
                console.warn('Ошибка загрузки сохранения:', e);
            }
        }
    }
    
    // ===== ОБРАБОТКА КЛАВИАТУРЫ =====
    handleKeyDown(e) {
        if (!this.state.activeCell) return;
        
        // Цифры 1-9
        if (e.key >= '1' && e.key <= '9') {
            e.preventDefault();
            this.inputNumber(parseInt(e.key));
        }
        
        // Backspace/Delete
        if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            this.inputNumber(0);
        }
        
        // Стрелки для навигации
        if (e.key.startsWith('Arrow')) {
            e.preventDefault();
            this.navigateGrid(e.key);
        }
        
        // Пробел для подсказки
        if (e.key === ' ') {
            e.preventDefault();
            this.showHintModal();
        }
        
        // Enter для проверки
        if (e.key === 'Enter') {
            e.preventDefault();
            this.checkSolution();
        }
        
        // Z для отмены (с Ctrl)
        if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.undoMove();
        }
    }
    
    navigateGrid(direction) {
        if (!this.state.activeCell) return;
        
        const index = parseInt(this.state.activeCell.dataset.index);
        let newIndex = index;
        
        switch (direction) {
            case 'ArrowUp':
                newIndex = index - 9;
                if (newIndex < 0) newIndex += 81;
                break;
            case 'ArrowDown':
                newIndex = index + 9;
                if (newIndex >= 81) newIndex -= 81;
                break;
            case 'ArrowLeft':
                if (index % 9 !== 0) newIndex = index - 1;
                break;
            case 'ArrowRight':
                if (index % 9 !== 8) newIndex = index + 1;
                break;
        }
        
        if (newIndex >= 0 && newIndex < 81) {
            this.selectCell(this.elements.grid.children[newIndex]);
        }
    }
}

// ===== ЗАПУСК ПРИЛОЖЕНИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    window.sudokuGame = new SudokuGame();
});
