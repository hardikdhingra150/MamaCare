import confetti from 'canvas-confetti';

export const useConfetti = () => {

  const celebrate = () => {
    confetti({
      particleCount: 120,
      spread:        80,
      origin:        { y: 0.6 },
      colors:        ['#f472b6','#a855f7','#34d399','#fbbf24','#60a5fa'],
    });
  };

  const burst = () => {
    // Two cannon burst from sides
    confetti({ particleCount: 80, angle: 60,  spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } });
  };

  const hearts = () => {
    const defaults = { spread: 360, ticks: 100, gravity: 0.5,
                       decay: 0.94, startVelocity: 20 };
    const shoot = () => {
      confetti({ ...defaults, particleCount: 30,
        scalar: 1.5,
        shapes:  ['heart'],
        colors:  ['#f472b6','#fb7185','#f9a8d4'],
      });
    };
    shoot(); setTimeout(shoot, 200); setTimeout(shoot, 400);
  };

  return { celebrate, burst, hearts };
};
