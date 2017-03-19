/* * * * * * * * * * RENDERING CONTEXT SETUP * * * * * * * * * */
var canvas = document.getElementById("game_canvas");
var ctx = canvas.getContext("2d");

window.requestAnimFrame = (function() {
	return  window.requestAnimationFrame       ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
			function(callback) {
				window.setTimeout(callback, 1000 / 60);
			};
})();

var render = null;

var animloop = function animloop() {
	requestAnimFrame(animloop);
	render();
};

canvas.oncontextmenu = function(e) {
    e.preventDefault();
};



/* * * * * * * * * * VECTOR MODULE * * * * * * * * * */
function vec2_t(x, y) {
	this.x = x || 0;
	this.y = y || 0;
};

var vec2 = function(x, y) {
	return new vec2_t(x,y);
}

vec2_t.prototype = {
	negate: function() {
		return vec2(-this.x,-this.y);
	},
	add: function(v) {
		if (v instanceof vec2_t) {
			return vec2(this.x + v.x,this.y + v.y);
		} else {
			return vec2(this.x + v,this.y + v);
		}
	},
	sub: function(v) {
		if (v instanceof vec2_t) {
			return vec2(this.x - v.x,this.y - v.y);
		} else {
			return vec2(this.x - v,this.y - v);
		}
	},
	mul: function(v) {
		if (v instanceof vec2_t) {
			return vec2(this.x * v.x,this.y * v.y);
		} else {
			return vec2(this.x * v,this.y * v);
		}
	},
	div: function(v) {
		if (v instanceof vec2_t) {
			return vec2(this.x / v.x,this.y / v.y);
		} else {
			return vec2(this.x / v,this.y / v);
		}
	},
	eq: function(v) {
		return this.x == v.x && this.y == v.y;
	},
	dot: function(v) {
		return this.x * v.x + this.y * v.y;
	},
	cross: function(v) {
		return this.x * v.y - this.y * v.x
	},
	LENGTH: function() {
		return this.dot(this);
	},
	length: function() {
		return Math.sqrt(this.LENGTH());
	},
	len: function() {
		return this.length();
	},
	norm: function() {
		return this.div(this.length());
	},
	sgn: function() {
		return this.norm();
	},
	min: function() {
		return Math.min(this.x,this.y);
	},
	max: function() {
		return Math.max(this.x,this.y);
	},
	getAngle: function() {
		return -Math.atan2(-this.y, this.x);
	},
	toArray: function() {
		return [this.x, this.y];
	},
	clone: function() {
		return new vec2_t(this.x, this.y);
	},
	set: function(x, y) {
		this.x = x;
		this.y = y;
		return this;
	}
};




/* * * * * * * * * * TRANSITION CLASS * * * * * * * * * */
function Transition(a, b, t) {
	this.from  = a || 0;
	this.until = b || 0;
	this.dur   = t || 1;
	this.clock = new Date();
};

Transition.prototype = {
	finished: function() {
		return this.getTime() > this.dur;
	},
	getTime: function() {
		return ((new Date()) - this.clock) / 1000;
	},
	set: function(a, b, t) {
		this.from  = a;
		this.until = b;
		this.dur   = t;
		this.clock = new Date();
	},
	get: function() {
		if (this.finished()) return this.until;
		
		var dt = this.getTime() / this.dur;
		
		dt = Math.sqrt(3*dt*dt - 2*dt*dt*dt);
		
		if (this.until instanceof vec2_t) {
			return this.until.mul(dt).add(this.from.mul(1.0 - dt));
		}
		
		return this.until * dt + this.from * (1.0 - dt);
	}
};


/* * * * * * * * * * FIELD TYPE * * * * * * * * * */
var Field_size  = vec2(85,85);
var Field_scale = 0.5;
var FieldT = {
	Laser  : {sprite_p: vec2(3,0)},
	Mirror : {sprite_p: vec2(2,0)},
};

