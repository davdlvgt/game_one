import * as THREE from 'three'

export default class BaseGround extends THREE.Scene {

	private readonly camera: THREE.PerspectiveCamera;
    private readonly renderer: THREE.WebGLRenderer;
    private readonly floor: THREE.Mesh;

    constructor(camera: THREE.PerspectiveCamera)
	{
		super();
		this.camera = camera;

		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.renderer.domElement);

		const geometry = new THREE.PlaneGeometry(100, 100);
		const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
		this.floor = new THREE.Mesh(geometry, material);
		this.add(this.floor);

		const light = new THREE.PointLight(0xffffff, 1, 100);
		light.position.set(10, 10, 10);
		this.add(light);

		this.animate();

		window.addEventListener('resize', this.onWindowResize.bind(this));
	}

	private onWindowResize(): void {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	private animate(): void {
		requestAnimationFrame(this.animate.bind(this));
		this.renderer.render(this, this.camera);
	}
    
}
