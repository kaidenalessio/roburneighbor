Math.range = (a, b) => a + Math.random() * (b - a);
Math.noise1 = (i) => 0.5 + 0.5 * Math.sin(Math.cos(i) * Math.sin(i / 2));
Math.noise2 = (i) => 0.5 + 0.5 * Math.tan(Math.cos(i) * Math.sin(i / 2));
Math.choose = (...args) => args[Math.floor(Math.random() * args.length)];
Math.clamp = (value, min, max) => Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max));
Math.map = (value, min1, max1, min2, max2) => min2 + (value - min1) / (max1 - min1) * (max2 - min2);
Math.mapClamped = (value, min1, max1, min2, max2) => Math.clamp(Math.map(value, min1, max1, min2, max2), min2, max2);
Math.angleBetween = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);
Math.polar = (x, y, radius, angle) => {
	x += Math.cos(angle) * radius;
	y += Math.sin(angle) * radius;
	return { x, y };
};
Math.shuffle = (array) => {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * i);
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
};

const Events = {
	on(object, eventName, callback) {
		object.events = object.events || {};
		object.events[eventName] = object.events[eventName] || [];
		object.events[eventName].push(callback);
		return callback;
	},
	off(object, eventName, callback) {
		if (object.events) {
			const callbacks = object.events[eventName];
			if (callbacks) {
				const newCallbacks = [];
				for (const _callback of callbacks) {
					if (_callback !== callback) {
						newCallbacks.push(_callback);
					}
				}
				object.events[eventName] = newCallbacks;
			}
		}
	},
	trigger(object, eventName) {
		if (object.events) {
			const callbacks = object.events[eventName];
			if (callbacks) {
				for (const callback of callbacks) {
					callback.call(object);
				}
			}
		}
	}
};

const Time = {
	FPS: 0,
	time: 0,
	deltaTime: 0,
	activeTime: 0,
	frameCount: 0,
	clampedDeltaTime: 0,
	unscaledDeltaTime: 0,
	start(t=window.performance.now()) {
		this.time = t;
	},
	update(t=window.performance.now()) {
		this.unscaledDeltaTime = t - this.time;
		this.deltaTime = this.unscaledDeltaTime * 0.06;
		this.clampedDeltaTime = Math.min(2, this.deltaTime);
		this.time = t;
		this.activeTime += this.unscaledDeltaTime;
		this.frameCount++;
		if (this.frameCount % 20 === 0) {
			this.FPS = Math.floor(this.deltaTime * 60);
		}
	}
};

