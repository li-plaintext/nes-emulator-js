function PPU() {
  this.PPUCTRL = { value: 0, arr: new Array(8) }; //$2000	VPHB SINN	NMI enable (V), PPU master/slave (P), sprite height (H), background tile select (B), sprite tile select (S), increment mode (I), nametable select (NN)
  this.PPUMASK = { value: 0, arr: new Array(8) }; //$2001	BGRs bMmG	color emphasis (BGR), sprite enable (s), background enable (b), sprite left column enable (M), background left column enable (m), greyscale (G)
  this.PPUSTATUS = { value: 0, arr: new Array(8) }; //$2002	VSO- ----	vblank (V), sprite 0 hit (S), sprite overflow (O), read resets write pair for $2005/2006
  this.OAMADDR = { value: 0, arr: new Array(8) }; //	$2003	aaaa aaaa	OAM read/write address
  this.OAMDATA = { value: 0, arr: new Array(8) }; //$2004	dddd dddd	OAM data read/write
  this.PPUSCROLL = { value: 0, arr: new Array(8) }; //$2005	xxxx xxxx	fine scroll position (two writes: X, Y)
  this.PPUADDR = { value: 0, arr: new Array(8) }; //$2006	aaaa aaaa	PPU read/write address (two writes: MSB, LSB)
  this.PPUDATA = { value: 0, arr: new Array(8) }; //$2007	dddd dddd	PPU data read/write
  this.OAMDMA = { value: 0, arr: new Array(8) }; // $4014	aaaa aaaa	OAM DMA high address

  this.mapper = new Mappers();

  this.memory = new Array(16 * 1024);
  this.oamRam = new Array(256);
  this.oamRam2 = new Array(32);

  this.rom = null;
  this.cpu = null;

  this.palette = (new Constants()).palette;

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

  this.init = function(rom, cpu){
    this.setRom(rom);
    this.setCPU(cpu);
    this.powerOn(rom);
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

  this.readPPUCTRL = function() {
    return this.PPUCTRL.value;
  }
  this.writePPUCTRL = function(value) {
    this.PPUCTRL.value = value;
    this.PPUCTRL.arr = Number(value).toString(2).split('');
  }
  this.setPPUCTRL = function(indicator, value) {
    // V P H B S I N N
    // 7 6 5 4 3 2 1 0

    switch(indicator) {
      case 'V': this.PPUCTRL.arr[0] = value; break;
      case 'P': this.PPUCTRL.arr[1] = value; break;
      case 'H': this.PPUCTRL.arr[2] = value; break;
      case 'B': this.PPUCTRL.arr[3] = value; break;
      case 'S': this.PPUCTRL.arr[4] = value; break;
      case 'I': this.PPUCTRL.arr[5] = value; break;
      case 'N':
        var bits = Number(value).toString(2).split('');
        this.PPUCTRL.arr[6] = bits[0];
        this.PPUCTRL.arr[7] = bits[1];
        break;
      default: break;
    }
    this.PPUCTRL.value = parseInt(this.PPUCTRL.arr.join(''), 2);
  }
  this.getPPUCTRL = function(indicator) {
    // V P H B S I N N
    // 7 6 5 4 3 2 1 0

    switch(indicator) {
      case 'V': return parseInt(this.PPUCTRL.arr[0]);
      case 'P': return parseInt(this.PPUCTRL.arr[1]);
      case 'H': return parseInt(this.PPUCTRL.arr[2]);
      case 'B': return parseInt(this.PPUCTRL.arr[3]);
      case 'S': return parseInt(this.PPUCTRL.arr[4]);
      case 'I': return parseInt(this.PPUCTRL.arr[5]);
      case 'N': return parseInt(this.PPUCTRL.arr[6] + this.PPUCTRL.arr[7], 2);
      default: break;
    }
  }

  this.readPPUMASK = function() {
    return this.PPUMASK.value;
  }
  this.writePPUMASK = function(value) {
    this.PPUMASK.value = value;
    this.PPUMASK.arr = Number(value).toString(2).split('');
  }
  this.setPPUMASK = function(indicator, value) {
    // B G R s b M m G
    // 7 6 5 4 3 2 1 0

    switch(indicator) {
      case 'B': this.PPUMASK.arr[0] = value; break;
      case 'G': this.PPUMASK.arr[1] = value; break;
      case 'R': this.PPUMASK.arr[2] = value; break;
      case 's': this.PPUMASK.arr[3] = value; break;
      case 'b': this.PPUMASK.arr[4] = value; break;
      case 'M': this.PPUMASK.arr[5] = value; break;
      case 'm': this.PPUMASK.arr[6] = value; break;
      case 'G': this.PPUMASK.arr[7] = value; break;
        break;
      default: break;
    }
    this.PPUMASK.value = parseInt(this.PPUMASK.arr.join(''), 2);

  }
  this.getPPUMASK = function(indicator) {
    // B G R s b M m G
    // 7 6 5 4 3 2 1 0

    switch(indicator) {
      case 'B': return parseInt(this.PPUMASK.arr[0]);
      case 'G': return parseInt(this.PPUMASK.arr[1]);
      case 'R': return parseInt(this.PPUMASK.arr[2]);
      case 's': return parseInt(this.PPUMASK.arr[3]);
      case 'b': return parseInt(this.PPUMASK.arr[4]);
      case 'M': return parseInt(this.PPUMASK.arr[5]);
      case 'm': return parseInt(this.PPUMASK.arr[6]);
      case 'G': return parseInt(this.PPUMASK.arr[7]);
      default: break;
    }
  }

  this.readPPUSTATUS = function() {
    return this.PPUSTATUS.value;
  }
  this.writePPUSTATUS = function(value) {
    this.PPUSTATUS.value = value;
    this.PPUSTATUS.arr = Number(value).toString(2).split('');
  }
  this.setPPUSTATUS = function(indicator, value) {
    // V S O
    // 7 6 5 4 3 2 1 0

    switch(indicator) {
      case 'V': this.PPUSTATUS.arr[0] = value; break;
      case 'S': this.PPUSTATUS.arr[1] = value; break;
      case 'O': this.PPUSTATUS.arr[2] = value; break;
      default: break;
    }

    this.PPUSTATUS.value = parseInt(this.PPUSTATUS.arr.join(''), 2);
  }
  this.getPPUSTATUS = function(indicator) {
    // V S O
    // 7 6 5 4 3 2 1 0

    switch(indicator) {
      case 'V': return parseInt(this.PPUSTATUS.arr[0]);
      case 'S': return parseInt(this.PPUSTATUS.arr[1]);
      case 'O': return parseInt(this.PPUSTATUS.arr[2]);
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
    if(address === 0x2003) {
      return this.readOAMADDR();
    }
    if(address === 0x2004) {
      return this.readOAMDATA();
    }
    if(address === 0x2006) {
      return this.readPPUADDR();
    }
    if(address === 0x2007) {
      return this.readPPUDATA();
    }
    if(address === 0x4014) {
      return this.readOAMDMA();
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
      this.oamRam[this.readOAMADDR()] = value;
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

    if(address < 0x2000 && this.rom.header.chr_num !== 0) {
      var mappedAddr = this.mapper.map(address, this.rom.header);
      return this.rom.prg[mappedAddr];
    }
    return this.memory[address];
  }
  this.writeMemory = function(address, value) {
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

    this.memory[address] = value;
  }
  this.incrementMemoryAddress = function() {
    this.currentVRamAddress += this.getPPUCTRL('I') ? 32 : 1;
    this.currentVRamAddress &= 0x7FFF;
    this.writePPUADDR(this.currentVRamAddress & 0xFF);
  }
}
