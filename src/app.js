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
			const colors = Math.shuffle(Global.BOX_COLORS);
			for (let i = 0; i < Global.NUMBER_OF_BOX; i++) {
				const pos = this.getGridWorldPos(i);
				this.boxes.push({
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
		}
	},
	onSetup() {
		// global variables
		this.grid = {
			paddingX: 20,
			paddingY: 20
		};
		this.boxes = [];
		this.presents = [];
	},
	onInit() {
		Global.onInit();
		Font.generate('boxText', Global.FONT_SIZE);
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