const Input = {
	SPACE: 0,
	CLICK: 1,
	TAP: 2,
	ESCAPE: 3,
	keyCount: 4, // space, click, tap, escape
	keys: [],
	position: {
		x: 0,
		y: 0,
	},
	x: 0,
	y: 0,
	canvas: null, // canvas as target element to offset mouse position to
	touchCount: 0,
	mouseDownEvent: {},
	init(canvas) {
		this.keys.length = 0;
		for (let i = 0; i < this.keyCount; i++) {
			this.keys.push(this.create());
		}
		window.addEventListener('keyup', (e) => {
			if (e.keyCode === 32) {
				this.keys[this.SPACE].up();
			}
			else if (e.keyCode === 27) {
				this.keys[this.ESCAPE].up();
			}
		});
		window.addEventListener('keydown', (e) => {
			if (e.keyCode === 32) {
				this.keys[this.SPACE].down();
			}
			else if (e.keyCode === 27) {
				this.keys[this.ESCAPE].down();
			}
		});
		window.addEventListener('mouseup', (e) => {
			this.updateMouse(e);
			// if (e.button === 0) {
				this.keys[this.CLICK].up();
			// }
		});
		window.addEventListener('mousemove', (e) => {
			this.updateMouse(e);
		});
		window.addEventListener('mousedown', (e) => {
			this.updateMouse(e);
			// if (e.button === 0) {
				this.keys[this.CLICK].down();
			// }
			this.mouseDownEvent = e;
		});
		window.addEventListener('touchend', (e) => { this.updateTouch(e); this.keys[this.TAP].up(); });
		window.addEventListener('touchmove', (e) => { this.updateTouch(e); });
		window.addEventListener('touchstart', (e) => { this.updateTouch(e); this.keys[this.TAP].down(); });
		canvas.addEventListener('contextmenu', (e) => e.preventDefault());
		this.canvas = canvas;
	},
	updatePosition(x, y) {
		const b = this.canvas.getBoundingClientRect();
		this.x = this.position.x = x - b.x;
		this.y = this.position.y = y - b.y;
	},
	updateMouse(e) {
		this.updatePosition(e.clientX, e.clientY);
	},
	updateTouch(e) {
		this.touchCount = e.changedTouches.length;
		e = e.changedTouches[e.changedTouches.length - 1];
		this.updatePosition(e.clientX, e.clientY);
	},
	reset() {
		for (const key of this.keys) {
			key.reset();
		}
		this.touchCount = 0;
	},
	anyKeyHold(i) {
		if (this.touchCount > 0) {
			return this.keys[this.TAP].held;
		}
		for (const key of this.keys) {
			if (key.held) return true;
		}
		return false;
	},
	anyKeyDown(i) {
		if (this.touchCount > 0) {
			return this.keys[this.TAP].pressed;
		}
		for (const key of this.keys) {
			if (key.pressed) return true;
		}
		return false;
	},
	anyActionKeyHold(i) {
		if (this.keys[this.TAP].held) return true;
		if (this.touchCount > 0) {
			return this.keys[this.TAP].held;
		}
		if (this.keys[this.SPACE].held) return true;
		if (this.keys[this.CLICK].held) return true;
		return false;
	},
	anyActionKeyDown(i) {
		if (this.keys[this.TAP].pressed) return true;
		if (this.touchCount > 0) {
			return this.keys[this.TAP].pressed;
		}
		if (this.keys[this.SPACE].pressed) return true;
		if (this.keys[this.CLICK].pressed) return true;
		return false;
	},
	keyUp(index) {
		return this.keys[index].released;
	},
	keyDown(index) {
		return this.keys[index].pressed;
	},
	keyHold(index) {
		return this.keys[index].held;
	},
	create() {
		return {
			held: false,
			pressed: false,
			released: false,
			repeated: false,
			up() {
				this.held = false;
				this.released = true;
			},
			down() {
				if (!this.held) {
					this.held = true;
					this.pressed = true;
				}
				this.repeated = true;
			},
			reset() {
				this.pressed = false;
				this.released = false;
				this.repeated = false;
			}
		};
	}
};

