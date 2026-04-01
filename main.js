import './style.css';

const STORAGE_KEY = 'productivity_matrix_tasks';

let tasks = [];

function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            tasks = JSON.parse(stored);
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
        
        // 2. Render Cards
        quadTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.draggable = true;
            
            // Text node
            const textNode = document.createElement('span');
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
            
            // Shimmer pseudo-element handled via CSS ::before
            
            // -- Events --
            // Drag Start
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', task.id);
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => card.classList.add('dragging'), 0);
            });
            // Drag End
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
            
            // Inline Editing (Double Click)
            card.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if (card.querySelector('input')) return; // Already editing
                
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
                
                card.insertBefore(input, textNode);
                input.focus();
            });

            list.appendChild(card);
        });

        // Scroll logic (delay slightly for DOM paint)
        setTimeout(() => {
            list.scrollTop = list.scrollHeight;
        }, 10);
    });
}

function addTask(quadrantId, text) {
    if (!text.trim()) return;
    const newTask = {
        id: Date.now().toString(),
        quadrantId,
        text: text.trim(),
        createdAt: Date.now()
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

function moveTask(id, newQuadrantId) {
    const task = tasks.find(t => t.id === id);
    if (task && task.quadrantId !== newQuadrantId) {
        task.quadrantId = newQuadrantId;
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
        
        // Input Overlay
        quad.addEventListener('click', (e) => {
            // Do not trigger if clicking a task or inside a task
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
            e.preventDefault(); // Necessary to allow dropping
            e.dataTransfer.dropEffect = 'move';
        });
        
        quad.addEventListener('dragenter', e => {
            e.preventDefault();
            // Need to filter out children events to prevent flicker
            if (e.target === quad || e.target.classList.contains('task-list')) {
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
            if (taskId) {
                moveTask(taskId, quad.dataset.id);
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
