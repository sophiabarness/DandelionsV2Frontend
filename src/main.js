import Two from 'two.js';

const ROOM_ID_LENGTH = 10;
let roomId = "";
let playerRole = "";
let otherPlayerRole = "";
let readyToPlay = false;
let message = "";
let dandelionTurn = false;
let windTurn = false;
let turns = 0;
let ws;

const CellState = {
    EMPTY: '/white.png',
    DANDELION: '/green-asterisk.png',
    SEED: '/green-dot.png'
}

const PlayerRole = {
    DANDELION: 'dandelion',
    WIND: 'wind',
}

const windMoveInfo = [
    [[], [], [1, 2, 3, 4], [6, 12, 18, 24], [5, 10, 15, 20], [], [], []], 
    [[], [], [2, 3, 4], [7, 13, 19], [6, 11, 16, 21], [5], [0], []],
    [[], [], [3, 4], [8, 14], [7, 12, 17, 22], [6, 10], [1, 0], []],
    [[], [], [4], [9], [8, 13, 18, 23], [7, 11, 15], [2, 1, 0], []],
    [[], [], [], [9, 14, 19, 24], [8, 12, 16, 20], [3, 2, 1, 0], []],
    [[0], [1], [6, 7, 8, 9], [11, 17, 23], [10, 15, 20], [], [], []],
    [[1], [2], [7, 8, 9], [12, 18, 24], [11, 16, 21], [10], [5], [0]],
    [[2], [3], [8, 9], [13, 19], [12, 17, 22], [11, 15], [6,5], [1]],
    [[3], [4], [9], [14], [13, 18, 23], [12, 16, 20],[7,6,5], [2]],
    [[4], [], [], [], [14, 19, 24], [13, 17, 21], [8, 7, 6, 5], [3]],
    [[5, 0], [6, 2], [11, 12, 13, 14], [16, 22], [15, 20], [], [], []],
    [[1, 6], [3, 7], [12, 13, 14], [17, 23], [16, 21], [15], [10], [5]],
    [[2, 7], [4, 8], [13, 14], [18, 24], [17, 22], [16, 20], [11, 10], [6,0]],
    [[3, 8], [9], [14], [19], [18, 23], [17, 21], [10, 11, 12], [1,7]],
    [[4, 9], [], [], [], [19, 24], [18, 22], [13, 12,11, 10], [1, 7]],
    [[10, 5, 0], [11, 7, 3], [16, 17, 18, 19], [21], [20], [], [], []],
    [[11, 6, 1], [12, 8, 4], [17, 18, 19], [22], [21], [20], [15], [10]],
    [[12, 7, 2], [13, 9], [18, 19], [23], [22], [21], [16, 15], [11, 5]],
    [[13, 8, 3], [14], [19], [24], [23] ,[22], [17, 16, 15], [11, 5]],
    [[14, 9, 4], [], [], [], [24], [23], [18, 17, 16, 15], [12, 6, 0]],
    [[15, 10, 5,0], [16, 12, 8, 4], [21, 22, 23, 24], [], [], [], [], []],
    [[16, 11, 6, 1], [17, 13, 9], [22, 23, 24], [], [], [], [20], [15]],
    [[17, 12, 7, 2], [18, 14], [23, 24], [], [], [], [21, 20], [16, 10]],
    [[18, 13, 8, 3], [19], [24], [], [], [], [22, 21, 20], [17, 11, 5]],
    [[19, 14, 9, 4], [], [], [], [], [], [23, 22, 21, 20], [18, 12, 6, 0]]
]

function generateRoomId(length) {
    return Math.random().toString(36).substring(2, length).toUpperCase();
}

