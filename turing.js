class TuringMachine {
    constructor() {
        this.tape = {};
        this.headPosition = 0;
        this.currentState = 'q0';
        this.transitions = {};
        this.steps = 0;
        this.status = 'READY'; // READY, RUNNING, HALTED, ERROR
        this.blankSymbol = '_';
    }

    // Parsowanie reguł z pola tekstowego
    loadProgram(programText) {
        this.transitions = {};
        const lines = programText.split('\n');
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('//')) continue;

            // Regex: state,symbol -> new_state,new_symbol,dir
            const match = line.match(/^([a-zA-Z0-9_]+),([^\s,])\s*->\s*([a-zA-Z0-9_]+),([^\s,]),([LRN])$/);
            if (match) {
                const [, state, symbol, newState, newSymbol, direction] = match;
                if (!this.transitions[state]) this.transitions[state] = {};
                this.transitions[state][symbol] = { newState, newSymbol, direction };
            } else {
                return false; // Błąd składni
            }
        }
        return true; // Sukces
    }

    // Inicjalizacja taśmy
    initTape(inputString) {
        this.tape = {};
        this.headPosition = 0;
        this.currentState = 'q0';
        this.steps = 0;
        this.status = 'READY';
        
        for (let i = 0; i < inputString.length; i++) {
            this.tape[i] = inputString[i];
        }
    }

    readSymbol() {
        return this.tape[this.headPosition] || this.blankSymbol;
    }

    writeSymbol(symbol) {
        if (symbol === this.blankSymbol) {
            delete this.tape[this.headPosition];
        } else {
            this.tape[this.headPosition] = symbol;
        }
    }

    // Zwraca informacje o kierunku animacji
    step() {
        if (this.status === 'HALTED' || this.status === 'ERROR') return null;

        const symbol = this.readSymbol();
        const stateTransitions = this.transitions[this.currentState];

        if (!stateTransitions || !stateTransitions[symbol]) {
            // Brak przejścia - domyślny halt
            this.status = this.currentState.toLowerCase().includes('halt') ? 'HALTED' : 'ERROR';
            return null;
        }

        const { newState, newSymbol, direction } = stateTransitions[symbol];
        
        this.writeSymbol(newSymbol);
        this.currentState = newState;
        
        let moveDir = 0;
        if (direction === 'R') {
            this.headPosition++;
            moveDir = 1;
        } else if (direction === 'L') {
            this.headPosition--;
            moveDir = -1;
        }

        this.steps++;
        if (this.currentState.toLowerCase() === 'halt') {
            this.status = 'HALTED';
        } else {
            this.status = 'RUNNING';
        }

        return moveDir; // Zwracamy kierunek dla UI (-1, 0, 1)
    }

    // Pobiera fragment taśmy do renderowania w UI (-15 do +15 względem głowicy)
    getVisibleTape(radius = 15) {
        const visible = [];
        for (let i = this.headPosition - radius; i <= this.headPosition + radius; i++) {
            visible.push({
                index: i,
                symbol: this.tape[i] || this.blankSymbol
            });
        }
        return visible;
    }
}
