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

var tmpGameData = document.getElementById("game_map").innerHTML.replace(/\s/g,'').split(";");
var GameData = [];

tmpGameData.forEach(function(r) {
	var string_arr = r.split(",");
	var int_arr = [];
	for (s of string_arr) {
		int_arr.push(parseInt(s));
	}
	GameData.push(int_arr);
});




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
	perp: function() {
		return vec2(-this.y,this.x);
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
function Transition(a, b, t, int) {
	this.from  = a || 0;
	this.until = b || 0;
	this.dur   = t || 1;
	this.clock = new Date();
	this.int   = int || 0;
};

Transition.prototype = {
	Linear: 0,
	Smooth: 1,
	finished: function() {
		return this.getTime() > this.dur;
	},
	getTime: function() {
		return ((new Date()) - this.clock) / 1000;
	},
	set: function(a, b, t, r) {
		this.from  = a;
		this.until = b;
		this.dur   = t;
		this.clock = new Date();
		this.reversed = r || false;
	},
	get: function() {
		if (this.finished()) {
			if (this.reversed)
				return this.from;
				
			return this.until;
		}
		
		var dt = this.getTime() / this.dur;
		
		if (this.int == 1) {
			dt = Math.sqrt(3*dt*dt - 2*dt*dt*dt);
		}
		
		if (this.reversed) dt = 1 - dt;
		
		if (this.until instanceof vec2_t) {
			return this.until.mul(dt).add(this.from.mul(1.0 - dt));
		}
		
		return this.until * dt + this.from * (1.0 - dt);
	}
};



/* * * * * * * * * * LASER TYPE * * * * * * * * * */
var LaserT = {
	Block:       0,
	Pass:        1,
	Emit:        2,
	MirrorRight: 3,
	MirrorLeft:  4,
	PassRight:   5,
	PassLeft:    6,
	FreeGoal:    7,
	Goal:        8
};

function LaserPos(p,v) {
	this.pos = p || vec2();
	this.vel = v || vec2();
}

LaserPos.prototype = {
	rotObjDegs: function(degs) {
		var rotN = Math.floor(degs / 90);
		if (rotN < 0) rotN = rotN * -3;
		
		var tmpLaser = new LaserPos(vec2(),this.vel);
		
		for (var i = 0;i<rotN % 4;i++) {
			tmpLaser.vel = tmpLaser.rotLeft();
		}
		
		return tmpLaser.vel;
	},
	getSide: function(field) {
		if (field == null) {
			return LaserT.Pass;
		}
		
		var vel = this.rotObjDegs(field.rot);
		
		if (Math.abs(vel.x) < Math.abs(vel.y)) {
			if (vel.y < 0) {
				return field.type.bottom;
			} else {
				return field.type.top;
			}
		} else {
			if (vel.x < 0) {
				return field.type.right;
			} else {
				return field.type.left;
			}
		}
	},
	rotLeft: function() {
		if (Math.abs(this.vel.x) < Math.abs(this.vel.y)) {
			if (this.vel.y < 0) {
				return vec2(-1,0);
			} else {
				return vec2(1,0);
			}
		} else {
			if (this.vel.x < 0) {
				return vec2(0,1);
			} else {
				return vec2(0,-1);
			}
		}
	},
	rotRight: function() {
		return this.rotLeft().mul(-1);
	},
	step: function(field) {
		var to_apply = this.getSide(field);
		
		var ret = [];
		
		if (to_apply == LaserT.Pass || to_apply == LaserT.PassLeft || to_apply == LaserT.PassRight) {
			ret.push(new LaserPos(this.pos.add(this.vel),this.vel)); 
		}
		if (to_apply == LaserT.MirrorLeft || to_apply == LaserT.PassLeft) {
			ret.push(new LaserPos(this.pos.add(this.rotLeft(this.vel)),this.rotLeft(this.vel))); 
		}
		if (to_apply == LaserT.MirrorRight || to_apply == LaserT.PassRight) {
			ret.push(new LaserPos(this.pos.add(this.rotRight(this.vel)),this.rotRight(this.vel))); 
		}
		if (field != null && field.type == FieldT.Gate && !field.washit) {
			field.washit = true;
		}
		if (to_apply == LaserT.Goal && !field.washit) {
			field.washit = true;
			num_targets--;
		}
		if (to_apply == LaserT.FreeGoal && !field.washit) {
			field.washit = true;
			num_targets--;
		}
		
		return ret;
	}
};




/* * * * * * * * * * LASERDRAW CLASS * * * * * * * * * */
function LaserPath(beg,lp) {
	this.cur  = beg || vec2();
	this.arr  = [];
	this.lpos = lp || null;
	this.cur_transition = new Transition(beg,beg,0);
	this.reversed = false;
};

LaserPath.prototype = {
	add: function(p) {
		this.arr.push(this.cur);
		this.cur_transition.set(this.cur,p,0.1,false,Transition.Linear);
		this.cur = p;
	},
	finished: function() {
		return this.cur_transition.finished();
	},
	step: function() {
		if (this.lpos != null) {
			if (!this.reversed) {
				var next_lposes = this.lpos.step(Map.fields[this.lpos.pos.x][this.lpos.pos.y].field);
			
				var ret = [];
				
				for (p in next_lposes) {
					ret.push(new LaserPath);
					ret[p].cur = this.cur;
					if (p == 0) {
						ret[p].arr = this.arr.slice();
					} else {
						ret[p].arr = [];
						while (ret[p].arr.length < this.arr.length) {
							ret[p].arr.push(this.cur);
						}
					}
					ret[p].cur_transition.set(this.cur,this.cur,0);
					ret[p].lpos = next_lposes[p];
					ret[p].add(Map.getPosFromIndex(next_lposes[p].pos));
				}
				
				return ret;
			} else {
				if (this.arr.length > 1) {
					this.cur_transition.set(this.arr[this.arr.length - 2],this.arr[this.arr.length - 1],0.1,true,Transition.Linear);
					this.arr.splice(this.arr.length - 1,1);
					return [this];
				}
				return [];
			}
		}
	},
	reverse: function() {
		var tmparr = [this.cur_transition.until];
		
		for (var i = this.arr.length - 1;i >= 0;i--) {
			tmparr.push(this.arr[i]);
		}
		
		this.cur_transition.set(this.arr[0],this.arr[0],0);
		this.arr = tmparr;
		
		this.reversed = true;
	},
	draw: function() {
		if (this.arr.length > 0) {
			
			ctx.shadowBlur = 2;
			ctx.shadowColor = "#ff0000";
			
			ctx.beginPath();
			ctx.strokeStyle = "#ff9ab2";
			ctx.lineWidth = 1;
			
			ctx.moveTo(this.arr[0].x,this.arr[0].y);
			
			for (p of this.arr) {
				ctx.lineTo(p.x,p.y);
			}
			
			var last = this.cur_transition.get(); 
			ctx.lineTo(last.x,last.y);
			
			ctx.moveTo(this.arr[0].x,this.arr[0].y);
			ctx.closePath();
			
			ctx.stroke();
			
			ctx.shadowBlur = 0;
		}
	}
};

var LaserDraw = {
	paths: [],
	finished_paths: [],
	reset: function() {
		paths = [];
		finished_paths = [];
	},
	started: function() {
		return this.paths.length != 0 || this.finished_paths.length != 0;
	},
	finished: function() {
		if (this.paths.length == 0 && 
			this.finished_paths.length == 0) {
			return true;
		}
		
		if (this.paths.length == 0) {
			return this.finished_paths[0].finished();
		}
		
		return this.paths[0].finished();
	},
	step: function() {
		if (!this.started()) {
			for (var x = 0;x < Map.fields.length;x++) {
				for (var y = 0;y < Map.fields[x].length;y++) {
					
					if (Map.fields[x][y].field != null) {
						if (Map.fields[x][y].field.type == FieldT.Laser) {
							var l = new LaserPos(vec2(x,y),vec2(1,0));
							var begp = l.pos;
							l.vel = l.rotObjDegs(Map.fields[x][y].field.rot * -1);
							l.pos = l.pos.add(l.vel);
							this.paths.push(new LaserPath(Map.getPosFromIndex(begp),l));
							this.paths[this.paths.length-1].add(Map.getPosFromIndex(l.pos));
						}
					}
				}
			}
		} else {
			var tmp = [];
			for (l of this.paths) {
				if (l.lpos.pos.x >= 0 && l.lpos.pos.y >= 0 && l.lpos.pos.x < Map.size.x && l.lpos.pos.y < Map.size.y) {
					
					var nexts = l.step();
					
					if (nexts.length == 0) {
						l.reverse();
						this.finished_paths.push(l);
					} else {
						tmp = tmp.concat(nexts);	
					}
				} else {
					l.reverse();
					this.finished_paths.push(l);
				}
			}
			
			this.paths = tmp;
			
			if (this.paths.length == 0) {
				tmp = [];
				
				for (l of this.finished_paths) {
					tmp = tmp.concat(l.step());
				}
				
				this.finished_paths = tmp;
			}
		}
	},
	draw: function() {
		for (l of this.paths) {
			l.draw();
		}
		for (l of this.finished_paths) {
			l.draw();
		}
	}
};





/* * * * * * * * * * FIELD TYPE * * * * * * * * * */
var Field_size  = vec2(85,85);
var Field_scale = 0.65;
var FieldT = {
	Laser      : {sprite_p: vec2(3,0), left: LaserT.Block,      top: LaserT.Block,      right: LaserT.Emit,       bottom: LaserT.Block      },
	Mirror     : {sprite_p: vec2(2,0), left: LaserT.MirrorLeft, top: LaserT.MirrorRight,right: LaserT.MirrorLeft, bottom: LaserT.MirrorRight},
	Gate       : {sprite_p: vec2(1,0), left: LaserT.Block,      top: LaserT.Pass,       right: LaserT.Block,      bottom: LaserT.Pass      },
	Block      : {sprite_p: vec2(0,0), left: LaserT.Block,      top: LaserT.Block,      right: LaserT.Block,      bottom: LaserT.Block      },
	MirrorPass : {sprite_p: vec2(0,1), left: LaserT.PassLeft,   top: LaserT.PassRight,  right: LaserT.PassLeft,   bottom: LaserT.PassRight  },
	MirrorMono : {sprite_p: vec2(1,1), left: LaserT.FreeGoal,   top: LaserT.Block,      right: LaserT.MirrorLeft, bottom: LaserT.MirrorRight},
	MirrorGoal : {sprite_p: vec2(2,1), left: LaserT.Goal,       top: LaserT.Block,      right: LaserT.MirrorLeft, bottom: LaserT.MirrorRight},
	Goal       : {sprite_p: vec2(0,2), left: LaserT.Goal,       top: LaserT.Goal,       right: LaserT.Goal,       bottom: LaserT.Goal       },
	Forbidden  : {sprite_p: vec2(3,1), left: LaserT.Pass,       top: LaserT.Pass,       right: LaserT.Pass,       bottom: LaserT.Pass       },
	getFromId: function(id) {
		if (id == 1) return this.Laser     ;
		if (id == 2) return this.Mirror    ;
		if (id == 3) return this.Gate      ;
		if (id == 4) return this.Block     ;
		if (id == 5) return this.MirrorPass;
		if (id == 6) return this.MirrorMono;
		if (id == 7) return this.MirrorGoal;
		if (id == 8) return this.Goal      ;
		if (id == 9) return this.Forbidden ;
		return this.Forbidden;
	},
	getRandom: function() {
		var r = Math.random()*100;
		if (r < 12) return this.Laser     ; r -= 12;
		if (r < 12) return this.Mirror    ; r -= 12;
		if (r < 12) return this.Gate      ; r -= 12;
		if (r < 12) return this.Block     ; r -= 12;
		if (r < 12) return this.MirrorPass; r -= 12;
		if (r < 12) return this.MirrorGoal; r -= 12;
		if (r < 12) return this.Goal      ; r -= 12;
		return this.MirrorMono;
	}
};

function Field(p, type, rot, scl) {
	this.pos  = p    || vec2();
	this.type = type || 0;
	this.rot  = rot  || 0;
	this.draw_scale = scl || 1.0;
	this.washit = false;
	
	this.init_rot          = rot || 0;
	this.init_drawer_place = -1;
	this.init_map_place    = vec2(-1,-1);
	
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
		
		if (draw_scale > 0.95) {
			ctx.shadowBlur    = (draw_scale - 0.95) *  50;
			ctx.shadowOffsetX = (draw_scale - 0.95) *  40;
			ctx.shadowOffsetY = (draw_scale - 0.95) * -20;
			ctx.shadowColor = "#999999";
		}
		
		ctx.translate(pos.x,pos.y);
		ctx.rotate(rot / 180.0 * 3.141592);
		ctx.translate(-Field_size.x * Field_scale/2 * draw_scale,-Field_size.y * Field_scale/2 * draw_scale);
		
		ctx.drawImage(sprite_sheet,
					  this.type.sprite_p.x * Field_size.x + 0.5,this.type.sprite_p.y * Field_size.y + 0.5,
					  Field_size.x - 1,Field_size.y - 1,
					  0,0,
					  Field_size.x * Field_scale * draw_scale,Field_size.y * Field_scale * draw_scale);
					  
		ctx.translate(Field_size.x * Field_scale/2 * draw_scale,Field_size.y * Field_scale/2 * draw_scale);
		ctx.rotate(-rot / 180.0 * 3.141592);
		ctx.translate(-pos.x,-pos.y);
		
		ctx.shadowBlur = 0;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
	}
};

