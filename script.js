const X_CLASS = "x";
const CIRCLE_CLASS = "circle";
const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
]

const scores = {
    'x': -1,  // Loss for AI (AI's opponent wins)
    'circle': 1,  // Win for AI
    'tie': 0  // Draw
};

const cellElements = document.querySelectorAll('[data-cell]')
const board = document.getElementById("board")
const winningMessageElement = document.getElementById('winningMessage')
const winningMessageTextElement = document.querySelector('[data-winning-message-text]')
const restartButton = document.getElementById('restartButton')
const resetScoreButton = document.getElementById('resetScoreButton');
let circleTurn

// Sound Effects
const placePiece = new Audio('SoundEffects/place-piece.mp3');
const winGame = new Audio('SoundEffects/win-sound.mp3');
const drawGame = new Audio('SoundEffects/draw-sound.mp3');

startGame()

restartButton.addEventListener('click', startGame)
resetScoreButton.addEventListener('click', resetScore);

/*
 * Starts the tic-tac-toe game
 *   - stops sound effects
 *   - x moves first
 *   - clears board
 *   - prepares hover animations
 */ 
function startGame() {
    stopAllSounds();
    circleTurn = false
    cellElements.forEach(cell => {
        cell.classList.remove(X_CLASS)
        cell.classList.remove(CIRCLE_CLASS)
        cell.classList.remove('winning-cell')
        cell.classList.remove('draw-cell')
        cell.removeEventListener('click', handleClick)
        cell.addEventListener('click', handleClick, { once: true }) 
    })
    setBoardHoverClass()
    winningMessageElement.classList.remove('show')

}

function placeMark(cell, currentClass) {
    cell.classList.add(currentClass)
}

function swapTurns() {
    circleTurn = !circleTurn
}

/*
 * Sets the hovering animations for the game
 */
function setBoardHoverClass() {
    board.classList.remove(X_CLASS)
    board.classList.remove(CIRCLE_CLASS)
    if (circleTurn) {
        board.classList.add(CIRCLE_CLASS) 
    } else {
        board.classList.add(X_CLASS)
    }
}

/*
 * Event handler that is triggered whenever a player clicks on a cell
 * - handles player move
 * - checks for game outcome (win/draw)
 * - if necessary, swaps turn to AI
 */
function handleClick(e) {
    const cell = e.target;                                          // refers to cell that was clicked
    const currentClass = circleTurn ? CIRCLE_CLASS : X_CLASS;       // determines whether X or O should be put on cell
    placeMark(cell, currentClass);                                  
    placePiece.play();

    if (checkWin(currentClass)) {       // if game ends with win, call endGame(false) - false meaning that game didn't end in draw
        endGame(false);     
    } else if (isDraw()) {              
        endGame(true);
    } else {                            // if game isn't over, swap turns, update hover state
        swapTurns();                    
        setBoardHoverClass();
        if (circleTurn) {               // AI plays O. If it's O's turn, AI makes a move.        
            aiMove();
        }

    }
}

/* 
 * Responsible for making the AI's move when it's the AI's turn
 * It has a 30% chance to make a random move and a 70% chance to make the best move
 */
function aiMove() {
    let randomMoveChance = Math.random();
    if (randomMoveChance < 0.2) {               // 20% chance to make a random move
        makeRandomMove();
    } else {                                    // 80% chance to make a strategic move
        const bestMove = getBestMove();         
        cellElements[bestMove].click();         // add to cell by simulating a click
    }
}

/*
 * Makes a random move for the AI
 */
function makeRandomMove() {
    let availableCells = [];    // list of all empty cells
    cellElements.forEach((cell, index) => {
        if (!cell.classList.contains(X_CLASS) && !cell.classList.contains(CIRCLE_CLASS)) {
            availableCells.push(index);
        }
    });
    const randomIndex = Math.floor(Math.random() * availableCells.length);  // pick a random number
    cellElements[availableCells[randomIndex]].click();                      // add to cell by simulating a click
}

/*
 * Determines the best move for the AI using the Minimax Algorithm
 * Evaluates all possible moves and selects the one with the highest score
 * Returns index of the best move found
 */
function getBestMove() {
    let bestScore = -Infinity;  
    let move;
    cellElements.forEach((cell, index) => {
        if (!cell.classList.contains(X_CLASS) && !cell.classList.contains(CIRCLE_CLASS)) {      // if cell is empty
            cell.classList.add(CIRCLE_CLASS);                                                   // temporarily make move
            let score = minimax(cellElements, 0, false, true);                                  // evaluate move using Minimax
            cell.classList.remove(CIRCLE_CLASS);                                                // undo the move
            if (score > bestScore) {                                                            
                bestScore = score;
                move = index;
            }
        }
    });
    return move;    
}

/*
 * A recursive algorithm used to find the optimal move for the AI.
 * Simulates all possible moves, scores them, and selects the best one.
 * @param cells - current state of the board
 * @param depth - num of moves ahead the function is calculating
 * @param isMaximizing - indicates which move to maximize score
 * @param allowRandomness - boolean indicating whether to include randomness
 */
