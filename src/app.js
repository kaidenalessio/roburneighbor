const Global = {
	getRatio() {
		return {
			w: Stage.w / 1280,
			h: Stage.h / 720
		};
	},
	FONT_SIZE: 58,
	BOX_SCALE: 2,
	BOX_WIDTH: 80,
	BOX_HEIGHT: 80,
	NUMBER_OF_BOX: 30,
	BOX_COLORS: [
		C.aliceBlue, C.bisque, C.cornflowerBlue, C.cornsilk, C.darkOrchid, C.deepSkyBlue,
		C.dodgerBlue, C.darkViolet, C.floralWhite, C.greenYellow, C.lawnGreen, C.lightSkyBlue,
		C.mediumVioletRed, C.orangeRed, C.orchid, C.papayaWhip, C.peru, C.paleGreen, C.salmon,
		C.seaGreen, C.slateBlue, C.royalBlue, C.sienna, C.tomato, C.sandyBrown, C.turquoise,
		C.thistle, C.rosyBrown, C.pink, C.plum
	],
	GRID: {
		COLS: 6,
		ROWS: 5
	},
	onInit() {
		const ratio = this.getRatio();
		this.BOX_WIDTH *= ratio.w;
		this.BOX_HEIGHT = this.BOX_WIDTH;
		this.FONT_SIZE *= ratio.w;
	}
};

const makeRect = (x, y, w, h) => {
	return { x, y, w, h };
};

const rectIntersects = (rectA, rectB) => {
	return rectA.x <= rectB.x + rectB.w && rectA.x + rectA.w >= rectB.x
		&& rectA.y <= rectB.y + rectB.h && rectA.y + rectA.h >= rectB.y;
};

const rectContainsPoint = (rect, p) => {
	return p.x >= rect.x && p.x < rect.x + rect.w
		&& p.y >= rect.y && p.y < rect.y + rect.h;
};

const drawPresent = (xCenter, yCenter, width, height, boxColor) => {
	Draw.ctx.save();
	const w = width;
	const h = height;
	const x = xCenter - w / 2;
	const y = yCenter - h / 2;
	const wrapWidth = h / 10;
	// box bottom border
	Draw.setColor(C.black);
	Draw.roundRect(x + 0.5, y + 3, w - 1, h);
	// box
	Draw.setColor(boxColor);
	Draw.roundRect(x, y, w, h);
	// wrap
	Draw.setColor(C.gold);
	Draw.rect(x, yCenter - wrapWidth / 2, w, wrapWidth);
	Draw.rect(xCenter - wrapWidth / 2, y, wrapWidth, h);
	// box outline
	Draw.ctx.lineWidth = 2;
	Draw.setColor(C.black);
	Draw.roundRect(x, y, w, h, 10, true);
	Draw.ctx.lineWidth = 1;
};

const resizeInputByValue = (e) => {
	e.size = e.value.length + 1;
};

const createNameInput = (translateX, translateY, textAlign, value, edges={}) => {
	const input = document.createElement('input');
	input.setAttribute('type', 'text');
	input.setAttribute('value', value);
	if (edges.top) input.style.top = edges.top;
	if (edges.left) input.style.left = edges.left;
	if (edges.right) input.style.right = edges.right;
	if (edges.bottom) input.style.bottom = edges.bottom;
	input.style.transform = `translate(${translateX}%, ${translateY}%)`;
	input.style.fontSize = `${Math.floor(Global.FONT_SIZE * 0.7) + 1}px`;
	input.style.textAlign = textAlign;
	input.onkeydown = input.onkeyup = () => resizeInputByValue(input);
	document.getElementById('nameInputs').appendChild(input);
	return input;
};