const C = {
	aliceBlue: '#f0f8ff',
	antiqueWhite: '#faebd7',
	aqua: '#00ffff',
	aquamarine: '#7fffd4',
	azure: '#f0ffff',
	beige: '#f5f5dc',
	bisque: '#ffe4c4',
	black: '#000000',
	blanchedAlmond: '#ffebcd',
	blue: '#0000ff',
	blueViolet: '#8a2be2',
	brown: '#a52a2a',
	burlyWood: '#deb887',
	cadetBlue: '#5f9ea0',
	chartreuse: '#7fff00',
	chocolate: '#d2691e',
	coral: '#ff7f50',
	cornflowerBlue: '#6495ed',
	cornsilk: '#fff8dc',
	crimson: '#dc143c',
	cyan: '#00ffff',
	darkBlue: '#00008b',
	darkCyan: '#008b8b',
	darkGoldenRod: '#b8860b',
	darkGray: '#a9a9a9',
	darkGrey: '#a9a9a9',
	darkGreen: '#006400',
	darkKhaki: '#bdb76b',
	darkMagenta: '#8b008b',
	darkOliveGreen: '#556b2f',
	darkOrange: '#ff8c00',
	darkOrchid: '#9932cc',
	darkRed: '#8b0000',
	darkSalmon: '#e9967a',
	darkSeaGreen: '#8fbc8f',
	darkSlateBlue: '#483d8b',
	darkSlateGray: '#2f4f4f',
	darkSlateGrey: '#2f4f4f',
	darkTurquoise: '#00ced1',
	darkViolet: '#9400d3',
	deepPink: '#ff1493',
	deepSkyBlue: '#00bfff',
	dimGray: '#696969',
	dimGrey: '#696969',
	dodgerBlue: '#1e90ff',
	fireBrick: '#b22222',
	floralWhite: '#fffaf0',
	forestGreen: '#228b22',
	fuchsia: '#ff00ff',
	gainsboro: '#dcdcdc',
	ghostWhite: '#f8f8ff',
	gold: '#ffd700',
	goldenRod: '#daa520',
	gray: '#808080',
	grey: '#808080',
	green: '#008000',
	greenYellow: '#adff2f',
	honeyDew: '#f0fff0',
	hotPink: '#ff69b4',
	indianRed: '#cd5c5c',
	indigo: '#4b0082',
	ivory: '#fffff0',
	khaki: '#f0e68c',
	lavender: '#e6e6fa',
	lavenderBlush: '#fff0f5',
	lawnGreen: '#7cfc00',
	lemonChiffon: '#fffacd',
	lightBlue: '#add8e6',
	lightCoral: '#f08080',
	lightCyan: '#e0ffff',
	lightGoldenRodYellow: '#fafad2',
	lightGray: '#d3d3d3',
	lightGrey: '#d3d3d3',
	lightGreen: '#90ee90',
	lightPink: '#ffb6c1',
	lightSalmon: '#ffa07a',
	lightSeaGreen: '#20b2aa',
	lightSkyBlue: '#87cefa',
	lightSlateGray: '#778899',
	lightSlateGrey: '#778899',
	lightSteelBlue: '#b0c4de',
	lightYellow: '#ffffe0',
	lime: '#00ff00',
	limeGreen: '#32cd32',
	linen: '#faf0e6',
	magenta: '#ff00ff',
	maroon: '#800000',
	mediumAquaMarine: '#66cdaa',
	mediumBlue: '#0000cd',
	mediumOrchid: '#ba55d3',
	mediumPurple: '#9370db',
	mediumSeaGreen: '#3cb371',
	mediumSlateBlue: '#7b68ee',
	mediumSpringGreen: '#00fa9a',
	mediumTurquoise: '#48d1cc',
	mediumVioletRed: '#c71585',
	midnightBlue: '#191970',
	mintCream: '#f5fffa',
	mistyRose: '#ffe4e1',
	moccasin: '#ffe4b5',
	navajoWhite: '#ffdead',
	navy: '#000080',
	oldLace: '#fdf5e6',
	olive: '#808000',
	oliveDrab: '#6b8e23',
	orange: '#ffa500',
	orangeRed: '#ff4500',
	orchid: '#da70d6',
	paleGoldenRod: '#eee8aa',
	paleGreen: '#98fb98',
	paleTurquoise: '#afeeee',
	paleVioletRed: '#db7093',
	papayaWhip: '#ffefd5',
	peachPuff: '#ffdab9',
	peru: '#cd853f',
	pink: '#ffc0cb',
	plum: '#dda0dd',
	powderBlue: '#b0e0e6',
	purple: '#800080',
	rebeccaPurple: '#663399',
	red: '#ff0000',
	rosyBrown: '#bc8f8f',
	royalBlue: '#4169e1',
	saddleBrown: '#8b4513',
	salmon: '#fa8072',
	sandyBrown: '#f4a460',
	seaGreen: '#2e8b57',
	seaShell: '#fff5ee',
	sienna: '#a0522d',
	silver: '#c0c0c0',
	skyBlue: '#87ceeb',
	slateBlue: '#6a5acd',
	slateGray: '#708090',
	slateGrey: '#708090',
	snow: '#fffafa',
	springGreen: '#00ff7f',
	steelBlue: '#4682b4',
	tan: '#d2b48c',
	teal: '#008080',
	thistle: '#d8bfd8',
	tomato: '#ff6347',
	turquoise: '#40e0d0',
	violet: '#ee82ee',
	wheat: '#f5deb3',
	white: '#ffffff',
	whiteSmoke: '#f5f5f5',
	yellow: '#ffff00',
	yellowGreen: '#9acd32',
	none: '#0000',
	keys: [],
	list: [],
	random() {
		return this.list[Math.floor(Math.random() * this.list.length)];
	},
	makeRGB(r, g, b) {
		if (g === undefined) g = r;
		if (b === undefined) b = r;
		return `rgb(${r}, ${g}, ${b})`;
	},
	makeRGBA(r, g, b, a) {
		if (arguments.length === 2) {
			a = g;
			g = r;
		}
		if (g === undefined) g = r;
		if (b === undefined) b = r;
		if (a === undefined) a = 1;
		return `rgba(${r}, ${g}, ${b}, ${a})`;
	},
	componentToHEX(c) {
		const hex = Math.ceil(c).toString(16);
		return hex.length < 2? `0${hex}` : hex;
	},
	RGBToRGBComponent(rgb) {
		rgb = rgb.replace('rgb(', '').replace(')', '').split(',').map(x => +x);
		return {
			r: rgb[0],
			g: rgb[1],
			b: rgb[2]
		};
	},
	HEXToRGBComponent(hex) {
		hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => r+r+g+g+b+b));
		if (!(hex instanceof Array)) {
			hex = [0, 0, 0, 0];
		}
		return {
			r: parseInt(hex[1], 16) || 0,
			g: parseInt(hex[2], 16) || 0,
			b: parseInt(hex[3], 16) || 0
		};
	},
	RGBComponentToRGB(c, weight=1) {
		return `rgb(${c.r * weight}, ${c.g * weight}, ${c.b * weight})`;
	},
	RGBComponentToHEX(c, weight=1) {
		return `#${this.componentToHEX(c.r * weight)}${this.componentToHEX(c.g * weight)}${this.componentToHEX(c.b * weight)}`;
	},
	RGBToHEX(rgb, weight=1) {
		return this.RGBComponentToHEX(this.RGBToRGBComponent(rgb), weight);
	},
	HEXToRGB(hex, weight=1) {
		return this.RGBComponentToRGB(this.HEXToRGBComponent(hex), weight);
	},
	multiply(c, weight=1) {
		if (c.includes('rgb')) {
			return this.RGBComponentToRGB(this.RGBToRGBComponent(c), weight);
		}
		if (c.includes('#')) {
			return this.RGBComponentToHEX(this.HEXToRGBComponent(c), weight);
		}
		throw new TypeError(`The provided value 'c' must be in CSS rgb([r], [g], [b]) or hex #[r][g][b] format.`);
	}
};

