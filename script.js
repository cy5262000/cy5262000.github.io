const timeEl = document.getElementById('time');
const mistakesEl = document.getElementById('mistakes');
const gameBoardDOM = document.getElementById('gameboard');
const linesBoardDOM = document.querySelectorAll('.line');
const numsInSolPad = document.querySelectorAll('.num .fa-solid');
const numsInNotePad = document.querySelectorAll('.notes-num .fa-solid');
const eraserBtn = document.getElementById('icon-eraser');
const modal = document.getElementById('modal-container');
const modalTime = document.getElementById('modal-time');
const modalMistakes = document.getElementById('modal-mistakes');
const restartBtn = document.getElementById('restart');
// const candidateBtn = document.getElementById('candidate-btn');
// const solutionBtn = document.getElementById('solution-btn');

const boardSize = 9;
const boardSizeSqrt = Math.sqrt(boardSize);
const numberOfEmptyCells = 41;
const timeInterval = null;
const gameBoard = [];
let newGameBoard = [];
let clickedX = -1;
let clickedY = -1;
let mistakesTotal = 0;
let filledSpaceCnt = 0;
let time = 0;
let formattedTime = '';

// TODO use number cnt to show cnt dots in solution pad 
let numberCnt = {};
// TODO generate html game board given boardsize
// TODO save board arrangement to localstorage 

//simple utility object to start and stop an interval       
var IntervalUtil = function (functionCall, interval) {
    var intervalObj = 0,
        INTERVAL = interval;
    var callback = functionCall;
    function startTimer() {
        console.log('start timer', intervalObj)
        if (intervalObj === 0) {
            intervalObj = setInterval(callback, INTERVAL)
        }
    }
    function stopTimer() {
        clearInterval(intervalObj);
        intervalObj = 0;
        console.log('timer stopped', intervalObj);
    }
    return {
        startTimer: startTimer,
        stopTimer: stopTimer
    }
};
const intervalUtil = new IntervalUtil(updateTime, 1000);

// revursive function to create a solved soduku game board 
// starting from cell (0,0) 
function generateSolvedBoard(x, y) {
    let arr = [];
    for (let ix = 1; ix <= boardSize; ix++) {
        arr.push(ix);
    }
    shuffleArray(arr);
    for (let i = 0; i < arr.length; i++) {
        let num = arr[i];
        if (isValid(x, y, num, gameBoard)) {
            let nx = x;
            let ny = (y + 1) % boardSize;
            if (ny == 0) {
                nx++;
                nx = nx % boardSize;
            }
            gameBoard[x][y] = num;
            if (x == boardSize - 1 && y == boardSize - 1) {
                return true;
            }
            if (generateSolvedBoard(nx, ny)) {
                return true;
            }
            gameBoard[x][y] = -1;
        }
    }
    return false;
}

// shuffle input array in place 
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

// check if number is valid in the given board
function isValid(i, j, num, board) {
    for (let idxj = 0; idxj < boardSize; idxj++) {
        if (num == board[i][idxj]) {
            return false;
        }
    }
    for (let idxi = 0; idxi < boardSize; idxi++) {
        if (num == board[idxi][j]) {
            return false;
        }
    }
    // integer divide and floor multiplied by boardSizeSqrt 
    // to get the upper right corner (the first element) in
    // current block 
    let blocki = (i / boardSizeSqrt >> 0) * boardSizeSqrt;
    let blockj = (j / boardSizeSqrt >> 0) * boardSizeSqrt;
    let blockiEnd = blocki + 3;
    let blockjEnd = blockj + 3;
    for (; blocki < blockiEnd; blocki++) {
        for (; blockj < blockjEnd; blockj++) {
            if (board[blocki][blockj] == num) {
                return false;
            }
        }
        blockj = blockj - 3;
    }
    return true;
}

// generate a new game and fill board in DOM 
function fillGameInBoard() {
    newGameBoard = generateGame();
    linesBoardDOM.forEach((line, rowIndex) => {
        [...line.children].forEach((numberDiv, colIndex) => {
            let n = newGameBoard[rowIndex][colIndex];
            if (n != -1) {
                numberDiv.innerHTML = `<i class="fa-solid fa-${n} fa-2x"></i>`
                numberDiv.classList.add('permanent')
                if (!(n in numberCnt)) {
                    numberCnt[n] = 9;
                }
                numberCnt[n]--;
            }
        })
    });
}

