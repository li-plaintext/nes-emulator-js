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

  this.memory = new Array(16 * 1024);

  this.palette = (new Constants()).palette;

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
      case 'V': this.PPUCTRL[0] = value; break;
      case 'P': this.PPUCTRL[1] = value; break;
      case 'H': this.PPUCTRL[2] = value; break;
      case 'B': this.PPUCTRL[3] = value; break;
      case 'S': this.PPUCTRL[4] = value; break;
      case 'I': this.PPUCTRL[5] = value; break;
      case 'N':
        var bits = Number(value).toString(2).split('');
        this.PPUCTRL[6] = bits[0];
        this.PPUCTRL[7] = bits[1];
        break;
      default: break;
    }
  }
  this.getPPUCTRL = function(indicator) {
    // V P H B S I N N
    // 7 6 5 4 3 2 1 0

    switch(indicator) {
      case 'V': return parnseInt(this.PPUCTRL[0]);
      case 'P': return parnseInt(this.PPUCTRL[1]);
      case 'H': return parnseInt(this.PPUCTRL[2]);
      case 'B': return parnseInt(this.PPUCTRL[3]);
      case 'S': return parnseInt(this.PPUCTRL[4]);
      case 'I': return parnseInt(this.PPUCTRL[5]);
      case 'N': return parnseInt(this.PPUCTRL[6] + this.PPUCTRL[7], 2);
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
      case 'B': this.PPUMASK[0] = value; break;
      case 'G': this.PPUMASK[1] = value; break;
      case 'R': this.PPUMASK[2] = value; break;
      case 's': this.PPUMASK[3] = value; break;
      case 'b': this.PPUMASK[4] = value; break;
      case 'M': this.PPUMASK[5] = value; break;
      case 'm': this.PPUMASK[6] = value; break;
      case 'G': this.PPUMASK[7] = value; break;
        break;
      default: break;
    }
  }
  this.getPPUMASK = function(indicator) {
    // B G R s b M m G
    // 7 6 5 4 3 2 1 0

    switch(indicator) {
      case 'B': return parnseInt(this.PPUMASK[0]);
      case 'G': return parnseInt(this.PPUMASK[1]);
      case 'R': return parnseInt(this.PPUMASK[2]);
      case 's': return parnseInt(this.PPUMASK[3]);
      case 'b': return parnseInt(this.PPUMASK[4]);
      case 'M': return parnseInt(this.PPUMASK[5]);
      case 'm': return parnseInt(this.PPUMASK[6]);
      case 'G': return parnseInt(this.PPUMASK[7]);
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
      case 'V': this.PPUSTATUS[0] = value; break;
      case 'S': this.PPUSTATUS[1] = value; break;
      case 'O': this.PPUSTATUS[2] = value; break;
      default: break;
    }
  }
  this.getPPUSTATUS = function(indicator) {
    // V S O
    // 7 6 5 4 3 2 1 0

    switch(indicator) {
      case 'V': return parnseInt(this.PPUSTATUS[0]);
      case 'S': return parnseInt(this.PPUSTATUS[1]);
      case 'O': return parnseInt(this.PPUSTATUS[2]);
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

  this.readPPUDATA= function() {
    return this.PPUDATA.value;
  }
  this.writePPUDATA = function(value) {
    this.PPUDATA.value = value;
  }

  this.readPOAMDMA= function() {
    return this.OAMDMA.value;
  }
  this.writeOAMDMA = function(value) {
    this.OAMDMA.value = value;
  }

}
