// Scroll reveal animation
const revealElements = document.querySelectorAll('.animate-on-scroll');

const checkScroll = () => {
    revealElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        if (rect.top <= windowHeight - 100) {
            el.classList.add('revealed');
        }
    });
};

window.addEventListener('scroll', checkScroll);
window.addEventListener('load', checkScroll);

// Newsletter
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input').value;
        alert(`¡Gracias ${email}! Revisa tu correo para el cupón de 15% descuento.`);
        newsletterForm.reset();
    });
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Navbar background change
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = '#1e4620';
    } else {
        navbar.style.backgroundColor = '#2c5f2d';
    }
});