C.keys = Object.keys(C);
C.keys.splice(C.keys.length - 14);
C.list = Object.values(C);
C.list.splice(C.list.length - 14);

const Align = {
	l: 'left',
	r: 'right',
	c: 'center',
	t: 'top',
	b: 'bottom',
	m: 'middle'
};

const Font = {
	bold: 'bold ',
	generate(name, size, style='', family='Lilita One, sans-serif') {
		this[name] = { size, style, family };
	},
	init() {
		this.generate('xxl', 64);
		this.generate('xl',  48);
		this.generate('l',   30);
		this.generate('ml',  24);
		this.generate('m',   20);
		this.generate('sm',  16);
		this.generate('s',   10);
		this.generate('xxlb', 64, this.bold);
		this.generate('xlb',  48, this.bold);
		this.generate('lb',   30, this.bold);
		this.generate('mlb',  24, this.bold);
		this.generate('mb',   20, this.bold);
		this.generate('smb',  16, this.bold);
		this.generate('sb',   10, this.bold);
	}
};

Font.init();

const Draw = {
	ctx: null,
	images: {},
	defaultCtx: null,
	currentFont: Font.m,
	init(ctx) {
		this.ctx = this.defaultCtx = ctx;
	},
	setAlpha(n) {
		this.ctx.globalAlpha = n;
	},
	setColor(fill, stroke) {
		this.ctx.fillStyle = fill;
		this.ctx.strokeStyle = stroke || fill;
	},
	rect(x, y, w, h, isStroke) {
		isStroke? this.ctx.strokeRect(x, y, w, h) : this.ctx.fillRect(x, y, w, h);
	},
	roundRect(x, y, w, h, r=10, isStroke=false) {
		if (w < 0) { x += w; w = -w; }
		if (h < 0) { y += h; h = -h; }
		r = Math.min(Math.min(w * 0.5, h * 0.5), Math.max(0, r)) || 0;
		this.ctx.beginPath();
		this.ctx.moveTo(x, y + r);
		this.ctx.quadraticCurveTo(x, y, x + r, y);
		this.ctx.lineTo(x + w - r, y);
		this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
		this.ctx.lineTo(x + w, y + h - r);
		this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
		this.ctx.lineTo(x + r, y + h);
		this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
		this.ctx.closePath();
		isStroke? this.ctx.stroke() : this.ctx.fill();
	},
	circle(x, y, r, isStroke) {
		this.ctx.beginPath();
		this.ctx.arc(x, y, r, 0, 2 * Math.PI);
		isStroke? this.ctx.stroke() : this.ctx.fill();
	},
	setFont(font) {
		this.ctx.font = `${font.style}${font.size}px ${font.family}, serif`;
		this.currentFont = font;
	},
	setHAlign(align) {
		this.ctx.textAlign = align;
	},
	setVAlign(align) {
		this.ctx.textBaseline = align;
	},
	setHVAlign(halign, valign) {
		this.ctx.textAlign = halign;
		this.ctx.textBaseline = valign;
	},
	splitText(text) {
		return ('' + text).split('\n');
	},
	text(x, y, text, isStroke) {
		let baseline = 0;
		const t = this.splitText(text);
		switch (this.ctx.textBaseline) {
			case 'bottom': baseline = -this.currentFont.size * (t.length - 1); break;
			case 'middle': baseline = -this.currentFont.size * (t.length - 1) * 0.5; break;
		}
		for (let i = t.length - 1; i >= 0; --i) {
			isStroke
				? this.ctx.strokeText(t[i], x, y + baseline + this.currentFont.size * i)
				: this.ctx.fillText(t[i], x, y + baseline + this.currentFont.size * i);
		}
	},
	textWithOutline(x, y, text) {
		this.text(x, y, text);
		this.text(x, y, text, true);
	},
	getTextWidth(text) {
		return Math.max(...this.splitText(text).map(x => this.ctx.measureText(x).width));
	},
	getTextHeight(text) {
		return this.currentFont.size * this.splitText(text).length;
	},
	addImage(name, img) {
		this.images[name] = img;
	},
	getImage(name) {
		return this.images[name];
	},
	image(name, x, y, xscale=1, yscale=1, angle=0, originX=0.5, originY=0.5) {
		if (!(name instanceof Image || name instanceof HTMLCanvasElement)) {
			name = this.images[name];
		}
		originX *= -name.width;
		originY *= -name.height;
		this.ctx.save();
		this.ctx.translate(x, y);
		this.ctx.rotate(angle);
		this.ctx.scale(xscale, yscale);
		this.ctx.drawImage(name, originX, originY);
		this.ctx.restore();
	},
	onTransform(x, y, xscale, yscale, angle, drawFn) {
		this.ctx.save();
		this.ctx.translate(x, y);
		this.ctx.rotate(angle);
		this.ctx.scale(xscale, yscale);
		drawFn();
		this.ctx.restore();
	},
	onCanvas(canvas, drawFn) {
		this.ctx = canvas.getContext('2d');
		drawFn(canvas.width, canvas.height);
		this.ctx = this.defaultCtx;
		return canvas;
	},
	createCanvas(w, h, drawFn) {
		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		this.ctx = canvas.getContext('2d');
		drawFn(w, h);
		this.ctx = this.defaultCtx;
		return canvas;
	},
	clear() {
		this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	},
	setShadow(xOffset, yOffset, blur=0, color='#000000') {
		this.ctx.shadowBlur = blur;
		this.ctx.shadowColor = color;
		this.ctx.shadowOffsetX = xOffset;
		this.ctx.shadowOffsetY = yOffset;
	},
	resetShadow() {
		this.setShadow(0, 0);
	},
	arrow(...args) {
		if (args.length % 2 !== 0) args.pop();
		if (args.length < 4) return;

		this.ctx.save();
		this.ctx.lineCap = 'round';
		this.ctx.lineWidth = 4;
		this.setShadow(-2, 2, 10, 'rgba(0, 0, 0, 0.4)');

		// retrieve points
		const p = [];
		for (let i = 0; i < args.length; i += 2) {
			p.push({
				x: args[i],
				y: args[i+1]
			});
		}

		// draw the line
		this.ctx.beginPath();
		this.ctx.moveTo(p[0].x, p[0].y);
		for (let i = 1; i < p.length; i++) {
			this.ctx.lineTo(p[i].x, p[i].y);
		}

		// draw the head/pointer
		const headLength = 14;
		const lastPoint = p[p.length - 1];
		const last2ndPoint = p[p.length - 2];
		const direction = Math.angleBetween(lastPoint.x, lastPoint.y, last2ndPoint.x, last2ndPoint.y);
		const polar1 = Math.polar(lastPoint.x, lastPoint.y, headLength, direction + Math.PI / 5);
		const polar2 = Math.polar(lastPoint.x, lastPoint.y, headLength, direction - Math.PI / 5);

		this.ctx.moveTo(polar1.x, polar1.y);
		this.ctx.lineTo(lastPoint.x, lastPoint.y);
		this.ctx.lineTo(polar2.x, polar2.y);
		this.ctx.stroke();

		this.ctx.restore();
	}
};