// clone the solved board 
function cloneSolvedBoard() {
    let clonedBoard = [...gameBoard];
    clonedBoard.forEach((row, rowIndex) => clonedBoard[rowIndex] = [...row]);
    return clonedBoard;
}

// generate game with a unique solution given a solved board 
function generateGame() {
    let board = [];
    let posToRemove = [];
    let randomPos = [];
    for (let i = 0; i < boardSize * boardSize; i++) {
        randomPos.push(i);
    }
    let toggle = true;
    while (toggle) {
        board = cloneSolvedBoard();
        posToRemove = [];
        shuffleArray(randomPos);
        for (let i = 0; i < numberOfEmptyCells; i++) {
            let xIdxToRemove = randomPos[i] / boardSize >> 0;
            let yIdxToRemove = randomPos[i] % boardSize;
            posToRemove.push([xIdxToRemove, yIdxToRemove]);
            board[xIdxToRemove][yIdxToRemove] = -1;
        }
        if (findNumberOfSolutions(board, 0, posToRemove) == 1) {
            toggle = false;
        }
    }
    return board;
}

// find number of solutions to the given board recursively 
function findNumberOfSolutions(board, i, posToRemove) {
    if (i >= posToRemove.length) {
        return 1;
    }
    let xIdx = posToRemove[i][0];
    let yIdx = posToRemove[i][1];
    let res = 0;
    for (let tryNum = 1; tryNum <= 9; tryNum++) {
        if (isValid(xIdx, yIdx, tryNum, board)) {
            board[xIdx][yIdx] = tryNum.toString();
            let nextRes = findNumberOfSolutions(board, i + 1, posToRemove);
            res = res + nextRes;
            board[xIdx][yIdx] = -1;
        }
    }
    return res;
}

// hightlight related cells when clicked 
function highLightRelatedCellsHandler(e) {
    clearHighlight();
    let currElem = e.target;
    highLightRelatedCells(currElem);
}

// hightlight related cells
function highLightRelatedCells(currElem) {
    while (!currElem.className.includes('number')) {
        currElem = currElem.parentElement;
    }
    let rowIdx = Array.prototype.indexOf.call(currElem.parentElement.parentElement.children, currElem.parentElement);
    let colIdx = Array.prototype.indexOf.call(currElem.parentElement.children, currElem);

    // update global variable clicked index 
    clickedX = rowIdx;
    clickedY = colIdx;

    // get clicked number 
    let clickedNum = -1;
    if (currElem.children.length == 1 && currElem.children[0].className.includes('fa-solid')) {
        const regex = /\sfa-(\d)\sfa/g;
        const s = currElem.children[0].className;
        let match = regex.exec(s);
        clickedNum = match[1];
    }

    // integer divide and floor multiplied by boardSizeSqrt 
    // to get the upper right corner (the first element) in
    // current block     
    let blocki = (rowIdx / boardSizeSqrt >> 0) * boardSizeSqrt;
    let blockj = (colIdx / boardSizeSqrt >> 0) * boardSizeSqrt;
    let blockiEnd = blocki + 3;
    let blockjEnd = blockj + 3;

    // highlight related row, column and block 
    linesBoardDOM.forEach((line, rowIndex) => {
        [...line.children].forEach((numberDiv, colIndex) => {
            if (numberDiv.children.length == 1 && numberDiv.children[0].className.includes(`fa-${clickedNum} `)) {
                if (!numberDiv.classList.contains('wrong')) {
                    numberDiv.children[0].classList.add('highlight');
                }
            }
            if (rowIndex == rowIdx || colIndex == colIdx) {
                if (!numberDiv.classList.contains('wrong')) {
                    numberDiv.classList.add('highlight');
                }
            }
            if (rowIndex >= blocki && rowIndex < blockiEnd && colIndex >= blockj && colIndex < blockjEnd) {
                if (!numberDiv.classList.contains('wrong')) {
                    numberDiv.classList.add('highlight');
                }
            }
        })
    });
    currElem.classList.add('focus');
}

