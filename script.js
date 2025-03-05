document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("grid");
    const log = document.getElementById("log");
    const moveBtn = document.getElementById("move-btn");
    const trapBtn = document.getElementById("trap-btn");
    const errorMessage = document.getElementById("error-message");
    const tutorial = document.getElementById("tutorial");

    let agents = [];
    let turn = 0;
    const maxAgents = 4;
    let selectedAgentCell = null;
    let actionMode = null;

    for (let i = 0; i < 16; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.index = i;
        grid.appendChild(cell);
    }

    updateTutorial();

    moveBtn.addEventListener("click", () => {
        if (turn > 0) {
            actionMode = "move";
            moveBtn.classList.add("active");
            trapBtn.classList.remove("active");
            logMessage("MOVE SELECTED");
            updateTutorial();
        }
    });

    trapBtn.addEventListener("click", () => {
        if (turn > 0) {
            actionMode = "trap";
            trapBtn.classList.add("active");
            moveBtn.classList.remove("active");
            logMessage("TRAP SELECTED");
            updateTutorial();
        }
    });

    grid.addEventListener("click", (e) => {
        const cell = e.target.className === "cell" ? e.target : e.target.closest(".cell");
        if (!cell) return;

        const index = parseInt(cell.dataset.index);
        const row = Math.floor(index / 4);
        const col = index % 4;

        if (turn === 0) {
            if (agents.length < maxAgents) {
                const agent = document.createElement("div");
                agent.className = "agent";
                const agentId = agents.length + 1;
                agent.textContent = `A${agentId}`;
                cell.appendChild(agent);
                agents.push({ id: agentId, row, col });
                logMessage(`AGENT A${agentId} DEPLOYED TO (${row + 1},${col + 1})`);
                updateTutorial();

                if (agents.length === maxAgents) {
                    turn = 1;
                    logMessage("DEPLOYMENT COMPLETE - TURN 1");
                    updateTutorial();
                }
            }
        } else if (turn > 0 && actionMode) {
            const agentsInCell = agents.filter(a => a.row === row && a.col === col);
            if (agentsInCell.length > 0 && !selectedAgentCell) {
                selectedAgentCell = { row, col };
                cell.classList.add("selected");
                logMessage(`CELL (${row + 1},${col + 1}) SELECTED`);
                updateTutorial();
            } else if (selectedAgentCell) {
                if (actionMode === "move") {
                    moveAgent(row, col);
                } else if (actionMode === "trap") {
                    deployTrap(row, col);
                }
            }
        } else if (turn > 0 && !actionMode) {
            showError("SELECT MOVE OR TRAP FIRST");
        }
    });

    function moveAgent(newRow, newCol) {
        const { row: oldRow, col: oldCol } = selectedAgentCell;
        const rowDiff = Math.abs(newRow - oldRow);
        const colDiff = Math.abs(newCol - oldCol);
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            const agentToMove = agents.find(a => a.row === oldRow && a.col === oldCol);
            if (agentToMove) {
                const oldCell = grid.children[oldRow * 4 + oldCol];
                const newCell = grid.children[newRow * 4 + newCol];
                const agentElement = oldCell.querySelector(".agent");
                newCell.appendChild(agentElement);
                agentToMove.row = newRow;
                agentToMove.col = newCol;
                logMessage(`AGENT A${agentToMove.id} MOVED TO (${newRow + 1},${newCol + 1})`);
                endTurn();
            }
        }
    }

    function deployTrap(newRow, newCol) {
        const { row: oldRow, col: oldCol } = selectedAgentCell;
        const rowDiff = Math.abs(newRow - oldRow);
        const colDiff = Math.abs(newCol - oldCol);
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            const newCell = grid.children[newRow * 4 + newCol];
            const trap = document.createElement("div");
            trap.className = "trap";
            trap.textContent = "T";
            newCell.appendChild(trap);
            logMessage(`TRAP DEPLOYED TO (${newRow + 1},${newCol + 1})`);
            endTurn();
        }
    }

    function endTurn() {
        if (selectedAgentCell) {
            const oldCell = grid.children[selectedAgentCell.row * 4 + oldCol];
            oldCell.classList.remove("selected");
        }
        selectedAgentCell = null;
        actionMode = null;
        moveBtn.classList.remove("active");
        trapBtn.classList.remove("active");
        turn++;
        logMessage(`TURN ${turn}`);
        updateTutorial();
    }

    function logMessage(message) {
        const p = document.createElement("p");
        p.textContent = `> ${message}`;
        log.appendChild(p);
        log.scrollTop = log.scrollHeight;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        errorMessage.classList.add("active");
        setTimeout(() => {
            errorMessage.style.display = "none";
            errorMessage.classList.remove("active");
        }, 2000);
    }

    function updateTutorial() {
        if (turn === 0) {
            const remaining = maxAgents - agents.length;
            tutorial.textContent = `DEPLOY ${remaining} AGENTS BY CLICKING ANY CELL`;
        } else if (turn > 0) {
            if (!actionMode && !selectedAgentCell) {
                tutorial.textContent = "SELECT MOVE OR TRAP";
            } else if (actionMode === "move" && !selectedAgentCell) {
                tutorial.textContent = "CLICK AN AGENT CELL TO MOVE";
            } else if (actionMode === "move" && selectedAgentCell) {
                tutorial.textContent = "CLICK AN ADJACENT CELL TO MOVE";
            } else if (actionMode === "trap" && !selectedAgentCell) {
                tutorial.textContent = "CLICK AN AGENT CELL TO DEPLOY TRAP";
            } else if (actionMode === "trap" && selectedAgentCell) {
                tutorial.textContent = "CLICK AN ADJACENT CELL TO DEPLOY TRAP";
            }
        }
    }
});