const Sound = {
	audios: {},
	addAudio(name, audio) {
		this.audios[name] = audio;
	},
	getAudio(name) {
		return this.audios[name];
	},
	play(name) {
		this.audios[name].currentTime = 0;
		this.audios[name].play();
	},
	loop(name) {
		if (!this.isPlaying(name)) {
			this.startLoop(name);
		}
	},
	stop(name) {
		if (this.isPlaying(name)) {
			this.stopLoop(name);
		}
	},
	startLoop(name) {
		this.audios[name].loop = true;
		this.audios[name].currentTime = 0;
		this.audios[name].play();
	},
	stopLoop(name) {
		this.audios[name].pause();
		this.audios[name].loop = false;
		this.audios[name].currentTime = 0;
	},
	isPlaying(name) {
		return !this.audios[name].paused;
	},
	stopAll() {
		for (const name in this.audios) {
			this.stop(name);
		}
	}
};

const Stage = {
	w: 300,
	h: 150,
	mid: {
		w: 150,
		h: 75
	},
	canvas: null,
	pixelRatio: 2,
	init(canvas, pixelRatio=this.pixelRatio) {
		this.canvas = canvas;
		const b = this.canvas.getBoundingClientRect();
		this.w = b.width;
		this.h = b.height;
		this.mid.w = this.w / 2;
		this.mid.h = this.h / 2;
		this.setPixelRatio(pixelRatio);
	},
	setPixelRatio(n) {
		this.pixelRatio = n;
		this.canvas.width = this.w * this.pixelRatio;
		this.canvas.height = this.h * this.pixelRatio;
		// this.canvas.style.width = `${this.w}px`;
		// this.canvas.style.height = `${this.h}px`;
		this.canvas.getContext('2d').resetTransform();
		this.canvas.getContext('2d').scale(this.pixelRatio, this.pixelRatio);
	}
};

