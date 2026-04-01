import './style.css';

// Add subtle interactions or animations going forward if needed.
// For now, the CSS handles most of the aesthetics.

document.addEventListener('DOMContentLoaded', () => {
    // Adding entry animation delays to the quadrants
    const quadrants = document.querySelectorAll('.quadrant');
    quadrants.forEach((quad, index) => {
        quad.style.animation = `zoomIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + index * 0.1}s backwards`;
    });
    
    // Adding entry animation to labels
    const labels = document.querySelectorAll('.axis-label');
    labels.forEach((label, index) => {
        label.style.animation = `fadeInDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.7 + index * 0.1}s backwards`;
    });
});