/* * * * * * * * * * DRAWER CLASS * * * * * * * * * */
var Drawer = {
	fields: [],
	width: Field_size.x * Field_scale * 2 + 6,
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
			var field = new Field(the_drawer.getPosFromIndex(n),i,0,0.95);
			field.init_drawer_place = the_drawer.fields.length;
			
			the_drawer.fields.push(field);
		})})(this);
	},
	addItem: function(p,item) {
		var index = this.findIdFromPos(p);
		
		if (index == -1) {
			index = this.fields.length;
			this.fields.push(item);
		}
		else {
			this.fields.splice(index,0,item);
		}
		item.setPos(this.getPosFromIndex(index));
		item.setDrawScale(0.95);
		
		for (let i = index;i < this.fields.length;i++) {
			if (i > index) {
				this.fields[i].setPos(this.getPosFromIndex(i));
			}
		}
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


var DrawerItems = [];

var item_offset = 1;
var items_count = 0;

while (items_count < GameData[0][0] * GameData[0][1]) {
	if (GameData[item_offset].length == 5) {
		items_count += GameData[item_offset][4];
	} else {
		items_count++;
	}
	
	item_offset++;
}

for (var i = 0;i < GameData[item_offset];i++) {
	DrawerItems.push(FieldT.getFromId(GameData[item_offset + 1][i]));
}

Drawer.loadItems(DrawerItems);





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
		
		for (x in this.fields) {
			for (y in this.fields[x]) {
				var f = this.fields[x][y];
				if (f.field != null) {
					f.field.draw();
				}
				if (f.fixed) {
					var p = this.getPosFromIndex(vec2(x,y)).add(Field_size.mul(Field_scale).mul(vec2(-1,-1)).div(2));
					if (f.rotfix) {
						ctx.drawImage(lock_rot_img,p.x + 3,p.y + 3);
					} else {
						ctx.drawImage(lock_img,p.x + 3,p.y + 3);
					}
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
				} else {
					if (this.fields[i.x][i.y].field != null && this.fields[i.x][i.y].field.type == FieldT.Laser) {
						playing = 1;
						try_play(true);
					}
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

Map.resize(vec2(GameData[0][0],GameData[0][1]));

Map.offset = vec2(canvas.width,canvas.height).sub(Map.size.mul(Field_size.mul(Field_scale))).div(2).sub(vec2(0,Field_size.mul(Field_scale).y / 2 + 3));

var MapFieldOffset = 1;

for (var i = 0;i < GameData[0][0] * GameData[0][1];i++) {
	var x = i % GameData[0][0];
	var y = Math.floor(i / GameData[0][0]);
	
	if (GameData[MapFieldOffset][0] != 0) {
		var field = new Field(Map.getPosFromIndex(vec2(x,y)),FieldT.getFromId(GameData[MapFieldOffset][0]));
		field.init_map_place = vec2(x,y);
		
		Map.forceSet(vec2(x,y),field);
		Map.fields[x][y].field.rot =  GameData[MapFieldOffset][1];
		Map.fields[x][y].field.setRot(GameData[MapFieldOffset][1]);
	}
	
	Map.fields[x][y].fixed     = (GameData[MapFieldOffset][2] == 1);
	Map.fields[x][y].rotfix    = (GameData[MapFieldOffset][3] == 1);
	
	if (GameData[MapFieldOffset].length == 4) {
		MapFieldOffset++;
	} else {
		if (GameData[MapFieldOffset][4] > 1) {
			GameData[MapFieldOffset][4]--;
		} else {
			MapFieldOffset++;
		}
	}
}



/* * * * * * * * * * PLAY BUTTON * * * * * * * * * */
function PlayButtonTemplate(s1,s2,s3) {
	this.offset   =  vec2();
	this.mouse_on =  false;
	this.clicked  =  false;
	this.normalState = s1 || [20,0,100,0,1];
	this.hoverState  = s2 || [23,100,200,100,3];
	this.clickState  = s3 || [21,50,150,50,2];
	this.red_transition =  new Transition(this.normalState[1],this.normalState[1],0);
	this.gre_transition =  new Transition(this.normalState[2],this.normalState[2],0);
	this.blu_transition =  new Transition(this.normalState[3],this.normalState[3],0);
	this.siz_transition =  new Transition(20,20,0);
	this.wid_transition =  new Transition(1,1,0);
	
	this.draw = function() {
		var size  = this.siz_transition.get();
		var red   = this.red_transition.get();
		var green = this.gre_transition.get();
		var blue  = this.blu_transition.get();
		var width = this.wid_transition.get();
		
		ctx.shadowBlur = 3;
		ctx.shadowColor = "rgb("+red*3+","+green*3+","+blue*3+")";
		
		ctx.beginPath();
		ctx.lineWidth = width;
		ctx.strokeStyle = "rgb("+red+","+green+","+blue+")";
		ctx.moveTo(this.offset.x + size,this.offset.y);
		ctx.lineTo(this.offset.x - size/2,this.offset.y + size/2);
		ctx.lineTo(this.offset.x - size/2,this.offset.y - size/2);
		ctx.lineTo(this.offset.x + size,this.offset.y);
		ctx.closePath();
		
		ctx.stroke();
		
		ctx.shadowBlur = 0;
	};
	this.onPress = function() {
		playing = 1;
		try_play(true);
	};
};

PlayButtonTemplate.prototype = {
	applyState: function(from_state,to_state) {
		var t = 0.1;
		this.siz_transition.set(from_state[0],to_state[0],t);
		this.red_transition.set(from_state[1],to_state[1],t);
		this.gre_transition.set(from_state[2],to_state[2],t);
		this.blu_transition.set(from_state[3],to_state[3],t);
		this.wid_transition.set(from_state[4],to_state[4],t);
	},
	updateState: function(hover_dif,click_dif) {
		if (click_dif) {
			if (this.mouse_on) {
				if (this.clicked) {
					this.applyState(this.hoverState,this.clickState);
				} else {
					this.applyState(this.clickState,this.hoverState);
				}
			} else {
				this.applyState(this.clickState,this.normalState);
			}
		} else {
			if (hover_dif) {
				if (this.clicked) {
					///
				} else {
					if (this.mouse_on) {
						this.applyState(this.normalState,this.hoverState);
					} else {
						this.applyState(this.hoverState,this.normalState);
					}
				}
			}
		}
	},
	handleHover: function(p) {
		var mouse = (p.sub(this.offset).length() < this.siz_transition.get());
		
		if (mouse && !this.mouse_on) {
			this.mouse_on = true;
			this.updateState(true,false);
		} else if (!mouse && this.mouse_on) {
			this.mouse_on = false;
			this.updateState(true,false);
		}
	},
	handlePress: function(p) {
		if (this.mouse_on && !this.clicked) {
			this.clicked = true;
			this.updateState(false,true);
			this.onPress();
		}
	},
	handleRelease: function(p) {
		if (this.clicked) {
			this.clicked = false;
			this.updateState(false,true);
		}
	}
};

var PlayButton = new PlayButtonTemplate();

PlayButton.offset = vec2(canvas.width,canvas.height).div(vec2(2,2)).add(Map.size.mul(Field_size.mul(Field_scale)).mul(vec2(0,0.5))).add(vec2(0,Field_size.mul(Field_scale).y / 2 + 3))



var BackButton = new PlayButtonTemplate([20,100,0,0,1],[23,200,100,100,3],[21,150,50,50,2]);

BackButton.offset = PlayButton.offset.add(vec2(-Field_size.mul(Field_scale).x,0));
BackButton.draw = function() {
	var size  = this.siz_transition.get();
	var red   = this.red_transition.get();
	var green = this.gre_transition.get();
	var blue  = this.blu_transition.get();
	var width = this.wid_transition.get();
	
	var sqrt2 = Math.sqrt(2);
	
	ctx.shadowBlur = 3;
	ctx.shadowColor = "rgb("+red*3+","+green*3+","+blue*3+")";
	
	var d = 5;
	var l = 10;
	
	ctx.beginPath();
	ctx.lineWidth = width;
	ctx.strokeStyle = "rgb("+red+","+green+","+blue+")";
	ctx.moveTo(this.offset.x+d,this.offset.y);
	ctx.lineTo(this.offset.x+d+l,this.offset.y+l);
	ctx.lineTo(this.offset.x+l,this.offset.y+l+d);
	ctx.lineTo(this.offset.x,this.offset.y+d);
	ctx.lineTo(this.offset.x-l,this.offset.y+l+d);
	ctx.lineTo(this.offset.x-d-l,this.offset.y+l);
	ctx.lineTo(this.offset.x-d,this.offset.y);

	ctx.moveTo(this.offset.x-d,this.offset.y);
	ctx.lineTo(this.offset.x-d,this.offset.y);
	ctx.lineTo(this.offset.x-d-l,this.offset.y-l);
	ctx.lineTo(this.offset.x-l,this.offset.y-l-d);
	ctx.lineTo(this.offset.x,this.offset.y-d);
	ctx.lineTo(this.offset.x+l,this.offset.y-l-d);
	ctx.lineTo(this.offset.x+d+l,this.offset.y-l);
	ctx.lineTo(this.offset.x+d,this.offset.y);
	ctx.moveTo(this.offset.x+d+l,this.offset.y-l);

	ctx.closePath();
	
	ctx.stroke();
	
	ctx.shadowBlur = 0;
};
BackButton.onPress = function() {
	gen_table();
};


var ResetButton = new PlayButtonTemplate([20,0,0,100,1],[23,100,100,200,3],[21,50,50,150,2]);

ResetButton.offset = PlayButton.offset.add(vec2(Field_size.mul(Field_scale).x,0));
ResetButton.draw = function() {
	var size  = this.siz_transition.get();
	var red   = this.red_transition.get();
	var green = this.gre_transition.get();
	var blue  = this.blu_transition.get();
	var width = this.wid_transition.get();
	
	ctx.shadowBlur = 3;
	ctx.shadowColor = "rgb("+red*3+","+green*3+","+blue*3+")";
	
	ctx.beginPath();
	ctx.lineWidth = width;
	ctx.strokeStyle = "rgb("+red+","+green+","+blue+")";
	ctx.moveTo(this.offset.x + size * 0.45,this.offset.y);
	ctx.arc(this.offset.x,this.offset.y,size * 0.45,0,1.5*Math.PI);
	ctx.moveTo(this.offset.x + size * 0.45,this.offset.y);
	ctx.lineTo(this.offset.x + size * 0.75,this.offset.y);
	ctx.arc(this.offset.x,this.offset.y,size * 0.75,0,1.5*Math.PI);
	ctx.moveTo(this.offset.x,this.offset.y - size * 0.45);
	ctx.lineTo(this.offset.x,this.offset.y - size * 0.35);
	ctx.lineTo(this.offset.x + size * 0.3,this.offset.y - size * 0.6);
	ctx.lineTo(this.offset.x,this.offset.y - size * 0.85);
	ctx.lineTo(this.offset.x,this.offset.y - size * 0.75);
	ctx.moveTo(this.offset.x,this.offset.y - size * 0.75);
	ctx.closePath();
	
	ctx.stroke();
	
	ctx.shadowBlur = 0;
};

ResetButton.onPress = function() {
	var map_to_drawer = [];
	var drawer_to_map = [];
	
	for (x in Map.fields) {
		for (y in Map.fields[x]) {
			var f = Map.fields[x][y];
			
			if (f.field != null) {
				if (f.field.init_map_place.x == -1) {
					var dat = [];
					dat.push(f.field);
					dat.push(f.field.pos);
					map_to_drawer.push(dat);
					f.field = null;
				} else if (f.field.init_drawer_place == -1) {
					var pp = f.field.init_map_place;
					if (pp.x != x || pp.y != y) {
						drawer_to_map.push(Map.remItem(vec2(x,y)));
					} else {
						f.field.setRot(f.field.init_rot);
					}
				}
			}
		}
	}
	
	while (Drawer.fields.length > 0) {
		var f = Drawer.fields[Drawer.fields.length - 1];
		
		if (f.init_drawer_place != -1) {
			
			var p = f.pos;
			
			var dat = [];
			dat.push(Drawer.remItem(Drawer.fields.length - 1));
			dat.push(p);
			map_to_drawer.push(dat);
		} else {
			drawer_to_map.push(Drawer.remItem(Drawer.fields.length - 1));
		}
	}
	
	for (f of drawer_to_map) {
		f.setRot(f.init_rot);
		Map.set(f.init_map_place,f);
	}
	
	map_to_drawer.sort(function(a, b) {
		return a[0].init_drawer_place - b[0].init_drawer_place;
	});
	
	for (f of map_to_drawer) {
		
		f[0].setPos(f[1]);
		f[0].setRot(f[0].init_rot);
		Drawer.addItem(f[0].init_map_place,f[0]);
	}
}

/* * * * * * * * * * GLOBAL VARIABLES * * * * * * * * * */
var sprite_sheet = document.getElementById("sprite_sheet");
var lock_rot_img = document.getElementById("lock_rot_img");
var lock_img     = document.getElementById("lock_img");

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
			Drawer.addItem(p,dragField);
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
		Drawer.addItem(p,dragField);
		dragField = null;
	}
};

var target_needed = GameData[0][2];
var num_targets = target_needed;
var playing = 0;

/* * * * * * * * * * RENDERING METHOD * * * * * * * * * */
render = function () {
	
	ctx.clearRect(0,0,canvas.width,canvas.height);
	
	Map.draw();
	Drawer.draw();
	if (isDraggingField()) {
		dragField.draw();
	}
	LaserDraw.draw();
	PlayButton.draw();
	ResetButton.draw();
	BackButton.draw();
	
	ctx.font="30px Verdana";
	ctx.fillText("Célpontok száma: " + num_targets,0,canvas.height - 21);
	
	if (playing == 1) {
		try_play(false);
	}
};



var try_play = function(start) {
	
	if (start) {
		LaserDraw.reset();
		
		LaserDraw.step();
		
		for (x of Map.fields) {
			for (y of x) {
				if (y.field != null) {
					y.field.washit = false;
				}				
			}
		}
	} else {
		if (LaserDraw.finished()) {
			if (!LaserDraw.started()) {
				playing = 0;
				
				if (num_targets == 0) {
					
					var gates_done = true;
					
					for (x of Map.fields) {
						for (y of x) {
							if (gates_done && y.field != null && y.field.type == FieldT.Gate && y.field.washit == false) {
								gates_done = false;
							}
						}
					}
					
					if (gates_done) {
						map_done();
						gen_table();						
					} else {
						console.log("not all gates were hit");
						num_targets = target_needed;
					}
				} else {
					num_targets = target_needed;
				}
				
			} else {
				LaserDraw.step();
			}
		}
	}
};


/* * * * * * * * * * LISTENERS * * * * * * * * * */
var dragMode = 0;
var dragBegP = vec2();
var dragTime = new Date();

var lastMouseP;

var onMouseLeftPress = function(p) {
	if (isDraggingField())
	{
		handleDragDrop(p);
	}
	else
	{
		PlayButton.handlePress(p);
		ResetButton.handlePress(p);
		BackButton.handlePress(p);
		Drawer.handlePress(p);
		Map.handlePress(p);
		dragMode  = 0;
		dragBegP  = p;
		dragTime  = new Date();
	}
}

window.onkeydown = function(e) {
	if (e.keyCode == 82) // r
	{
		if (isDraggingField())
		{
			dragField.setRot(dragField.rot + 90);
		} else {
			Drawer.handleRightPress(lastMouseP);
			Map.handleRightPress(lastMouseP);
		}
	}
	
	if (e.keyCode == 84) // t
	{
		onMouseLeftPress(lastMouseP);
	}
	
	if (e.keyCode == 65) 
	{
		LaserDraw.step();
	}
	
	if (e.keyCode == 66) 
	{
		playing = 1;
		try_play(true);
	}
	
	if (e.keyCode == 67) 
	{
		localStorage.clear();
		map_states = [];
		gen_table();
	}
	
	if ((e.keyCode >= 48 && e.keyCode <= 57) || 
		(e.keyCode >= 96 && e.keyCode <= 105))
	{
		var n = e.keyCode - 48;
		if (n > 9) n += 48 - 96;
		
		if (!isDraggingField()) {
			dragMode = 2;
			Drawer.handlePress(Drawer.getPosFromIndex(n));
			dragField.setPos(lastMouseP);
		} else {
			handleDragDrop(Drawer.getPosFromIndex(n).add(vec2(canvas.width,0)));
		}
	}
};

window.onkeyup = function(e) {
	
};

canvas.onmouseleave = function(e) {
	if (isDraggingField())
	{
		var p = vec2(e.layerX - canvas.offsetLeft,e.layerY - canvas.offsetTop);
		Drawer.addItem(p,dragField);
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
		onMouseLeftPress(p);
	}
};

canvas.onmouseup = function(e) {
	if (e.button == 0)
	{
		var p = vec2(e.layerX - canvas.offsetLeft,e.layerY - canvas.offsetTop);
		
		PlayButton.handleRelease(p);
		ResetButton.handleRelease(p);
		BackButton.handleRelease(p);
		
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
	var p = vec2(e.layerX - canvas.offsetLeft,e.layerY - canvas.offsetTop);
	lastMouseP = p;
	
	PlayButton.handleHover(p);
	ResetButton.handleHover(p);
	BackButton.handleHover(p);
	
	if (isDraggingField())
	{
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