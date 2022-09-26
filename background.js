const TWO_PI = Math.PI * 2;
var minDist = 70;
var mouseX, mouseY, mouseFR, isMouseDown = false;
const toRadians = function (deg) {
    return deg * (Math.PI / 180);
}
document.onmousedown = this.onDocMouseDown;
document.onmousemove = this.onDocMouseMove;
document.onmouseup = this.onDocMouseUp;

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function onDocMouseMove(e) {
    var ev = e ? e : window.event;
    mouseX = ev.clientX;
    mouseY = ev.clientY;
}

function onDocMouseDown(e) {
    isMouseDown = true;
    return false;
}

function onDocMouseUp(e) {
    isMouseDown = false;
    return false;
}


class vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(x, y) {
        this.x += x;
        this.y += y;
        return new vec2(this.x, this.y);
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return new vec2(this.x, this.y);
    }
    sub(x, y) {
        this.x -= x;
        this.y -= y;
        return new vec2(this.x, this.y);
    }
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return new vec2(this.x, this.y);
    }

    static sub(v1, v2) {
        return new vec2(v1.x - v2.x, v1.y - v2.y);
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    mul(m) {
        this.x *= m;
        this.y *= m;
        return this;
    }
    normalize() {
        let d = this.mag();
        this.x /= d;
        this.y /= d;
        return this;
    }
    setMag(m) {
        this.normalize().mul(m);
        return this;
    }
    dist(x, y) {
        let a = this.x - x;
        let b = this.y - y;
        return Math.sqrt(a * a + b * b);
    }
    dist(v) {
        let a = this.x - v.x;
        let b = this.y - v.y;
        return Math.sqrt(a * a + b * b);
    }

    div(m) {
        this.x /= m;
        this.y /= m;
        return this;
    }

    negate() {
        this.x *= -1;
        this.y *= -1;
        return this;
    }

    magSq() {
        return this.x * this.x + this.y * this.y;
    }

    limit(max) {
        const mSq = this.magSq();
        if (mSq > max * max) {
            this.div(this.mag()) //normalize it
                .mul(max);
        }
        return this;
    }
}

class Particle {
    constructor(ctx, W, H, {
        pos,
        vel,
        acc,
        minDist
    } = {}) {
        this.ctx = ctx;
        this.W = W;
        this.H = H;
        this.minDist = minDist || 70;
        this.pos = pos || new vec2(rand(0, W), rand(0, H));
        this.vel = vel || new vec2(rand(-1, 1), rand(-1, 1));
        this.acc = acc || new vec2(rand(-1, 1), rand(-1, 1));
        this.radius = rand(0, 2);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    draw() {
        this.ctx.fillStyle = "black";
        this.ctx.beginPath();
        this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, TWO_PI, false);
        this.ctx.fill();
    }

    update(neighbour) {
        let mouse = new vec2(mouseX, mouseY);
        let d = this.pos.dist(mouse);
        let dir = vec2.sub(this.pos, mouse);
        if (d <= mouseFR && !isMouseDown) {
            let diff = (mouseFR - d) + 1;
            let m = diff / mouseFR;
            dir.setMag(m);
            this.acc = dir;
            this.vel.add(this.acc);
            this.vel.normalize();
            this.vel.limit(0.05);
        } else {
            this.vel.add(this.acc);
            this.vel.normalize();
            this.vel.limit(0.005);
        }
        this.pos.add(this.vel);
        if (this.pos.x + this.radius > this.W) {
            this.pos.x = this.radius;
        } else if (this.pos.x - this.radius < 0) {
            this.pos.x = this.W - this.radius;
        }
        if (this.pos.y + this.radius > this.H) {
            this.pos.y = this.radius;
        } else if (this.pos.y - this.radius < 0) {
            this.pos.y = this.H - this.radius;
        }
        let dist = this.pos.dist(neighbour.pos);
        if (dist <= this.minDist) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(0, 0, 0, ${1-dist / this.minDist})`;
            this.ctx.moveTo(this.pos.x, this.pos.y);
            this.ctx.lineTo(neighbour.pos.x, neighbour.pos.y);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        this.acc.add(new vec2(rand(-0.0009, 0.0009), rand(-0.0009, 0.0009)));
    }
}

class ParticleBG {
    constructor(canvas, {
        width,
        height,
        maxParticles,
        mouseRadius,
        minDist
    } = {}) {
        this.dc = 0.0;
        this.particles = [];
        this.canvas = canvas;
        this.W = this.canvas.width = width || document.body.clientWidth;
        this.H = this.canvas.height = height || document.body.clientHeight;
        this.maxParticles = maxParticles || 70;
        this.ctx = this.canvas.getContext("2d");
        this.ctx.lineWidth = 1;
        this.minDist = minDist || 70;
        mouseFR = mouseRadius || 100;
        this.setup();
    }

    background(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.W, this.H);
    }

    removeIfExcess() {
        if (this.particles.length > this.maxParticles + 9) {
            this.particles.shift();
            this.particles.shift();
            this.particles.shift();
        }
    }

    setup() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(new Particle(this.ctx, this.W, this.H, {
                minDist: this.minDist
            }));
        }
    }

    draw() {
        this.background("rgba(255,255,255,0.81)");
        this.update();
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].draw();
            for (let j = 0; j < this.particles.length; j++) {
                this.particles[i].update(this.particles[j]);
            }
        }
        this.removeIfExcess();
    }

    update() {
        let c = 0;
        if (isMouseDown) {
            if (c == 0) {
                let mouse = new vec2(mouseX, mouseY);
                let rc = rand(0, 3);
                for (let i = 0; i < rc; i++) {
                    let cs = Math.cos(toRadians(rand(180, 2 * 180)));
                    let sn = Math.sin(toRadians(rand(180, 2 * 180)));
                    let x = mouse.x * cs - mouse.y * sn;
                    let y = mouse.x * sn + mouse.y * cs;
                    let v = new vec2(x, y);
                    v.normalize();
                    this.particles.push(new Particle(this.ctx, this.W, this.H, {
                        pos: mouse,
                        acc: v,
                        minDist: this.minDist
                    }));
                }
                c++;
            }
        }
    }
}