Manager.setup({
	methods: {
		getGridWorldPos(index) {
			const i = index % Global.GRID.COLS;
			const j = Math.floor(index / Global.GRID.COLS);
			return {
				x: this.grid.xOffset + (Global.BOX_WIDTH + this.grid.paddingX) * i,
				y: this.grid.yOffset + (Global.BOX_HEIGHT + this.grid.paddingY) * j
			};
		},
		inputInCanvas() {
			return Input.x >= 0 && Input.x < Stage.w
				&& Input.y >= 0 && Input.y < Stage.h;
		},
		getInputHold() {
			if (Input.keys[Input.SPACE].held) {
				return true;
			}
			return Input.anyKeyHold()/* && this.inputInCanvas()*/;
		},
		getInputDown() {
			if (Input.anyKeyDown()) {
				if (this.isEditMode) {
					return false;
				}
				if (Input.keys[Input.SPACE].pressed) {
					return true;
				}
				// else if (this.inputInCanvas()) {
					return true;
				// }
			}
			return false;
		},
		getHoveredBox() {
			const sortedBoxes = this.boxes.slice();
			sortedBoxes.sort((a, b) => a.depth - b.depth);
			for (const box of sortedBoxes) {
				const w = Global.BOX_WIDTH;
				const h = Global.BOX_HEIGHT;
				const x = box.x - w / 2;
				const y = box.y - h / 2;
				const rect = makeRect(x, y, w, h);
				if (rectContainsPoint(rect, Input.position)) {
					return box;
				}
			}
			return null;
		},
		toggleEditMode() {
			this.isEditMode = !this.isEditMode;
			if (this.isEditMode) {
				for (const input of this.nameInputs) {
					input.disabled = false;
				}
			}
			else {
				for (const input of this.nameInputs) {
					input.disabled = true;
				}
			}
		},
		initGrid() {
			const gridWidth = (Global.GRID.COLS - 1) * (Global.BOX_WIDTH + this.grid.paddingX);
			const gridHeight = (Global.GRID.ROWS - 1) * (Global.BOX_HEIGHT + this.grid.paddingY);
			this.grid.xOffset = Stage.mid.w - gridWidth / 2;
			this.grid.yOffset = Stage.mid.h - gridHeight / 2;
		},
		initBoxes() {
			const colors = Math.shuffle(Global.BOX_COLORS);
			for (let i = 0; i < Global.NUMBER_OF_BOX; i++) {
				const pos = this.getGridWorldPos(i);
				this.boxes.push({
					id: i,
					x: pos.x,
					y: pos.y,
					depth: 0
				});
				const canvas = Draw.createCanvas(Global.BOX_WIDTH * Global.BOX_SCALE * 1.2, Global.BOX_HEIGHT * Global.BOX_SCALE * 1.2, (w, h) => {
					Draw.ctx.scale(Global.BOX_SCALE, Global.BOX_SCALE);
					drawPresent(w / 2 / Global.BOX_SCALE, h / 2 / Global.BOX_SCALE, Global.BOX_WIDTH, Global.BOX_HEIGHT, colors[i % colors.length]);
				});
				this.presents.push(canvas);
			}
		},
		initNameInputs() {
			this.nameInputs.push(createNameInput(-50, 0, Align.c, 'Name 1', { top: '15px', left: '20%' }));
			this.nameInputs.push(createNameInput(-50, 0, Align.c, 'Name 2', { top: '15px', left: '50%' }));
			this.nameInputs.push(createNameInput(-50, 0, Align.c, 'Name 3', { top: '15px', left: '80%' }));

			this.nameInputs.push(createNameInput(0, -50, Align.r, 'Name 4', { top: '30%', right: '20px' }));
			this.nameInputs.push(createNameInput(0, -50, Align.r, 'Name 5', { top: '70%', right: '20px' }));

			this.nameInputs.push(createNameInput(-50, 0, Align.c, 'Name 6', { bottom: '15px', left: '80%' }));
			this.nameInputs.push(createNameInput(-50, 0, Align.c, 'Name 7', { bottom: '15px', left: '50%' }));
			this.nameInputs.push(createNameInput(-50, 0, Align.c, 'Name 8', { bottom: '15px', left: '20%' }));

			this.nameInputs.push(createNameInput(0, -50, Align.l, 'Name 9', { top: '70%', left: '20px' }));
			this.nameInputs.push(createNameInput(0, -50, Align.l, 'Name 10', { top: '30%', left: '20px' }));

			for (const input of this.nameInputs) {
				input.onkeydown();
			}
		}
	},
	onSetup() {
		// global variables
		this.isEditMode = false;

		this.grid = {
			paddingX: 20,
			paddingY: 20
		};

		this.boxes = [];
		this.presents = [];
		this.nameInputs = [];

		this.dragTime = 0;
		this.draggedBox = null;
		this.isDragging = false;
	},
	onInit() {
		Global.onInit();
		Font.generate('boxText', Global.FONT_SIZE);
		this.initGrid();
		this.initBoxes();
		this.initNameInputs();

		this.isEditMode = true;
		this.toggleEditMode();
	},
	onUpdate() {
		// --- Drag and Drop ---
		if (this.isDragging) {
			this.dragTime += Time.clampedDeltaTime;
			if (this.isEditMode || this.draggedBox === null) {
				this.isDragging = false;
			}
			else {
				if (this.getInputHold()) {
					this.draggedBox.x += 0.5 * (Input.x /*+ this.dragOffsetX*/ - this.draggedBox.x);
					this.draggedBox.y += 0.5 * (Input.y /*+ this.dragOffsetY*/ - this.draggedBox.y);
				}
				else {
					this.isDragging = false;
				}
			}
		}
		else {
			this.draggedBox = null;
			if (this.getInputDown()) {
				this.draggedBox = this.getHoveredBox();
				if (this.draggedBox !== null) {
					let lowestDepth = 0;
					for (const box of this.boxes) {
						if (box.depth < lowestDepth) {
							lowestDepth = box.depth;
						}
					}
					this.draggedBox.depth = lowestDepth - 1;
					// this.dragOffsetX = this.draggedBox.x - Input.x;
					// this.dragOffsetY = this.draggedBox.y - Input.y;
					this.isDragging = true;
					this.dragTime = 0;
				}
			}
		}
	},
	onRender() {
		// --- Render Boxes ---
		Draw.setFont(Font.boxText);
		Draw.setColor(C.white, C.black);
		Draw.setHVAlign(Align.c, Align.m);
		Draw.ctx.lineWidth = 2;
		const sortedBoxes = this.boxes.slice();
		sortedBoxes.sort((a, b) => b.depth - a.depth);
		for (const box of sortedBoxes) {
			let isDragged = false;
			if (!this.isEditMode && this.isDragging && this.draggedBox !== null) {
				if (this.draggedBox.id === box.id) {
					isDragged = true;
				}
			}
			const boxScale = 1 / Global.BOX_SCALE;
			if (isDragged) {
				const t = Math.sin(this.dragTime * 0.1);
				const angle = t * Math.PI * 0.01;
				Draw.onTransform(box.x, box.y, 1.1, 1.1, angle, () => {
					Draw.image(this.presents[box.id], 0, 0, boxScale, boxScale);
					Draw.textWithOutline(0, 0, box.id + 1);
				});
			}
			else {
				Draw.image(this.presents[box.id], box.x, box.y, boxScale, boxScale);
				Draw.textWithOutline(box.x, box.y, box.id + 1);
			}
		}
		Draw.ctx.lineWidth = 1;

		// --- Debug ---
		Draw.setFont(Font.m);
		Draw.setHVAlign(Align.l, Align.t);
		Draw.text(10, 10, Time.FPS);
	}
});

window.onload = () => startGame();