const Manager = {
	restarting: false,
	setup(options={}) {
		if (options.onInit) Events.on(this, 'init', options.onInit);
		if (options.onRestart) Events.on(this, 'restart', options.onRestart);
		if (options.onUpdate) Events.on(this, 'update', options.onUpdate);
		if (options.onRender) Events.on(this, 'render', options.onRender);
		if (options.methods) {
			for (const key in options.methods) {
				this[key] = options.methods[key].bind(this);
			}
		}
		if (options.onSetup) options.onSetup.call(this);
	},
	init() {
		Events.trigger(this, 'init');
	},
	restart() {
		Events.trigger(this, 'restart');
		this.restarting = true;
	},
	update() {
		if (!this.restarting) {
			Events.trigger(this, 'update');
		}
	},
	render() {
		if (!this.restarting) {
			Events.trigger(this, 'render');
		}
		else {
			this.restarting = false;
		}
	}
};

const Runner = {
	isRunning: false,
	start() {
		if (!this.isRunning) {
			this.isRunning = true;
			Time.start();
			this.run();
		}
	},
	stop() {
		this.isRunning = false;
		window.cancelAnimationFrame(Runner.run);
	},
	run() {
		Time.update();
		Manager.update();
		Draw.clear();
		Manager.render();
		Input.reset();
		if (Runner.isRunning) {
			window.requestAnimationFrame(Runner.run);
		}
	}
};

const startGame = (options={}) => {
	options.gameCanvasId = options.gameCanvasId || 'gameCanvas';
	if (options.addImages) {
		for (const key in options.addImages) {
			Draw.addImage(key, document.getElementById(options.addImages[key]));
		}
	}
	if (options.addAudios) {
		for (const key in options.addAudios) {
			Sound.addAudio(key, document.getElementById(options.addAudios[key]));
		}
	}
	Stage.init(document.getElementById(options.gameCanvasId));
	Input.init(Stage.canvas);
	Draw.init(Stage.canvas.getContext('2d'));
	Manager.init();
	Manager.restart();
	Runner.start();
};