// clear all highlight in board 
function clearHighlight() {
    linesBoardDOM.forEach(line => {
        [...line.children].forEach(numberDiv => {
            numberDiv.classList.remove('highlight');
            numberDiv.classList.remove('focus');
            if (numberDiv.children.length == 1 && numberDiv.children[0].className.includes('fa-solid')) {
                numberDiv.children[0].classList.remove('highlight');
            }
        })
    });
}

// erase a cell if number was not part of the initial board
function eraseCell() {
    let xIdx = clickedX;
    let yIdx = clickedY;
    if (xIdx != -1 && yIdx != -1) {
        linesBoardDOM.forEach((line, rowIndex) => {
            [...line.children].forEach((numberDiv, colIndex) => {
                if (xIdx == rowIndex && yIdx == colIndex && !numberDiv.classList.contains('permanent')) {
                    numberDiv.innerHTML = '';
                    numberDiv.classList.remove('wrong');
                }
            })
        });
    }
}

// get clicked number in pad 
function getClickedNumberInPad(e) {
    const regex = /\sfa-(\d)\sfa/g;
    let match = regex.exec(e.target.className);
    return match[1];
}

// fill number in board 
function fillNumberInBoard(e) {
    let xIdx = clickedX;
    let yIdx = clickedY;
    if (xIdx != -1 && yIdx != -1) {
        let clickedNum = getClickedNumberInPad(e);
        let isCorrect = false;
        if (gameBoard[xIdx][yIdx] == clickedNum) {
            isCorrect = true;
        }

        // fill number in board
        linesBoardDOM.forEach((line, rowIndex) => {
            [...line.children].forEach((numberDiv, colIndex) => {
                if (rowIndex == xIdx && colIndex == yIdx) {
                    // fill the cell if it has a wrong number or notes 
                    if (numberDiv.classList.contains('wrong') || (!numberDiv.classList.contains('wrong') && numberDiv.children.length != 1)) {
                        numberDiv.innerHTML = `<i class="fa-solid fa-${clickedNum} fa-2x"></i>`;
                        if (!isCorrect) {
                            numberDiv.classList.add('wrong');
                            mistakesTotal++;
                            mistakesEl.innerHTML = mistakesTotal;
                        } else if (gameBoard[xIdx][yIdx] == clickedNum) {
                            if (numberDiv.classList.contains('wrong')) {
                                numberDiv.classList.remove('wrong');
                            }
                            filledSpaceCnt++;
                            newGameBoard[xIdx][yIdx] = clickedNum;
                            numberCnt[clickedNum]--;
                            highLightRelatedCells(numberDiv);
                        }
                    }
                }
                // clear notes in related row, column and block 
                else if (isCorrect) {
                    // remove notes in the related row and column 
                    if (rowIndex == xIdx || colIndex == yIdx) {
                        if (numberDiv.children.length > 1) {
                            for (let i = 0; i < numberDiv.children.length; i++) {
                                if (i + 1 == clickedNum && numberDiv.children[i].children.length != 0) {
                                    numberDiv.children[i].removeChild(numberDiv.children[i].firstElementChild);
                                }
                            }
                        }
                    }
                    // integer divide and floor multiplied by boardSizeSqrt 
                    // to get the upper right corner (the first element) in
                    // current block     
                    let blocki = (xIdx / boardSizeSqrt >> 0) * boardSizeSqrt;
                    let blockj = (yIdx / boardSizeSqrt >> 0) * boardSizeSqrt;
                    let blockiEnd = blocki + 3;
                    let blockjEnd = blockj + 3;
                    // remove notes in the related block 
                    if (rowIndex >= blocki && rowIndex < blockiEnd && colIndex >= blockj && colIndex < blockjEnd) {
                        if (numberDiv.children.length > 1) {
                            for (let i = 0; i < numberDiv.children.length; i++) {
                                if (i + 1 == clickedNum && numberDiv.children[i].children.length != 0) {
                                    numberDiv.children[i].removeChild(numberDiv.children[i].firstElementChild);
                                }
                            }
                        }
                    }
                }
            })
        });
    }

    // check if game ended 
    let gameEnded = checkGameStatus();
    if (gameEnded) {
        // clearInterval(timeInterval);
        modalTime.innerHTML = `${formattedTime}`;
        modalMistakes.innerHTML = `${mistakesTotal}`;
        modal.classList.add('show-modal');
        intervalUtil.stopTimer();
    }
}


