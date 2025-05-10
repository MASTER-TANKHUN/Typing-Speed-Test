const textSamples = {
    words: [
        "the quick brown fox jumps over the lazy dog interface keyboard monitor display desktop laptop code syntax array function variable constant string integer algorithm framework server client database network protocol security responsive design development environment cloud storage memory processor graphics tablet mobile device",
        "apple banana cherry date elderberry fig grape honeydew imbe jackfruit kiwi lemon mango nectarine orange papaya quince raspberry strawberry tangerine ugli fruit vanilla watermelon xigua yellow zucchini avocado blueberry coconut dragonfruit",
        "mountain valley river forest desert ocean island beach cliff cave canyon plateau glacier volcano summit ridge peak peninsula isthmus strait gulf bay lake delta oasis waterfall creek stream pond basin watershed coast shoreline horizon"
    ],
    quotes: [
        "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle. - Steve Jobs",
        "In three words I can sum up everything I've learned about life: it goes on. - Robert Frost",
        "Success is not final, failure is not fatal: It is the courage to continue that counts. - Winston Churchill",
        "The greatest glory in living lies not in never falling, but in rising every time we fall. - Nelson Mandela",
        "Life is what happens when you're busy making other plans. - John Lennon"
    ],
    code: [
        "function calculateSum(array) { let sum = 0; for(let i = 0; i < array.length; i++) { sum += array[i]; } return sum; }",
        "const fetchData = async () => { try { const response = await fetch('https://api.example.com/data'); const data = await response.json(); return data; } catch (error) { console.error('Error:', error); } }",
        "class Rectangle { constructor(height, width) { this.height = height; this.width = width; } get area() { return this.calcArea(); } calcArea() { return this.height * this.width; } }"
    ]
};

const wordsElement = document.getElementById('words');
const typingInput = document.getElementById('typing-input');
const focusMessage = document.getElementById('focus-message');
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const timeElement = document.getElementById('time');
const restartBtn = document.getElementById('restart-btn');
const newTestBtn = document.getElementById('new-test-btn');
const timeSelector = document.getElementById('time-selector');
const textSelector = document.getElementById('text-selector');
const typingArea = document.getElementById('typing-area');

let words = [];
let wordIndex = 0;
let letterIndex = 0;
let startTime;
let endTime;
let timerInterval;
let totalTestTime = 30;
let timeLeft = totalTestTime;
let correctWords = 0;
let correctChars = 0;
let incorrectChars = 0;
let testActive = false;
let testFinished = false;
let currentInput = '';
let lastCursorPosition = { left: 0, top: 0 };
let caretAnimationTimeout;

function init() {
    totalTestTime = parseInt(timeSelector.value);
    timeLeft = totalTestTime;

    timeElement.textContent = formatTime(timeLeft);

    wpmElement.textContent = '0';
    accuracyElement.textContent = '100%';

    wordIndex = 0;
    letterIndex = 0;
    correctWords = 0;
    correctChars = 0;
    incorrectChars = 0;
    testActive = false;
    testFinished = false;
    currentInput = '';
    lastCursorPosition = { left: 0, top: 0 };

    clearInterval(timerInterval);
    clearTimeout(caretAnimationTimeout);

    generateTest();

    typingInput.value = '';
    typingInput.focus();
    
    // Initial smooth fade-in for words
    const allWords = document.querySelectorAll('.word');
    allWords.forEach((word, index) => {
        word.style.opacity = '0';
        word.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            word.style.transition = 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)';
            word.style.opacity = index === 0 ? '1' : '0.5';
            word.style.transform = 'translateY(0)';
        }, 50 + index * 20);
    });
}

function generateTest() {
    const category = textSelector.value;
    const sampleText = textSamples[category][Math.floor(Math.random() * textSamples[category].length)];

    wordsElement.innerHTML = '';

    words = sampleText.split(' ');
    
    words.forEach((word, index) => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word';
        if (index === 0) wordElement.classList.add('active');

        [...word].forEach(letter => {
            const letterElement = document.createElement('span');
            letterElement.textContent = letter;
            wordElement.appendChild(letterElement);
        });
        
        wordsElement.appendChild(wordElement);
    });

    addCursorToCurrentLetter();
}

