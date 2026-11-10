import * as THREE from 'three'

export type Status = 'ready' | 'playing' | 'paused' | 'won' | 'lost'
export interface Snapshot { health: number; seals: number; enemies: number; status: Status; message: string; leap: number; x: number; z: number; height: number; mangoes: number; score: number; energy: number; streak: number; bossHealth: number; bossMax: number; bossAwake: boolean }
export interface Controls { keys: Set<string>; action: (action: string) => void; orbit: (delta: number) => void; dispose: () => void }

// Everything in this scene is original geometry; there are no remote game assets.
export function createWorld(host: HTMLDivElement, publish: (state: Snapshot) => void): Controls {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.25
  host.appendChild(renderer.domElement)
  renderer.domElement.setAttribute('aria-label', '3D Hanuman temple courtyard')
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#b4d3d0')
  scene.fog = new THREE.FogExp2('#b4d3d0', .013)
  const camera = new THREE.PerspectiveCamera(50, 1, .1, 220)
  const keys = new Set<string>()
  const materials = new Map<string, THREE.MeshStandardMaterial>()
  function material(color: string, metalness = 0, roughness = .8) {
    const key = color + metalness + roughness
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, metalness, roughness }))
    return materials.get(key)!
  }
  const stone = material('#bfab85'), darkStone = material('#7b7768'), gold = material('#dcb45c', .72, .3)
  const saffron = material('#f18228'), skin = material('#dca16d'), charcoal = material('#253b3e')
  const glow = new THREE.MeshStandardMaterial({ color: '#ffe7a2', emissive: '#ffc35e', emissiveIntensity: 3 })
  const geometries: THREE.BufferGeometry[] = []
  function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
    geometries.push(geometry)
    const object = new THREE.Mesh(geometry, mat)
    object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true; parent.add(object)
    return object
  }
  function box(w: number, h: number, d: number, mat: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
    return mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z)
  }
  function sphere(r: number, mat: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
    return mesh(new THREE.SphereGeometry(r, 16, 12), mat, parent, x, y, z)
  }
  function cylinder(top: number, bottom: number, h: number, mat: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0, sides = 16) {
    return mesh(new THREE.CylinderGeometry(top, bottom, h, sides), mat, parent, x, y, z)
  }
  scene.add(new THREE.HemisphereLight('#d6edff', '#79614b', 2.2))
  const sun = new THREE.DirectionalLight('#ffe0ad', 3.4)
  sun.position.set(-22, 38, -18); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, far: 100 })
  sun.shadow.bias = -.0005; scene.add(sun)
  sphere(5, new THREE.MeshBasicMaterial({ color: '#fff1c9' }), scene, -65, 37, -100)
  // Hazy mountain silhouettes, lake and a raised carved sandstone court.
  const lake = box(350, .3, 350, material('#75aaa6', .3, .35), scene, 0, -8, 0)
  lake.receiveShadow = false
  for (let i = 0; i < 35; i++) {
    const angle = i / 35 * Math.PI * 2, radius = 85 + Math.sin(i * 9) * 15
    const mountain = cylinder(0, 15 + (i % 4) * 4, 28 + Math.sin(i * 4) * 16, material(i % 2 ? '#739d97' : '#91b2ab'), scene, Math.cos(angle) * radius, 0, Math.sin(angle) * radius, 5)
    mountain.rotation.y = i
  }
  box(46, 3, 46, darkStone, scene, 0, -1.65)
  box(45, .3, 45, stone, scene, 0, -.15)
  for (let x = -20; x <= 20; x += 4) for (let z = -20; z <= 20; z += 4) {
    box(3.93, .025, 3.93, material((x + z) % 8 === 0 ? '#b5a384' : '#c2b291'), scene, x, .015, z)
  }
  const mandala = mesh(new THREE.RingGeometry(5.7, 5.78, 80), gold, scene, 0, .045, 0)
  mandala.rotation.x = -Math.PI / 2
  const innerRing = mesh(new THREE.RingGeometry(3.6, 3.66, 64), gold, scene, 0, .05, 0); innerRing.rotation.x = -Math.PI / 2
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6
    const tile = box(.32, .035, 1.7, gold, scene, Math.sin(a) * 4.7, .04, Math.cos(a) * 4.7); tile.rotation.y = a
  }
  const obstacles: { x: number; z: number; r: number }[] = []
  const flags: THREE.Mesh[] = []
  function pillar(x: number, z: number) {
    obstacles.push({ x, z, r: 1.1 })
    box(2.2, .5, 2.2, darkStone, scene, x, .25, z)
    box(1.8, .35, 1.8, gold, scene, x, .65, z)
    cylinder(.55, .7, 5.6, stone, scene, x, 3.6, z, 8)
    for (const y of [1.3, 5.7, 6.1]) cylinder(.82, .82, .22, gold, scene, x, y, z, 8)
    box(2, .55, 2, stone, scene, x, 6.5, z)
    cylinder(.05, .95, 1.6, gold, scene, x, 7.5, z, 4)
    cylinder(.035, .035, 2.4, gold, scene, x, 9, z)
    const flag = box(1.9, .85, .025, saffron, scene, x + .95, 9.45, z); flags.push(flag)
  }
  for (const x of [-18, 18]) for (const z of [-17, -5, 7, 18]) pillar(x, z)
  for (const x of [-22, 22]) {
    box(.5, 1.1, 44, darkStone, scene, x, .55)
    for (let z = -21; z < 23; z += 3) box(.9, 1.6, .9, stone, scene, x, .8, z)
  }
  box(44, 1.1, .5, darkStone, scene, 0, .55, 22)
  // Sanctuary at the north end, with a stepped shikhara and golden finial.
  box(14, 1, 7, darkStone, scene, 0, .5, -21)
  for (let i = 0; i < 4; i++) box(11 - i * .8, .25, 2.5 - i * .45, stone, scene, 0, i * .25 + .1, -16.7 - i * .25)
  for (const x of [-5, 5]) { box(2.4, 7.2, 4.5, stone, scene, x, 4.4, -21); box(2.7, .4, 5, gold, scene, x, 7.8, -21) }
  box(8, 1.5, 4.5, stone, scene, 0, 7.4, -21)
  box(6, 6, .3, material('#233b3c'), scene, 0, 3.8, -23)
  for (let i = 0; i < 9; i++) box(10 - i * .85, .65, 6 - i * .47, i % 3 === 0 ? gold : stone, scene, 0, 8.5 + i * .65, -21)
  cylinder(0, .8, 2, gold, scene, 0, 15, -21)
  const shrineLight = new THREE.PointLight('#ffbe66', 25, 18); shrineLight.position.set(0, 3, -19); scene.add(shrineLight)
  for (const x of [-10, 10]) {
    cylinder(.4, .7, 1.8, darkStone, scene, x, .9, -15)
    sphere(.3, glow, scene, x, 2, -15)
    const light = new THREE.PointLight('#ff9f40', 10, 8); light.position.set(x, 2.4, -15); scene.add(light)
  }
  // Small flowering trees make the sanctuary feel alive and playful.
  for (const x of [-14, 14]) {
    cylinder(.8, 1, .65, stone, scene, x, .32, 16)
    cylinder(.13, .2, 2.7, material('#88664a'), scene, x, 1.8, 16)
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5
      sphere(.95, material(i % 2 ? '#689b6c' : '#82ad76'), scene, x + Math.sin(a) * .65, 3.1 + (i % 2) * .45, 16 + Math.cos(a) * .65)
      sphere(.14, material('#f5b895'), scene, x + Math.sin(a) * 1.3, 3.1, 16 + Math.cos(a) * 1.3)
    }
  }
  function character(hero: boolean) {
    const root = new THREE.Group(); scene.add(root)
    const body = new THREE.Group(); root.add(body)
    const flesh = hero ? skin : charcoal
    const torso = sphere(.6, flesh, body, 0, 1.5); torso.scale.set(hero ? .9 : 1, hero ? .95 : 1.2, .65)
    sphere(hero ? .26 : .37, flesh, body, -.55, 1.85); sphere(hero ? .26 : .37, flesh, body, .55, 1.85)
    cylinder(.4, .3, .35, hero ? saffron : material('#675772'), body, 0, .98)
    cylinder(.31, .51, .65, hero ? saffron : charcoal, body, 0, .63)
    const head = new THREE.Group(); head.position.y = hero ? 2.43 : 2.55; body.add(head)
    sphere(hero ? .59 : .35, flesh, head).scale.set(1, hero ? 1 : 1.12, .9)
    let tail: THREE.Mesh | null = null
    if (hero) {
      const cream = material('#ffe0ad'), eyeWhite = material('#fffaf0'), eyeDark = material('#422b23'), blush = material('#ef9b85')
      sphere(.37, cream, head, 0, -.19, .37).scale.set(1.13, .7, .65)
      for (const side of [-1, 1]) {
        sphere(.24, flesh, head, side * .57, -.01).scale.set(.8, 1, .7)
        sphere(.15, blush, head, side * .61, -.01, .12).scale.set(.7, 1, .35)
        sphere(.18, cream, head, side * .23, .06, .43).scale.set(1.15, 1.3, .65)
        sphere(.115, eyeDark, head, side * .23, .055, .54).scale.set(.9, 1.1, .5)
        sphere(.035, eyeWhite, head, side * .23 - .025, .1, .595)
        sphere(.09, blush, head, side * .37, -.17, .46).scale.set(1, .55, .25)
        const brow = mesh(new THREE.TorusGeometry(.145, .025, 6, 12, Math.PI * .7), flesh, head, side * .24, .23, .49)
        brow.rotation.z = .45
        cylinder(.08, .08, .1, gold, head, side * .62, -.25, .02)
      }
      sphere(.07, material('#a35f40'), head, 0, -.12, .61).scale.set(1.3, .65, .7)
      const smile = mesh(new THREE.TorusGeometry(.145, .022, 6, 16, Math.PI), eyeDark, head, 0, -.23, .595)
      smile.rotation.z = Math.PI
      cylinder(.34, .5, .18, gold, head, 0, .48)
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5
        const point = cylinder(0, .12, .35 + (i === 0 ? .12 : 0), gold, head, Math.sin(a) * .32, .72, Math.cos(a) * .32)
        point.rotation.z = -Math.sin(a) * .2
      }
      sphere(.09, material('#e75b34', .4), head, 0, .54, .47)
      box(.055, .21, .025, material('#fff4d7'), head, 0, .2, .54)
      box(.025, .15, .03, material('#e96836'), head, 0, .2, .56)
      cylinder(.5, .5, .12, gold, body, 0, 1.02)
      const sash = box(.19, 1.05, .055, saffron, body, 0, 1.58, .39); sash.rotation.z = -.55
      const necklace = mesh(new THREE.TorusGeometry(.37, .04, 8, 24, Math.PI), gold, body, 0, 1.78, .36); necklace.rotation.z = Math.PI
      sphere(.075, gold, body, 0, 1.4, .43)
      const tailCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1, -.25), new THREE.Vector3(.3, .5, -1), new THREE.Vector3(1.15, 1.15, -1.25), new THREE.Vector3(1.15, 2.05, -.9), new THREE.Vector3(.9, 2.35, -.8), new THREE.Vector3(.65, 2.2, -.75)])
      tail = mesh(new THREE.TubeGeometry(tailCurve, 28, .085, 8, false), flesh, body)
    } else {
      for (const x of [-.25, .25]) {
        const horn = cylinder(0, .12, .5, material('#a59686'), head, x, .39); horn.rotation.z = -x
        box(.085, .035, .03, glow, head, x * .52, .08, .325)
      }
    }
    const arms = [-1, 1].map(side => {
      const pivot = new THREE.Group(); pivot.position.set(side * .64, 1.82, 0); body.add(pivot)
      cylinder(.18, .14, .65, flesh, pivot, 0, -.25)
      sphere(.16, flesh, pivot, 0, -.58)
      cylinder(.14, .12, .48, flesh, pivot, 0, -.8)
      cylinder(.17, .17, .16, hero ? gold : material('#78848a', .5), pivot, 0, -.9)
      sphere(.15, flesh, pivot, 0, -1.08)
      return pivot
    })
    const legs = [-1, 1].map(side => {
      const pivot = new THREE.Group(); pivot.position.set(side * .24, .85, 0); body.add(pivot)
      cylinder(.2, .13, .67, flesh, pivot, 0, -.29)
      sphere(.15, flesh, pivot, 0, -.62)
      sphere(.18, flesh, pivot, 0, -.77, .12).scale.set(.8, .65, 1.4)
      return pivot
    })
    const weapon = new THREE.Group(); arms[1].add(weapon)
    // Offset and tilt the gada away from the shoulder: the handle stays in his fist.
    weapon.position.set(.05, -1.04, .13); weapon.rotation.z = hero ? -.75 : 0
    cylinder(.065, .065, 1.8, gold, weapon, 0, .55)
    for (let i = 0; i < 5; i++) cylinder(.08, .08, .045, saffron, weapon, 0, .05 + i * .1)
    sphere(.11, gold, weapon, 0, -.4)
    const mace = sphere(hero ? .47 : .23, hero ? gold : material('#7c8b89', .7), weapon, 0, 1.55)
    mace.scale.y = 1.12
    if (hero) {
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4
        cylinder(.032, .032, .65, gold, weapon, Math.sin(a) * .43, 1.55, Math.cos(a) * .43)
      }
      cylinder(.22, .22, .1, saffron, weapon, 0, 1.55)
      cylinder(.12, .25, .18, gold, weapon, 0, 2.1)
      sphere(.07, glow, weapon, 0, 2.23)
    }
    return { root, body, arms, legs, head, tail, weapon }
  }

  const player = character(true); player.root.position.set(0, 0, 14)
  const enemies = [[-8, 5], [8, 1], [-7, -9], [7, -12], [0, -7]].map(([x, z], i) => {
    const rig = character(false); rig.root.position.set(x, 0, z)
    const marker = mesh(new THREE.TorusGeometry(.42, .05, 8, 24), glow, rig.root, 0, 3.45)
    marker.rotation.x = Math.PI / 2; marker.visible = false
    const hpBar = box(.8, .065, .04, material('#f8b581'), rig.root, 0, 3.15)
    hpBar.visible = false
    return { ...rig, home: new THREE.Vector3(x, 0, z), hp: 3, maxHp: 3, boss: false, windup: 0, cooldown: 1 + i * .4, alert: false, marker, hpBar }

  })
  const bossRig = character(false); bossRig.root.scale.setScalar(1.65); bossRig.root.position.set(0, 0, -9); bossRig.root.visible = false
  const bossCrown = cylinder(.35, .5, .35, gold, bossRig.body, 0, 2.95)
  bossCrown.rotation.y = Math.PI / 4
  const bossMarker = mesh(new THREE.TorusGeometry(.6, .065, 8, 24), glow, bossRig.root, 0, 3.5)
  bossMarker.rotation.x = Math.PI / 2; bossMarker.visible = false
  const bossBar = box(1, .075, .04, material('#e8a3d5'), bossRig.root, 0, 3.2); bossBar.visible = false
  const boss = { ...bossRig, home: new THREE.Vector3(0, 0, -9), hp: 0, maxHp: 18, boss: true, windup: 0, cooldown: 3, alert: true, marker: bossMarker, hpBar: bossBar }
  enemies.push(boss)
  const dangerMaterial = new THREE.MeshBasicMaterial({ color: '#d8689d', transparent: true, opacity: 0, side: THREE.DoubleSide })
  const danger = mesh(new THREE.RingGeometry(.94, 1, 64), dangerMaterial, scene); danger.rotation.x = -Math.PI / 2
  let dangerTime = 0, dangerHit = false
  // Mango trails lead players off the direct route; pots reward exploration and combat.
  const mangoes = [[-4, 11], [-7, 9], [-11, 6], [4, 10], [8, 7], [12, 4], [-13, -2], [13, -4]].map(([x, z], i) => {
    const root = new THREE.Group(); root.position.set(x, .85, z); scene.add(root)
    sphere(.26, material('#ffc34f', .15, .4), root).scale.set(.9, 1.15, .8)
    const leaf = sphere(.13, material('#5a9d57'), root, .12, .27); leaf.scale.set(1.5, .35, .65); leaf.rotation.z = -.4
    return { root, collected: false, phase: i }
  })
  const pots = [[-12, 11], [12, 12], [-13, -5], [13, -7]].map(([x, z]) => {
    const root = new THREE.Group(); root.position.set(x, 0, z); scene.add(root)
    sphere(.48, material('#b96744'), root, 0, .55).scale.y = 1.15
    cylinder(.27, .32, .2, gold, root, 0, 1.04)
    cylinder(.3, .3, .07, material('#683c31'), root, 0, 1.17)
    cylinder(.43, .43, .12, saffron, root, 0, .6)
    return { root, broken: false }
  })
  const sparks = Array.from({ length: 64 }, () => ({ position: new THREE.Vector3(), velocity: new THREE.Vector3(), life: 0 }))
  const sparkGeometry = new THREE.BufferGeometry(); geometries.push(sparkGeometry)
  const sparkPositions = new Float32Array(sparks.length * 3); sparkPositions.fill(-100)
  sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3))
  const sparkMaterial = new THREE.PointsMaterial({ color: '#ffd98a', size: .14, transparent: true, opacity: .9 })
  const sparkCloud = new THREE.Points(sparkGeometry, sparkMaterial); sparkCloud.frustumCulled = false; scene.add(sparkCloud)
  let sparkIndex = 0
  function burst(position: THREE.Vector3, count = 16) {
    for (let i = 0; i < count; i++) {
      const spark = sparks[sparkIndex++ % sparks.length]; spark.position.copy(position); spark.position.y += 1
      spark.velocity.set((Math.random() - .5) * 6, 2 + Math.random() * 5, (Math.random() - .5) * 6); spark.life = .5 + Math.random() * .4
    }
  }
  const slashMaterial = new THREE.MeshBasicMaterial({ color: '#fff0b0', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  const slash = mesh(new THREE.RingGeometry(1.4, 1.7, 32, 1, 0, Math.PI * 1.5), slashMaterial, player.root, 0, 1.2)
  slash.rotation.x = -Math.PI / 2
  const seals = [[-11, -10], [11, -10], [0, -17]].map(([x, z]) => {
    cylinder(.85, 1.1, .45, darkStone, scene, x, .23, z)
    const ring = mesh(new THREE.TorusGeometry(.7, .055, 8, 48), gold, scene, x, 1.5, z)
    const orb = mesh(new THREE.OctahedronGeometry(.3), glow, scene, x, 1.5, z)
    const light = new THREE.PointLight('#ffc76d', 4, 5); light.position.set(x, 2, z); scene.add(light)
    return { ring, orb, light, collected: false }
  })
  const dustCount = 180, dustPositions = new Float32Array(dustCount * 3)
  for (let i = 0; i < dustCount; i++) { dustPositions[i * 3] = Math.random() * 48 - 24; dustPositions[i * 3 + 1] = Math.random() * 12; dustPositions[i * 3 + 2] = Math.random() * 48 - 24 }
  const dustGeometry = new THREE.BufferGeometry(); geometries.push(dustGeometry)
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
  const dustMaterial = new THREE.PointsMaterial({ color: '#fff0b0', size: .055, transparent: true, opacity: .65 })
  const dust = new THREE.Points(dustGeometry, dustMaterial); scene.add(dust)
  const shockMaterial = new THREE.MeshBasicMaterial({ color: '#ffe5a0', transparent: true, opacity: 0, side: THREE.DoubleSide })
  const shock = mesh(new THREE.RingGeometry(.8, 1, 64), shockMaterial, scene); shock.rotation.x = -Math.PI / 2
  let status: Status = 'ready', health = 100, collected = 0, elapsed = 0, orbit = 0, height = 0, velocity = 0
  let mangoCount = 0, score = 0, energy = 0, streak = 0, streakUntil = 0, bossAwake = false, spin = 0
  let attack = 0, attackCooldown = 0, leapCooldown = 0, invincible = 0, shockTime = 0, combo = 0
  let message = 'Awaken the three sacred seals and restore the sanctuary.', messageUntil = 0, last = 0, lastPublish = 0
  let previousStatus: Status = 'playing'
  const target = new THREE.Vector3(), move = new THREE.Vector3(), cameraGoal = new THREE.Vector3()
  camera.position.set(0, 7, 25)
  const snapshot = (): Snapshot => ({ health, seals: collected, enemies: enemies.filter(e => !e.boss && e.hp > 0).length, status, message, leap: leapCooldown, x: player.root.position.x, z: player.root.position.z, height, mangoes: mangoCount, score, energy, streak, bossHealth: boss.hp, bossMax: boss.maxHp, bossAwake })
  function announce(text: string) { message = text; messageUntil = elapsed + 3 }
  function damageEnemy(enemy: typeof enemies[number], amount: number) {
    if (enemy.hp <= 0) return
    enemy.hp = Math.max(0, enemy.hp - amount); enemy.alert = true
    energy = Math.min(100, energy + 12); streak++; streakUntil = elapsed + 4
    score += 25 * Math.min(streak, 5)
    burst(enemy.root.position); enemy.hpBar.visible = enemy.hp > 0; enemy.hpBar.scale.x = enemy.hp / enemy.maxHp
    if (!enemy.boss) { enemy.windup = 0; enemy.cooldown = 1.1; enemy.marker.visible = false }
    const push = enemy.root.position.clone().sub(player.root.position).setY(0).normalize().multiplyScalar(enemy.boss ? .25 : 1.1)
    enemy.root.position.add(push)
    if (!enemy.hp) { enemy.root.visible = false; score += enemy.boss ? 1000 : 100; burst(enemy.root.position, 28) }
  }
  function action(name: string) {
    if (name === 'start') { if (status === 'ready') { status = 'playing'; player.root.rotation.y = Math.PI } publish(snapshot()); return }
    if (name === 'pause') { if (status === 'playing') { previousStatus = status; status = 'paused' } else if (status === 'paused') status = previousStatus; keys.clear(); publish(snapshot()); return }
    if (status !== 'playing') return
    if (name === 'jump' && height === 0) { velocity = 10; announce('Son of the Wind') }
    if (name === 'leap' && leapCooldown <= 0 && height === 0) { velocity = 17; leapCooldown = 8; shockTime = .65; shock.position.copy(player.root.position).setY(.08); announce('VAYU LEAP · Land beside an enemy to strike') }
    if (name === 'spin') {
      if (energy < 100) { announce('Collect mangoes and land strikes to charge your Gada Storm.'); return }
      energy = 0; spin = .85; attackCooldown = .85; invincible = 1
      shockTime = .65; shock.position.copy(player.root.position).setY(.08)
      enemies.filter(e => e.hp > 0 && e.root.position.distanceTo(player.root.position) < 6.5).forEach(e => damageEnemy(e, 4))
      announce('GADA STORM · A whirlwind of golden light!')
    }
    if (name === 'attack' && attackCooldown <= 0) {
      attack = .5; attackCooldown = .56; combo = (combo + 1) % 3
      const nearby = enemies.filter(e => e.hp > 0 && e.root.position.distanceTo(player.root.position) < (e.boss ? 5.2 : 3.6)).sort((a, b) => a.root.position.distanceToSquared(player.root.position) - b.root.position.distanceToSquared(player.root.position))
      for (const pot of pots) {
        if (!pot.broken && pot.root.position.distanceTo(player.root.position) < 3.2) {
          pot.broken = true; pot.root.visible = false; burst(pot.root.position)
          mangoCount++; score += 75; energy = Math.min(100, energy + 25); health = Math.min(100, health + 10)
          announce('Mango surprise! +10 vitality · +25 storm energy')
        }
      }
      if (nearby[0]) {
        const enemy = nearby[0], delta = enemy.root.position.clone().sub(player.root.position)
        player.root.rotation.y = Math.atan2(delta.x, delta.z)
        damageEnemy(enemy, combo === 0 ? 2 : 1); announce(combo === 0 ? 'GADA STRIKE · Heavy finish' : 'GADA STRIKE')
      }
    }
    if (name === 'interact') {
      const seal = seals.find(s => !s.collected && s.orb.position.clone().setY(0).distanceTo(player.root.position.clone().setY(0)) < 2.8)
      if (!seal) { announce('Approach a golden seal to awaken it.'); return }
      if (enemies.some(e => e.hp > 0 && e.root.position.distanceTo(seal.orb.position) < 6)) { announce('Defeat the guardians near this seal first.'); return }
      if (collected === 2 && enemies.some(e => !e.boss && e.hp > 0)) { announce('Defeat the remaining shadow guardians before the final seal.'); return }
      seal.collected = true; collected++; seal.light.intensity = 0; seal.orb.visible = false; seal.ring.visible = false
      health = Math.min(100, health + 20); score += 250; burst(seal.orb.position); announce('Sacred seal awakened · Vitality restored')
      if (collected === 3) {
        bossAwake = true; boss.hp = boss.maxHp; boss.root.visible = true; boss.root.position.set(0, 0, -6)
        health = 100; energy = 100; burst(boss.root.position, 40)
        announce('THE STORM GUARDIAN AWAKENS · Jump over the pink shockwaves!')
      }
    }
    publish(snapshot())
  }
  function clear() { keys.clear() }
  function visibility() { clear(); if (document.hidden && status === 'playing') action('pause') }
  window.addEventListener('blur', clear); document.addEventListener('visibilitychange', visibility)
  const resize = new ResizeObserver(() => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix() }); resize.observe(host)
  renderer.setAnimationLoop((now: number) => {
    const dt = last ? Math.min((now - last) / 1000, .04) : 0; last = now
    if (status === 'playing') {
      elapsed += dt; spin = Math.max(0, spin - dt); if (elapsed > streakUntil) streak = 0; attack = Math.max(0, attack - dt); attackCooldown -= dt; leapCooldown = Math.max(0, leapCooldown - dt); invincible -= dt
      if (keys.has('q')) orbit += dt * 1.7
      if (keys.has('e')) orbit -= dt * 1.7
      const x = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'))
      const z = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'))
      move.set(x, 0, z).normalize().applyAxisAngle(THREE.Object3D.DEFAULT_UP, orbit)
      const running = keys.has('shift'), speed = (running ? 9 : 5) * (spin > 0 ? 1.3 : attack > 0 ? .35 : 1)
      const p = player.root.position
      p.addScaledVector(move, dt * speed)
      p.x = THREE.MathUtils.clamp(p.x, -20.6, 20.6); p.z = THREE.MathUtils.clamp(p.z, -18.5, 20.6)
      for (const o of obstacles) { const dx = p.x - o.x, dz = p.z - o.z, distance = Math.hypot(dx, dz); if (distance < o.r + .5 && height < 6) { p.x = o.x + (dx / (distance || 1)) * (o.r + .5); p.z = o.z + (dz / (distance || 1)) * (o.r + .5) } }
      if (move.lengthSq() && attack <= 0 && spin <= 0) {
        const goal = Math.atan2(move.x, move.z), difference = Math.atan2(Math.sin(goal - player.root.rotation.y), Math.cos(goal - player.root.rotation.y))
        player.root.rotation.y += difference * Math.min(1, dt * 13)
      }
      const wasAirborne = height > 0
      velocity -= dt * 23; height = Math.max(0, height + velocity * dt)
      if (height === 0) { if (wasAirborne && leapCooldown > 5) { shockTime = .65; shock.position.copy(p).setY(.08); enemies.filter(e => e.hp > 0 && e.root.position.distanceTo(p) < 5).forEach(e => damageEnemy(e, 2)); announce('VAYU IMPACT') } velocity = 0 }
      p.y = height
      const stride = Math.sin(elapsed * (running ? 15 : 10)) * (move.lengthSq() ? .7 : .025)
      player.legs[0].rotation.x = height > .1 ? -.65 : stride; player.legs[1].rotation.x = height > .1 ? .5 : -stride
      player.arms[0].rotation.x = -stride * .65; player.arms[1].rotation.x = attack > 0 ? -Math.sin((.5 - attack) * Math.PI * 2) * 2.4 : stride * .6 - .15
      player.arms[1].rotation.z = spin > 0 ? -1.3 : attack > 0 ? -.85 : -.2
      player.weapon.rotation.x = attack > 0 ? Math.sin((.5 - attack) * Math.PI * 2) * .9 : 0
      slashMaterial.opacity = spin > 0 ? .7 : attack > 0 ? Math.sin(attack / .5 * Math.PI) * .65 : 0
      slash.rotation.z = elapsed * (spin > 0 ? 22 : 14)
      slash.scale.setScalar(spin > 0 ? 2.2 : 1)
      player.head.rotation.z = move.lengthSq() ? Math.sin(elapsed * 7) * .06 : Math.sin(elapsed * 2) * .035
      if (player.tail) player.tail.rotation.y = Math.sin(elapsed * 4) * .12
      if (spin > 0) player.root.rotation.y += dt * 19
      player.body.rotation.y = attack > 0 ? Math.sin((.5 - attack) * Math.PI * 2) * .45 : 0
      player.body.rotation.x = move.lengthSq() && running ? .12 : height > .1 ? -.12 : 0
      player.body.position.y = height > 0 ? 0 : Math.abs(stride) * .06 + Math.sin(elapsed * 2) * .025
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue
        const delta = p.clone().sub(enemy.root.position).setY(0), distance = delta.length()
        if (distance < 6.5 || enemy.boss) enemy.alert = true
        enemy.cooldown -= dt
        if (enemy.alert) {
          enemy.root.rotation.y = Math.atan2(delta.x, delta.z)
          if (distance > (enemy.boss ? 4 : 2) && !enemy.windup) {
            enemy.root.position.addScaledVector(delta.normalize(), dt * (enemy.boss ? 1.6 : 2.3))
            enemy.legs[0].rotation.x = Math.sin(elapsed * 9) * .55; enemy.legs[1].rotation.x = -enemy.legs[0].rotation.x
          }
          if (distance < (enemy.boss ? 14 : 2.7) && enemy.cooldown <= 0 && !enemy.windup) enemy.windup = enemy.boss ? 1.3 : .85
          if (enemy.windup > 0) {
            enemy.windup -= dt; enemy.marker.visible = true; enemy.arms[1].rotation.x = -2.3
            if (enemy.windup <= 0) {
              if (enemy.boss) {
                dangerTime = 1.25; dangerHit = false; danger.position.copy(enemy.root.position).setY(.09)
                announce('STORM WAVE · Jump over the pink ring!')
              }
              if (!enemy.boss && distance < 3.1 && height < 1.2 && invincible <= 0) { health = Math.max(0, health - (keys.has('c') ? 3 : 13)); invincible = .6; if (!keys.has('c')) streak = 0; announce(keys.has('c') ? 'Blocked · Reduced damage' : 'Incoming strike · Hold C to guard or leap away') }
              enemy.windup = 0; enemy.cooldown = enemy.boss ? 3.4 : 1.7; enemy.marker.visible = false; enemy.arms[1].rotation.x = 0
            }
          }
        } else {
          enemy.root.position.x = enemy.home.x + Math.sin(elapsed * .7 + enemy.home.z) * 1.2
          enemy.root.rotation.y = Math.cos(elapsed * .35 + enemy.home.z)
        }
        enemy.root.position.x = THREE.MathUtils.clamp(enemy.root.position.x, -20, 20)
        enemy.root.position.z = THREE.MathUtils.clamp(enemy.root.position.z, -18, 20)
      }
      player.arms[0].rotation.x = keys.has('c') ? -1.5 : player.arms[0].rotation.x
      for (const mango of mangoes) {
        if (mango.collected) continue
        mango.root.rotation.y += dt * 1.8; mango.root.position.y = .9 + Math.sin(elapsed * 3 + mango.phase) * .18
        if (mango.root.position.distanceTo(p.clone().add(new THREE.Vector3(0, 1, 0))) < 1.2) {
          mango.collected = true; mango.root.visible = false; mangoCount++; score += 50; energy = Math.min(100, energy + 20); health = Math.min(100, health + 8)
          burst(mango.root.position, 10); announce('Sweet mango! +8 vitality · +20 storm energy')
        }
      }
      if (dangerTime > 0) {
        dangerTime = Math.max(0, dangerTime - dt)
        const radius = 1 + (1.25 - dangerTime) * 12
        danger.scale.setScalar(radius); dangerMaterial.opacity = dangerTime * .7
        const distance = Math.hypot(p.x - danger.position.x, p.z - danger.position.z)
        if (!dangerHit && Math.abs(distance - radius) < 1 && height < 1 && invincible <= 0) {
          health = Math.max(0, health - (keys.has('c') ? 9 : 22)); dangerHit = true; invincible = .7; streak = 0
          announce('Jump as the pink wave reaches you!')
        }
      } else dangerMaterial.opacity = 0
      sparks.forEach((spark, i) => {
        if (spark.life > 0) { spark.life -= dt; spark.velocity.y -= dt * 9; spark.position.addScaledVector(spark.velocity, dt) }
        sparkPositions[i * 3] = spark.life > 0 ? spark.position.x : -100
        sparkPositions[i * 3 + 1] = spark.life > 0 ? spark.position.y : -100
        sparkPositions[i * 3 + 2] = spark.life > 0 ? spark.position.z : -100
      })
      sparkGeometry.attributes.position.needsUpdate = true
      if (health <= 0) status = 'lost'
      if (bossAwake && boss.hp <= 0 && health > 0) status = 'won'
      if (elapsed > messageUntil) message = bossAwake ? 'Defeat the Storm Guardian · L unleashes Gada Storm · Jump over pink waves' : enemies.some(e => e.hp > 0 && e.windup > 0) ? 'Incoming attack · Hold C to guard' : 'Defeat the guardians. Approach each golden seal and press F.'
      for (const seal of seals) { seal.orb.rotation.y += dt; seal.orb.position.y = 1.5 + Math.sin(elapsed * 2) * .15; seal.ring.rotation.y += dt * .5 }
      shockTime = Math.max(0, shockTime - dt); shock.scale.setScalar(1 + (.65 - shockTime) * 9); shockMaterial.opacity = shockTime
      flags.forEach((flag, i) => { flag.rotation.y = Math.sin(elapsed * 3 + i) * .15 })
      dust.rotation.y += dt * .006
    }
    target.copy(player.root.position).add(new THREE.Vector3(0, 2.2, 0))
    cameraGoal.set(Math.sin(orbit) * 13, 5.8, Math.cos(orbit) * 13).add(player.root.position)
    camera.position.lerp(cameraGoal, 1 - Math.exp(-dt * 5)); camera.lookAt(target)
    renderer.render(scene, camera)
    if (now - lastPublish > 100) { publish(snapshot()); lastPublish = now }
  })
  publish(snapshot())
  return { keys, action, orbit(delta) { orbit += delta }, dispose() {
    renderer.setAnimationLoop(null); resize.disconnect(); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', visibility)
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); glow.dispose(); dustMaterial.dispose(); shockMaterial.dispose(); dangerMaterial.dispose(); slashMaterial.dispose(); sparkMaterial.dispose(); sun.shadow.dispose()
    scene.traverse(object => { if (object instanceof THREE.Mesh) { const mats = Array.isArray(object.material) ? object.material : [object.material]; mats.forEach(m => m.dispose()) } })
    renderer.dispose(); renderer.domElement.remove()
  } }
}
