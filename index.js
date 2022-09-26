var canvas = document.querySelector('canvas');
let bg = new ParticleBG(canvas, {
    maxParticles: 200
});

function run() {
    bg.draw();
    window.requestAnimationFrame(run);
}

run();
