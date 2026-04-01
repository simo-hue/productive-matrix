import './style.css';

const STORAGE_KEY = 'productivity_matrix_tasks';

let tasks = [];

function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            tasks = JSON.parse(stored);
            // Retrofit existing tasks with coordinates if they lack them
            tasks.forEach(task => {
                if (task.x === undefined) task.x = Math.floor(Math.random() * 60) + 20;
                if (task.y === undefined) task.y = Math.floor(Math.random() * 60) + 20;
                if (task.rot === undefined) task.rot = Math.floor(Math.random() * 20) - 10;
            });
        } catch (e) {
            tasks = [];
        }
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function renderTasks() {
    const quadrants = document.querySelectorAll('.quadrant');
    
    quadrants.forEach(quad => {
        const quadId = quad.dataset.id;
        const list = quad.querySelector('.task-list');
        list.innerHTML = '';
        
        const quadTasks = tasks.filter(t => t.quadrantId === quadId);
        
        // 1. Update Counters
        let counterEl = quad.querySelector('.quadrant-counter');
        if (!counterEl) {
            counterEl = document.createElement('div');
            counterEl.className = 'quadrant-counter';
            quad.appendChild(counterEl);
        }
        counterEl.textContent = quadTasks.length.toString().padStart(2, '0');
        
        // 2. Render Cards Scattered
        quadTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.draggable = true;
            
            // Apply randomized positions
            card.style.position = 'absolute';
            card.style.left = `${task.x}%`;
            card.style.top = `${task.y}%`;
            // Keep rotation logic decoupled from hover transform in CSS
            card.style.setProperty('--task-rot', `${task.rot}deg`);
            
            // Text node
            const textNode = document.createElement('span');
            textNode.className = 'task-text-content';
            textNode.textContent = task.text;
            card.appendChild(textNode);
            
            // Delete btn
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'task-delete';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            };
            card.appendChild(deleteBtn);
            
            // -- Events --
            // Drag Start
            card.addEventListener('dragstart', (e) => {
                // Ensure data payload exists
                e.dataTransfer.setData('text/plain', task.id);
                e.dataTransfer.effectAllowed = 'move';
                
                // We calculate drag offset so the card doesn't jump to top-left of mouse
                const rect = card.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const offsetY = e.clientY - rect.top;
                e.dataTransfer.setData('offsetX', offsetX);
                e.dataTransfer.setData('offsetY', offsetY);
                
                setTimeout(() => card.classList.add('dragging'), 0);
            });
            // Drag End
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
            
            // Inline Editing
            card.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if (card.querySelector('input')) return;
                
                textNode.style.display = 'none';
                const input = document.createElement('input');
                input.className = 'edit-input';
                input.value = task.text;
                
                const saveEdit = () => {
                    const newText = input.value.trim();
                    if (newText) {
                        updateTaskText(task.id, newText);
                    } else {
                        renderTasks(); // Revert
                    }
                };
                
                input.addEventListener('blur', saveEdit);
                input.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter') saveEdit();
                    if (ev.key === 'Escape') renderTasks();
                });
                
                // Stop dragging when editing
                card.draggable = false;
                
                card.insertBefore(input, textNode);
                input.focus();
            });

            list.appendChild(card);
        });
    });
}

function generateNonOverlappingCoords(quadrantId) {
    const quadTasks = tasks.filter(t => t.quadrantId === quadrantId);
    let bestX = 15;
    let bestY = 15;
    let maxDistance = -1;

    for (let attempts = 0; attempts < 50; attempts++) {
        let x = Math.floor(Math.random() * 60) + 15; // 15% to 75%
        let y = Math.floor(Math.random() * 60) + 15;
        
        let minDistance = 9999;
        let overlap = false;

        for (const t of quadTasks) {
            const dx = Math.abs(t.x - x);
            const dy = Math.abs(t.y - y);
            // If they are within 18% horizontal and 12% vertical distance, they overlap significantly
            if (dx < 18 && dy < 12) {
                overlap = true;
            }
            
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < minDistance) {
                minDistance = dist;
            }
        }

        if (!overlap) {
            return { x, y };
        }

        if (minDistance > maxDistance) {
            maxDistance = minDistance;
            bestX = x;
            bestY = y;
        }
    }
    
    // If quadrant is heavily populated, return the least-overlapping spot found
    return { x: bestX, y: bestY };
}