function addCursorToCurrentLetter() {
    const existingCursor = document.querySelector('.cursor');
    const existingCurrentLetter = document.querySelector('.current-letter');
    
    if (existingCurrentLetter) existingCurrentLetter.classList.remove('current-letter');
    
    const activeWord = document.querySelector('.word.active');
    if (!activeWord) return;

    const currentLetter = activeWord.children[letterIndex];
    let newLeft, newTop;
    
    if (currentLetter) {
        currentLetter.classList.add('current-letter');

        const letterRect = currentLetter.getBoundingClientRect();
        const wordsRect = wordsElement.getBoundingClientRect();
        
        newLeft = letterRect.left - wordsRect.left - 2;
        newTop = letterRect.top - wordsRect.top;
    } else if (activeWord) {
        const lastLetter = activeWord.lastChild;
        const letterRect = lastLetter.getBoundingClientRect();
        const wordsRect = wordsElement.getBoundingClientRect();
        
        newLeft = letterRect.right - wordsRect.left + 2;
        newTop = letterRect.top - wordsRect.top;
    } else {
        return;
    }
    
    if (existingCursor) {
        // Animate cursor movement
        existingCursor.style.left = `${newLeft}px`;
        existingCursor.style.top = `${newTop}px`;
        
        // Add a quick flash animation
        existingCursor.classList.remove('caret-animation');
        void existingCursor.offsetWidth;
        existingCursor.classList.add('caret-animation');
    } else {
        const cursor = document.createElement('div');
        cursor.className = 'cursor';
        cursor.style.left = `${newLeft}px`;
        cursor.style.top = `${newTop}px`;
        wordsElement.appendChild(cursor);
    }
    
    lastCursorPosition = { left: newLeft, top: newTop };
}

function startTest() {
    if (testActive) return;
    
    testActive = true;
    startTime = new Date();
    
    timerInterval = setInterval(() => {
        timeLeft = totalTestTime - Math.floor((new Date() - startTime) / 1000);
        
        if (timeLeft <= 0) {
            finishTest();
            return;
        }
        
        timeElement.textContent = formatTime(timeLeft);
        updateWPM();
    }, 1000);
}

function updateWPM() {
    if (!testActive) return;
    
    const timeElapsed = (new Date() - startTime) / 60000;
    const wpm = Math.round(correctChars / 5 / timeElapsed);
    
    const oldWpm = parseInt(wpmElement.textContent);
    if (wpm !== oldWpm) {
        wpmElement.textContent = wpm;
        smoothlyAnimateMetric(wpmElement);
    }
}

function finishTest() {
    if (testFinished) return;
    
    testFinished = true;
    testActive = false;
    endTime = new Date();
    clearInterval(timerInterval);

    const timeElapsed = (endTime - startTime) / 60000;
    const wpm = Math.round(correctChars / 5 / timeElapsed);
    const accuracy = Math.round((correctChars / (correctChars + incorrectChars)) * 100);
    
    wpmElement.textContent = wpm;
    accuracyElement.textContent = `${accuracy}%`;
    timeElement.textContent = '0s';
    
    smoothlyAnimateMetric(wpmElement);
    smoothlyAnimateMetric(accuracyElement);

    const activeWord = document.querySelector('.word.active');
    if (activeWord) activeWord.classList.remove('active');
    
    const currentLetter = document.querySelector('.current-letter');
    if (currentLetter) currentLetter.classList.remove('current-letter');
    
    const cursor = document.querySelector('.cursor');
    if (cursor) {
        cursor.style.animation = 'none';
        setTimeout(() => cursor.remove(), 300);
    }
    
    // Smooth fade-out for all words
    const allWords = document.querySelectorAll('.word');
    allWords.forEach((word, index) => {
        setTimeout(() => {
            word.style.opacity = '0.3';
            word.style.transform = 'translateY(5px)';
        }, 50 + index * 10);
    });
}

function formatTime(seconds) {
    if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
        return `${seconds}s`;
    }
}