// add a note in board 
function addNotesInBoard(e) {
    let xIdx = clickedX;
    let yIdx = clickedY;
    if (xIdx != -1 && yIdx != -1) {
        let clickedNum = getClickedNumberInPad(e);
        // fill number in board
        linesBoardDOM.forEach((line, rowIndex) => {
            [...line.children].forEach((numberDiv, colIndex) => {
                if (rowIndex == xIdx && colIndex == yIdx) {
                    if (!numberDiv.classList.contains('wrong') && numberDiv.children.length > 1) {
                        for (let i = 0; i < numberDiv.children.length; i++) {
                            if (i + 1 != clickedNum) { continue; }
                            let child = numberDiv.children[i];
                            if (child.children.length == 0) {
                                child.innerHTML = `<i class="fa-solid fa-${clickedNum} fa-xs"></i>`;
                            } else {
                                child.removeChild(child.firstElementChild);
                            }
                        }
                    } else if (numberDiv.classList.contains('wrong') || numberDiv.children.length == 0) {
                        numberDiv.innerHTML = '';
                        numberDiv.classList.remove('wrong');
                        for (let i = 0; i < boardSize; i++) {
                            let currDiv = document.createElement("div");
                            currDiv.classList.add('notes-in-board');
                            if (i + 1 == clickedNum) {
                                currDiv.innerHTML = `<i class="fa-solid fa-${clickedNum} fa-xs"></i>`;
                            }
                            numberDiv.appendChild(currDiv);
                        }
                    }
                }
            })
        });
    }
}

// check if game ended 
function checkGameStatus() {
    if (filledSpaceCnt == numberOfEmptyCells) {
        return true;
    } else {
        return false;
    }
}

// update time elapsed 
function updateTime() {
    time++;
    let displayTime = '';
    if (time >= 60) {
        displayTime = new Date(time * 1000).toISOString().substr(14, 5);
    } else if (time > 3600) {
        displayTime = new Date(time * 1000).toISOString().substr(11, 8)
    } else {
        displayTime = time + 's';
    }
    formattedTime = displayTime;
    timeEl.innerHTML = displayTime;
}

// clear board 
function clearBoard() {
    linesBoardDOM.forEach((line, rowIndex) => {
        [...line.children].forEach((numberDiv, colIndex) => {
            numberDiv.innerHTML = '';
            numberDiv.classList.remove('wrong');
            numberDiv.classList.remove('permanent');
        })
    });
}


// restart game 
function startGame() {
    // init/rest global variables 
    for (let i = 0; i < boardSize; i++) {
        gameBoard.push([])
        for (let j = 0; j < boardSize; j++) {
            gameBoard[i].push(-1);
        }
    }
    newGameBoard = [];
    clickedX = -1;
    clickedY = -1;
    mistakesTotal = 0;
    numberCnt = {};
    filledSpaceCnt = 0;
    time = 0;
    formattedTime = '';
    mistakesEl.innerHTML = '0';
    generateSolvedBoard(0, 0);
    clearBoard();
    fillGameInBoard();
    modal.classList.remove('show-modal')
    intervalUtil.startTimer();
}

// event listeners 
gameBoardDOM.addEventListener('click', highLightRelatedCellsHandler);
for (const numInSolPad of numsInSolPad) {
    numInSolPad.addEventListener('click', fillNumberInBoard);
}
for (const numInNotePad of numsInNotePad) {
    numInNotePad.addEventListener('click', addNotesInBoard);
}
eraserBtn.addEventListener('click', eraseCell);
restartBtn.addEventListener('click', startGame);

(function () {
    startGame();
})();