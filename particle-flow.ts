export interface Particle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  targetX: number;
  targetY: number;
  distance: number;
  hunted: boolean;
}

export interface Pool {
  x: number;
  y: number;
  radius: number;
  label: string;
}

export interface PoolLayout {
  source: Pool;
  survived: Pool;
  hunted: Pool;
}

export function computeLayout(width: number, height: number): PoolLayout {
  return {
    source: { x: width / 2, y: height * 0.16, radius: 30, label: "Retail stops" },
    survived: { x: width * 0.28, y: height * 0.82, radius: 44, label: "Survived" },
    hunted: { x: width * 0.72, y: height * 0.82, radius: 44, label: "Swept up" },
  };
}

export function createParticles(
  distances: number[],
  source: Pool,
  rng: () => number,
): Particle[] {
  return distances.map((distance) => {
    const x = source.x + (rng() - 0.5) * source.radius * 1.6;
    const y = source.y + (rng() - 0.5) * source.radius * 1.6;
    return { x, y, prevX: x, prevY: y, targetX: x, targetY: y, distance, hunted: false };
  });
}

export function retarget(particle: Particle, pool: Pool, rng: () => number): void {
  particle.targetX = pool.x + (rng() - 0.5) * pool.radius * 1.4;
  particle.targetY = pool.y + (rng() - 0.5) * pool.radius * 1.4;
}

const EASE = 0.08;

export function stepParticles(particles: Particle[]): boolean {
  let anyMoving = false;
  for (const p of particles) {
    p.prevX = p.x;
    p.prevY = p.y;
    const dx = p.targetX - p.x;
    const dy = p.targetY - p.y;
    if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
      p.x += dx * EASE;
      p.y += dy * EASE;
      anyMoving = true;
    }
  }
  return anyMoving;
}

export function snapToTarget(particle: Particle): void {
  particle.x = particle.targetX;
  particle.y = particle.targetY;
  particle.prevX = particle.x;
  particle.prevY = particle.y;
}
