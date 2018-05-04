function PPU() {
  this.PPUCTRL = { value: 0, arr: new Uint8Array(8) }; //$2000	VPHB SINN	NMI enable (V), PPU master/slave (P), sprite height (H), background tile select (B), sprite tile select (S), increment mode (I), nametable select (NN)
  this.PPUMASK = { value: 0, arr: new Uint8Array(8) }; //$2001	BGRs bMmG	color emphasis (BGR), sprite enable (s), background enable (b), sprite left column enable (M), background left column enable (m), greyscale (G)
  this.PPUSTATUS = { value: 0, arr: new Uint8Array(8) }; //$2002	VSO- ----	vblank (V), sprite 0 hit (S), sprite overflow (O), read resets write pair for $2005/2006
  this.OAMADDR = { value: 0, arr: new Uint8Array(8) }; //	$2003	aaaa aaaa	OAM read/write address
  this.OAMDATA = { value: 0, arr: new Uint8Array(8) }; //$2004	dddd dddd	OAM data read/write
  this.PPUSCROLL = { value: 0, arr: new Uint8Array(8) }; //$2005	xxxx xxxx	fine scroll position (two writes: X, Y)
  this.PPUADDR = { value: 0, arr: new Uint8Array(8) }; //$2006	aaaa aaaa	PPU read/write address (two writes: MSB, LSB)
  this.PPUDATA = { value: 0, arr: new Uint8Array(8) }; //$2007	dddd dddd	PPU data read/write
  this.OAMDMA = { value: 0, arr: new Uint8Array(8) }; // $4014	aaaa aaaa	OAM DMA high address

  this.mapper = new Mappers();
  this.canvas = {};

  this.memory = new Uint8Array(16 * 1024);
  this.oamRam = new Uint8Array(256);
  this.oamRam2 = new Uint8Array(32);

  this.rom = null;
  this.cpu = null;

  this.palette = (new Constants()).palette;

  this.nameTableRegister = { value: 0, arr: new Array(8) };
  this.attributeTableLowRegister = { value: 0, arr: new Array(16) };
  this.attributeTableHighRegister = { value: 0, arr: new Array(16) };
  this.patternTableLowRegister = { value: 0, arr: new Array(16) };
  this.patternTableHighRegister = { value: 0, arr: new Array(16) };

  this.nameTableLatch = 0;
  this.attributeTableLowLatch = 0;
  this.attributeTableHighLatch = 0;
  this.patternTableLowLatch = 0;
  this.patternTableHighLatch = 0

  //

  this.fineXScroll = 0;
  this.currentVRamAddress = 0;
  this.temporalVRamAddress = 0;

  //

  this.vRamReadBuffer = 0;
  this.registerFirstStore = true;


  this.scanLine = 0;
  this.cycle = 0;
  this.frame = 0;

  this.dup = {};

  this.init = function(rom, cpu, cxt){
    this.setRom(rom);
    this.setCPU(cpu);
    this.powerOn(rom);
    this.initCanvas(cxt);
  }
  this.setRom = function(rom) {
    this.rom = rom;
  }
  this.setCPU = function(cpu) {
    this.cpu = cpu;
  }

  this.powerOn = function() {
    this.writePPUSTATUS(0x80);
  }

  this.run = function () {
    // console.log('ppu run');
    this.render();
    this.updateShiftRegisters();
    this.updateFlags();
    this.updateScrollCounters();
    this.updateCycle();
  }


  this.readPPUCTRL = function() {
    return this.PPUCTRL.value;
  }
  this.writePPUCTRL = function(value) {
    this.PPUCTRL.value = value;
    for(var i=0 ; i<8 ;i++)
      this.PPUCTRL.arr[i] = (value >> i) & 1;
  }
  this.setPPUCTRL = function(indicator, value) {
    // PPUCTRL ($2000)
    // 7	Generate an NMI at the start of the vertical blanking interval vblank (0: off; 1: on)
    // 6	PPU master/slave select
    // 5	Sprite size (0: 8x8; 1: 8x16)
    // 4	Background pattern table address (0: $0000; 1: $1000)
    // 3	Sprite pattern table address for 8x8 sprites (0: $0000; 1: $1000)
    // 2	VRAM address increment per CPU read/write of PPUDATA (0: increment by 1, going across; 1: increment by 32, going down)
    // 1 & 0	Base nametable address (0 = $2000; 1 = $2400; 2 = $2800; 3 = $2C00)

    switch(indicator) {
      case 'V': this.PPUCTRL.arr[7] = value; break;
      case 'P': this.PPUCTRL.arr[6] = value; break;
      case 'H': this.PPUCTRL.arr[5] = value; break;
      case 'B': this.PPUCTRL.arr[4] = value; break;
      case 'S': this.PPUCTRL.arr[3] = value; break;
      case 'I': this.PPUCTRL.arr[2] = value; break;
      case 'N':
        var bits = Number(value).toString(2).split('');
        this.PPUCTRL.arr[1] = bits[0];
        this.PPUCTRL.arr[0] = bits[1];
        break;
      default: break;
    }
    this.PPUCTRL.value = parseInt(this.PPUCTRL.arr.reverse().join(''), 2);
  }
  this.getPPUCTRL = function(indicator) {
    // V P H B S I N N
    // 7 6 5 4 3 2 1 0

    switch(indicator) {
      case 'V': return parseInt(this.PPUCTRL.arr[7]);
      case 'P': return parseInt(this.PPUCTRL.arr[6]);
      case 'H': return parseInt(this.PPUCTRL.arr[5]);
      case 'B': return parseInt(this.PPUCTRL.arr[4]);
      case 'S': return parseInt(this.PPUCTRL.arr[3]);
      case 'I': return parseInt(this.PPUCTRL.arr[2]);
      case 'N': return parseInt(this.PPUCTRL.arr[1] + this.PPUCTRL.arr[0], 2);
      default: break;
    }
  }

  this.readPPUMASK = function() {
    return this.PPUMASK.value;
  }
  this.writePPUMASK = function(value) {
    this.PPUMASK.value = value;
    for(var i=0 ; i<8 ;i++)
      this.PPUMASK.arr[i] = (value >> i) & 1;
  }
  this.setPPUMASK = function(indicator, value) {
    // B G R s b M m g
    // 7 6 5 4 3 2 1 0
    // BGRs bMmG
    // |||| ||||
    // |||| |||+- Greyscale (0: normal color, 1: produce a greyscale display)
    // |||| ||+-- 1: Show background in leftmost 8 pixels of screen, 0: Hide
    // |||| |+--- 1: Show sprites in leftmost 8 pixels of screen, 0: Hide
    // |||| +---- 1: Show background
    // |||+------ 1: Show sprites
    // ||+------- Emphasize red*
    // |+-------- Emphasize green*
    // +--------- Emphasize blue*

    switch(indicator) {
      case 'B': this.PPUMASK.arr[7] = value; break;
      case 'G': this.PPUMASK.arr[6] = value; break;
      case 'R': this.PPUMASK.arr[5] = value; break;
      case 's': this.PPUMASK.arr[4] = value; break;
      case 'b': this.PPUMASK.arr[3] = value; break;
      case 'M': this.PPUMASK.arr[2] = value; break;
      case 'm': this.PPUMASK.arr[1] = value; break;
      case 'g': this.PPUMASK.arr[0] = value; break;
        break;
      default: break;
    }
    this.PPUMASK.value = parseInt(this.PPUMASK.arr.reverse().join(''), 2);

  }
  this.getPPUMASK = function(indicator) {
    // B G R s b M m g
    // 7 6 5 4 3 2 1 0

    switch(indicator) {
      case 'B': return parseInt(this.PPUMASK.arr[7]);
      case 'G': return parseInt(this.PPUMASK.arr[6]);
      case 'R': return parseInt(this.PPUMASK.arr[5]);
      case 's': return parseInt(this.PPUMASK.arr[4]);
      case 'b': return parseInt(this.PPUMASK.arr[3]);
      case 'M': return parseInt(this.PPUMASK.arr[2]);
      case 'm': return parseInt(this.PPUMASK.arr[1]);
      case 'g': return parseInt(this.PPUMASK.arr[0]);
      default: break;
    }
  }

  this.readPPUSTATUS = function() {
    return this.PPUSTATUS.value;
  }
  this.writePPUSTATUS = function(value) {
    this.PPUSTATUS.value = value;
    for(var i=0 ; i<8 ;i++)
      this.PPUSTATUS.arr[i] = (value >> i) & 1;
  }
  this.setPPUSTATUS = function(indicator, value) {
    // V S O
    // 7 6 5 4 3 2 1 0
    // O: Sprite overflow
    // S: Sprite 0 hit
    // V: vertical blank

    switch(indicator) {
      case 'V': this.PPUSTATUS.arr[7] = value; break;
      case 'S': this.PPUSTATUS.arr[6] = value; break;
      case 'O': this.PPUSTATUS.arr[5] = value; break;
      default: break;
    }

    this.PPUSTATUS.value = parseInt(this.PPUSTATUS.arr.reverse().join(''), 2);
  }
  this.getPPUSTATUS = function(indicator) {
    // V S O
    // 7 6 5 4 3 2 1 0

    switch(indicator) {
      case 'V': return parseInt(this.PPUSTATUS.arr[7]);
      case 'S': return parseInt(this.PPUSTATUS.arr[6]);
      case 'O': return parseInt(this.PPUSTATUS.arr[5]);
      default: break;
    }
  }

  this.readOAMDATA = function() {
    return this.OAMDATA.value;
  }
  this.writeOAMDATA = function(value) {
    this.OAMDATA.value = value;
  }

  this.readPPUSCROLL = function() {
    return this.PPUSCROLL.value;
  }
  this.writePPUSCROLL = function(value) {
    this.PPUSCROLL.value = value;
  }

  this.readPPUADDR = function() {
    return this.PPUADDR.value;
  }
  this.writePPUADDR = function(value) {
    this.PPUADDR.value = value;
  }
  this.increasePPUADDR = function() {
    this.PPUADDR.value++;
  }


  this.readPPUDATA= function() {
    return this.PPUDATA.value;
  }
  this.writePPUDATA = function(value) {
    this.PPUDATA.value = value;
  }

  this.readOAMDMA= function() {
    return this.OAMDMA.value;
  }
  this.writeOAMDMA = function(value) {
    this.OAMDMA.value = value;
  }

  this.readOAMADDR= function() {
    return this.OAMADDR.value;
  }
  this.writeOAMADDR = function(value) {
    this.OAMADDR.value = value;
  }
  this.increaseOAMADDR = function(value) {
    this.OAMADDR.value++;
  }

  this.readRegisters = function(address) {
    if(address === 0x2002) {
      var value = this.readPPUSTATUS();
      this.setPPUSTATUS('V', 0);
      this.registerFirstStore = true;
      return value;
    }

    if(address === 0x2004) {
      return this.readOAMDATA();
    }

    if(address === 0x2007) {
      var value;

      if((this.currentVRamAddress & 0x3FFF) >= 0 &&
          (this.currentVRamAddress & 0x3FFF) < 0x3F00) {
        value = this.vRamReadBuffer;
        this.vRamReadBuffer = this.readMemory(this.currentVRamAddress);
      } else {
        value = this.readMemory(this.currentVRamAddress);
        this.vRamReadBuffer = value;
      }

      this.incrementMemoryAddress();
      return value;

    }


    return 0;
  }
  this.writeRegisters = function(address, value) {
    if(address === 0x2000) {
      this.writePPUCTRL(value);
      this.temporalVRamAddress &= ~0xC00;
      this.temporalVRamAddress |= (value & 0x3) << 10;
    }
    if(address === 0x2001) {
      this.writePPUMASK(value);
    }
    if(address === 0x2003) {
      this.writeOAMADDR(value);
    }
    if(address === 0x2004) {
      this.writeOAMDATA(value);
      this.oamRam[this.readOAMADDR()] = value & 0xff;
      this.increaseOAMADDR();
    }
    if(address === 0x2005) {
      this.writePPUSCROLL(value);

      if(this.registerFirstStore === true) {
        this.fineXScroll = value & 0x7;
        this.temporalVRamAddress &= ~0x1F;
        this.temporalVRamAddress |= (value >> 3) & 0x1F;
      } else {
        this.temporalVRamAddress &= ~0x73E0;
        this.temporalVRamAddress |= (value & 0xF8) << 2;
        this.temporalVRamAddress |= (value & 0x7) << 12;
      }

      this.registerFirstStore = !this.registerFirstStore;

    }
    if(address === 0x2006) {
      if(this.registerFirstStore === true) {
        this.temporalVRamAddress &= ~0x7F00;
        this.temporalVRamAddress |= (value & 0x3F) << 8;
      } else {
        this.writePPUADDR(value);
        this.temporalVRamAddress &= ~0xFF;
        this.temporalVRamAddress |= (value & 0xFF);
        this.currentVRamAddress = this.temporalVRamAddress;
      }

      this.registerFirstStore = !this.registerFirstStore;
    }
    if(address === 0x2007) {
      this.writePPUDATA(value);
      this.writeMemory(this.currentVRamAddress, value);
      this.incrementMemoryAddress();
    }
    if(address === 0x4014) {
      return this.writeOAMDMA(value);
      var offset = value * 0x100;

      for(var i = this.readOAMADDR(); i < 256; i++)
        this.oamRam[i] = this.cpu.readMemory(offset + i);

    }
  }

  this.readMemory = function(address) {
    // https://wiki.nesdev.com/w/index.php/PPU_memory_map
    // 0x0000 - 0x1FFF: chr-rom
    // 0x2000 - 0x2FFF: nametable 0-3
    // 0x3000 - 0x3EFF: mirror of nametable 0-3
    // 0x3F00 - 0x3F1F: palette
    // 0x3F20 - 0x3FFF: mirror of palette
    //

    address = address & 0x3FFF;  // just in case

    if(address < 0x2000 && this.rom.header.chr_num !== 0) {
      var mappedAddr = this.mapper.map(address, this.rom.header);
      return this.rom.prg[mappedAddr];
    }

    if(address >= 0x2000 && address < 0x3F00)
      return this.memory[this.getNameTableAddressWithMirroring(address & 0x2FFF)];

    if(address >= 0x3F00 && address < 0x4000)
      address = address & 0x3F1F;

    if(address === 0x3F10)
      address = 0x3F00;

    if(address === 0x3F14)
      address = 0x3F04;

    if(address === 0x3F18)
      address = 0x3F08;

    if(address === 0x3F1C)
      address = 0x3F0C;


    return this.memory[address];
  }
  this.writeMemory = function(address, value) {
    address = address & 0x3FFF;  // just in case

    // https://wiki.nesdev.com/w/index.php/PPU_memory_map
    // 0x0000 - 0x1FFF: chr-rom
    // 0x2000 - 0x2FFF: nametable 0-3
    // 0x3000 - 0x3EFF: mirror of nametable 0-3
    // 0x3F00 - 0x3F1F: palette
    // 0x3F20 - 0x3FFF: mirror of palette

    if(address < 0x2000 && this.rom.header.chr_num !== 0) {
      var mappedAddr = this.mapper.map(address, this.rom.header);
      this.rom.prg[mappedAddr] = value;
      return;
    }

    if(address >= 0x2000 && address < 0x3F00) {
      this.memory[this.getNameTableAddressWithMirroring(address & 0x2FFF)] = value;
      return;
    }

    if(address >= 0x3F00 && address < 0x4000)
      address = address & 0x3F1F;

    if(address === 0x3F10)
      address = 0x3F00;

    if(address === 0x3F14)
      address = 0x3F04;

    if(address === 0x3F18)
      address = 0x3F08;

    if(address === 0x3F1C)
      address = 0x3F0C;

    this.memory[address] = value;
  }
  this.incrementMemoryAddress = function() {
    this.currentVRamAddress += this.getPPUCTRL('I') ? 32 : 1;
    this.currentVRamAddress &= 0x7FFF;
    this.writePPUADDR(this.currentVRamAddress & 0xFF);
  }

  this.getNameTableAddressWithMirroring = function(address) {
    address = address & 0x2FFF;

    var baseAddress = 0;

    switch(this.rom.header.mirroring) {
      case 'SINGLE_SCREEN':
        baseAddress = 0x2000;
        break;

      case 'HORIZONTAL':
        if(address >= 0x2000 && address < 0x2400)
          baseAddress = 0x2000;
        else if(address >= 0x2400 && address < 0x2800)
          baseAddress = 0x2000;
        else if(address >= 0x2800 && address < 0x2C00)
          baseAddress = 0x2400;
        else
          baseAddress = 0x2400;

        break;

      case 'VERTICAL':
        if(address >= 0x2000 && address < 0x2400)
          baseAddress = 0x2000;
        else if(address >= 0x2400 && address < 0x2800)
          baseAddress = 0x2400;
        else if(address >= 0x2800 && address < 0x2C00)
          baseAddress = 0x2000;
        else
          baseAddress = 0x2400;

        break;

      case 'FOUR_SCREEN':
        if(address >= 0x2000 && address < 0x2400)
          baseAddress = 0x2000;
        else if(address >= 0x2400 && address < 0x2800)
          baseAddress = 0x2400;
        else if(address >= 0x2800 && address < 0x2C00)
          baseAddress = 0x2800;
        else
          baseAddress = 0x2C00;

        break;
    }

    return baseAddress | (address & 0x3FF);
  }

  this.initCanvas = function(ctx) {
    this.canvas.ctx = ctx;
    this.canvas.imageData = this.canvas.ctx.getImageData(0, 0, 256, 240);
    this.canvas.pixelData = new Uint32Array(this.canvas.imageData.data.buffer);
  }

  this.setCanvasdata = function (x, y, colurHex) {
    var index = y * 256 + x;
    this.canvas.pixelData[index] = colurHex;
  }

  this.renderCanvas = function () {



    this.canvas.ctx.putImageData(this.canvas.imageData,0,0);
  }

  this.loadBit = function(register, index) {
    return (register.value >> index) & 1;
  }

  this.shift = function(register, value) {
    value = value & 1;  // just in case
    var carry = this.loadBit(register, register.arr.length - 1);
    register.value = (register.value << 1) | value;
    return carry;
  },
  this.getBackgroundPixel = function() {

    var offset = 15 - this.fineXScroll;

    var lsb = (this.loadBit(this.patternTableHighRegister.value, offset) << 1) |
                this.loadBit(this.patternTableLowRegister.value, offset);

    var msb = (this.loadBit(this.attributeTableHighRegister.value, offset) << 1) |
                this.loadBit(this.attributeTableLowRegister.value, offset);

    var index = (msb << 2) | lsb;

    // TODO: fix me

    if(this.getPPUSTATUS('g') === 1)
      index = index & 0x30;

    var hexIndex = this.readMemory(0x3F00 + index);

    this.dup[hexIndex] = hexIndex;

    return this.palette[hexIndex];
  }
  this.render = function() {
    if(this.cycle >= 257 || this.scanLine >= 240 || this.cycle === 0)
      return;

    var x = this.cycle - 1 ;
    var y = this.scanLine;

    var backgroundPixel = this.getBackgroundPixel();

    this.setCanvasdata(x, y, backgroundPixel);
  }
  this.updateShiftRegisters = function() {
    if(this.scanLine >= 240 && this.scanLine <= 260)
      return;

    if((this.cycle >= 1 && this.cycle <= 256) ||
       (this.cycle >= 329 && this.cycle <= 336)) {
      this.shift(this.patternTableLowRegister, 0);
      this.shift(this.patternTableHighRegister, 0);
      this.shift(this.attributeTableLowRegister, 0);
      this.shift(this.attributeTableHighRegister, 0);
    }
  }
  this.updateFlags = function() {
    if(this.cycle === 1) {
      if(this.scanLine === 241) {
        this.setPPUSTATUS('V', 1);
        this.renderCanvas();

      } else if(this.scanLine === 261) {
        this.setPPUSTATUS('V', 0);
        this.setPPUSTATUS('S', 0);
        this.setPPUSTATUS('O', 0);
      }
    }

  }
  this.updateScrollCounters = function() {
    if(this.getPPUMASK('b') === 0 && this.getPPUMASK('s') === 0)
      return;

    if(this.scanLine >= 240 && this.scanLine <= 260)
      return;

    if(this.scanLine === 261) {
      if(this.cycle >= 280 && this.cycle <= 304) {
        this.currentVRamAddress &= ~0x7BE0;
        this.currentVRamAddress |= (this.temporalVRamAddress & 0x7BE0)
      }
    }

    if(this.cycle === 0 || (this.cycle >= 258 && this.cycle <= 320))
      return;

    if((this.cycle % 8) === 0) {
      var v = this.currentVRamAddress;

      if((v & 0x1F) === 31) {
        v &= ~0x1F;
        v ^= 0x400;
      } else {
        v++;
      }

      this.currentVRamAddress = v;
    }

    if(this.cycle === 256) {
      var v = this.currentVRamAddress;

      if((v & 0x7000) !== 0x7000) {
        v += 0x1000;
      } else {
        v &= ~0x7000;
        var y = (v & 0x3E0) >> 5;

        if(y === 29) {
          y = 0;
          v ^= 0x800;
        } else if(y === 31) {
          y = 0;
        } else {
          y++;
        }

        v = (v & ~0x3E0) | (y << 5);
      }

      this.currentVRamAddress = v;
    }

    if(this.cycle === 257) {
      this.currentVRamAddress &= ~0x41F;
      this.currentVRamAddress |= (this.temporalVRamAddress & 0x41F)
    }
  }
  this.updateCycle = function() {
    this.cycle++;

    if(this.cycle > 340) {
      this.cycle = 0;
      this.scanLine++;

      if(this.scanLine > 261) {
        this.scanLine = 0;
        this.frame++;
      }
    }
  }

}