function minimax(cells, depth, isMaximizing, allowRandomness) {

    // Base Case: if game is over, return score for that result
    let result = checkWinner();
    if (result !== null) {
        return scores[result];  // returns either -1, 0, or 1 (depending on result)
    }

    if (isMaximizing) {     // O's turn
        let bestScore = -Infinity;
        cells.forEach((cell, index) => {
            if (!cell.classList.contains(X_CLASS) && !cell.classList.contains(CIRCLE_CLASS)) {   // if cell is empty
                cell.classList.add(CIRCLE_CLASS);                                                // temporarily add a circle
                let score = minimax(cells, depth + 1, false, true);                              // recursive call, switch turn 
                cell.classList.remove(CIRCLE_CLASS);                                             // undo temporary circle
                bestScore = Math.max(score, bestScore);                                          // update bestScore
            }
        });

        return bestScore;

    } else {                                                                                     // same algorithm as above
        let bestScore = Infinity;
        cells.forEach((cell, index) => {
            if (!cell.classList.contains(X_CLASS) && !cell.classList.contains(CIRCLE_CLASS)) {
                cell.classList.add(X_CLASS);
                let score = minimax(cells, depth + 1, true, true);
                cell.classList.remove(X_CLASS);
                bestScore = Math.min(score, bestScore);
            }
        });

        return bestScore;
    }
}

/*
 * Helper function for minimax algorithm - checks win/draw for possible moves
 */
function checkWinner() {
    let winner = null;
    if (checkWin(CIRCLE_CLASS)) {
        winner = 'circle';
    } else if (checkWin(X_CLASS)) {
        winner = 'x';
    } else if (isDraw()) {
        winner = 'tie';
    }
    return winner;
}

/*
 * Checks current board to see if it matches one of the possible winning combinations
 */
function checkWin(currentClass) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => cellElements[index].classList.contains(currentClass));
    });
}

/*
 * Checks if every cell is full (draw)
 */ 
function isDraw() {
    return [...cellElements].every(cell => {
        return cell.classList.contains(X_CLASS) || cell.classList.contains(CIRCLE_CLASS)
    })
}

/*
 * Displays end game message and sound effects at the end of the game
 */
function endGame(draw) {
    if (draw) {
        winningMessageTextElement.innerText = 'Draw!';
        drawGame.play();
        cellElements.forEach(cell => {
            cell.classList.add('draw-cell');
        });
    } else {
        winningMessageTextElement.innerText = `${circleTurn ? "O's" : "X's"} Wins!`;
        winGame.play();
        updateScore(circleTurn ? 'O' : 'X');

        WINNING_COMBINATIONS.forEach(combination => {
            if (combination.every(index => cellElements[index].classList.contains(circleTurn ? CIRCLE_CLASS : X_CLASS))) {
                combination.forEach(index => cellElements[index].classList.add('winning-cell'));
            }
        });
    }
    winningMessageElement.classList.add('show');
}

/*
 * Keeps track of the current score between player and AI
 */ 
function updateScore(winner) {
    if (winner === 'X') {
        let scoreX = document.getElementById('score-x')
        scoreX.textContent = parseInt(scoreX.textContent) + 1
    } else if (winner === 'O') {
        let scoreO = document.getElementById('score-o')
        scoreO.textContent = parseInt(scoreO.textContent) + 1
    }
}

function resetScore() {
    document.getElementById('score-x').textContent = 0
    document.getElementById('score-o').textContent = 0
}

function stopAllSounds() {
    winGame.pause();
    winGame.currentTime = 0;
    drawGame.pause();
    drawGame.currentTime = 0;
}

function handleThemeChange(event) {
    const selectedTheme = event.target.value;
    setTheme(selectedTheme);
}

/*
 * Contains containers and elements for various themese
 */
function setTheme(theme) {
    document.body.className = ''; 
    if (theme !== 'default') {
        document.body.classList.add(`${theme}-theme`);
    }
    localStorage.setItem('selectedTheme', theme); 

    const cloudContainer = document.getElementById('cloudContainer');
    const moonContainer = document.getElementById('moonContainer');
    const starContainer = document.getElementById('starContainer');
    cloudContainer.innerHTML = ''; 
    moonContainer.innerHTML = ''; 
    starContainer.innerHTML = '';

    if (theme === 'sky') {
        addClouds();
    } else if (theme === 'night') {
        addMoon();
        addStars(50);
    }
}

/* 
 * Supplements "Sky" theme
 */
function addClouds() {
    const cloudContainer = document.getElementById('cloudContainer');
    for (let i = 0; i < 5; i++) {
        const cloud = document.createElement('div');
        cloud.classList.add('cloud');
        cloudContainer.appendChild(cloud);
    }
}

/* 
 * Supplements "Night" theme
 */
function addMoon() {
    const moonContainer = document.getElementById('moonContainer');
    const moon = document.createElement('div');
    moon.classList.add('moon');
    moonContainer.appendChild(moon);
}

function addStars(count) {
    const starContainer = document.getElementById('starContainer');
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        star.style.top = `${Math.random() * 100}vh`;
        star.style.left = `${Math.random() * 100}vw`;
        starContainer.appendChild(star);
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    document.getElementById('themeSelect').value = savedTheme;
    setTheme(savedTheme);
});