import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import Bullet from './Bullet';

export default class BlasterScene extends THREE.Scene {
  private readonly mtlLoader = new MTLLoader();
  private readonly objLoader = new OBJLoader();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly keyDown = new Set<string>();
  private blaster?: THREE.Group;
  private bulletMtl?: MTLLoader.MaterialCreator;
  private directionVector = new THREE.Vector3();
  private bullets: Bullet[] = [];
  private targets: THREE.Group[] = [];
  private floor?: THREE.Mesh;

  constructor(camera: THREE.PerspectiveCamera) {
    super();
    this.camera = camera;
  }

  async initialize() {
    // Boden erstellen
    this.createFloor();

    // Targets laden und hinzufügen
    const targetMtl = await this.mtlLoader.loadAsync('assets/targetA.mtl');
    targetMtl.preload();
    this.bulletMtl = await this.mtlLoader.loadAsync('assets/foamBulletB.mtl');
    this.bulletMtl.preload();

    const t1 = await this.createTarget(targetMtl);
    t1.position.set(1, 0, 0);
    this.add(t1);
    this.targets.push(t1);

    // Blaster erstellen und zur Szene hinzufügen
    this.blaster = await this.createBlaster();
    this.add(this.blaster);

    // Kamera zum Blaster hinzufügen und positionieren
    this.blaster.position.z = 3;
    this.blaster.add(this.camera);
    this.camera.position.set(0, 0.5, 1);

    // Licht hinzufügen
    const light = new THREE.DirectionalLight(0xFFFFFF, 1);
    light.position.set(0, 4, 2);
    this.add(light);

    // Event-Listener für Tastatureingaben
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  private createFloor() {
	const blockSize = 2; // Größe jedes Blocks
	const gridSize = 100; // Gesamtgröße des Bodens
	const halfGridSize = gridSize / 2;
  
	// Farben für die Blöcke
	const color1 = new THREE.Color(0x228B22); // Grün
	const color2 = new THREE.Color(0x8B4513); // Braun
  
	// Geometrie für einen Block
	const geometry = new THREE.PlaneGeometry(blockSize, blockSize);
	
	for (let i = -halfGridSize; i < halfGridSize; i += blockSize) {
	  for (let j = -halfGridSize; j < halfGridSize; j += blockSize) {
		// Zufällig eine der beiden Farben wählen
		const color = Math.random() < 0.5 ? color1 : color2;
  
		// Material mit der ausgewählten Farbe erstellen
		const material = new THREE.MeshStandardMaterial({ color });
		
		// Block erstellen
		const block = new THREE.Mesh(geometry, material);
		block.position.set(i + blockSize / 2, 0, j + blockSize / 2);
		block.rotation.x = -Math.PI / 2;
		block.receiveShadow = true;
  
		// Block zur Szene hinzufügen
		this.add(block);
	  }
	}
  }
  
  

  private handleKeyDown = (event: KeyboardEvent) => {
    this.keyDown.add(event.key.toLowerCase());
  }

  private handleKeyUp = (event: KeyboardEvent) => {
    this.keyDown.delete(event.key.toLowerCase());

    if (event.key === ' ') {
      this.createBullet();
    }
  }

  private updateInput() {
    if (!this.blaster) return;

    const shiftKey = this.keyDown.has('shift');
    const speed = 0.1;

    if (!shiftKey) {
      if (this.keyDown.has('a') || this.keyDown.has('arrowleft')) {
        this.blaster.rotateY(0.02);
      } else if (this.keyDown.has('d') || this.keyDown.has('arrowright')) {
        this.blaster.rotateY(-0.02);
      }
    }

    const dir = this.directionVector;
    this.camera.getWorldDirection(dir);

    if (this.keyDown.has('w') || this.keyDown.has('arrowup')) {
      this.blaster.position.add(dir.clone().multiplyScalar(speed));
    } else if (this.keyDown.has('s') || this.keyDown.has('arrowdown')) {
      this.blaster.position.add(dir.clone().multiplyScalar(-speed));
    }

    if (shiftKey) {
      const strafeDir = dir.clone();
      const upVector = new THREE.Vector3(0, 1, 0);

      if (this.keyDown.has('a') || this.keyDown.has('arrowleft')) {
        this.blaster.position.add(
          strafeDir.applyAxisAngle(upVector, Math.PI * 0.5).multiplyScalar(speed)
        );
      } else if (this.keyDown.has('d') || this.keyDown.has('arrowright')) {
        this.blaster.position.add(
          strafeDir.applyAxisAngle(upVector, Math.PI * -0.5).multiplyScalar(speed)
        );
      }
    }
  }

  private async createTarget(mtl: MTLLoader.MaterialCreator) {
	this.objLoader.setMaterials(mtl);
  
	// Laden des OBJ-Modells
	const modelRoot = await this.objLoader.loadAsync('assets/targetA.obj');
  
	// Zurücksetzen aller bisherigen Transformationen des Modells
	modelRoot.rotation.set(0, 0, 0);
	modelRoot.position.set(0, 0, 0);
	modelRoot.scale.set(1, 1, 1);
  
	// Optional: Modell rotieren, falls nötig
	modelRoot.rotateY(Math.PI * 0.5);
  
	// Debug: Box3 zum Überprüfen der Bounds
	const boundingBox = new THREE.Box3().setFromObject(modelRoot);
	console.log('Bounding Box:', boundingBox);
  
	// Berechnung des Verschiebungswerts basierend auf der Bounding Box
	const center = boundingBox.getCenter(new THREE.Vector3());
	const yOffset = 1 - center.y; // Höhe auf 1 setzen
  
	// Positionierung des Targets auf y = 1
	modelRoot.position.set(0, yOffset, 0);
  
	// Debug: Überprüfen der finalen Position
	console.log('Final Position:', modelRoot.position);
  
	return modelRoot;
  }
  
  
  
  

  private async createBlaster() {
    const mtl = await this.mtlLoader.loadAsync('assets/blasterG.mtl');
    mtl.preload();
    this.objLoader.setMaterials(mtl);
    const modelRoot = await this.objLoader.loadAsync('assets/blasterG.obj');
    return modelRoot;
  }

  private async createBullet() {
    if (!this.blaster || !this.bulletMtl) return;

    this.objLoader.setMaterials(this.bulletMtl);
    const bulletModel = await this.objLoader.loadAsync('assets/foamBulletB.obj');

    this.camera.getWorldDirection(this.directionVector);
    const aabb = new THREE.Box3().setFromObject(this.blaster);
    const size = aabb.getSize(new THREE.Vector3());

    const vec = this.blaster.position.clone();
    vec.y += 0.06;

    bulletModel.position.add(
      vec.add(
        this.directionVector.clone().multiplyScalar(size.z * 0.5)
      )
    );

    bulletModel.children.forEach(child => child.rotateX(Math.PI * -0.5));
    bulletModel.rotation.copy(this.blaster.rotation);

    this.add(bulletModel);

    const b = new Bullet(bulletModel);
    b.setVelocity(
      this.directionVector.x * 0.2,
      this.directionVector.y * 0.2,
      this.directionVector.z * 0.2
    );

    this.bullets.push(b);
  }

  private updateBullets() {
    for (let i = 0; i < this.bullets.length; ++i) {
      const b = this.bullets[i];
      b.update();

      if (b.shouldRemove) {
        this.remove(b.group);
        this.bullets.splice(i, 1);
        i--;
      } else {
        for (let j = 0; j < this.targets.length; ++j) {
          const target = this.targets[j];
          if (target.position.distanceToSquared(b.group.position) < 0.05) {
            this.remove(b.group);
            this.bullets.splice(i, 1);
            i--;
            target.visible = false;
            setTimeout(() => {
              target.visible = true;
            }, 1000);
          }
        }
      }
    }
  }

  update() {
    this.updateInput();
    this.updateBullets();
  }
}
