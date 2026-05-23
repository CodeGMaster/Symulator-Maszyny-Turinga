document.addEventListener('DOMContentLoaded', () => {
    const tm = new TuringMachine();
    
    // Elementy DOM
    const tapeContainer = document.getElementById('tape-container');
    const editor = document.getElementById('code-editor');
    const initialTapeInput = document.getElementById('initial-tape');
    const syntaxError = document.getElementById('syntax-error');
    const examplesSelect = document.getElementById('examples');
    
    const uiState = document.getElementById('current-state');
    const uiSteps = document.getElementById('step-counter');
    const uiStatus = document.getElementById('machine-status');
    
    const btnPlay = document.getElementById('btn-play');
    const btnPause = document.getElementById('btn-pause');
    const btnStep = document.getElementById('btn-step');
    const btnReset = document.getElementById('btn-reset');
    const speedSlider = document.getElementById('speed-slider');

    let runInterval = null;
    let isRunning = false;
    const CELL_WIDTH = 64; // px (4rem)

    // Predefiniowane programy
    const PROGRAMS = {
        invert: {
            code: "q0,0 -> q0,1,R\nq0,1 -> q0,0,R\nq0,_ -> halt,_,N",
            tape: "101100"
        },
        parity: {
            code: "q0,0 -> q0,0,R\nq0,1 -> q1,1,R\nq0,_ -> halt,E,N\nq1,0 -> q1,0,R\nq1,1 -> q0,1,R\nq1,_ -> halt,O,N",
            tape: "1011"
        }
    };

    examplesSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (PROGRAMS[val]) {
            editor.value = PROGRAMS[val].code;
            initialTapeInput.value = PROGRAMS[val].tape;
            resetMachine();
        }
    });

    // Renderowanie statyczne całej widocznej taśmy
    function renderTape() {
        tapeContainer.style.transition = 'none';
        tapeContainer.style.transform = `translateX(0px)`;
        tapeContainer.innerHTML = '';
        
        const cells = tm.getVisibleTape(15);
        cells.forEach(cell => {
            const div = document.createElement('div');
            div.className = 'tape-cell';
            div.textContent = cell.symbol;
            tapeContainer.appendChild(div);
        });
    }

    function updateUI() {
        uiState.textContent = tm.currentState;
        uiSteps.textContent = tm.steps;
        
        if (tm.status === 'ERROR') {
            uiStatus.textContent = 'BŁĄD (Brak reguły)';
            uiStatus.className = 'ml-2 font-bold text-red-500';
            stopMachine();
        } else if (tm.status === 'HALTED') {
            uiStatus.textContent = 'ZAKOŃCZONO (Halt)';
            uiStatus.className = 'ml-2 font-bold text-blue-500';
            stopMachine();
        } else if (tm.status === 'RUNNING') {
            uiStatus.textContent = 'W TRAKCIE...';
            uiStatus.className = 'ml-2 font-bold text-yellow-500';
        } else {
            uiStatus.textContent = 'GOTOWA';
            uiStatus.className = 'ml-2 font-bold text-green-500';
        }
    }

    function resetMachine() {
        stopMachine();
        const success = tm.loadProgram(editor.value);
        if (!success) {
            syntaxError.classList.remove('hidden');
            return;
        }
        syntaxError.classList.add('hidden');
        
        tm.initTape(initialTapeInput.value);
        renderTape();
        updateUI();
    }

    // Wykonuje krok z uwzględnieniem animacji CSS (przesuwanie taśmy pod statyczną głowicą)
    function executeStep() {
        if (tm.status === 'HALTED' || tm.status === 'ERROR') return;

        const moveDir = tm.step();
        if (moveDir === null) {
            updateUI();
            return; // Halt lub Błąd
        }

        // Krok 1: Animacja CSS - ruszamy kontenerem taśmy
        const speed = parseInt(speedSlider.value);
        const animDuration = Math.min(0.3, (speed / 1000) * 0.8); // Skalowanie animacji
        
        tapeContainer.style.transition = `transform ${animDuration}s ease-in-out`;
        
        // Zauważ odwrotność: Jeśli głowica idzie w Prawo (1), taśma jedzie w Lewo (-CELL_WIDTH)
        tapeContainer.style.transform = `translateX(${-moveDir * CELL_WIDTH}px)`;

        // Zmiana symbolu aktualnej komórki natychmiastowo przed/w trakcie ruchu
        const cells = tapeContainer.children;
        const middleIndex = Math.floor(cells.length / 2);
        // Zaktualizuj komórkę, na której stała głowica (teraz z przesunięciem)
        cells[middleIndex].textContent = tm.tape[tm.headPosition - moveDir] || tm.blankSymbol;

        updateUI();

        // Krok 2: Po zakończeniu animacji - zresetuj transform i przebuduj DOM
        setTimeout(() => {
            if(!isRunning && moveDir !== 0) {
                 renderTape(); // Wymuś re-render jeśli zatrzymano na klatce
            }
        }, animDuration * 1000 + 20); // Drobny margines
    }

    function loop() {
        if (!isRunning) return;
        
        // Czekamy na koniec poprzedniego kroku i restartujemy DOM przed następnym
        renderTape(); 
        
        executeStep();

        const speed = parseInt(speedSlider.value);
        runInterval = setTimeout(loop, speed);
    }

    function startMachine() {
        if (tm.status === 'HALTED' || tm.status === 'ERROR') resetMachine();
        if (syntaxError.classList.contains('hidden')) {
            isRunning = true;
            btnPlay.disabled = true;
            btnPause.disabled = false;
            btnStep.disabled = true;
            loop();
        }
    }

    function stopMachine() {
        isRunning = false;
        clearTimeout(runInterval);
        btnPlay.disabled = false;
        btnPause.disabled = true;
        btnStep.disabled = false;
        renderTape(); // Odbuduj aby usunąć transformacje
    }

    // Nasłuchiwacze zdarzeń
    btnPlay.addEventListener('click', startMachine);
    btnPause.addEventListener('click', stopMachine);
    btnStep.addEventListener('click', () => {
        if (!isRunning) {
            renderTape();
            executeStep();
            setTimeout(renderTape, parseInt(speedSlider.value));
        }
    });
    btnReset.addEventListener('click', resetMachine);
    editor.addEventListener('input', () => {
        stopMachine();
        if(!tm.loadProgram(editor.value)) {
            syntaxError.classList.remove('hidden');
        } else {
            syntaxError.classList.add('hidden');
        }
    });

    // Inicjalizacja początkowa
    resetMachine();
});