function addTask(quadrantId, text) {
    if (!text.trim()) return;
    const coords = generateNonOverlappingCoords(quadrantId);
    const newTask = {
        id: Date.now().toString(),
        quadrantId,
        text: text.trim(),
        createdAt: Date.now(),
        x: coords.x,
        y: coords.y,
        rot: Math.floor(Math.random() * 24) - 12 // -12 to 12 deg
    };
    tasks.push(newTask);
    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

function updateTaskText(id, newText) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.text = newText;
        saveTasks();
        renderTasks();
    }
}

function moveTask(id, newQuadrantId, xPercent, yPercent) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.quadrantId = newQuadrantId;
        // Keep bounds 2% to 85% to not overflow completely 
        task.x = Math.max(2, Math.min(85, xPercent));
        task.y = Math.max(2, Math.min(85, yPercent));
        saveTasks();
        renderTasks();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderTasks();

    const quadrants = document.querySelectorAll('.quadrant');
    
    // Initial animations
    quadrants.forEach((quad, index) => {
        quad.style.animation = `zoomIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + index * 0.1}s backwards`;
    });
    const labels = document.querySelectorAll('.axis-label');
    labels.forEach((label, index) => {
        label.style.animation = `fadeInDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.7 + index * 0.1}s backwards`;
    });

    quadrants.forEach(quad => {
        const input = quad.querySelector('.quick-add-input');
        
        quad.addEventListener('click', (e) => {
            if (e.target.closest('.task-card') || e.target.closest('.task-delete')) return;
            
            document.querySelectorAll('.quadrant.input-active').forEach(q => {
                if (q !== quad) q.classList.remove('input-active');
            });
            quad.classList.add('input-active');
            input.focus();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTask(quad.dataset.id, input.value);
                input.value = '';
            }
            if (e.key === 'Escape') {
                quad.classList.remove('input-active');
                input.blur();
            }
        });

        // --- Drag and Drop Target Logic ---
        quad.addEventListener('dragover', e => {
            e.preventDefault(); 
            e.dataTransfer.dropEffect = 'move';
        });
        
        quad.addEventListener('dragenter', e => {
            e.preventDefault();
            if (e.target === quad || e.target.classList.contains('task-list') || e.target.classList.contains('quadrant-counter')) {
                quad.classList.add('drag-over');
            }
        });
        
        quad.addEventListener('dragleave', e => {
            if (e.relatedTarget && !quad.contains(e.relatedTarget)) {
                quad.classList.remove('drag-over');
            }
        });
        
        quad.addEventListener('drop', e => {
            e.preventDefault();
            quad.classList.remove('drag-over');
            const taskId = e.dataTransfer.getData('text/plain');
            
            // Parse offset for smooth drop without jumping
            let offsetX = parseInt(e.dataTransfer.getData('offsetX')) || 0;
            let offsetY = parseInt(e.dataTransfer.getData('offsetY')) || 0;

            if (taskId) {
                // Determine drop coordinates relative to quadrant
                const rect = quad.getBoundingClientRect();
                
                // Calculate percentage positions
                const droppedX = e.clientX - rect.left - offsetX;
                const droppedY = e.clientY - rect.top - offsetY;
                
                const percentX = (droppedX / rect.width) * 100;
                const percentY = (droppedY / rect.height) * 100;

                moveTask(taskId, quad.dataset.id, percentX, percentY);
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.quadrant')) {
            document.querySelectorAll('.quadrant.input-active').forEach(q => {
                q.classList.remove('input-active');
            });
        }
    });
});