function loaded() {
    const directions = document.getElementById('directions');
    const output =  document.getElementById("output");
    let images = [];
    let board = document.getElementById('board');
    for (let i = 0; i < 25; i++) {
        images[i] = document.createElement("img");
        images[i].setAttribute('src', CellState.EMPTY);
        board.appendChild(images[i]);
    };
    let windButtons = document.querySelectorAll('button');
    let usedWindButtons = [];
    let dandelionTurns = [];

    // Draw game. 
    var compass = document.getElementById("compass");
    var twoCompass = new Two({fitted: true}).appendTo(compass);
    var styles = {
        size: 14, 
        weight: 'bold'
    }
    var x1 = twoCompass.width * 0.5;
    var y1 = twoCompass.height * 0.5;
    var circle = twoCompass.makeCircle(x1, y1, 50);
    var circle1 = twoCompass.makeCircle(x1, y1, 25);
    circle.stroke = 'green';
    circle.fill = 'rgb(220, 238, 244)';
    circle1.fill = 'rgb(220, 238, 244)';
    circle1.stroke = 'green';
    circle.linewidth = '2px';
    circle1.linewidth = '2px';
    let xdirections = [x1, x1+48, x1+66, x1 + 48, x1, x1 - 48, x1-66, x1-48];
    let ydirections = [y1-66, y1-48, y1, y1 + 48, y1+66, y1 + 48, y1, y1 -48];
    let xTextDirections = [x1, x1+57, x1+75, x1 + 57, x1, x1 - 57, x1-75, x1-57];
    let yTextDirections = [y1-75, y1-57, y1, y1 + 57, y1+75, y1 + 57, y1, y1 -57];
    var line = [];
    var text = [];
    for (let i = 0; i < 8; i++) {
        line[i] = twoCompass.makeArrow(x1, y1, xdirections[i], ydirections[i]);
        var textDirection = document.getElementById(String(i));
        text[i] = twoCompass.makeText(textDirection.innerText, xTextDirections[i], yTextDirections[i], styles);
    }
    twoCompass.update();

    function setDirections(message) {
        directions.innerText = message;
    }

    async function enterGame() {
        await waitForWebSocket();
        ws.send(`{ "action": "entergame", "data": "${roomId}"}`);
    }

    async function waitForWebSocket() {
        while (!ws || ws.readyState !== WebSocket.OPEN) {
            await new Promise(resolve => setTimeout(resolve, 25)); // Wait for 25ms
        }
    }

    async function send(msg) {
        await waitForWebSocket();
        const str = `${playerRole}: ${encodeURI(msg)}`;
        console.log(`sending message: ${str}`);
        ws.send(`{ "action": "sendmessage", "data":"${str}"}`);
    }

    // Checks if the board is filled.
    function boardFilled() {
        var counter = 0;
        for (let i = 0; i < 25; i++) {
            if (images[i].getAttribute('src') === CellState.EMPTY) {
                counter++;
            }
        }
        return (counter === 0);
    }

    // Checks if the game is over.
    function isGameOver() {
        return (boardFilled() || turns === 7);
    }

    // Completes next steps after game is over.
    function gameOver() {
        if (playerRole === PlayerRole.WIND && (boardFilled() || turns === 7)) {
            for (let j = 0; j < buttons.length; j++) {
                buttons[j].classList.add('disabled');
            }
        }
        if (boardFilled()) {
            setDirections('The dandelion won!');
        }
        else if (turns === 7) {
            setDirections('The wind won!');
        }
    }
    
    function connectToWebSocket(roomId) {
        console.log(`Room ID: ${roomId}`);
        
        const uri = "wss://k5fc15wo29.execute-api.us-east-1.amazonaws.com/dev";
        ws = new WebSocket(uri);
        
        ws.onopen = (e) => {
            send("hi");
            console.log("Connected");
            enterGame();
            const joinDiv = document.getElementById("join");
            if (joinDiv) {
                joinDiv.innerHTML = '';
                const gameIdText = document.createElement("h3");
                gameIdText.textContent = `Game ID: ${roomId}`;
                joinDiv.appendChild(gameIdText);
            }
        };
    
        ws.onmessage = (e) => {
            message = decodeURI(e.data);
            console.log(`receiving message: ${message}`);
            if (message === "wind: connected to the game") {
                readyToPlay = true;
                drawGame();
            }
            // Dandelion just went. 
            if (message.startsWith("dandelion: turn:")) {
                dandelionTurns = message.split(": ")[2].split(",");
                console.log(dandelionTurns);
                const index = parseInt(dandelionTurns[dandelionTurns.length - 1]);
                images[index].setAttribute('src', CellState.DANDELION);
                dandelionTurn = false;
                windTurn = true;
                if (isGameOver()) {
                    gameOver();
                } else {
                    if (playerRole === PlayerRole.DANDELION) {
                        setDirections('It\'s the wind\'s turn! Wait for your turn.');
                    } else if (playerRole === PlayerRole.WIND) {
                        setDirections('It\'s the wind\'s turn! Choose a direction to blow.');
                        // Enable wind buttons. 
                        for (let j = 0; j < windButtons.length; j++) {
                            if (!usedWindButtons.includes(j)) {
                                windButtons[j].classList.remove('disabled');
                            }
                        }
                    }
                }
            }

            // Wind just went.
            if (message.startsWith("wind: turn:")) {
                const windMove = parseInt(message.split(":")[2]);
                usedWindButtons.push(windMove);
                line[windMove].linewidth = 5;
                line[windMove].stroke = 'green';
                twoCompass.update();
                console.log("dandelionTurns", dandelionTurns);
                for (let h = 0; h < dandelionTurns.length; h++) {
                    let toFill = windMoveInfo[parseInt(dandelionTurns[h])][windMove];
                    for (let j = 0; j < toFill.length; j++) {
                        if (images[toFill[j]].getAttribute('src') !== CellState.DANDELION) {
                            images[toFill[j]].setAttribute('src', CellState.SEED);
                        }
                    }
                }
                dandelionTurn = true;
                windTurn = false;
                turns++;
                if (isGameOver()) {
                    gameOver();
                } else {
                    if (playerRole === PlayerRole.DANDELION) {
                        setDirections('It\'s the dandelion\'s turn! Choose a square on the grid.');
                    } else if (playerRole === PlayerRole.WIND) {
                        setDirections('It\'s the dandelion\'s turn! Wait for your turn.');
                    }
                }
            }
        };
        
        ws.onclose = (e) => {
            console.log("Disconnected");
        };
        
        ws.onerror = (e) => {
            console.log("Error: " + e.data);
        };
    }

    const startGameButton = document.getElementById("start");
    startGameButton.onclick = () => {
        roomId = generateRoomId(ROOM_ID_LENGTH);
        connectToWebSocket(roomId);
        playerRole = PlayerRole.DANDELION;
        otherPlayerRole = PlayerRole.WIND;
    }

    const joinGameButton = document.getElementById("join-button");
    joinGameButton.onclick = async () => {
        const roomIdInput = document.getElementById("enter-game-id");
        roomId = roomIdInput.value; // Retrieve the value from the input field
        if (roomId === "") {
            alert("Please enter your Game ID.");
            return;
        }
        // Check if the roomId exists in the database
        try {
            const response = await fetch(`https://glf3kwiynd.execute-api.us-east-1.amazonaws.com/dev/roomInfoExists?roomId=${encodeURIComponent(roomId)}`, { 
                method: 'GET'
            });

            const data = await response.json();
            const parsedBody = JSON.parse(data.body);
            console.log("parsedBody", parsedBody);
            console.log(parsedBody);
            if (parsedBody.exists) {
                connectToWebSocket(roomId);
                playerRole = PlayerRole.WIND;
                otherPlayerRole = PlayerRole.DANDELION;
                send("connected to the game");
            } else {
                alert("Game ID does not exist.");
            }
        } catch (error) {
            console.error("Error checking roomId", error);
            alert("An error occurred while checking the Game ID.");
        }
    }

    
    function drawGame() {
        if (playerRole === PlayerRole.DANDELION) {
            setDirections('It\'s the dandelion\'s turn! Choose a square on the grid.');
        } else if (playerRole === PlayerRole.WIND) {
            setDirections('It\'s the dandelion\'s turn! Wait for your turn.');
        }
        for (let i = 0; i < windButtons.length; i++) {
            windButtons[i].addEventListener('click', windClick);
            function windClick() {
                let notClickable = windButtons[i].classList.contains('disabled');
                if (windTurn && !notClickable && playerRole === PlayerRole.WIND) {
                    send(`turn: ${i}`);
                    // Disable the wind buttons for dandelion's turn. 
                    for (let j = 0; j < windButtons.length; j++) {
                        windButtons[j].classList.add('disabled');
                    }
                }        
            }
        }
    
        dandelionTurn = true;
        for (let i = 0; i < 25; i++) {
            images[i].addEventListener("click", onMouseClick);
            function onMouseClick() {
                if (dandelionTurn && turns !== 7 && !isGameOver() & playerRole === PlayerRole.DANDELION) {
                    dandelionTurns.push(i);
                    send(`turn: ${dandelionTurns}`);
                    images[i].removeEventListener("click", onMouseClick);
                    images[i].setAttribute('src', CellState.DANDELION);
                    // if (isGameOver()) {
                    //     gameOver();
                    // }
                    // else {
                    //     directions.innerText = 'It\'s the wind\'s turn! Choose a direction to blow.';
                    // }
                    // dandelionTurn = false;
                    // windTurn = true;
                }    
            }
        }
    
        // // checks if the board is filled
        // function boardFilled() {
        //     var counter = 0;
        //     for (let i = 0; i < 25; i++) {
        //         if (images[i].getAttribute('src') === CellState.EMPTY) {
        //             counter++;
        //         }
        //     }
        //     return (counter === 0);
        // }
    
        // // checks if the game is over
        // function isGameOver() {
        //     return (boardFilled() || turns === 7);
        // }
    
        // // completes next steps after game is over
        // function gameOver() {
        //     if (boardFilled() || turns === 7) {
        //         for (let j = 0; j < buttons.length; j++) {
        //             buttons[j].classList.add('disabled');
        //         }
        //     }
        //     if (boardFilled()) {
        //         setDirections('The dandelion won!');
        //     }
        //     else if (turns === 7) {
        //         setDirections('The wind won!');
        //     }
        // }
    }  
}


/* Execute the above function when the DOM tree is fully loaded. */
document.addEventListener("DOMContentLoaded", loaded);


