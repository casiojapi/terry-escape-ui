document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("grid");
    const log = document.getElementById("log");
    const moveBtn = document.getElementById("move-btn");
    const trapBtn = document.getElementById("trap-btn");
    const errorMessage = document.getElementById("error-message");
    let agents = [];
    let traps = [];
    let turn = 0;
    const maxAgents = 4;
    const maxTrapsPerCell = 4;
    let selectedAgentCell = null;
    let actionMode = null;
    let draggedAgent = null;

    for (let i = 0; i < 16; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i;
        grid.appendChild(cell);
    }

    moveBtn.addEventListener("click", () => {
        if (turn > 0) {
            actionMode = "move";
            moveBtn.classList.add("active");
            trapBtn.classList.remove("active");
            addLog("MOVE ACTION SELECTED");
        }
    });

    trapBtn.addEventListener("click", () => {
        if (turn > 0) {
            actionMode = "trap";
            trapBtn.classList.add("active");
            moveBtn.classList.remove("active");
            addLog("TRAP ACTION SELECTED");
        }
    });

    grid.addEventListener("click", (e) => {
        const cell = e.target.closest(".cell");
        if (!cell || e.target.classList.contains("agent")) return;

        const index = parseInt(cell.dataset.index);
        const row = Math.floor(index / 4);
        const col = index % 4;

        if (turn === 0) {
            if (agents.length < maxAgents) {
                const agent = document.createElement("div");
                agent.classList.add("agent");
                agent.draggable = true;
                const agentId = agents.length + 1;
                agent.textContent = `A${agentId}`;
                agent.dataset.id = agentId;
                cell.appendChild(agent);
                agents.push({ id: agentId, row, col });
                addLog(`AGENT A${agentId} DEPLOYED TO (${row + 1},${col + 1})`);
                
                if (agents.length === maxAgents) {
                    turn = 1;
                    addLog("DEPLOYMENT COMPLETE - TURN 1 BEGINS");
                }
            }
        } else if (turn > 0) {
            const agentsInCell = agents.filter(a => a.row === row && a.col === col);
            if (agentsInCell.length > 0 && !selectedAgentCell && actionMode) {
                selectedAgentCell = { row, col };
                cell.style.backgroundColor = "#ffcccc";
                addLog(`CELL (${row + 1},${col + 1}) SELECTED FOR ${actionMode.toUpperCase()}`);
            } else if (selectedAgentCell && actionMode) {
                if (actionMode === "move") {
                    moveAgent(row, col);
                } else if (actionMode === "trap") {
                    deployTrap(row, col);
                }
            } else if (!actionMode) {
                showError("SELECT MOVE OR TRAP FIRST");
            }
        }
    });

    grid.addEventListener("dragstart", (e) => {
        if (turn > 0 && actionMode === "move" && e.target.classList.contains("agent")) {
            draggedAgent = e.target;
            draggedAgent.classList.add("dragging");
            const agentId = parseInt(draggedAgent.dataset.id);
            const agent = agents.find(a => a.id === agentId);
            selectedAgentCell = { row: agent.row, col: agent.col };
            e.dataTransfer.setData("text/plain", agentId);
            addLog(`AGENT A${agentId} SELECTED FOR MOVE VIA DRAG`);
        } else {
            e.preventDefault();
        }
    });

    grid.addEventListener("dragend", (e) => {
        if (draggedAgent) {
            draggedAgent.classList.remove("dragging");
            draggedAgent = null;
        }
    });

    grid.addEventListener("dragover", (e) => {
        if (actionMode === "move") {
            e.preventDefault();
        }
    });

    grid.addEventListener("dragenter", (e) => {
        const cell = e.target.closest(".cell");
        if (cell && actionMode === "move") {
            cell.classList.add("drag-over");
        }
    });

    grid.addEventListener("dragleave", (e) => {
        const cell = e.target.closest(".cell");
        if (cell) {
            cell.classList.remove("drag-over");
        }
    });

    grid.addEventListener("drop", (e) => {
        e.preventDefault();
        const cell = e.target.closest(".cell");
        if (!cell || !draggedAgent || actionMode !== "move") return;

        const index = parseInt(cell.dataset.index);
        const newRow = Math.floor(index / 4);
        const newCol = index % 4;

        const agentId = parseInt(e.dataTransfer.getData("text/plain"));
        const agent = agents.find(a => a.id === agentId);
        if (agent) {
            moveAgent(newRow, newCol);
        }

        cell.classList.remove("drag-over");
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
                const agentElement = oldCell.querySelector(`.agent:nth-child(${agents.filter(a => a.row === oldRow && a.col === oldCol).indexOf(agentToMove) + 1})`);
                newCell.appendChild(agentElement);
                agentToMove.row = newRow;
                agentToMove.col = newCol;
                addLog(`AGENT A${agentToMove.id} MOVED FROM (${oldRow + 1},${oldCol + 1}) TO (${newRow + 1},${newCol + 1})`);
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
            const trapsInCell = traps.filter(t => t.row === newRow && t.col === newCol).length;
            if (trapsInCell < maxTrapsPerCell) {
                const trap = document.createElement("div");
                trap.classList.add("trap");
                trap.textContent = "T";
                newCell.appendChild(trap);
                traps.push({ row: newRow, col: newCol, id: traps.length + 1 });
                addLog(`TRAP DEPLOYED FROM (${oldRow + 1},${oldCol + 1}) TO (${newRow + 1},${newCol + 1})`);
                endTurn();
            } else {
                addLog(`CANNOT DEPLOY TRAP TO (${newRow + 1},${newCol + 1}) - MAX ${maxTrapsPerCell} TRAPS`);
            }
        }
    }

    function endTurn() {
        if (selectedAgentCell) {
            const oldCell = grid.children[selectedAgentCell.row * 4 + selectedAgentCell.col];
            oldCell.style.backgroundColor = "#4a4a4a"; /* Reset to retro gray */
        }
        selectedAgentCell = null;
        actionMode = null;
        moveBtn.classList.remove("active");
        trapBtn.classList.remove("active");
        turn++;
        addLog(`TURN ${turn} BEGINS`);
    }

    function addLog(message) {
        const p = document.createElement("p");
        p.textContent = `> ${message}`;
        log.appendChild(p);
        log.scrollTop = log.scrollHeight;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        setTimeout(() => {
            errorMessage.style.display = "none";
        }, 2000);
    }
});