function Field(p, type, rot) {
	this.pos  = p    || 0;
	this.type = type || 0;
	this.rot  = rot  || 0;
	this.draw_scale = 1.0;
	
	this.pos_transition = new Transition(p,p,0);
	this.rot_transition = new Transition(rot,rot,0);
	this.scl_transition = new Transition(1.0,1.0,0);
};

Field.prototype = {
	setPos: function(p) {
		this.pos_transition.set(this.pos,p,0.2);
		this.pos = p;
	},
	setRot: function(r) {
		this.rot_transition.set(this.rot,r,0.2);
		this.rot = r;
	},
	setDrawScale: function(s) {
		this.scl_transition.set(this.draw_scale,s,0.2);
		this.draw_scale = s;
	},
	draw: function() {
		
		var pos = this.pos_transition.get();
		var rot = this.rot_transition.get();
		var draw_scale = this.scl_transition.get();
		
		ctx.translate(pos.x,pos.y);
		ctx.rotate(rot / 180.0 * 3.141592);
		ctx.translate(-Field_size.x * Field_scale/2 * draw_scale,-Field_size.y * Field_scale/2 * draw_scale);
		
		ctx.drawImage(sprite_sheet,
					  this.type.sprite_p.x * Field_size.x,this.type.sprite_p.y * Field_size.y,
					  Field_size.x,Field_size.y,
					  0,0,
					  Field_size.x * Field_scale * draw_scale,Field_size.y * Field_scale * draw_scale);
					  
		ctx.translate(Field_size.x * Field_scale/2 * draw_scale,Field_size.y * Field_scale/2 * draw_scale);
		ctx.rotate(-rot / 180.0 * 3.141592);
		ctx.translate(-pos.x,-pos.y);
	}
};




/* * * * * * * * * * DRAWER CLASS * * * * * * * * * */
var Drawer = {
	fields: [],
	width: 50, 
	draw: function() {
		this.fields.forEach(function(ff) {
			ff.draw();
		});
	},
	getPosFromIndex: function(n) {
		var itemPerRow = Math.floor(this.width / (Field_size.x * Field_scale));
		if (itemPerRow < 1) itemPerRow = 1;
		var row = Math.floor(this.fields.length / itemPerRow);
		var col = this.fields.length % itemPerRow;
		
		return vec2(col,row).mul(Field_size.x * Field_scale).add(vec2(canvas.width - this.width + Field_size.x * Field_scale / 2,Field_size.x * Field_scale / 2));
	},
	loadItems: function(items) {
		(function(the_drawer) {
		items.forEach(function(i,n) {
			the_drawer.fields.push(new Field(the_drawer.getPosFromIndex(n),i));
		})})(this);
	}
};

Drawer.loadItems([FieldT.Laser,FieldT.Laser,FieldT.Mirror]);



/* * * * * * * * * * GLOBAL VARIABLES * * * * * * * * * */
var sprite_sheet = document.getElementById("sprite_sheet");


var f = new Field(vec2(50,50),FieldT.Laser,0);




/* * * * * * * * * * RENDERING METHOD * * * * * * * * * */
render = function () {
	
	ctx.clearRect(0,0,canvas.width,canvas.height);
	
	Drawer.draw();
	
	f.draw();
};

/* * * * * * * * * * LISTENERS * * * * * * * * * */

window.onkeydown = function(e) 
{
	if (e.keyCode == 107) f.setRot(f.rot + 90);
};
/*
window.onkeyup = function(e) 
{
	if (e.keyCode == 38) down[0] = false;
	if (e.keyCode == 40) down[1] = false;
	if (e.keyCode == 39) down[2] = false;
	if (e.keyCode == 37) down[3] = false;
};*/

canvas.onmousedown = function(e) {
	if (e.buttons == 1)
	{
		f.setPos(vec2(e.layerX - canvas.offsetLeft,e.layerY - canvas.offsetTop));
	}
	if (e.buttons == 2)
	{
		f.setDrawScale(f.draw_scale + 1.0);
	}
};
canvas.onmousemove = function(e) {
	// console.log(e);
};







animloop();