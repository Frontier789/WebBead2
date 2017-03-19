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
	rem: function(v) {
		if (v instanceof vec2_t) {
			return vec2(this.x % v.x,this.y % v.y);
		} else {
			return vec2(this.x % v,this.y % v);
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
var Field_scale = 0.55;
var FieldT = {
	Laser      : {sprite_p: vec2(3,0)},
	Mirror     : {sprite_p: vec2(2,0)},
	Gate       : {sprite_p: vec2(1,0)},
	Block      : {sprite_p: vec2(0,0)},
	MirrorPass : {sprite_p: vec2(0,1)},
	MirrorMono : {sprite_p: vec2(1,1)},
	Forbidden  : {sprite_p: vec2(3,1)},
	getRandom: function() {
		var r = Math.random()*100;
		if (r < 16) return this.Laser     ; r -= 16;
		if (r < 16) return this.Mirror    ; r -= 16;
		if (r < 16) return this.Gate      ; r -= 16;
		if (r < 16) return this.Block     ; r -= 16;
		if (r < 16) return this.MirrorPass; r -= 16;
		return this.MirrorMono;
	}
};

function Field(p, type, rot, scl) {
	this.pos  = p    || vec2();
	this.type = type || 0;
	this.rot  = rot  || 0;
	this.draw_scale = scl || 1.0;
	
	this.pos_transition = new Transition(p,p,0);
	this.rot_transition = new Transition(rot,rot,0);
	this.scl_transition = new Transition(this.draw_scale,this.draw_scale,0);
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
	width: 100,
	offsety: 5,
	getItemPerRow: function() {
		var itemPerRow = Math.floor(this.width / (Field_size.x * Field_scale));
		if (itemPerRow < 1) itemPerRow = 1;
		return itemPerRow;
	},
	draw: function() {
		var itemPerRow = this.getItemPerRow();
		
		drawGrid(vec2(itemPerRow,Math.floor(canvas.height / (Field_size.y * Field_scale))),
				 Field_size.mul(Field_scale),
				 vec2(canvas.width - this.width,this.offsety),
				 ["#cfcfcf","#000000"],[1.5,0.1]);
		
		this.fields.forEach(function(ff) {
			ff.draw();
		});
		
	},
	getPosFromIndex: function(n) {
		var itemPerRow = this.getItemPerRow();
		var row = Math.floor(n / itemPerRow);
		var col = n % itemPerRow;
		
		return vec2(col,row).mul(Field_size.mul(Field_scale)).add(vec2(canvas.width - this.width + Field_size.x * Field_scale / 2,this.offsety + Field_size.x * Field_scale / 2));
	},
	loadItems: function(items) {
		(function(the_drawer) {
		items.forEach(function(i,n) {
			the_drawer.fields.push(new Field(the_drawer.getPosFromIndex(n),i,0,0.95));
		})})(this);
	},
	addItem: function(item) {
		item.setPos(this.getPosFromIndex(this.fields.length));
		item.setDrawScale(0.95);
		this.fields.push(item);
	},
	remItem: function(index) {
		var ret = this.fields.splice(index,1)[0];
		for (let i = index;i < this.fields.length;i++) {
			this.fields[i].setPos(this.getPosFromIndex(i));
		}
		return ret;
	},
	findIdFromPos: function(p) {
		var s = Field_size.mul(Field_scale);
		for (i in this.fields) {
			var midp = this.getPosFromIndex(i);
			if (p.x > midp.x - s.x/2 && p.x < midp.x + s.x/2 && 
				p.y > midp.y - s.y/2 && p.y < midp.y + s.y/2)
			{
				return i;
			}
		}
		return -1;
	},
	handlePress: function(p) {
		if (!isDraggingField())
		{
			var i = this.findIdFromPos(p);
			if (i != -1)
			{
				dragField = this.remItem(i);
				dragField.setDrawScale(1.05);
				dragField.setPos(p);				
			}
		}
	},
	handleRightPress: function(p) {
		if (!isDraggingField())
		{
			var i = this.findIdFromPos(p);
			if (i != -1)
			{
				this.fields[i].setRot(this.fields[i].rot + 90);
			}
		}
	}
};

Drawer.loadItems([FieldT.getRandom(),FieldT.getRandom(),FieldT.getRandom(),FieldT.getRandom(),FieldT.getRandom(),FieldT.getRandom(),FieldT.getRandom(),FieldT.getRandom()]);





/* * * * * * * * * * GAMEMAP CLASS * * * * * * * * * */
function Map_element(field, fixed, rotfix) {
	this.field  = field || null;
	this.fixed  = fixed || false;
	this.rotfix = rotfix || false;
};

Map_element.prototype = {};

var Map = {
	fields: [],
	size: vec2(),
	offset: vec2(5,5),
	resize: function(size) {
		this.fields = [];
		this.size = size;
		for (var x = 0;x < size.x;++x) {
			this.fields.push([]);
			for (var y = 0;y < size.y;++y) {
				this.fields[x].push(new Map_element());
			}
		}
	},
	getPosFromIndex: function(index) {
		return index.mul(Field_size.mul(Field_scale)).add(this.offset).add(Field_size.mul(Field_scale).div(2));
	},
	draw: function() {
		drawGrid(this.size,
				 Field_size.mul(Field_scale),
				 this.offset,
				 ["#cfcfcf","#000000"],[1.5,0.1]);
		
		for (x of this.fields) {
			for (y of x) {
				if (y.field != null) {
					y.field.draw();
				}
			}
		}
	},
	set: function(p,item) {
		if (this.fields[p.x][p.y].fixed == false) {
			
			return this.forceSet(p,item);
		}
		return -1;
	},
	forceSet: function(p,item) {
		item.setPos(this.getPosFromIndex(p));
		item.setDrawScale(0.95);
		
		var tmp = this.fields[p.x][p.y].field;
		
		this.fields[p.x][p.y].field = item;
		
		if (tmp != null) {
			tmp.setDrawScale(1.05);
		}
		
		return tmp;
	},
	remItem: function(index) {
		var ret = this.fields[index.x][index.y].field;
		this.fields[index.x][index.y].field = null;
		return ret;
	},
	findIdFromPos: function(p) {
		var s = Field_size.mul(Field_scale);
		for (var x = 0;x < this.fields.length;x++) {
			for (var y = 0;y < this.fields[x].length;y++) {
				var midp = this.getPosFromIndex(vec2(x,y));
				
				if (this.fields[x][y].field != null)
				{
					if (p.x > midp.x - s.x/2 && p.x < midp.x + s.x/2 && 
						p.y > midp.y - s.y/2 && p.y < midp.y + s.y/2)
					{
						return vec2(x,y);
					}
				}
			}
		}
		return vec2(-1,-1);
	},
	handlePress: function(p) {
		if (!isDraggingField())
		{
			var i = this.findIdFromPos(p); 
			if (i.x != -1)
			{
				if (!this.fields[i.x][i.y].fixed)
				{
					dragField = this.remItem(i);
					dragField.setDrawScale(1.05);
					dragField.setPos(p);									
				}
			}
		}
	},
	handleRightPress: function(p) {
		if (!isDraggingField())
		{
			var i = this.findIdFromPos(p); 
			if (i.x != -1)
			{
				if (this.fields[i.x][i.y].field != null && 
					!this.fields[i.x][i.y].rotfix)
				{
					this.fields[i.x][i.y].field.setRot(this.fields[i.x][i.y].field.rot + 90);
				}
			}
		}
	}
};

Map.resize(vec2(10,10));
Map.fields[5][5].fixed = true;
Map.forceSet(vec2(5,5),new Field(Map.getPosFromIndex(vec2(5,5)),FieldT.Forbidden));



/* * * * * * * * * * GLOBAL VARIABLES * * * * * * * * * */
var sprite_sheet = document.getElementById("sprite_sheet");

var dragField = null;

var isDraggingField = function() {
	return dragField instanceof Field;
};

var drawGrid = function(cell_count,cell_size,p,colors,widths) {
	
	ctx.beginPath();
	ctx.lineWidth = widths[0];
	ctx.strokeStyle = colors[0];
	ctx.moveTo(p.x + 0.5,p.y + 0.5);
	ctx.lineTo(p.x + cell_size.x * cell_count.x + 0.5,p.y + 0.5);
	ctx.lineTo(p.x + cell_size.x * cell_count.x + 0.5,p.y + cell_size.y * cell_count.y + 0.5);
	ctx.lineTo(p.x + 0.5,p.y + cell_size.y * cell_count.y + 0.5);
	ctx.lineTo(p.x + 0.5,p.y + 0.5);
	ctx.closePath();
	
	ctx.stroke();
	
	
	ctx.beginPath();
	ctx.lineWidth = widths[1];
	ctx.strokeStyle = colors[1];
	for (var x = 1;x < cell_count.x;x++) {
		ctx.moveTo(p.x + cell_size.x * x + 0.5,p.y);
		ctx.lineTo(p.x + cell_size.x * x + 0.5,p.y + cell_size.y * cell_count.y);
	}
	
	for (var y = 1;y < cell_count.y;y++) {
		ctx.moveTo(p.x,p.y + cell_size.y * y + 0.5);
		ctx.lineTo(p.x + cell_size.x * cell_count.x,p.y + cell_size.y * y + 0.5);
	}
	ctx.closePath();
	
	ctx.stroke();
};

var handleDragDrop = function(p) {
	
	if (p.x > Map.offset.x && p.y > Map.offset.y &&
		p.x < Map.offset.x + Map.size.x * Field_size.x * Field_scale && 
		p.y < Map.offset.y + Map.size.y * Field_size.y * Field_scale)
	{
		var map_p = p.sub(Map.offset).div(Field_size.mul(Field_scale));
		map_p.x = Math.floor(map_p.x);
		map_p.y = Math.floor(map_p.y);
		
		var field = Map.set(map_p,dragField);
		if (field == -1)
		{
			/*
			Drawer.addItem(dragField);
			dragField = null;
			*/
			dragField.setRot(dragField.rot + 360);
		}
		else
		{
			dragField = field;
			if (dragField != null) 
			{
				dragField.setPos(p);
			}
		}
	}
	else
	{
		Drawer.addItem(dragField);
		dragField = null;
	}
};

/* * * * * * * * * * RENDERING METHOD * * * * * * * * * */
render = function () {
	
	ctx.clearRect(0,0,canvas.width,canvas.height);
	
	Map.draw();
	Drawer.draw();
	if (isDraggingField()) {
		dragField.draw();
	}
};




/* * * * * * * * * * LISTENERS * * * * * * * * * */
var dragMode = 0;
var dragBegP = vec2();
var dragTime = new Date();

window.onkeydown = function(e) {
	if (isDraggingField())
	{
		if (e.keyCode == 82) // r
		{
			dragField.setRot(dragField.rot + 90);
		}
	}
};

window.onkeyup = function(e) {
	
};

canvas.onmouseleave = function(e) {
	if (isDraggingField())
	{
		Drawer.addItem(dragField);
		dragField = null;
	}
}

canvas.onmousedown = function(e) {
	if (e.button == 2)
	{
		var p = vec2(e.layerX - canvas.offsetLeft,e.layerY - canvas.offsetTop);
		if (isDraggingField())
		{
			dragField.setRot(dragField.rot + 90);
		}
		else
		{
			Drawer.handleRightPress(p);
			Map.handleRightPress(p);
		}
	}
	if (e.button == 0)
	{
		var p = vec2(e.layerX - canvas.offsetLeft,e.layerY - canvas.offsetTop);
		if (isDraggingField())
		{
			handleDragDrop(p);
		}
		else
		{
			Drawer.handlePress(p);
			Map.handlePress(p);
			dragMode  = 0;
			dragBegP  = p;
			dragTime  = new Date();
		}
	}
};

canvas.onmouseup = function(e) {
	if (e.button == 0)
	{
		var p = vec2(e.layerX - canvas.offsetLeft,e.layerY - canvas.offsetTop);
		if (isDraggingField())
		{
			if (dragMode == 1)
			{
				handleDragDrop(p);
				dragMode = 2;
			}
			else
			{
				var dt = ((new Date()) - dragTime) / 1000;
				
				if (dt < 0.3)
				{
					dragMode = 2;
				}
				else if (dragMode == 0)
				{
					handleDragDrop(p);
				}
			}
		}
	}
};

canvas.onmousemove = function(e) {
	if (isDraggingField())
	{
		var p = vec2(e.layerX - canvas.offsetLeft,e.layerY - canvas.offsetTop);
		dragField.setPos(p);
		
		if (dragMode == 0)
		{
			if (Math.abs(dragBegP.x - p.x) > Field_size.x * Field_scale / 2 || 
				Math.abs(dragBegP.y - p.y) > Field_size.y * Field_scale / 2)
			{
				dragMode = 1;
			}			
		}
	}
};







animloop();