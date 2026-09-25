(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLYPHS = 'アイウエオカキクケコサシスセソ0123456789ABCDEFΣΩΨ{}[]<>/\\=+*#$%&';
  const rnd = (n) => Math.floor(Math.random() * n);
  const mouse = { x: -999, y: -999 };

  /* ---------------- safe storage ---------------- */
  const storage = {
    get(k) { try { return window.sessionStorage ? sessionStorage.getItem(k) : null; } catch { return null; } },
    set(k, v) { try { if (window.sessionStorage) sessionStorage.setItem(k, v); } catch {} },
    remove(k) { try { if (window.sessionStorage) sessionStorage.removeItem(k); } catch {} }
  };

  /* ---------------- helper: create element safely ---------------- */
  function h(tag, props = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (v != null && v !== false) el.setAttribute(k, v);
    }
    kids.flat().forEach((c) => c != null && el.append(c));
    return el;
  }
  const fmtDate = (iso) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  /* ---------------- cursor ---------------- */
  const cursor = $('#cursor');
  if (cursor) {
    let cursorRaf = null;
    addEventListener('pointermove', (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      if (!cursorRaf) {
        cursorRaf = requestAnimationFrame(() => {
          cursor.style.left = mouse.x + 'px';
          cursor.style.top = mouse.y + 'px';
          cursorRaf = null;
        });
      }
      cursor.classList.toggle('hover', !!e.target.closest('a,button,.card,.leader,input,select,textarea'));
    }, { passive: true });
  }

  /* ---------------- matrix rain (shared by intro) ---------------- */
  function startRain(canvas, { size = 16, fade = 0.08 } = {}) {
    if (!canvas) return () => {};
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};
    let cols = 0, drops = [], raf = null, w = 0, h_ = 0, active = true;
    const resize = () => {
      w = canvas.width = Math.min(innerWidth || 800, 1920);
      h_ = canvas.height = Math.min(innerHeight || 600, 1080);
      cols = Math.min(Math.ceil(w / size), 80);
      drops = Array.from({ length: cols }, () => rnd(-40));
    };
    resize();
    let rtime;
    const onResize = () => { clearTimeout(rtime); rtime = setTimeout(resize, 100); };
    addEventListener('resize', onResize, { passive: true });

    const tick = () => {
      if (!active) return;
      ctx.fillStyle = `rgba(0,0,0,${fade})`;
      ctx.fillRect(0, 0, w, h_);
      ctx.font = `${size}px JetBrains Mono, monospace`;
      for (let i = 0; i < drops.length; i++) {
        const y = drops[i];
        ctx.fillStyle = Math.random() > 0.96 ? '#c8ffd9' : '#00ff66';
        ctx.globalAlpha = 0.55;
        ctx.fillText(GLYPHS[rnd(GLYPHS.length)], i * size, y * size);
        ctx.globalAlpha = 1;
        drops[i] = y * size > h_ && Math.random() > 0.975 ? 0 : y + 1;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      removeEventListener('resize', onResize);
    };
  }

  /* ---------------- intro: decrypt "CIPHER" ---------------- */
  function runIntro() {
    const intro = $('#intro');
    if (!intro) {
      document.body.classList.remove('locked');
      return;
    }
    const seen = storage.get('cipher-intro') === '1';
    if (seen || reduceMotion) {
      intro.remove();
      document.body.classList.remove('locked');
      return;
    }

    const stopRain = startRain($('#intro-rain'));
    const word = 'CIPHER';
    const box = $('#intro-word');
    const spans = box ? [...word].map(() => box.appendChild(h('span', { text: GLYPHS[rnd(GLYPHS.length)] }))) : [];
    const t0 = performance.now();
    const scramble = setInterval(() => {
      const t = performance.now() - t0;
      spans.forEach((s, i) => {
        s.textContent = t > 900 + i * 450 ? word[i] : GLYPHS[rnd(GLYPHS.length)];
      });
    }, 60);

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      clearInterval(scramble);
      intro.classList.add('done');
      document.body.classList.remove('locked');
      storage.set('cipher-intro', '1');
      setTimeout(() => {
        stopRain();
        intro.remove();
      }, 500);
    };
    const skip = $('#intro-skip');
    if (skip) skip.addEventListener('click', close);
    setTimeout(close, 3500);
  }

  /* ---------------- living cybersecurity digital environment canvas ---------------- */
  function startWaves() {
    const c = $("#waves");
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let w = 0, hgt = 0, t = 0, rafId = null, running = true;
    let farParticles = [];
    let networkNodes = [];
    let networkLinks = [];
    let dataPulses = [];
    let packetClusters = [];
    let rippleRings = [];
    let scanWave = { active: false, x: -100, y: -100, speed: 3.8, nextTrigger: 350 };
    let smoothMouse = { x: -999, y: -999 };
    let lastMouseEmit = { x: -999, y: -999 };
    let scrollY = 0, smoothScrollY = 0;

    const resize = () => {
      w = c.width = Math.max(innerWidth || 800, 320);
      hgt = c.height = Math.max(innerHeight || 600, 320);
      initSystem();
      if (reduceMotion) drawStatic();
    };

    function initSystem() {
      // 1. Far ambient star particles (deep parallax layer)
      const farCount = Math.min(Math.max(Math.floor((w * hgt) / 32000), 22), 48);
      farParticles = [];
      for (let i = 0; i < farCount; i++) {
        farParticles.push({
          x: Math.random() * w,
          y: Math.random() * hgt,
          vx: (Math.random() - 0.5) * 0.14,
          vy: (Math.random() - 0.5) * 0.14,
          radius: Math.random() * 0.7 + 0.6,
          baseAlpha: Math.random() * 0.18 + 0.10,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.012 + Math.random() * 0.018
        });
      }

      // 2. Living Network constellation nodes
      const nodeCount = Math.min(Math.max(Math.floor((w * hgt) / 26000), 26), 54);
      networkNodes = [];
      for (let i = 0; i < nodeCount; i++) {
        networkNodes.push({
          id: i,
          x: Math.random() * w,
          y: Math.random() * hgt,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          radius: Math.random() * 0.8 + 1.2,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.015 + Math.random() * 0.02,
          baseAlpha: Math.random() * 0.22 + 0.25,
          energy: 0, // 0 to 1, flashes when receiving data pulse
          isAnchor: i % 7 === 0 // occasional special anchor node with subtle flare
        });
      }

      // 3. Digital packet clusters (cohesive traveling data units)
      packetClusters = [];
      for (let k = 0; k < 3; k++) {
        spawnPacketCluster();
      }

      dataPulses = [];
      rippleRings = [];
      networkLinks = [];
    }

    function spawnPacketCluster() {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 0.6;
      const originX = Math.random() < 0.5 ? -30 : w + 30;
      const originY = Math.random() * hgt;
      const members = [];
      const count = Math.floor(Math.random() * 3) + 3;

      for (let m = 0; m < count; m++) {
        members.push({
          ox: (Math.random() - 0.5) * 18,
          oy: (Math.random() - 0.5) * 18,
          radius: Math.random() * 0.8 + 0.9,
          alpha: Math.random() * 0.3 + 0.4
        });
      }

      packetClusters.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        members: members,
        life: 0,
        maxLife: 600 + Math.random() * 400
      });
    }

    resize();
    let rtime;
    addEventListener("resize", () => {
      clearTimeout(rtime);
      rtime = setTimeout(resize, 120);
    }, { passive: true });

    addEventListener("scroll", () => {
      scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if (running && !reduceMotion) {
        if (!rafId) rafId = requestAnimationFrame(draw);
      } else {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    });

    // Draw single static frame if reduced motion is requested
    function drawStatic() {
      ctx.clearRect(0, 0, w, hgt);
      drawGrid(0);
      drawNetworkNodes(0);
    }

    // LAYER 1: Subtle Animated Cyber Grid & Corner Tech Radar Accents
    function drawGrid(time) {
      const gridSize = 68;
      const parallaxY = (smoothScrollY * 0.05) % gridSize;
      const shiftY = (time * 5 + parallaxY) % gridSize;

      ctx.beginPath();
      ctx.strokeStyle = "rgba(0, 255, 102, 0.022)";
      ctx.lineWidth = 0.5;

      for (let x = 0; x <= w; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, hgt);
      }
      for (let y = shiftY; y <= hgt; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Sparse subtle tech crosshairs at grid intersections
      ctx.fillStyle = "rgba(0, 255, 102, 0.045)";
      for (let x = gridSize * 2; x < w; x += gridSize * 3) {
        for (let y = shiftY + gridSize * 2; y < hgt; y += gridSize * 3) {
          ctx.fillRect(x - 3, y, 7, 1);
          ctx.fillRect(x, y - 3, 1, 7);
        }
      }

      // Top-left and bottom-right corner cyber radar arcs (reference style)
      ctx.save();
      ctx.strokeStyle = "rgba(0, 255, 102, 0.035)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(40, 40, 110, 0, Math.PI * 0.7);
      ctx.stroke();

      ctx.beginPath();
      ctx.setLineDash([4, 10]);
      ctx.arc(40, 40, 140, time * 0.1, time * 0.1 + Math.PI * 0.65);
      ctx.stroke();

      ctx.beginPath();
      ctx.setLineDash([2, 14]);
      ctx.arc(w - 50, hgt - 50, 160, -Math.PI * 0.8 - time * 0.08, -Math.PI * 0.2 - time * 0.08);
      ctx.stroke();
      ctx.restore();
    }

    // LAYER 2: Flowing Harmonic Digital Wave Ribbons (as shown in reference image)
    function drawFlowingRibbons(time) {
      const parallax = smoothScrollY * 0.08;

      // Ribbon bundle 1: sweeping from upper-left across mid-left
      drawRibbonBundle(
        time * 0.4,
        -50, hgt * 0.18 - parallax,
        w * 0.75, hgt * 0.72 - parallax,
        10,
        0.0028,
        34,
        1.0
      );

      // Ribbon bundle 2: sweeping along bottom-right edge
      drawRibbonBundle(
        time * 0.35 + 2.5,
        w * 0.35, hgt * 0.65 - parallax,
        w + 60, hgt * 0.35 - parallax,
        8,
        0.0032,
        28,
        -0.8
      );
    }

    function drawRibbonBundle(time, x1, y1, x2, y2, lineCount, freq, amp, dir) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);
      const steps = Math.max(Math.floor(len / 22), 20);

      for (let l = 0; l < lineCount; l++) {
        const lineOffset = (l - lineCount / 2) * 4.5;
        const linePhase = l * 0.18;
        const alpha = (0.024 + 0.022 * Math.sin(l * 0.4 + time * 0.6)) * (1 - Math.abs(l - lineCount / 2) / (lineCount * 0.7));

        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const px = x1 + dx * u;
          const py = y1 + dy * u;

          // Harmonic wave deformation
          const wave = Math.sin(u * 7.5 + time * 0.8 + linePhase) * amp * dir
                     + Math.cos(u * 14.0 - time * 0.5 + linePhase * 0.5) * (amp * 0.35);

          // Mouse deflection
          const mdx = px - smoothMouse.x;
          const mdy = py - smoothMouse.y;
          const mDistSq = mdx * mdx + mdy * mdy;
          const mPull = mDistSq < 35000 ? (1 - Math.sqrt(mDistSq) / 187) * 22 : 0;

          const finalX = px + perpX * (lineOffset + wave + mPull);
          const finalY = py + perpY * (lineOffset + wave + mPull);

          if (s === 0) ctx.moveTo(finalX, finalY);
          else ctx.lineTo(finalX, finalY);
        }

        ctx.strokeStyle = `rgba(0, 255, 102, ${Math.max(alpha, 0.008)})`;
        ctx.lineWidth = 0.75;
        ctx.stroke();
      }
    }

    // LAYER 3: Living Network, Multi-Hop Sequential Pulses & Packet Clusters
    function drawLivingNetwork(time) {
      networkLinks = [];
      const parallaxY = smoothScrollY * 0.15;

      // Far depth ambient drifting stars
      for (let i = 0; i < farParticles.length; i++) {
        const fp = farParticles[i];
        if (!reduceMotion) {
          fp.x += fp.vx;
          fp.y += fp.vy;
          fp.twinkle += fp.twinkleSpeed;
          if (fp.x < 0) fp.x = w;
          else if (fp.x > w) fp.x = 0;
          if (fp.y < 0) fp.y = hgt;
          else if (fp.y > hgt) fp.y = 0;
        }

        const alpha = fp.baseAlpha * (0.6 + 0.4 * Math.sin(fp.twinkle));
        ctx.beginPath();
        ctx.arc(fp.x, (fp.y - parallaxY * 0.4 + hgt * 5) % hgt, fp.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 102, ${alpha})`;
        ctx.fill();
      }

      // Constellation Network Nodes & Links
      const maxDist = Math.min(w * 0.18, 145);
      const maxDistSq = maxDist * maxDist;

      for (let i = 0; i < networkNodes.length; i++) {
        const p = networkNodes[i];

        if (!reduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
          p.pulse += p.pulseSpeed;

          // Wrap edges
          if (p.x < -15) p.x = w + 15;
          else if (p.x > w + 15) p.x = -15;
          if (p.y < -15) p.y = hgt + 15;
          else if (p.y > hgt + 15) p.y = -15;

          // Decay node energy from pulses
          if (p.energy > 0) p.energy = Math.max(0, p.energy - 0.025);

          // Cursor gentle magnetic nudge
          const mdx = p.x - smoothMouse.x;
          const mdy = p.y - smoothMouse.y;
          const mDistSq = mdx * mdx + mdy * mdy;
          if (mDistSq < 22000 && mDistSq > 1) {
            const push = (1 - Math.sqrt(mDistSq) / 148) * 0.65;
            p.x += (mdx / Math.sqrt(mDistSq)) * push;
            p.y += (mdy / Math.sqrt(mDistSq)) * push;
            p.energy = Math.max(p.energy, push * 0.8);
          }
        }

        const py = (p.y - parallaxY + hgt * 5) % hgt;

        // Build links to neighbors
        for (let j = i + 1; j < networkNodes.length; j++) {
          const p2 = networkNodes[j];
          const p2y = (p2.y - parallaxY + hgt * 5) % hgt;
          const dx = p.x - p2.x;
          const dy = py - p2y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            let lineAlpha = (1 - dist / maxDist) * 0.15;

            // Brighten line if connected nodes have active pulse energy
            if (p.energy > 0.1 || p2.energy > 0.1) {
              lineAlpha += Math.max(p.energy, p2.energy) * 0.28;
            }

            // Mouse proximity line curvature
            const midX = (p.x + p2.x) / 2;
            const midY = (py + p2y) / 2;
            const cdx = midX - smoothMouse.x;
            const cdy = midY - smoothMouse.y;
            const cDistSq = cdx * cdx + cdy * cdy;

            ctx.beginPath();
            if (cDistSq < 16000) {
              const bend = (1 - Math.sqrt(cDistSq) / 126) * 12;
              const ctrlX = midX + (cdx / (Math.sqrt(cDistSq) || 1)) * bend;
              const ctrlY = midY + (cdy / (Math.sqrt(cDistSq) || 1)) * bend;
              ctx.moveTo(p.x, py);
              ctx.quadraticCurveTo(ctrlX, ctrlY, p2.x, p2y);
            } else {
              ctx.moveTo(p.x, py);
              ctx.lineTo(p2.x, p2y);
            }

            ctx.strokeStyle = `rgba(0, 255, 102, ${lineAlpha})`;
            ctx.lineWidth = p.energy > 0.3 ? 1.0 : 0.6;
            ctx.stroke();

            networkLinks.push({ from: p, to: p2 });
          }
        }

        // Draw node
        const glow = Math.sin(p.pulse) * 0.3 + 0.7;
        const currentAlpha = Math.min(1.0, p.baseAlpha * glow + p.energy * 0.7);
        const currentRadius = p.radius + p.energy * 1.5;

        ctx.beginPath();
        ctx.arc(p.x, py, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = p.energy > 0.3 ? "#ffffff" : `rgba(0, 255, 102, ${currentAlpha})`;
        if (p.energy > 0.2) {
          ctx.shadowColor = "#00ff66";
          ctx.shadowBlur = 8 + p.energy * 10;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Occasional anchor cross star flare
        if (p.isAnchor && currentAlpha > 0.35) {
          ctx.strokeStyle = `rgba(0, 255, 102, ${currentAlpha * 0.4})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x - 6, py);
          ctx.lineTo(p.x + 6, py);
          ctx.moveTo(p.x, py - 6);
          ctx.lineTo(p.x, py + 6);
          ctx.stroke();
        }
      }

      // 4. Sequential Multi-Hop Living Network Data Pulses
      if (!reduceMotion) {
        // Organic trigger for new data pulse
        if (dataPulses.length < 9 && networkLinks.length > 0 && Math.random() < 0.06) {
          const link = networkLinks[Math.floor(Math.random() * networkLinks.length)];
          dataPulses.push({
            from: link.from,
            to: link.to,
            progress: 0,
            speed: 0.016 + Math.random() * 0.022,
            hopsLeft: Math.floor(Math.random() * 3) + 1 // multi-hop: 1 to 3 hops!
          });
        }

        for (let pIdx = dataPulses.length - 1; pIdx >= 0; pIdx--) {
          const pk = dataPulses[pIdx];
          pk.progress += pk.speed;

          const fromY = (pk.from.y - parallaxY + hgt * 5) % hgt;
          const toY = (pk.to.y - parallaxY + hgt * 5) % hgt;

          if (pk.progress >= 1) {
            // Pulse reached target node: illuminate it!
            pk.to.energy = 1.0;

            // Sequential hop: continue to neighbor node if hops remaining
            if (pk.hopsLeft > 0) {
              const nextLinks = networkLinks.filter((l) => (l.from === pk.to && l.to !== pk.from) || (l.to === pk.to && l.from !== pk.from));
              if (nextLinks.length > 0) {
                const nextLink = nextLinks[Math.floor(Math.random() * nextLinks.length)];
                const nextTarget = nextLink.from === pk.to ? nextLink.to : nextLink.from;
                pk.from = pk.to;
                pk.to = nextTarget;
                pk.progress = 0;
                pk.hopsLeft--;
                continue;
              }
            }

            dataPulses.splice(pIdx, 1);
            continue;
          }

          const pkX = pk.from.x + (pk.to.x - pk.from.x) * pk.progress;
          const pkY = fromY + (toY - fromY) * pk.progress;

          // Glowing traveling pulse head with subtle trailing spark
          ctx.beginPath();
          ctx.arc(pkX, pkY, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#00ff66";
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // 5. Digital Packet Clusters
        for (let k = packetClusters.length - 1; k >= 0; k--) {
          const cluster = packetClusters[k];
          cluster.x += cluster.vx;
          cluster.y += cluster.vy;
          cluster.life++;

          if (cluster.life >= cluster.maxLife || cluster.x < -60 || cluster.x > w + 60 || cluster.y < -60 || cluster.y > hgt + 60) {
            packetClusters.splice(k, 1);
            spawnPacketCluster();
            continue;
          }

          const cAlpha = Math.sin((cluster.life / cluster.maxLife) * Math.PI);
          for (let m = 0; m < cluster.members.length; m++) {
            const mem = cluster.members[m];
            ctx.beginPath();
            ctx.arc(cluster.x + mem.ox, cluster.y + mem.oy, mem.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 102, ${mem.alpha * cAlpha * 0.75})`;
            ctx.fill();
          }
        }
      }
    }

    // LAYER 4: Periodic Subtle Data Scan Wave (Radar sweep)
    function drawDataScan(time) {
      if (!scanWave.active) {
        scanWave.nextTrigger--;
        if (scanWave.nextTrigger <= 0) {
          scanWave.active = true;
          scanWave.progress = 0;
          scanWave.nextTrigger = Math.floor(Math.random() * 450) + 400; // triggers every ~10-15s
        }
        return;
      }

      scanWave.progress += 0.0035;
      if (scanWave.progress >= 1) {
        scanWave.active = false;
        return;
      }

      // Diagonal scanning band across the viewport
      const scanX = (w + hgt) * scanWave.progress;
      const scanAlpha = Math.sin(scanWave.progress * Math.PI) * 0.065;

      ctx.save();
      const grad = ctx.createLinearGradient(scanX - 120, 0, scanX + 40, hgt);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.65, `rgba(0, 255, 102, ${scanAlpha})`);
      grad.addColorStop(0.85, `rgba(0, 255, 102, ${scanAlpha * 1.8})`);
      grad.addColorStop(1, "transparent");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(scanX - 120, 0);
      ctx.lineTo(scanX + 40, 0);
      ctx.lineTo(scanX - hgt + 40, hgt);
      ctx.lineTo(scanX - hgt - 120, hgt);
      ctx.closePath();
      ctx.fill();

      // Energize nodes intersected by scan beam
      for (let i = 0; i < networkNodes.length; i++) {
        const node = networkNodes[i];
        const distToScan = Math.abs((node.x + node.y * 0.6) - scanX);
        if (distToScan < 35) {
          node.energy = Math.max(node.energy, 0.7);
        }
      }

      ctx.restore();
    }

    // LAYER 5: Interactive Cursor Field & Expanding Ripple Rings
    function drawMouseField() {
      if (smoothMouse.x < 0 || smoothMouse.y < 0) return;

      // Soft ambient cursor spotlight
      const rad = ctx.createRadialGradient(smoothMouse.x, smoothMouse.y, 0, smoothMouse.x, smoothMouse.y, 260);
      rad.addColorStop(0, "rgba(0, 255, 102, 0.045)");
      rad.addColorStop(0.5, "rgba(0, 255, 102, 0.015)");
      rad.addColorStop(1, "transparent");
      ctx.fillStyle = rad;
      ctx.beginPath();
      ctx.arc(smoothMouse.x, smoothMouse.y, 260, 0, Math.PI * 2);
      ctx.fill();

      // Mouse motion emitter for expanding subtle ripple rings
      const moveDist = Math.hypot(smoothMouse.x - lastMouseEmit.x, smoothMouse.y - lastMouseEmit.y);
      if (moveDist > 45 && rippleRings.length < 5) {
        rippleRings.push({
          x: smoothMouse.x,
          y: smoothMouse.y,
          radius: 10,
          maxRadius: 190,
          alpha: 0.14
        });
        lastMouseEmit.x = smoothMouse.x;
        lastMouseEmit.y = smoothMouse.y;
      }

      // Draw active ripple rings
      for (let rIdx = rippleRings.length - 1; rIdx >= 0; rIdx--) {
        const ring = rippleRings[rIdx];
        ring.radius += 3.2;
        const progress = ring.radius / ring.maxRadius;

        if (progress >= 1) {
          rippleRings.splice(rIdx, 1);
          continue;
        }

        const ringAlpha = ring.alpha * (1 - progress);
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 102, ${ringAlpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    // MAIN RENDER LOOP (60 FPS GPU-optimized procedural Canvas)
    function draw() {
      if (!running) { rafId = null; return; }
      ctx.clearRect(0, 0, w, hgt);

      // Smooth coordinate interpolations
      if (mouse.x >= 0) {
        if (smoothMouse.x < 0) {
          smoothMouse.x = mouse.x;
          smoothMouse.y = mouse.y;
        } else {
          smoothMouse.x += (mouse.x - smoothMouse.x) * 0.12;
          smoothMouse.y += (mouse.y - smoothMouse.y) * 0.12;
        }
      }

      smoothScrollY += (scrollY - smoothScrollY) * 0.08;

      drawMouseField();
      drawGrid(t);
      drawFlowingRibbons(t);
      drawLivingNetwork(t);
      drawDataScan(t);

      t += 0.005;
      rafId = requestAnimationFrame(draw);
    }

    if (reduceMotion) {
      drawStatic();
    } else {
      rafId = requestAnimationFrame(draw);
    }
  }

  /* ---------------- hero: dot-matrix "CIPHER" ---------------- */
  function startHeroDots() {
    const c = $('#hero-dots');
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    let pts = [], W = 0, H = 0, running = true, rafId = null;

    // Character pool: A-Z, 0-9, @, #, $, %, &, *, +, =, /, <, >
    const GLYPHS = [
      'A','B','C','D','E','F','G','H','I','J','K','L','M',
      'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
      '0','1','2','3','4','5','6','7','8','9',
      '@','#','$','%','&','*','+','=','/',':','-','.','<'
    ];

    function getRandomChar() {
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }

    function build() {
      const rect = c.getBoundingClientRect();
      W = Math.floor(rect.width || c.clientWidth || innerWidth || 1000);
      H = Math.floor(rect.height || c.clientHeight || 280);
      if (W < 60 || H < 60) {
        W = Math.min(Math.max((window.innerWidth || 1000) - 40, 360), 1200);
        H = Math.min(Math.max(Math.floor((window.innerHeight || 650) * 0.42), 220), 340);
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = W * dpr;
      c.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      try {
        const off = document.createElement('canvas');
        off.width = W;
        off.height = H;
        const o = off.getContext('2d');
        if (!o) return;

        const letters = ['C', 'I', 'P', 'H', 'E', 'R'];
        // Proportional layout for letters:
        // Elegant, slightly thinner letter strokes
        const weights = [1.0, 0.70, 0.96, 1.02, 0.92, 1.0];
        const weightSum = weights.reduce((a, b) => a + b, 0);
        
        const totalWordW = Math.min(W * 0.88, 920);
        const gapRatio = 0.40;
        const totalGaps = (letters.length - 1) * gapRatio;
        const unit = totalWordW / (weightSum + totalGaps);
        const gapWidth = unit * gapRatio;

        const startX = (W - totalWordW) / 2;
        // Constrain font size by BOTH height AND width so letters don't overlap on mobile
        const fsFromHeight = Math.floor(H * 0.80);
        const maxLetterSlot = weights.reduce((mx, w) => Math.max(mx, w), 0) * unit;
        const fsFromWidth = Math.floor(maxLetterSlot * 1.55);
        const fs = Math.min(fsFromHeight, fsFromWidth);

        // Thinner, cleaner font rendering: weight 700 with fillText creates defined strokes with open counters
        o.font = '700 ' + fs + 'px "JetBrains Mono", monospace';
        o.textAlign = 'center';
        o.textBaseline = 'middle';
        o.fillStyle = '#ffffff';

        let curX = startX;
        for (let i = 0; i < letters.length; i++) {
          const slotW = weights[i] * unit;
          const centerX = curX + slotW / 2;
          o.fillText(letters[i], centerX, H / 2);
          curX += slotW + gapWidth;
        }

        const maskData = o.getImageData(0, 0, W, H).data;

        // Monospace grid settings:
        const isMobile = W < 650;
        const charW = isMobile ? 6.4 : 7.6;
        const charH = isMobile ? 9.8 : 11.6;
        const cols = Math.floor(W / charW);
        const rows = Math.floor(H / charH);

        pts = [];
        for (let r = 0; r < rows; r++) {
          for (let cl = 0; cl < cols; cl++) {
            const gx = (cl + 0.5) * charW;
            const gy = (r + 0.5) * charH;
            const idx = (Math.floor(gy) * W + Math.floor(gx)) * 4 + 3;

            // Threshold 80 for crisp, thin, well-defined letterforms
            if (maskData[idx] > 80) {
              const baseCh = getRandomChar();
              const randVal = Math.random();
              pts.push({
                hx: gx,
                hy: gy,
                x: gx,
                y: gy,
                vx: 0,
                vy: 0,
                char: baseCh,
                baseChar: baseCh,
                isBright: randVal < 0.12,
                isDim: randVal > 0.82
              });
            }
          }
        }
      } catch (err) {
        console.warn('Hero build error:', err);
      }
    }

    let lastMorphTime = 0;

    function frame(now) {
      if (!running) { rafId = null; return; }

      if (pts.length === 0) {
        build();
        if (pts.length === 0) {
          rafId = requestAnimationFrame(frame);
          return;
        }
      }

      ctx.clearRect(0, 0, W, H);

      // Clean, very dark background with subtle ambient neon radial glow
      const grad = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * 0.44);
      grad.addColorStop(0, 'rgba(0, 255, 102, 0.055)');
      grad.addColorStop(0.55, 'rgba(0, 255, 102, 0.012)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const r = c.getBoundingClientRect();
      const mx = mouse.x - r.left;
      const my = mouse.y - r.top;
      const isMouseInside = mx >= -50 && mx <= W + 50 && my >= -50 && my <= H + 50;

      const isMobile = W < 650;
      const charFontSize = isMobile ? 8.4 : 9.8;
      ctx.font = '700 ' + charFontSize + 'px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const rippleRadius = isMobile ? 75 : 115;
      const rippleRadiusSq = rippleRadius * rippleRadius;
      const shouldMorph = (now - lastMorphTime) > 70;
      if (shouldMorph) lastMorphTime = now;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        let isNear = false;
        let proximity = 0;

        if (isMouseInside) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const distSq = dx * dx + dy * dy;

          if (distSq < rippleRadiusSq && distSq > 0.5) {
            isNear = true;
            const dist = Math.sqrt(distSq);
            proximity = 1 - (dist / rippleRadius);

            // SPREAD / DISPERSE physics: push characters outward away from mouse
            const force = (1 - dist / rippleRadius) * (isMobile ? 6.5 : 10);
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;

            // Character morph near mouse
            if (shouldMorph && Math.random() < 0.20) {
              p.char = getRandomChar();
            }
          }
        }

        // SPRING physics: smoothly pull back to home position (p.hx, p.hy)
        p.vx += (p.hx - p.x) * 0.085;
        p.vy += (p.hy - p.y) * 0.085;
        p.vx *= 0.81;
        p.vy *= 0.81;
        p.x += p.vx;
        p.y += p.vy;

        // When mouse leaves / moves away, smoothly restore base character
        if (!isNear && p.char !== p.baseChar && Math.random() < 0.06) {
          p.char = p.baseChar;
        }

        // Rendering colors & restrained neon-green glow
        if (isNear) {
          ctx.fillStyle = proximity > 0.55 ? '#ffffff' : (proximity > 0.28 ? '#c2ffd8' : '#00ff66');
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur = 8 + proximity * 6;
        } else if (p.isBright) {
          ctx.fillStyle = '#d2ffea';
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur = 7;
        } else if (p.isDim) {
          ctx.fillStyle = '#00b344';
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = '#00ff66';
          ctx.shadowColor = 'rgba(0, 255, 102, 0.45)';
          ctx.shadowBlur = 4;
        }

        ctx.fillText(p.char, p.x, p.y);
      }

      rafId = requestAnimationFrame(frame);
    }

    const startLoop = () => {
      if (!rafId && running) rafId = requestAnimationFrame(frame);
    };

    build();
    startLoop();

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => { build(); }).catch(() => {});
    }

    [80, 250, 600, 1200].forEach((delay) => {
      setTimeout(() => { if (pts.length < 50) build(); }, delay);
    });

    let rtime;
    addEventListener('resize', () => {
      clearTimeout(rtime);
      rtime = setTimeout(() => { build(); }, 120);
    }, { passive: true });

    if (window.IntersectionObserver) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          running = e.isIntersecting;
          if (running) {
            if (pts.length === 0) build();
            startLoop();
          } else if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        });
      }, { threshold: 0.05 });
      io.observe(c);
    }
  }

  /* ---------------- API ---------------- */
  const api = async (path, opts) => {
    const res = await fetch('/api' + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
    const data = res.status === 204 ? null : await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data?.error || 'Request failed'), { data });
    return data;
  };

  /* ---------------- leadership (infinite scrollable carousel) ---------------- */
  async function loadLeaders() {
    const box = $('#leaders');
    const wrapper = $('#leaders-wrapper') || box?.parentElement;
    if (!box || !wrapper) return;

    try {
      const list = await api('/leadership');
      if (!list.length) { box.textContent = ''; return; }

      /* build a single card */
      const buildCard = (m) => {
        const initials = m.name.split(' ').map((p) => p[0]).slice(0, 2).join('');
        const photo = h('div', { class: 'leader__photo' },
          m.image ? h('img', { src: m.image, alt: m.name, loading: 'lazy' }) : h('span', { class: 'leader__initials', text: initials }));
        const links = h('div', { class: 'leader__links' },
          m.github && h('a', { href: m.github, 'aria-label': `${m.name} on GitHub`, rel: 'noopener', target: '_blank', text: 'GitHub' }),
          m.linkedin && h('a', { href: m.linkedin, 'aria-label': `${m.name} on LinkedIn`, rel: 'noopener', target: '_blank', text: 'LinkedIn' }));
        const extra = h('div', { class: 'leader__extra', text: `${m.role} · CIPHER CSE Association` });
        const info = h('div', { class: 'leader__info' },
          h('p', { class: 'leader__role', text: m.role }),
          h('h3', { class: 'leader__name', text: m.name }),
          links, extra);
        return h('article', { class: 'leader', 'aria-label': `${m.name}, ${m.role}` }, photo, info);
      };

      /* build 3 identical sets for infinite bidirectional seamless wrapping */
      const set1 = list.map(buildCard);
      const set2 = list.map(buildCard);
      const set3 = list.map(buildCard);
      box.replaceChildren(...set1, ...set2, ...set3);

      let unitWidth = 0;
      const measure = () => {
        unitWidth = box.scrollWidth / 3;
      };

      requestAnimationFrame(() => {
        measure();
        if (unitWidth > 0 && wrapper.scrollLeft === 0) {
          wrapper.scrollLeft = unitWidth;
        }
      });

      // Wrap-around handler on scroll to ensure truly infinite scrolling in both directions
      let isWrapping = false;
      const checkWrap = () => {
        if (!unitWidth || isWrapping) return;
        if (wrapper.scrollLeft >= unitWidth * 2) {
          isWrapping = true;
          wrapper.scrollLeft -= unitWidth;
          isWrapping = false;
        } else if (wrapper.scrollLeft <= 5) {
          isWrapping = true;
          wrapper.scrollLeft += unitWidth;
          isWrapping = false;
        }
      };

      wrapper.addEventListener('scroll', checkWrap, { passive: true });

      // State tracking for user interaction & auto-scroll
      let isInteracting = false;
      let idleTimer = null;

      const pauseAuto = () => {
        isInteracting = true;
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          isInteracting = false;
        }, 1800);
      };

      // Continuous 60fps auto-scroll when user is idle
      const autoScrollLoop = () => {
        if (!isInteracting && !reduceMotion && unitWidth > 0) {
          wrapper.scrollLeft += 0.75;
          checkWrap();
        }
        requestAnimationFrame(autoScrollLoop);
      };
      requestAnimationFrame(autoScrollLoop);

      // Pause auto-scroll on hover
      wrapper.addEventListener('mouseenter', () => { isInteracting = true; });
      wrapper.addEventListener('mouseleave', () => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { isInteracting = false; }, 600);
      });

      // 1. Mouse wheel horizontal scrolling
      wrapper.addEventListener('wheel', (e) => {
        pauseAuto();
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        wrapper.scrollLeft += delta;
        checkWrap();
        e.preventDefault();
      }, { passive: false });

      // 2. Click and Drag (Grab-to-scroll)
      let isDragging = false;
      let startX = 0;
      let scrollStart = 0;
      let hasDragged = false;

      wrapper.addEventListener('pointerdown', (e) => {
        if (e.target.closest('a')) return;
        isDragging = true;
        hasDragged = false;
        startX = e.clientX;
        scrollStart = wrapper.scrollLeft;
        wrapper.classList.add('is-dragging');
        try { wrapper.setPointerCapture(e.pointerId); } catch {}
        pauseAuto();
      });

      wrapper.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 4) hasDragged = true;
        wrapper.scrollLeft = scrollStart - dx;
        checkWrap();
        pauseAuto();
      });

      const endDrag = (e) => {
        if (!isDragging) return;
        isDragging = false;
        wrapper.classList.remove('is-dragging');
        try { wrapper.releasePointerCapture(e.pointerId); } catch {}
        pauseAuto();
      };

      wrapper.addEventListener('pointerup', endDrag);
      wrapper.addEventListener('pointercancel', endDrag);

      // Prevent link clicks if user was actively dragging
      wrapper.addEventListener('click', (e) => {
        if (hasDragged) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);

      // 3. Arrow buttons navigation
      const prevBtn = $('#leaders-prev');
      const nextBtn = $('#leaders-next');
      const scrollStep = () => {
        const firstCard = box.querySelector('.leader');
        return firstCard ? firstCard.offsetWidth + 26 : 310;
      };

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          pauseAuto();
          wrapper.scrollBy({ left: -scrollStep(), behavior: 'smooth' });
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          pauseAuto();
          wrapper.scrollBy({ left: scrollStep(), behavior: 'smooth' });
        });
      }

      // 4. Keyboard navigation
      wrapper.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          pauseAuto();
          wrapper.scrollBy({ left: -scrollStep(), behavior: 'smooth' });
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          pauseAuto();
          wrapper.scrollBy({ left: scrollStep(), behavior: 'smooth' });
          e.preventDefault();
        }
      });

      // Recalculate on window resize
      window.addEventListener('resize', measure, { passive: true });
    } catch {
      box.replaceChildren(h('p', { class: 'err-msg', text: 'Could not load leadership. Refresh to try again.' }));
    }
  }

  /* ---------------- events + modal ---------------- */
  const modal = $('#event-modal');
  let gal = [], gi = 0;
  const showSlide = () => {
    const f = $('#em-frame');
    if (!gal.length) {
      f.className = 'gallery__frame empty';
      f.style.backgroundImage = '';
      f.innerHTML = '<span style="color:var(--g-dim)">Photos coming soon</span>';
      $('#em-count').textContent = '00 / 00';
      return;
    }
    const s = gal[gi];
    f.className = 'gallery__frame';
    f.style.backgroundImage = `url("${encodeURI(s.src)}")`;
    f.innerHTML = s.caption ? `<div class="gallery__caption">${s.caption}</div>` : '';
    $('#em-count').textContent = `${String(gi + 1).padStart(2, '0')} / ${String(gal.length).padStart(2, '0')}`;
  };
  function openEvent(ev) {
    $('#em-tag').textContent = `cipher // activities`;
    $('#em-title').textContent = ev.title;
    $('#em-meta').textContent = [fmtDate(ev.event_date), ev.venue].filter(Boolean).join(' · ');
    $('#em-body').replaceChildren(...(ev.body.length ? ev.body : [ev.summary]).map((p) => h('p', { text: p })));
    document.body.classList.add("modal-open"); gal = ev.gallery; gi = 0; showSlide(); modal.showModal();
  }
  $('#em-prev').addEventListener('click', () => { if (gal.length) { gi = (gi - 1 + gal.length) % gal.length; showSlide(); } });
  $('#em-next').addEventListener('click', () => { if (gal.length) { gi = (gi + 1) % gal.length; showSlide(); } });

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') $('#em-prev').click();
    if (e.key === 'ArrowRight') $('#em-next').click();
  });
  let touchX = null;
  const frame = $('#em-frame');
  frame.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  frame.addEventListener('touchend', (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) > 40) $(dx < 0 ? '#em-next' : '#em-prev').click();
  });

  let allEvents = [];

  function openEventBySlug(slug, cardElem) {
    const ev = allEvents.find((e) => e.slug === slug);
    if (ev) {
      openEvent(ev);
      return;
    }
    let gallery = [];
    if (cardElem && cardElem.dataset.gallery) {
      try { gallery = JSON.parse(cardElem.dataset.gallery); } catch {}
    }
    const title = cardElem?.querySelector('.card__title')?.textContent || 'Event Details';
    const dateText = cardElem?.querySelector('.card__date-tag')?.textContent || '';
    const venueText = cardElem?.querySelector('.card__venue')?.textContent || '';
    const summaryText = cardElem?.querySelector('.card__summary')?.textContent || '';

    $('#em-tag').textContent = `cipher // activities`;
    $('#em-title').textContent = title;
    $('#em-meta').textContent = [dateText, venueText].filter(Boolean).join(' · ');
    $('#em-body').replaceChildren(h('p', { text: summaryText }));
    document.body.classList.add("modal-open");
    gal = gallery;
    gi = 0;
    showSlide();
    modal.showModal();
  }

  function initEventCards() {
    const cards = $$('#event-cards .card');
    cards.forEach((card) => {
      const slides = Array.from(card.querySelectorAll('.card__slide'));
      const hudIdx = card.querySelector('.hud-idx');
      const hudTotal = card.querySelector('.hud-total');
      const progressBar = card.querySelector('.card__progress-bar');
      const dots = Array.from(card.querySelectorAll('.card__dot'));
      const slug = card.dataset.slug;

      if (hudTotal && slides.length) {
        hudTotal.textContent = String(slides.length).padStart(2, '0');
      }

      let curIdx = 0;
      let cycleInterval = null;
      const CYCLE_DURATION = 1300;

      function setSlide(idx) {
        curIdx = idx;
        slides.forEach((sl, i) => sl.classList.toggle('active', i === curIdx));
        dots.forEach((dt, i) => dt.classList.toggle('active', i === curIdx));
        if (hudIdx) hudIdx.textContent = String(curIdx + 1).padStart(2, '0');
      }

      function startProgress() {
        if (!progressBar) return;
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';
        void progressBar.offsetWidth; // force reflow
        progressBar.style.transition = `width ${CYCLE_DURATION}ms linear`;
        progressBar.style.width = '100%';
      }

      function resetProgress() {
        if (!progressBar) return;
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';
      }

      function startCycling() {
        if (slides.length <= 1) return;
        clearInterval(cycleInterval);
        startProgress();
        cycleInterval = setInterval(() => {
          const next = (curIdx + 1) % slides.length;
          setSlide(next);
          startProgress();
        }, CYCLE_DURATION);
      }

      function stopCycling() {
        clearInterval(cycleInterval);
        cycleInterval = null;
        resetProgress();
        setSlide(0);
      }

      card.addEventListener('mouseenter', startCycling);
      card.addEventListener('mouseleave', stopCycling);
      card.addEventListener('focusin', startCycling);
      card.addEventListener('focusout', stopCycling);

      // Subtle magnetic tilt towards cursor
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        const MAX_TILT = 6.5; // degrees of subtle tilt
        const MAX_TRANS = 5;  // px of subtle magnetic pull
        let tiltRaf = null;
        let tX = 50, tY = 50, pX = 0, pY = 0;

        const updateTilt = () => {
          tiltRaf = null;
          const rotX = (pY * MAX_TILT).toFixed(2);
          const rotY = (-pX * MAX_TILT).toFixed(2);
          const trX = (pX * MAX_TRANS).toFixed(1);
          const trY = (pY * MAX_TRANS - 5).toFixed(1);

          card.style.setProperty('--tilt-x', `${rotX}deg`);
          card.style.setProperty('--tilt-y', `${rotY}deg`);
          card.style.setProperty('--trans-x', `${trX}px`);
          card.style.setProperty('--trans-y', `${trY}px`);
          card.style.setProperty('--trans-z', '12px');
          card.style.setProperty('--shine-x', `${tX.toFixed(1)}%`);
          card.style.setProperty('--shine-y', `${tY.toFixed(1)}%`);
        };

        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          tX = (x / rect.width) * 100;
          tY = (y / rect.height) * 100;
          pX = (x / rect.width) * 2 - 1;
          pY = (y / rect.height) * 2 - 1;

          if (!card.classList.contains('is-tilting')) {
            card.classList.add('is-tilting');
            card.classList.remove('is-resetting');
          }

          if (!tiltRaf) {
            tiltRaf = requestAnimationFrame(updateTilt);
          }
        });

        card.addEventListener('mouseleave', () => {
          if (tiltRaf) {
            cancelAnimationFrame(tiltRaf);
            tiltRaf = null;
          }
          card.classList.remove('is-tilting');
          card.classList.add('is-resetting');
          card.style.setProperty('--tilt-x', '0deg');
          card.style.setProperty('--tilt-y', '0deg');
          card.style.setProperty('--trans-x', '0px');
          card.style.setProperty('--trans-y', '0px');
          card.style.setProperty('--trans-z', '0px');
        });
      }

      const triggerModal = () => openEventBySlug(slug, card);
      card.addEventListener('click', triggerModal);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerModal();
        }
      });
    });

    // Category filter chips
    const chips = $$('#event-chips .chip');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const cat = (chip.dataset.cat || chip.textContent).trim().toUpperCase();
        chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        cards.forEach((c) => {
          const cCat = (c.dataset.category || '').trim().toUpperCase();
          let match = false;
          if (cat === 'ALL') {
            match = true;
          } else if (cat === 'BRANCH GALA' || cat === 'BRANCH ENTRY') {
            match = cCat.includes('BRANCH') || cCat.includes('GALA') || cCat.includes('ENTRY');
          } else {
            match = cCat === cat;
          }
          c.hidden = !match;
        });
      });
    });
  }

  async function loadContent() {
    try {
      const content = await api('/content');
      if (content && typeof content === 'object') {
        if (content.about_title && $('#about-title')) $('#about-title').textContent = content.about_title;
        if (content.about_text && $('#about-lead')) $('#about-lead').textContent = content.about_text;
        if (content.hero_subtitle && $('#hero-sub')) $('#hero-sub').textContent = content.hero_subtitle;
      }
    } catch (e) {
      console.warn('Content loader fallback:', e.message);
    }
  }

  async function loadEvents() {
    const container = $('#event-cards');
    if (!container) return;

    try {
      allEvents = await api('/events');
      if (Array.isArray(allEvents) && allEvents.length > 0) {
        // Build cards dynamically for all published events
        const cardElements = allEvents.map((ev) => {
          const gallery = Array.isArray(ev.gallery) && ev.gallery.length > 0 ? ev.gallery : (ev.poster ? [{ src: ev.poster, caption: ev.title }] : []);
          const firstImg = gallery[0]?.src || 'img/events/gsoc-llm-workshop/02.jpg';
          const cat = (ev.category || 'EVENT').toUpperCase();
          const dept = ev.category?.toUpperCase() === 'WORKSHOP' ? 'CSE · HANDS-ON' : (ev.category?.toUpperCase() === 'COMPETITION' ? 'CIPHER · CONTEST' : 'CSE · CIPHER');
          const dateFormatted = fmtDate(ev.event_date);
          const totalCount = String(gallery.length || 1).padStart(2, '0');

          const article = h('article', {
            class: `card ${gallery.length > 1 ? 'has-gallery' : ''}`,
            'data-slug': ev.slug,
            'data-category': cat,
            'data-gallery': JSON.stringify(gallery),
            tabindex: '0',
            role: 'button',
            'aria-label': `${ev.title} details`
          });

          // Media container
          const media = h('div', { class: 'card__media' },
            h('div', { class: 'card__progress', 'aria-hidden': 'true' }, h('div', { class: 'card__progress-bar' })),
            h('div', { class: 'card__category-badge', text: cat }),
            gallery.length > 1 ? h('div', { class: 'card__hud', 'aria-hidden': 'true' },
              h('span', { class: 'card__hud-badge' },
                h('span', { class: 'hud-idx', text: '01' }), ' / ', h('span', { class: 'hud-total', text: totalCount })
              )
            ) : null,
            h('div', { class: 'card__slides' },
              ...gallery.map((g, idx) => h('img', {
                src: g.src,
                alt: `${ev.title} photo ${idx + 1}`,
                class: `card__slide ${idx === 0 ? 'active' : ''}`,
                loading: 'lazy',
                decoding: 'async'
              }))
            ),
            h('div', { class: 'card__overlay', 'aria-hidden': 'true' }),
            gallery.length > 1 ? h('div', { class: 'card__dots', 'aria-hidden': 'true' },
              ...gallery.map((_, idx) => h('span', { class: `card__dot ${idx === 0 ? 'active' : ''}` }))
            ) : null
          );

          // Content container
          const content = h('div', { class: 'card__content' },
            h('div', { class: 'card__header-meta' },
              h('span', { class: 'card__dept-tag', text: dept }),
              h('span', { class: 'card__date-tag', text: dateFormatted })
            ),
            h('h3', { class: 'card__title', text: ev.title }),
            h('p', { class: 'card__summary', text: ev.summary || '' }),
            h('div', { class: 'card__footer' },
              h('span', { class: 'card__venue', text: ev.venue || (ev.event_time ? ev.event_time : 'SJEC Campus') }),
              h('span', { class: 'card__action', text: 'VIEW DETAILS ↗' })
            )
          );

          article.append(media, content);
          return article;
        });

        container.replaceChildren(...cardElements);
      }
    } catch (err) {
      console.warn('Using pre-rendered event cards fallback:', err);
    }

    initEventCards();
  }

  async function loadActivities() {
    const grid = $('#activities-grid');
    const input = $('#activity-search');
    const chipsWrap = $('#activity-chips');
    if (!grid) return;
    
    let activeCat = 'ALL';

    try {
      const list = await api('/activities');

      if (chipsWrap) {
        chipsWrap.addEventListener('click', (e) => {
          const btn = e.target.closest('.chip');
          if (!btn) return;
          activeCat = btn.dataset.cat;
          chipsWrap.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c === btn));
          draw();
        });
      }

      const draw = () => {
        const q = (input ? input.value : '').trim().toLowerCase();
        const shown = list.filter((a) => {
          const matchSearch = a.title.toLowerCase().includes(q);
          const matchCat = activeCat === 'ALL' || (a.category || '').toUpperCase() === activeCat;
          return matchSearch && matchCat;
        });

        grid.replaceChildren(...shown.map((a, i) => {
          const idx = String(list.indexOf(a) + 1).padStart(2, '0');
          const card = h('a', { class: 'activity-card', href: a.url || '#', target: '_blank', rel: 'noopener' },
            h('span', { class: 'activity-card__num', text: idx }),
            h('h4', { class: 'activity-card__title', text: a.title }),
            h('div', { class: 'activity-card__footer' },
              h('span', { class: 'activity-card__cat', text: a.category || 'EVENTS' }),
              h('span', { class: 'activity-card__action', text: 'OPEN LINK ↗' })
            )
          );
          return card;
        }));
      };

      if (input) input.addEventListener('input', draw);
      draw();
    } catch {
      grid.replaceChildren(h('div', { class: 'activity-card', text: 'Could not load activities.' }));
    }
  }

  /* ---------------- join form ---------------- */
  const joinModal = $('#join-modal'), form = $('#join-form'), status = $('#join-status');
  const syncModalCursorState = () => {
    const anyOpen = $$('dialog').some((d) => d.open);
    document.body.classList.toggle('modal-open', anyOpen);
  };

  $$('[data-open-join]').forEach((b) => b.addEventListener('click', () => {
    document.body.classList.add('modal-open');
    status.textContent = '';
    joinModal.showModal();
  }));

  $$('dialog [data-close]').forEach((b) => b.addEventListener('click', () => {
    const diag = b.closest('dialog');
    if (diag) diag.close();
    syncModalCursorState();
  }));

  $$('dialog').forEach((d) => {
    d.addEventListener('click', (e) => {
      if (e.target === d) {
        d.close();
        syncModalCursorState();
      }
    });
    d.addEventListener('close', syncModalCursorState);
    d.addEventListener('cancel', syncModalCursorState);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#join-submit');
    status.className = 'form-status';
    if (!form.checkValidity()) { status.classList.add('err'); status.textContent = 'Enter your name and a valid email.'; return; }
    const body = Object.fromEntries(new FormData(form));
    if (!body.year) delete body.year;
    if (!body.interest) delete body.interest;
    btn.disabled = true; status.textContent = 'Sending…';
    try {
      const r = await api('/join', { method: 'POST', body: JSON.stringify(body) });
      status.classList.add('ok'); status.textContent = r.message || 'Application received.';
      form.reset(); setTimeout(() => joinModal.close(), 1800);
    } catch (err) {
      status.classList.add('err');
      status.textContent = err.data?.details?.map((d) => `${d.field}: ${d.message}`).join(' · ') || err.message;
    } finally { btn.disabled = false; }
  });

  /* ---------------- interactive pillars ---------------- */
  function initPillars() {
    const pillars = $$('.pillar');
    const chars = '01#$*!~_><[]%&';

    pillars.forEach((pillar) => {
      const modEl = pillar.querySelector('.pillar__mod');
      const originalText = modEl ? modEl.textContent : '';

      // Dynamic mouse spotlight tracking
      pillar.addEventListener('mousemove', (e) => {
        const rect = pillar.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        pillar.style.setProperty('--mouse-x', `${x}%`);
        pillar.style.setProperty('--mouse-y', `${y}%`);
      });

      // Hover trigger: laser sweep & hacker text decipher scramble
      pillar.addEventListener('mouseenter', () => {
        pillar.classList.add('scanning');
        setTimeout(() => pillar.classList.remove('scanning'), 900);

        if (modEl && originalText) {
          let iteration = 0;
          const maxIterations = 8;
          clearInterval(pillar._scrambleInterval);
          pillar._scrambleInterval = setInterval(() => {
            modEl.textContent = originalText
              .split('')
              .map((char, index) => {
                if (char === ' ' || char === '/' || char === '·') return char;
                if (index < iteration) return originalText[index];
                return chars[Math.floor(Math.random() * chars.length)];
              })
              .join('');

            if (iteration >= originalText.length) {
              clearInterval(pillar._scrambleInterval);
              modEl.textContent = originalText;
            }
            iteration += originalText.length / maxIterations;
          }, 32);
        }
      });

      pillar.addEventListener('mouseleave', () => {
        clearInterval(pillar._scrambleInterval);
        if (modEl) modEl.textContent = originalText;
      });

      // Smooth scroll navigation with category filter auto-select
      const handleAction = () => {
        const target = pillar.dataset.target;
        if (target) {
          const el = $(target);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            const filter = pillar.dataset.filter;
            if (filter) {
              const chip = $(`#event-chips .chip[data-cat="${filter}"]`);
              if (chip) chip.click();
            }
          }
        }
      };

      pillar.addEventListener('click', handleAction);
      pillar.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleAction();
        }
      });
    });
  }

  /* ---------------- mobile menu ---------------- */
  const toggle = $('#nav-toggle'), navLinks = $('#nav-links');
  const setMenu = (open) => { toggle.setAttribute('aria-expanded', String(open)); navLinks.classList.toggle('open', open); };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  navLinks.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));
  addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

  /* ---------------- nav highlight ---------------- */
  const links = $$('.nav__links a');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => en.isIntersecting &&
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id)));
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['home', 'about', 'leadership', 'events', 'admin', 'join'].forEach((id) => {
    const el = $('#' + id);
    if (el) io.observe(el);
  });

  /* ---------------- viewport scroll reveal ---------------- */
  function initScrollReveal() {
    if (reduceMotion) {
      $$('.reveal').forEach((el) => el.classList.add('in-view'));
      return;
    }
    const revealTargets = $$(
      '.section, .pillar, .card, .admin-dashboard-hero-card, .admin-card-v2, .admin-login-banner, .archive-card, .about__text, .about__interactive'
    );
    revealTargets.forEach((el) => {
      el.classList.add('reveal');
      const siblings = el.parentNode ? Array.from(el.parentNode.children) : [];
      const idx = siblings.indexOf(el);
      el.style.setProperty('--reveal-delay', String(idx >= 0 ? idx % 6 : 0));
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.06 });

    revealTargets.forEach((el) => observer.observe(el));
  }

  /* ---------------- dynamic interactive about hover collage (ultra-fast, zero-lag) ---------------- */
  function initAboutHoverEffect() {
    const container = $('#about-interactive');
    if (!container) return;
    const photos = $$('.about-hover-photo', container);
    if (!photos.length) return;

    let isHovering = false;
    let cycleTimer = null;
    let currentIdx = 0;
    let lastMoveTime = 0;
    let lastX = 0, lastY = 0;
    const activeIndices = new Set();
    const DISPLAY_TIME = 650; // fast snappy visible duration
    const INTERVAL_TIME = 180; // rapid cycling interval

    function showPhoto(idx) {
      const photo = photos[idx];
      if (!photo) return;
      activeIndices.add(idx);
      photo.classList.remove('is-fading');
      photo.classList.add('is-visible');

      // Schedule fast fade out
      setTimeout(() => {
        if (!isHovering) return;
        hidePhoto(idx);
      }, DISPLAY_TIME);
    }

    function hidePhoto(idx) {
      const photo = photos[idx];
      if (!photo) return;
      photo.classList.remove('is-visible');
      photo.classList.add('is-fading');
      setTimeout(() => {
        photo.classList.remove('is-fading');
        activeIndices.delete(idx);
      }, 180);
    }

    function nextPhoto() {
      currentIdx = (currentIdx + 1) % photos.length;
      showPhoto(currentIdx);
    }

    function startHover() {
      if (isHovering) return;
      isHovering = true;

      // Immediately burst 2 photos instantly on hover with zero delay
      showPhoto(currentIdx);
      setTimeout(() => {
        if (isHovering) nextPhoto();
      }, 70);

      clearInterval(cycleTimer);
      cycleTimer = setInterval(() => {
        if (isHovering) nextPhoto();
      }, INTERVAL_TIME);
    }

    function stopHover() {
      isHovering = false;
      clearInterval(cycleTimer);
      cycleTimer = null;

      photos.forEach((_, idx) => {
        hidePhoto(idx);
      });
      activeIndices.clear();
    }

    container.addEventListener('mouseenter', startHover);
    container.addEventListener('mouseleave', stopHover);

    // Rapid interactive mouse scrubbing: as cursor moves across, switch images fast!
    container.addEventListener('mousemove', (e) => {
      if (!isHovering) startHover();
      const now = performance.now();
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (dist > 30 && now - lastMoveTime > 80) {
        lastX = e.clientX;
        lastY = e.clientY;
        lastMoveTime = now;
        nextPhoto();
      }
    });

    // Mobile touch interaction
    container.addEventListener('touchstart', () => {
      startHover();
      setTimeout(stopHover, 3500);
    }, { passive: true });
  }

  
  /* ---------------- boot ---------------- */
  runIntro(); startWaves(); startHeroDots();
  initPillars();
  loadLeaders(); loadEvents(); loadActivities(); loadContent();
  initScrollReveal();
  initAboutHoverEffect();
})();
