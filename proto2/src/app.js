var firebaseConfig;

const Global = {
	DATABASE_NAME: 'MyDefaultRoom',
	getRatio() {
		return {
			w: Stage.w / 1200,
			h: Stage.h / 900
		};
	},
	FONT_SIZE: 54,
	BOX_SCALE: 2,
	BOX_WIDTH: 72,
	BOX_HEIGHT: 72,
	NUMBER_OF_BOX: 30,
	TIMER_DURATION: 30000, // in milliseconds
	DRAG_WITH_OFFSET: true,
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
	RATIO: {
		w: 1,
		h: 1
	},
	onInit() {
		this.RATIO = this.getRatio();
		this.BOX_WIDTH *= this.RATIO.w;
		this.BOX_HEIGHT = this.BOX_WIDTH;
		this.FONT_SIZE *= this.RATIO.w;

		const urlParams = new URLSearchParams(window.location.search);
		const box = Number(urlParams.get('box'));
		const room = urlParams.get('room');

		if (box > 0) this.NUMBER_OF_BOX = box;
		if (room) this.DATABASE_NAME = room;
		
		if (this.NUMBER_OF_BOX <= 12) {
			this.GRID.COLS = 4;
			this.GRID.ROWS = 3;
		}
		else if (this.NUMBER_OF_BOX <= 16) {
			this.GRID.COLS = 4;
			this.GRID.ROWS = 4;
		}
		else if (this.NUMBER_OF_BOX <= 20) {
			this.GRID.COLS = 5;
			this.GRID.ROWS = 4;
		}
		else if (this.NUMBER_OF_BOX <= 25) {
			this.GRID.COLS = 5;
			this.GRID.ROWS = 5;
		}
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

const createNameInput = (translateX, translateY, textAlign, value, edges={}, onClickCallback, onChangeCallback) => {
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
	if (onClickCallback) {
		input.onmousedown = onClickCallback;
	}
	if (onChangeCallback) {
		input.onchange = onChangeCallback;
	}
	document.getElementById('nameInputs').appendChild(input);
	return input;
};

const getTimeNow = () => (new Date()).getTime();

class GameTimer {
	constructor(x, y, time) {
		this.x = x;
		this.y = y;
		this.time = time;
		this.timeTo = getTimeNow() + this.time;
		this.isActive = true;
	}
	update() {
		if (this.time <= 0) {
			this.isActive = false;
		}
		else {
			this.time = this.timeTo - getTimeNow();
		}
	}
	show() {
		const text = `:${Math.max(0, Math.round(this.time / 1000))}`;
		const fill = Draw.ctx.fillStyle;
		Draw.setColor(C.black);
		Draw.text(this.x + 1 * Global.RATIO.w, this.y + 3 * Global.RATIO.w, text);
		Draw.setColor(C.crimson);
		Draw.text(this.x, this.y, text);
	}
}

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
			return Input.anyActionKeyHold();/* && this.inputInCanvas()*/;
		},
		getInputDown() {
			if (Input.anyActionKeyDown()) {
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
			this.isEditMode = false;
			// this.isEditMode = !this.isEditMode;
			// if (this.isEditMode) {
			// 	for (const input of this.nameInputs) {
			// 		input.classList.remove('disabled');
			// 	}
			// }
			// else {
			// 	for (const input of this.nameInputs) {
			// 		input.classList.add('disabled');
			// 	}
			// }
		},
		initGrid() {
			const gridWidth = (Global.GRID.COLS - 1) * (Global.BOX_WIDTH + this.grid.paddingX);
			const gridHeight = (Global.GRID.ROWS - 1) * (Global.BOX_HEIGHT + this.grid.paddingY);
			this.grid.xOffset = Stage.mid.w - gridWidth / 2;
			this.grid.yOffset = Stage.mid.h - gridHeight / 2;
		},
		initBoxes() {
			const colors = Global.BOX_COLORS;// Math.shuffle(Global.BOX_COLORS);
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
		nameInputOnClick(e, index) {
			if (e.button === 0) {
				const timer = this.spawnTimerOnName(index);
				this.sendDataUsers(index, 'timeTo', timer.timeTo);
			}
			else if (e.button === 2) {
				this.removeTimer(index);
				this.sendDataUsers(index, 'timeTo', 0);
			}
		},
		nameInputOnChange(index) {
			this.sendDataUsers(index, 'name', this.nameInputs[index].value);
		},
		initNameInputs() {
			this.nameInputs.push(createNameInput(-50, 0, Align.c, 'Name 1',  { top: '15px',    left: '20%' },   (e) => this.nameInputOnClick(e, 0), () => this.nameInputOnChange(0)));
			this.nameInputs.push(createNameInput(-50, 0, Align.c, 'Name 2',  { top: '15px',    left: '50%' },   (e) => this.nameInputOnClick(e, 1), () => this.nameInputOnChange(1)));
			this.nameInputs.push(createNameInput(-50, 0, Align.c, 'Name 3',  { top: '15px',    left: '80%' },   (e) => this.nameInputOnClick(e, 2), () => this.nameInputOnChange(2)));
			this.nameInputs.push(createNameInput(0, -50, Align.r, 'Name 4',  { top: '30%',     right: '20px' }, (e) => this.nameInputOnClick(e, 3), () => this.nameInputOnChange(3)));
			this.nameInputs.push(createNameInput(0, -50, Align.r, 'Name 5',  { top: '70%',     right: '20px' }, (e) => this.nameInputOnClick(e, 4), () => this.nameInputOnChange(4)));
			this.nameInputs.push(createNameInput(-50, 0, Align.c, 'Name 6',  { bottom: '15px', left: '80%' },   (e) => this.nameInputOnClick(e, 5), () => this.nameInputOnChange(5)));
			this.nameInputs.push(createNameInput(-50, 0, Align.c, 'Name 7',  { bottom: '15px', left: '50%' },   (e) => this.nameInputOnClick(e, 6), () => this.nameInputOnChange(6)));
			this.nameInputs.push(createNameInput(-50, 0, Align.c, 'Name 8',  { bottom: '15px', left: '20%' },   (e) => this.nameInputOnClick(e, 7), () => this.nameInputOnChange(7)));
			this.nameInputs.push(createNameInput(0, -50, Align.l, 'Name 9',  { top: '70%',     left: '20px' },  (e) => this.nameInputOnClick(e, 8), () => this.nameInputOnChange(8)));
			this.nameInputs.push(createNameInput(0, -50, Align.l, 'Name 10', { top: '30%',     left: '20px' },  (e) => this.nameInputOnClick(e, 9), () => this.nameInputOnChange(9)));
			for (const input of this.nameInputs) {
				resizeInputByValue(input);
			}
		},
		createTimer(x, y, time) {
			const timer = new GameTimer(x, y, time);
			this.timers.push(timer);
			return timer;
		},
		removeTimer(nameIndex) {
			for (let i = this.timers.length - 1; i >= 0; --i) {
				if (this.timers[i].nameIndex === nameIndex) {
					this.timers.splice(i, 1);
				}
			}
		},
		spawnTimerOnName(index) {
			this.removeTimer(index);
			const b = this.nameInputs[index].getBoundingClientRect();
			const cb = Stage.canvas.getBoundingClientRect();
			const x = (b.x - cb.x) + b.width / 2;
			let y = b.y - cb.y;
			if (index < 5 || index > 7) {
				y += b.height + Font.timer.size / 2;
			}
			else {
				y -= Font.timer.size / 2;
			}
			const timer = this.createTimer(x, y, Global.TIMER_DURATION);
			timer.nameIndex = index;
			return timer;
		},
		initFirebase() {
			if (firebase && firebaseConfig) {
				firebase.initializeApp(firebaseConfig);
				this.database = firebase.database().ref(Global.DATABASE_NAME);
				this.dbUsers = this.database.child('users');
				this.dbBoxes = this.database.child('boxes');


				this.dbUsers.on('value', (snap) => {
					const users = [];

					snap.forEach((childSnap) => {
						const val = childSnap.val();
						const user = {
							index: +childSnap.key,
							name: val.name || null,
							timeTo: val.timeTo || 0
						};
						users.push(user);
					});

					for (const user of users) {
						if (user.name !== null) {
							this.nameInputs[user.index].value = user.name;
							resizeInputByValue(this.nameInputs[user.index]);
						}
						if (user.timeTo > getTimeNow()) {
							const timer = this.spawnTimerOnName(user.index);
							timer.timeTo = user.timeTo;
						}
						else {
							this.removeTimer(user.index);
						}
					}
				});

				this.dbBoxes.on('value', (snap) => {
					const boxes = [];

					snap.forEach((childSnap) => {
						const val = childSnap.val();
						const box = {
							index: +childSnap.key,
							x: val.x || null,
							y: val.y || null
						};
						boxes.push(box);
					});

					for (const box of boxes) {
						const mybox = this.boxes[box.index];
						const px = mybox.x;
						const py = mybox.y;

						if (this.isDragging && this.draggedBox !== null) {
							if (this.draggedBox.id === mybox.id) {
								continue;
							}
						}
						if (typeof box.x === 'number') {
							mybox.x = box.x * Global.RATIO.w;
						}
						if (typeof box.y === 'number') {
							mybox.y = box.y * Global.RATIO.h;
						}
						if (mybox.x !== px || mybox.y !== py) {
							mybox.depth = this.getBoxLowestDepth() - 1;
						}
					}
				});

			}
		},
		sendDataUsers(index, key, value) {
			if (this.dbUsers) {
				this.dbUsers.child(`${index}/${key}`).set(value);
			}
		},
		sendDataBox(index) {
			if (this.dbBoxes) {
				const box = this.boxes[index];
				const value = {
					x: box.x / Global.RATIO.w,
					y: box.y / Global.RATIO.h
				};
				this.dbBoxes.child(`${index}`).set(value);
			}
		},
		getBoxLowestDepth() {
			let lowestDepth = 0;
			for (const box of this.boxes) {
				if (box.depth < lowestDepth) {
					lowestDepth = box.depth;
				}
			}
			return lowestDepth;
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
		this.timers = [];
		this.presents = [];
		this.nameInputs = [];

		this.database = null;
		this.dbUsers = null;
		this.dbBoxes = null;

		this.dragTime = 0;
		this.draggedBox = null;
		this.isDragging = false;
	},
	onInit() {
		Global.onInit();

		Font.generate('boxText', Math.floor(Global.FONT_SIZE));
		Font.generate('timer', Math.floor(Global.FONT_SIZE * 0.75));

		this.initGrid();
		this.initBoxes();
		this.initNameInputs();

		this.isEditMode = true;
		this.toggleEditMode();

		this.initFirebase();
	},
	onUpdate() {
		// --- Update Drag and Drop ---
		if (this.isDragging) {
			this.dragTime += Time.clampedDeltaTime;
			if (this.isEditMode || this.draggedBox === null) {
				this.isDragging = false;
			}
			else {
				if (this.getInputHold()) {
					this.draggedBox.x += 0.5 * (Input.x + this.dragOffsetX - this.draggedBox.x);
					this.draggedBox.y += 0.5 * (Input.y + this.dragOffsetY - this.draggedBox.y);
					this.draggedBox.x = Math.clamp(this.draggedBox.x, Global.BOX_WIDTH / 2, Stage.w - Global.BOX_WIDTH / 2);
					this.draggedBox.y = Math.clamp(this.draggedBox.y, Global.BOX_HEIGHT / 2, Stage.h - Global.BOX_HEIGHT / 2);
				}
				else {
					this.isDragging = false;
					this.sendDataBox(this.draggedBox.id);
				}
			}
		}
		else {
			this.draggedBox = null;
			if (this.getInputDown()) {
				this.draggedBox = this.getHoveredBox();
				if (this.draggedBox !== null) {
					this.draggedBox.depth = this.getBoxLowestDepth() - 1;
					if (Global.DRAG_WITH_OFFSET) {
						this.dragOffsetX = this.draggedBox.x - Input.x;
						this.dragOffsetY = this.draggedBox.y - Input.y;
					}
					else {
						this.dragOffsetX = 0;
						this.dragOffsetY = 0;
					}
					this.isDragging = true;
					this.dragTime = 0;
				}
			}
		}

		// --- Update Timers ---
		for (const timer of this.timers) {
			timer.update();
		}
	},
	onRender() {
		// --- Render on Game Mode ---
		if (this.isEditMode) {
			Draw.setAlpha(0.5);
		}

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

		// --- Render Timers ---
		Draw.setFont(Font.timer);
		Draw.setHVAlign(Align.c, Align.m);
		Draw.ctx.lineWidth = 2;
		for (let i = this.timers.length - 1; i >= 0; --i) {
			if (this.timers[i]) {
				if (this.timers[i].isActive) {
					this.timers[i].show();
				}
				else {
					this.timers.splice(i, 1);
				}
			}
		}
		Draw.ctx.lineWidth = 1;

		// End of game mode render
		Draw.setAlpha(1);

		// --- Render on Edit Mode ---
		if (this.isEditMode) {
			Draw.setFont(Font.boxText);

			const h = Draw.currentFont.size * 2;

			Draw.setColor(C.black);
			Draw.rect(0, Stage.mid.h - h / 2, Stage.w, h);

			Draw.setColor(C.white);
			Draw.setHVAlign(Align.c, Align.m);
			Draw.text(Stage.mid.w, Stage.mid.h, 'Edit mode');
		}

		if (Input.keyDown(Input.ESCAPE)) {
			this.toggleEditMode();
		}
	}
});

window.onload = () => startGame();