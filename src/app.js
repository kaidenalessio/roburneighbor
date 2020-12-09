const Global = {
	getRatio() {
		return {
			w: Stage.w / 1280,
			h: Stage.h / 720
		};
	},
	BOX_SCALE: 2,
	BOX_WIDTH: 80,
	FONT_SIZE: 58,
	BOX_HEIGHT: 80,
	NUMBER_OF_BOX: 30,
	GRID: {
		COLS: 6,
		ROWS: 5
	}
};

const makeColorStop = (myGradient, color) => {
	const c = C.HEXToRGBComponent(color);
	myGradient.addColorStop(0, C.makeRGB(c.r + 50, c.g + 50, c.b + 50));
	myGradient.addColorStop(0.1, color);
	myGradient.addColorStop(0.6, color);
	myGradient.addColorStop(0.9, C.makeRGB(c.r * 0.8, c.g * 0.8, c.b * 0.8));
	myGradient.addColorStop(1, C.makeRGB(c.r * 0.76, c.g * 0.76, c.b * 0.76));
};

const drawPresent = (xCenter, yCenter, width, height, boxColor) => {
	Draw.ctx.save();
	const w = width;
	const h = height;
	const x = xCenter - w / 2;
	const y = yCenter - h / 2;
	const wrapWidth = h / 10;
	const drawWrap = (isStroke) => {
		Draw.roundRect(x - 3, yCenter - wrapWidth / 2, w + 6, wrapWidth, 4, isStroke);
		Draw.roundRect(xCenter - wrapWidth / 2, y - 3, wrapWidth, h + 8, 4, isStroke);
	};
	// box bottom border
	Draw.setColor(C.black);
	Draw.roundRect(x + 0.5, y + 3, w - 1, h);
	// wrap outline
	Draw.ctx.lineWidth = 4;
	drawWrap(true);
	Draw.ctx.lineWidth = 1;
	// box
	const myGradient = Draw.ctx.createLinearGradient(xCenter, y, xCenter, y + h);
	makeColorStop(myGradient, boxColor);
	Draw.setColor(myGradient);
	Draw.roundRect(x, y, w, h);
	// box outline
	Draw.ctx.lineWidth = 2;
	Draw.setColor(C.black);
	Draw.roundRect(x, y, w, h, 10, true);
	Draw.ctx.lineWidth = 1;
	// wrap
	Draw.setColor(C.gold);
	drawWrap();
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
		initBoxes() {
			const colors = Math.shuffle(C.list.slice());
			for (let i = 0; i < Global.NUMBER_OF_BOX; i++) {
				const pos = this.getGridWorldPos(i);
				this.boxes.push({
					x: pos.x,
					y: pos.y,
					depth: 0
				});
				const canvas = Draw.createCanvas(Global.BOX_WIDTH * Global.BOX_SCALE * 1.2, Global.BOX_HEIGHT * Global.BOX_SCALE * 1.2, (w, h) => {
					Draw.ctx.scale(Global.BOX_SCALE, Global.BOX_SCALE);
					drawPresent(w / 2 / Global.BOX_SCALE, h / 2 / Global.BOX_SCALE, Global.BOX_WIDTH, Global.BOX_HEIGHT, colors.pop());
				});
				this.presents.push(canvas);
			}
		}
	},
	onSetup() {
		// global variables
		Font.generate('boxText', Global.FONT_SIZE);
		this.grid = {
			paddingX: 20,
			paddingY: 20
		};
		this.boxes = [];
		this.presents = [];
	},
	onInit() {
		const gridWidth = (Global.GRID.COLS - 1) * (Global.BOX_WIDTH + this.grid.paddingX);
		const gridHeight = (Global.GRID.ROWS - 1) * (Global.BOX_HEIGHT + this.grid.paddingY);
		this.grid.xOffset = Stage.mid.w - gridWidth / 2;
		this.grid.yOffset = Stage.mid.h - gridHeight / 2;
		this.initBoxes();
	},
	onUpdate() {
	},
	onRender() {
		// --- Render Boxes ---
		Draw.setFont(Font.boxText);
		Draw.setColor(C.white, C.black);
		Draw.setHVAlign(Align.c, Align.m);
		Draw.ctx.lineWidth = 2;
		for (let i = 0, s = 1 / Global.BOX_SCALE; i < Global.NUMBER_OF_BOX; i++) {
			Draw.image(this.presents[i], this.boxes[i].x, this.boxes[i].y, s, s);
			Draw.textWithOutline(this.boxes[i].x, this.boxes[i].y, i + 1);
		}
		Draw.ctx.lineWidth = 1;

		// --- Debug ---
		Draw.setFont(Font.m);
		Draw.setHVAlign(Align.l, Align.t);
		Draw.text(10, 10, Time.FPS);
	}
});

window.onload = () => startGame();