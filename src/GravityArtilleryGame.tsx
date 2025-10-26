import { useState, useEffect, useRef } from 'react';

const GravityArtilleryGame = () => {
  const canvasRef = useRef(null);
  const [player1Angle, setPlayer1Angle] = useState(0);
  const [player2Angle, setPlayer2Angle] = useState(180);
  const [player1Ready, setPlayer1Ready] = useState(false);
  const [player2Ready, setPlayer2Ready] = useState(false);
  const [gameState, setGameState] = useState('setup'); // setup, firing, gameover
  const [winner, setWinner] = useState(null);
  const animationRef = useRef(null);

  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 600;
  const PLANET_RADIUS = 25;
  const PROJECTILE_SPEED = 5;

  // Game objects
  const [planets] = useState({
    player1: { x: 50, y: CANVAS_HEIGHT / 2, radius: PLANET_RADIUS, color: '#4287f5' },
    player2: { x: CANVAS_WIDTH - 50, y: CANVAS_HEIGHT / 2, radius: PLANET_RADIUS, color: '#f54242' }
  });

  const [gravitationalBodies] = useState([
    { x: 300, y: 200, mass: 8000, radius: 20, color: '#ffaa00', type: 'star' },
    { x: 500, y: 400, mass: 5000, radius: 15, color: '#aa88ff', type: 'planet' },
    { x: 700, y: 250, mass: 6000, radius: 18, color: '#88ff88', type: 'planet' },
    { x: 400, y: 450, mass: 10000, radius: 12, color: '#ff0088', type: 'blackhole' },
    { x: 650, y: 100, mass: 4000, radius: 13, color: '#ffff88', type: 'planet' }
  ]);

  const [projectiles, setProjectiles] = useState([]);

  const calculateGravity = (px, py, bodies) => {
    let ax = 0;
    let ay = 0;
    
    bodies.forEach(body => {
      const dx = body.x - px;
      const dy = body.y - py;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);
      
      if (dist > 1) {
        const force = body.mass / distSq;
        ax += force * (dx / dist);
        ay += force * (dy / dist);
      }
    });
    
    return { ax, ay };
  };

  const startGame = () => {
    if (!player1Ready || !player2Ready) return;
    
    const angleRad1 = (player1Angle * Math.PI) / 180;
    const angleRad2 = (player2Angle * Math.PI) / 180;
    
    setProjectiles([
      {
        x: planets.player1.x + PLANET_RADIUS,
        y: planets.player1.y,
        vx: Math.cos(angleRad1) * PROJECTILE_SPEED,
        vy: Math.sin(angleRad1) * PROJECTILE_SPEED,
        trail: [],
        player: 1,
        active: true
      },
      {
        x: planets.player2.x - PLANET_RADIUS,
        y: planets.player2.y,
        vx: Math.cos(angleRad2) * PROJECTILE_SPEED,
        vy: Math.sin(angleRad2) * PROJECTILE_SPEED,
        trail: [],
        player: 2,
        active: true
      }
    ]);
    
    setGameState('firing');
  };

  useEffect(() => {
    if (player1Ready && player2Ready && gameState === 'setup') {
      startGame();
    }
  }, [player1Ready, player2Ready, gameState]);

  const checkCollision = (proj, target, radius) => {
    const dx = proj.x - target.x;
    const dy = proj.y - target.y;
    return Math.sqrt(dx * dx + dy * dy) < radius;
  };

  useEffect(() => {
    if (gameState !== 'firing') return;

    const animate = () => {
      setProjectiles(prevProjectiles => {
        const updated = prevProjectiles.map(proj => {
          if (!proj.active) return proj;

          const { ax, ay } = calculateGravity(proj.x, proj.y, gravitationalBodies);
          
          const newVx = proj.vx + ax * 0.1;
          const newVy = proj.vy + ay * 0.1;
          const newX = proj.x + newVx;
          const newY = proj.y + newVy;

          // Check boundaries
          if (newX < 0 || newX > CANVAS_WIDTH || newY < 0 || newY > CANVAS_HEIGHT) {
            return { ...proj, active: false };
          }

          // Check collision with enemy planet
          const enemyPlanet = proj.player === 1 ? planets.player2 : planets.player1;
          if (checkCollision({ x: newX, y: newY }, enemyPlanet, PLANET_RADIUS)) {
            setGameState('gameover');
            setWinner(proj.player);
            return { ...proj, active: false };
          }

          const newTrail = [...proj.trail, { x: proj.x, y: proj.y }];
          if (newTrail.length > 50) newTrail.shift();

          return {
            ...proj,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            trail: newTrail
          };
        });

        // Check if both projectiles are inactive
        if (updated.every(p => !p.active)) {
          setGameState('gameover');
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, gravitationalBodies, planets]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 117) % CANVAS_WIDTH;
      const y = (i * 211) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 1, 1);
    }

    // Draw gravitational bodies
    gravitationalBodies.forEach(body => {
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
      ctx.fillStyle = body.color;
      ctx.fill();
      
      // Draw glow for black holes
      if (body.type === 'blackhole') {
        ctx.beginPath();
        ctx.arc(body.x, body.y, body.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 136, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw planets
    ctx.beginPath();
    ctx.arc(planets.player1.x, planets.player1.y, PLANET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = planets.player1.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(planets.player2.x, planets.player2.y, PLANET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = planets.player2.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw angle indicators in setup mode
    if (gameState === 'setup') {
      const angleRad1 = (player1Angle * Math.PI) / 180;
      const lineLength = 40;
      ctx.beginPath();
      ctx.moveTo(planets.player1.x, planets.player1.y);
      ctx.lineTo(
        planets.player1.x + Math.cos(angleRad1) * lineLength,
        planets.player1.y + Math.sin(angleRad1) * lineLength
      );
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      const angleRad2 = (player2Angle * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(planets.player2.x, planets.player2.y);
      ctx.lineTo(
        planets.player2.x + Math.cos(angleRad2) * lineLength,
        planets.player2.y + Math.sin(angleRad2) * lineLength
      );
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw projectiles and trails
    projectiles.forEach(proj => {
      // Draw trail
      ctx.strokeStyle = proj.player === 1 ? 'rgba(66, 135, 245, 0.6)' : 'rgba(245, 66, 66, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      proj.trail.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();

      // Draw projectile
      if (proj.active) {
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = proj.player === 1 ? '#4287f5' : '#f54242';
        ctx.fill();
      }
    });
  }, [player1Angle, player2Angle, projectiles, gameState, gravitationalBodies, planets]);

  const resetGame = () => {
    setPlayer1Ready(false);
    setPlayer2Ready(false);
    setGameState('setup');
    setWinner(null);
    setProjectiles([]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <h1 className="text-4xl font-bold text-white mb-6">Gravity Artillery</h1>
      
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-gray-700 rounded-lg mb-6"
      />

      <div className="flex gap-3 mb-4">
        <button
          onClick={() => {
            setWinner(1);
            setGameState('gameover');
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm"
        >
          TEST: Player 1 Wins
        </button>
        <button
          onClick={() => {
            setWinner(2);
            setGameState('gameover');
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm"
        >
          TEST: Player 2 Wins
        </button>
      </div>

      {gameState === 'setup' && (
        <div className="flex gap-8 mb-4">
          <div className="bg-blue-900 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-3">Player 1 (Blue)</h2>
            <div className="mb-3">
              <label className="text-white block mb-2">Angle: {player1Angle}°</label>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => setPlayer1Angle(Math.min(90, player1Angle - 1))}
                    disabled={player1Ready}
                    className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-600 text-white font-bold py-1 px-3 rounded"
                  >
                    ↑
                  </button>
                  <div style={{ width: '32px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      value={player1Angle}
                      onChange={(e) => setPlayer1Angle(Number(e.target.value))}
                      disabled={player1Ready}
                      style={{
                        width: '150px',
                        transform: 'rotate(90deg)',
                        transformOrigin: 'center center'
                      }}
                    />
                  </div>
                  <button
                    onClick={() => setPlayer1Angle(Math.max(-90, player1Angle + 1))}
                    disabled={player1Ready}
                    className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-600 text-white font-bold py-1 px-3 rounded"
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setPlayer1Ready(!player1Ready)}
              className={`w-full py-2 px-4 rounded font-bold ${
                player1Ready
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {player1Ready ? 'Ready!' : 'Ready?'}
            </button>
          </div>

          <div className="bg-red-900 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-3">Player 2 (Red)</h2>
            <div className="mb-3">
              <label className="text-white block mb-2">Angle: {player2Angle}°</label>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => setPlayer2Angle(Math.min(270, player2Angle + 1))}
                    disabled={player2Ready}
                    className="bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-bold py-1 px-3 rounded"
                  >
                    ↑
                  </button>
                  <div style={{ width: '32px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                      type="range"
                      min="90"
                      max="270"
                      value={player2Angle}
                      onChange={(e) => setPlayer2Angle(Number(e.target.value))}
                      disabled={player2Ready}
                      style={{
                        width: '150px',
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center center'
                      }}
                    />
                  </div>
                  <button
                    onClick={() => setPlayer2Angle(Math.max(90, player2Angle - 1))}
                    disabled={player2Ready}
                    className="bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-bold py-1 px-3 rounded"
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setPlayer2Ready(!player2Ready)}
              className={`w-full py-2 px-4 rounded font-bold ${
                player2Ready
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              {player2Ready ? 'Ready!' : 'Ready?'}
            </button>
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {winner ? `Player ${winner} Wins!` : 'Both Missed!'}
          </h2>
          <button
            onClick={resetGame}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded"
          >
            Play Again
          </button>
        </div>
      )}

      <p className="text-gray-400 text-sm mt-4 max-w-2xl text-center">
        Set your launch angle and click Ready. When both players are ready, projectiles will fire simultaneously. 
        Gravitational bodies will bend your projectile's path. Hit the enemy planet to win!
      </p>
    </div>
  );
};

export default GravityArtilleryGame;