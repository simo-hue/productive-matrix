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
    document.querySelectorAll('.task-list').forEach(list => {
        // Clear current rendered list
        list.innerHTML = '';
        
        // Get tasks for this quadrant
        const quadTasks = tasks.filter(t => t.quadrantId === list.id.replace('task-list-', ''));
        
        quadTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.textContent = task.text;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'task-delete';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            };
            
            card.appendChild(deleteBtn);
            list.appendChild(card);
        });

        // Scroll to the bottom to always show newest task
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

    // Implementation: Inline Task Insertion triggered natively by quadrant click
    quadrants.forEach(quad => {
        const input = quad.querySelector('.quick-add-input');
        
        quad.addEventListener('click', (e) => {
            if (e.target.closest('.task-delete')) return;
            
            // Revert others
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
                // Optional: keep overlay actively popped up to insert lots of tasks quickly
            }
            if (e.key === 'Escape') {
                quad.classList.remove('input-active');
                input.blur();
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