function smoothlyAnimateMetric(element) {
    element.classList.remove('updated');
    void element.offsetWidth;
    element.classList.add('updated');
}

function smoothLetterAnimation(letterElement) {
    if (!letterElement) return;
    letterElement.classList.remove('typed-letter');
    void letterElement.offsetWidth;
    letterElement.classList.add('typed-letter');
}

function handleInput(e) {
    if (testFinished) return;

    if (!testActive) {
        startTest();
    }
    
    const key = e.key;
    
    if (key === ' ') {
        checkWord();
        moveToNextWord();
        currentInput = '';
        return;
    }

    if (key === 'Backspace') {
        if (letterIndex > 0) {
            letterIndex--;
            currentInput = currentInput.slice(0, -1);

            const activeWord = document.querySelector('.word.active');
            if (activeWord && letterIndex < activeWord.children.length) {
                const currentLetter = activeWord.children[letterIndex];
                currentLetter.classList.remove('correct', 'incorrect');
                currentLetter.style.transition = 'all 0.12s cubic-bezier(0.25, 0.1, 0.25, 1)';
            }
            
            addCursorToCurrentLetter();
        }
        return;
    }

    if (key.length !== 1) return;

    const activeWord = document.querySelector('.word.active');
    if (!activeWord) return;
    
    const wordLength = activeWord.children.length;

    currentInput += key;

    if (letterIndex < wordLength) {
        const currentLetter = activeWord.children[letterIndex];
        const correctLetter = currentLetter.textContent;
        
        if (key === correctLetter) {
            currentLetter.classList.add('correct');
            correctChars++;
        } else {
            currentLetter.classList.add('incorrect');
            incorrectChars++;
        }
        
        smoothLetterAnimation(currentLetter);
    } else {
        incorrectChars++;
    }

    letterIndex++;
    addCursorToCurrentLetter();
    
    const accuracy = Math.round((correctChars / (correctChars + incorrectChars)) * 100);
    const oldAccuracy = parseInt(accuracyElement.textContent);
    if (accuracy !== oldAccuracy) {
        accuracyElement.textContent = `${accuracy}%`;
        smoothlyAnimateMetric(accuracyElement);
    }
}

function checkWord() {
    const activeWord = document.querySelector('.word.active');
    if (!activeWord) return;
    
    const wordText = [...activeWord.children].map(letter => letter.textContent).join('');
    
    if (currentInput === wordText) {
        activeWord.classList.add('correct', 'word-complete');
        correctWords++;
    } else {
        activeWord.classList.add('incorrect', 'word-complete');
    }
    
    // Remove animation class after completion
    setTimeout(() => {
        activeWord.classList.remove('word-complete');
    }, 300);
}

function moveToNextWord() {
    const activeWord = document.querySelector('.word.active');
    if (!activeWord) return;
    
    // Smooth transition for completed word
    activeWord.style.transition = 'all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)';
    activeWord.style.opacity = '0.8';
    activeWord.classList.remove('active');
    
    const nextWord = activeWord.nextElementSibling;
    if (nextWord) {
        // Prepare next word transition
        nextWord.style.transition = 'all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)';
        
        // Slightly delay the activation for smooth transition
        setTimeout(() => {
            nextWord.classList.add('active');
            nextWord.style.opacity = '1';
            letterIndex = 0;
            addCursorToCurrentLetter();
        }, 20);
    } else {
        finishTest();
    }
}

function handleFocus() {
    focusMessage.classList.remove('show');
}

function handleBlur() {
    focusMessage.classList.add('show');
}

function handleTypingAreaClick(e) {
    if (e.target !== typingInput) {
        typingInput.focus();
    }
}

typingInput.addEventListener('keydown', handleInput);
typingInput.addEventListener('focus', handleFocus);
typingInput.addEventListener('blur', handleBlur);
typingArea.addEventListener('click', handleTypingAreaClick);
restartBtn.addEventListener('click', init);
newTestBtn.addEventListener('click', init);
timeSelector.addEventListener('change', init);
textSelector.addEventListener('change', init);
document.addEventListener('DOMContentLoaded', () => {
    init();
    setTimeout(() => {
        typingInput.focus();
    }, 500);
});

init();