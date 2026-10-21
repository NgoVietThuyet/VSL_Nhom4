import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';

type GameState = 'ready' | 'playing' | 'over';

interface Pipe {
  x: number;
  gapY: number;
  scored: boolean;
}

@Component({
  selector: 'app-flappy-bird',
  imports: [],
  templateUrl: './flappy-bird.html',
  styleUrl: './flappy-bird.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlappyBird implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly WIDTH = 288;
  private readonly HEIGHT = 512;

  private readonly assetBase = 'game/flappybird';
  private images: Record<string, HTMLImageElement> = {};
  private sounds: Record<string, HTMLAudioElement> = {};

  private readonly BIRD_W = 34;
  private readonly BIRD_H = 24;
  private readonly PIPE_W = 52;
  private readonly PIPE_H = 320;
  private readonly BASE_H = 112;

  private readonly GRAVITY = 0.35;
  private readonly FLAP = -6.5;
  private readonly MAX_FALL = 10;
  private readonly PIPE_SPEED = 2;
  private readonly PIPE_GAP = 110;
  private readonly PIPE_INTERVAL = 160;

  readonly score = signal(0);
  readonly best = signal(0);
  readonly state = signal<GameState>('ready');

  private bird = { x: 60, y: this.HEIGHT / 2, vy: 0, rot: 0 };
  private pipes: Pipe[] = [];
  private baseX = 0;
  private frame = 0;
  private rafId = 0;
  private ctx!: CanvasRenderingContext2D;
  private dpr = 1;
  private lastTime = 0;
  private assetsReady = false;
  private bgKey: 'background-day' | 'background-night' = 'background-day';
  private pipeKey: 'pipe-green' | 'pipe-red' = 'pipe-green';
  private birdKey: 'yellowbird' | 'bluebird' | 'redbird' = 'yellowbird';

  constructor(private zone: NgZone) {}

  async ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();

    const stored = Number(localStorage.getItem('flappy_best') ?? 0);
    if (!Number.isNaN(stored)) this.best.set(stored);

    this.bgKey = Math.random() < 0.5 ? 'background-day' : 'background-night';
    this.pipeKey = Math.random() < 0.5 ? 'pipe-green' : 'pipe-red';
    const birds: Array<typeof this.birdKey> = ['yellowbird', 'bluebird', 'redbird'];
    this.birdKey = birds[Math.floor(Math.random() * birds.length)];

    await this.loadAssets();
    this.assetsReady = true;
    this.reset();

    this.zone.runOutsideAngular(() => {
      this.lastTime = performance.now();
      const loop = (t: number) => {
        const dt = Math.min(32, t - this.lastTime) / (1000 / 60);
        this.lastTime = t;
        this.update(dt);
        this.draw();
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    });
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.rafId);
  }

  @HostListener('window:resize')
  onResize() {
    this.resizeCanvas();
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      this.action();
    }
  }

  onPointer(e: Event) {
    e.preventDefault();
    this.action();
  }

  private action() {
    if (!this.assetsReady) return;
    const s = this.state();
    if (s === 'ready') {
      this.zone.run(() => this.state.set('playing'));
      this.flap();
    } else if (s === 'playing') {
      this.flap();
    } else if (s === 'over') {
      this.reset();
      this.zone.run(() => this.state.set('ready'));
    }
  }

  private flap() {
    this.bird.vy = this.FLAP;
    this.play('wing');
  }

  private reset() {
    this.bird = { x: 60, y: this.HEIGHT / 2 - 50, vy: 0, rot: 0 };
    this.pipes = [];
    this.frame = 0;
    this.zone.run(() => this.score.set(0));
  }

  private update(dt: number) {
    if (!this.assetsReady) return;
    const s = this.state();
    this.frame += dt;

    if (s !== 'over') {
      this.baseX = (this.baseX - this.PIPE_SPEED * dt) % 24;
    }

    if (s === 'ready') {
      this.bird.y += Math.sin(this.frame * 0.15) * 0.6;
      this.bird.rot = 0;
      return;
    }

    if (s === 'playing') {
      this.bird.vy = Math.min(this.bird.vy + this.GRAVITY * dt, this.MAX_FALL);
      this.bird.y += this.bird.vy * dt;
      this.bird.rot = Math.max(-25, Math.min(90, this.bird.vy * 6));

      const lastPipe = this.pipes[this.pipes.length - 1];
      if (!lastPipe || this.WIDTH - lastPipe.x >= this.PIPE_INTERVAL) {
        const minTop = 60;
        const maxTop = this.HEIGHT - this.BASE_H - this.PIPE_GAP - 60;
        const gapY = minTop + Math.random() * (maxTop - minTop);
        this.pipes.push({ x: this.WIDTH + 10, gapY, scored: false });
      }

      for (const p of this.pipes) p.x -= this.PIPE_SPEED * dt;
      this.pipes = this.pipes.filter(p => p.x + this.PIPE_W > -10);

      for (const p of this.pipes) {
        if (!p.scored && p.x + this.PIPE_W < this.bird.x) {
          p.scored = true;
          this.zone.run(() => this.score.update(v => v + 1));
          this.play('point');
        }
      }

      if (this.collides()) {
        this.play('hit');
        setTimeout(() => this.play('die'), 350);
        const sc = this.score();
        if (sc > this.best()) {
          this.zone.run(() => this.best.set(sc));
          localStorage.setItem('flappy_best', String(sc));
        }
        this.zone.run(() => this.state.set('over'));
      }
    }

    if (s === 'over') {
      if (this.bird.y < this.HEIGHT - this.BASE_H - this.BIRD_H / 2) {
        this.bird.vy = Math.min(this.bird.vy + this.GRAVITY * dt, this.MAX_FALL);
        this.bird.y += this.bird.vy * dt;
        this.bird.rot = Math.min(90, this.bird.rot + 4 * dt);
      } else {
        this.bird.y = this.HEIGHT - this.BASE_H - this.BIRD_H / 2;
        this.bird.vy = 0;
        this.bird.rot = 90;
      }
    }
  }

  private collides(): boolean {
    const bx = this.bird.x;
    const by = this.bird.y;
    const r = this.BIRD_H / 2 - 2;

    if (by + r >= this.HEIGHT - this.BASE_H) return true;
    if (by - r <= 0) return true;

    for (const p of this.pipes) {
      const inX = bx + r > p.x && bx - r < p.x + this.PIPE_W;
      if (!inX) continue;
      const aboveGap = by - r < p.gapY;
      const belowGap = by + r > p.gapY + this.PIPE_GAP;
      if (aboveGap || belowGap) return true;
    }
    return false;
  }

  private draw() {
    const ctx = this.ctx;
    if (!this.assetsReady) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

    const bg = this.images[this.bgKey];
    ctx.drawImage(bg, 0, 0, this.WIDTH, this.HEIGHT);

    const pipeImg = this.images[this.pipeKey];
    for (const p of this.pipes) {
      ctx.save();
      ctx.translate(p.x + this.PIPE_W / 2, p.gapY);
      ctx.scale(1, -1);
      ctx.drawImage(pipeImg, -this.PIPE_W / 2, 0, this.PIPE_W, this.PIPE_H);
      ctx.restore();
      ctx.drawImage(pipeImg, p.x, p.gapY + this.PIPE_GAP, this.PIPE_W, this.PIPE_H);
    }

    const base = this.images['base'];
    const baseY = this.HEIGHT - this.BASE_H;
    ctx.drawImage(base, this.baseX, baseY, this.WIDTH + 24, this.BASE_H);

    const flap = ['upflap', 'midflap', 'downflap'][Math.floor(this.frame / 6) % 3];
    const birdImg = this.images[`${this.birdKey}-${flap}`];
    ctx.save();
    ctx.translate(this.bird.x, this.bird.y);
    ctx.rotate((this.bird.rot * Math.PI) / 180);
    ctx.drawImage(birdImg, -this.BIRD_W / 2, -this.BIRD_H / 2, this.BIRD_W, this.BIRD_H);
    ctx.restore();

    if (this.state() === 'ready') {
      const msg = this.images['message'];
      ctx.drawImage(msg, (this.WIDTH - msg.width) / 2, 80);
    } else if (this.state() === 'playing') {
      this.drawScore(this.score(), this.WIDTH / 2, 50);
    } else if (this.state() === 'over') {
      const go = this.images['gameover'];
      ctx.drawImage(go, (this.WIDTH - go.width) / 2, 150);
      this.drawScore(this.score(), this.WIDTH / 2, 220);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`BEST: ${this.best()}`, this.WIDTH / 2, 260);
      ctx.fillText('Tap / Space to restart', this.WIDTH / 2, 290);
    }
  }

  private drawScore(value: number, cx: number, cy: number) {
    const digits = String(value).split('');
    const dW = 24;
    const totalW = digits.length * dW;
    let x = cx - totalW / 2;
    for (const d of digits) {
      const img = this.images[d];
      if (img) this.ctx.drawImage(img, x, cy, dW, 36);
      x += dW;
    }
  }

  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.dpr = window.devicePixelRatio || 1;
    canvas.width = this.WIDTH * this.dpr;
    canvas.height = this.HEIGHT * this.dpr;
    canvas.style.aspectRatio = `${this.WIDTH} / ${this.HEIGHT}`;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  private async loadAssets(): Promise<void> {
    const spriteNames = [
      'background-day',
      'background-night',
      'base',
      'pipe-green',
      'pipe-red',
      'gameover',
      'message',
      'bluebird-downflap',
      'bluebird-midflap',
      'bluebird-upflap',
      'redbird-downflap',
      'redbird-midflap',
      'redbird-upflap',
      'yellowbird-downflap',
      'yellowbird-midflap',
      'yellowbird-upflap',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    ];

    const loadImg = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.src = `${this.assetBase}/sprites/${name}.png`;
        img.onload = () => {
          this.images[name] = img;
          resolve();
        };
        img.onerror = () => reject(new Error(`Failed to load ${name}`));
      });

    await Promise.all(spriteNames.map(loadImg));

    for (const s of ['die', 'hit', 'point', 'swoosh', 'wing']) {
      const a = new Audio(`${this.assetBase}/audio/${s}.wav`);
      a.preload = 'auto';
      this.sounds[s] = a;
    }
  }

  private play(key: string) {
    const a = this.sounds[key];
    if (!a) return;
    try {
      const inst = a.cloneNode(true) as HTMLAudioElement;
      inst.volume = 0.6;
      void inst.play().catch(() => {});
    } catch {
      /* ignore */
    }
  }
}
