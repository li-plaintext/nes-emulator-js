// The stack instructions (PHA, PLA, PHP, PLP, JSR, RTS, BRK, RTI)

function NES() {
  this.length16K = 16384;
  this.length8K = 8192;
  this.length1K = 1024;
  this.offset = 0;
  this.opcodes = (new Constants()).opcodes;
  this.interupts = (new Constants()).interupts;
  this.mapper = new Mappers();
  this.statusMapping = {
    'C': 0,
    'Z': 1,
    'I': 2,
    'D': 3,
    'B': 4,
    '-': 5,
    'V': 6,
    'N': 7
  };

  this.a = null; //Accumulator
  this.x = null; //Indexs
  this.y = null; //Indexs
  this.pc = null; //Progam counter
  this.s = null; //Stack Register
  this.p = new Array(8); //Status Register
  this.momery = new Uint8Array(this.length1K * 64); //momery
  this.rom = {}; // cartridge


  this.init = function(buffer) {
    this.analyzerRom(buffer);
    this.powerOn();
  }

  this.run = function() {
    var currentArr = this.getPC();
    this.increasePC();
    var opcObj = this.opcodes[this.readMemory(currentArr)];
    this.processInstruction(opcObj);
  }

  this.analyzerRom = function(buffer) {
    var header = new Uint8Array(buffer.slice(0, 16));

    var trainer = (header[6] & (1 << 2)) === 4;

    var header = {
      'prg_num': header[4],
      'chr_num': header[5],
      'flag_6': header[6],
      'flag_7': header[7],
      'prg_ram_num': header[8],
      'flag_9': header[9],
      'trainer': trainer,
    }

    this.rom.rowData = buffer;
    this.rom.header = header;
    this.rom.prg = new Uint8Array(buffer.slice(16, 16 + (this.length16K * this.rom.header.prg_num))) ;
  }

  this.processInstruction = function(opcObj) {
    switch(opcObj.instruction){
      case 'ADC':
        debug('ADC');
        break;
      case 'AND':
        debug('ADC');
        break;
      case 'ASL':
        debug('ASL');
        break;

      case 'BCC':
        debug('BCC');
        break;
      case 'BCS':
        debug('BCS');
        break;
      case 'BEQ':
        debug('BEQ');
        break;
      case 'BIT':
        debug('BIT');
        var aValue = this.a;
        var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
        var result = aValue & memValue;
        this.FlagN(memValue);
        this.FlagZ(result);
        this.FlagV(result);
        break;
      case 'BMI':
        debug('BMI');
        break;
      case 'BNE':
        debug('BNE');
        break;
      case 'BPL':
        debug('BPL');
        break;
      case 'BRK':
        this.setStatusRegisterFlag('B', 1);
        this.increasePC();
        // debug('BRK');
        break;
      case 'BVC':
        debug('BVC');
        break;
      case 'BVS':
        debug('BVS');
        break;
      case 'CLC':
        debug('CLC');
        break;
      case 'CLD':
        debug('CLD');
        break;
      case 'CLI':
        debug('CLI');
        break;
      case 'CLV':
        debug('CLV');
        break;
      case 'CMP':
        debug('CMP');
        break;
      case 'CPX':
        debug('CPX');
        break;
      case 'CPY':
        debug('CPY');
        break;
      case 'DEC':
        debug('DEC');
        break;
      case 'DEX':
        debug('DEX');
        break;
      case 'DEY':
        debug('DEY');
        break;

      case 'EOR':
        debug('EOR');
        break;

      case 'INC': debug('INC'); break;

      case 'INX':
        debug('INX');
        this.x++;
        this.FlagN(value);
        this.FlagZ(value);
        this.processAddressingMode(opcObj.addressing)
        break;
      case 'INY': debug('INY');
        this.y++;
        this.FlagN(value);
        this.FlagZ(value);
        this.processAddressingMode(opcObj.addressing)
        break;

      case 'JMP': debug('JMP'); break;
      case 'JSR': debug('JSR'); break;

      case 'LDA': debug('LDA'); break;
      case 'LDY': debug('LDY'); break;
      case 'LDX':
        debug('LDX');
        var value =  this.readMemory(this.processAddressingMode(opcObj.addressing));
        this.x = value;
        this.FlagN(value);
        this.FlagZ(value);
        break;
      case 'LSR': debug('LSR'); break;

      case 'NOP': debug('NOP'); break;

      case 'ORA': debug('ORA'); break;

      case 'PHA': debug('PHA'); break;
      case 'PHP': debug('PHP'); break;

      case 'PLA': debug('PLA'); break;
      case 'PLP': debug('PLP'); break;

      case 'ROL': debug('ROL'); break;
      case 'ROR': debug('ROR'); break;
      case 'RTI': debug('RTI'); break;
      case 'RTS': debug('RTS'); break;

      case 'SBC': debug('SBC'); break;
      case 'SEC': debug('SEC'); break;
      case 'SED': debug('SED'); break;
      case 'SEI':
        this.setStatusRegisterFlag('I', 1);
        debug('SEI');
        break;
      case 'STA': debug('STA'); break;
      case 'STX':
        debug('STX');
        var memAddr = this.processAddressingMode(opcObj.addressing);
        this.writeMemory(memAddr, this.x);
        break;
      case 'STY': debug('STY'); break;

      case 'TAX': debug('TAX'); break;
      case 'TAY': debug('TAY'); break;
      case 'TSX':
        this.s = this.a;
        this.processAddressingMode(opcObj.addressing);
        debug('TSX');
        break;
      case 'TXA': debug('TXA'); break;
      case 'TXS': debug('TXS'); break;
      case 'TYA': debug('TYA'); break;

      case 'INV': debug('do nothing'); break;

      default: debug('missing') ;break;
    }

  }

  this.processAddressingMode = function(opcObj) {
    switch(opcObj){
      case 'IMPLIED':
        // Bytes 1
        break;
      case 'IMMEDIATE':
        // Bytes 2
        debug('IMMEDIATE bytes');

        var currentArr = this.getPC();
        this.increasePC();

        return currentArr;
        break;

      case 'ACCUMULATOR':
        // Bytes 1
        break;

      case 'ZERO_PAGE':
        // Bytes 2
        debug('ZERO_PAGE bytes', this.rom.prg[++this.offset]);
      break;

      case 'ABSOLUTE':
        // Bytes 3
        return this.getPCby2Bytes();
        break;
      case 'INDEXED_ABSOLUTE_X':
        // Bytes 3
        debug('INDEXED_ABSOLUTE_X bytes', this.rom.prg[++this.offset]);
        debug('INDEXED_ABSOLUTE_X bytes', this.rom.prg[++this.offset]);
        break;
      case 'INDEXED_ABSOLUTE_Y':
        // Bytes 3
        debug('INDEXED_ABSOLUTE_Y bytes', this.rom.prg[++this.offset]);
        debug('INDEXED_ABSOLUTE_Y bytes', this.rom.prg[++this.offset]);
        break;

      case 'RELATIVE':
        // Bytes 2
        debug('RELATIVE bytes', this.rom.prg[++this.offset]);
        break;

      case 'INDIRECT':
        // Bytes 3
        debug('INDIRECT bytes', this.rom.prg[++this.offset]);
        debug('INDIRECT bytes', this.rom.prg[++this.offset]);
        break;

      case 'INDEXED_INDIRECT_X':
        // Bytes 2
        debug('INDEXED_INDIRECT_X bytes', this.rom.prg[++this.offset]);

        break;
      case 'INDEXED_INDIRECT_Y':
        // Bytes 2
        debug('INDEXED_INDIRECT_Y bytes', this.rom.prg[++this.offset]);
        break;

      case 'INDEXED_ZERO_PAGE_X':
        // Bytes 2
        debug('INDEXED_ZERO_PAGE_X bytes', this.rom.prg[++this.offset]);
        break;
      case 'INDEXED_ZERO_PAGE_Y':
        // Bytes 2
        debug('INDEXED_ZERO_PAGE_Y bytes', this.rom.prg[++this.offset]);
        break;

      default: break;
    }
  }

  this.powerOn = function() {
    /*
      P = $34 (IRQ disabled), 0011 0100 , N V - B D I Z C
      A, X, Y = 0
      S = $FD 1111 1101
      $4017 = $00 (frame irq enabled)
      $4015 = $00 (all channels disabled)
      $4000-$400F = $00 (not sure about $4010-$4013)
    */
    this.x = 0x00;
    this.y = 0x00;
    this.a = 0x00;
    this.setStatusRegister(0x34);
    this.s = 0xFD;
    this.reset();
  }

  this.setStatusRegister = function(value) {
    this.p[0] = (value & 0x01) === 0x01? 1: 0;
    this.p[1] = (value & 0x02) === 0x02? 1: 0;
    this.p[2] = (value & 0x04) === 0x04? 1: 0;
    this.p[3] = (value & 0x08) === 0x08? 1: 0;
    this.p[4] = (value & 0x10) === 0x10? 1: 0;
    this.p[5] = (value & 0x20) === 0x20? 1: 0;
    this.p[6] = (value & 0x40) === 0x40? 1: 0;
    this.p[7] = (value & 0x80) === 0x80? 1: 0;

  }

  this.setStatusRegisterFlag = function(indicator, value) {
    /*
      N V - B D I Z C
      7 6 5 4 3 2 1 0
     */
     this.p[this.statusMapping[indicator]] = value;
  }
  this.getStatusRegister = function(indicator) {
     return this.p[indicator];
  }

  this.FlagZ = function(value){
    if((value & 0xff) === 0)
      this.setStatusRegisterFlag('Z', 0);
    else
      this.setStatusRegisterFlag('Z', 1);
  }

  this.FlagN = function(value) {
    if((value & (1<<7)) === 0)
      this.setStatusRegisterFlag('N', 0);
    else
      this.setStatusRegisterFlag('N', 1);
  }

  this.FlagV = function(value) {
    if((value & (1<<6)) === 0)
      this.setStatusRegisterFlag('V', 0);
    else
      this.setStatusRegisterFlag('V', 1);
  }

  this.getPC = function() {
    return this.pc;
  }

  this.getPCby2Bytes = function(address) {
    var byte1 = this.readMemory(this.getPC());
    this.increasePC();
    var byte2 = this.readMemory(this.getPC());
    this.increasePC();

    return byte1 | (byte2 << 8);
  }

  this.increasePC = function() {
     return ++this.pc;
  }

  this.readMemory = function (address) {
      // 0x0000 - 0x07FF: 2KB internal RAM
      // 0x0800 - 0x1FFF: Mirrors of 0x0000 - 0x07FF (repeats every 0x800 bytes)

      if(address >= 0 && address < 0x2000){
        debug('readMemory address >= 0 && address < 0x2000');
      }

      // 0x2000 - 0x2007: PPU registers
      // 0x2008 - 0x3FFF: Mirrors of 0x2000 - 0x2007 (repeats every 8 bytes)

      if(address >= 0x2000 && address < 0x4000){
        debug('readMemory address >= 0x2000 && address < 0x4000');
      }

      // 0x4000 - 0x4017: APU, PPU and I/O registers
      // 0x4018 - 0x401F: APU and I/O functionality that is normally disabled

      if(address >= 0x4000 && address < 0x4014){
        debug('readMemory address >= 0x4000 && address < 0x4014');

      }

      if(address === 0x4014){
        debug('readMemory address === 0x4014');

      }

      if(address === 0x4015){
        debug('readMemory address === 0x4015');

      }

      if(address === 0x4016){
        debug('readMemory address === 0x4016');

      }

      if(address >= 0x4017 && address < 0x4020){
        debug('readMemory address >= 0x4017 && address < 0x4020');

      }

      // cartridge space
      if(address >= 0x4020 && address < 0x6000){
        debug('readMemory address >= 0x4020 && address < 0x6000');

      }

      // 0x6000 - 0x7FFF: Battery Backed Save or Work RAM
      if(address >= 0x6000 && address < 0x8000){
        debug('readMemory address >= 0x6000 && address < 0x8000');

      }

      // 0x8000 - 0xFFFF: ROM
      if(address >= 0x8000 && address < 0x10000) {
        debug('readMemory address >= 0x8000 && address < 0x10000');
        var mappedAddr = this.mapper.map(address, this.rom.header);

        return this.rom.prg[mappedAddr];
      }
  }

  this.writeMemory = function (address) {
      // 0x0000 - 0x07FF: 2KB internal RAM
      // 0x0800 - 0x1FFF: Mirrors of 0x0000 - 0x07FF (repeats every 0x800 bytes)

      if(address >= 0 && address < 0x2000){
        debug('writeMemory address >= 0 && address < 0x2000');
      }

      // 0x2000 - 0x2007: PPU registers
      // 0x2008 - 0x3FFF: Mirrors of 0x2000 - 0x2007 (repeats every 8 bytes)

      if(address >= 0x2000 && address < 0x4000){
        debug('writeMemory address >= 0x2000 && address < 0x4000');
      }

      // 0x4000 - 0x4017: APU, PPU and I/O registers
      // 0x4018 - 0x401F: APU and I/O functionality that is normally disabled

      if(address >= 0x4000 && address < 0x4014){
        debug('writeMemory address >= 0x4000 && address < 0x4014');

      }

      if(address === 0x4014){
        debug('writeMemory address === 0x4014');

      }

      if(address === 0x4015){
        debug('writeMemory address === 0x4015');

      }

      if(address === 0x4016){
        debug('writeMemory address === 0x4016');

      }

      if(address >= 0x4017 && address < 0x4020){
        debug('writeMemory address >= 0x4017 && address < 0x4020');

      }

      // cartridge space
      if(address >= 0x4020 && address < 0x6000){
        debug('writeMemory address >= 0x4020 && address < 0x6000');

      }

      // 0x6000 - 0x7FFF: Battery Backed Save or Work RAM
      if(address >= 0x6000 && address < 0x8000){
        debug('writeMemory address >= 0x6000 && address < 0x8000');

      }

      // 0x8000 - 0xFFFF: ROM
      if(address >= 0x8000 && address < 0x10000) {
        debug('writeMemory address >= 0x8000 && address < 0x10000');
      }
  }

  this.reset = function() {
    var pc = this.readHighAndLowBytes(this.interupts.RESET);
    this.pc = pc;
  }

  this.readHighAndLowBytes = function(address){
    return this.readMemory(address) | (this.readMemory(address + 1) << 8);
  }



  this.dumpCPU = function(){
    console.log('this.a ->', this.a);
    console.log('this.x ->', this.x);
    console.log('this.y ->', this.y);
    console.log('this.p ->', this.p);
    console.log('this.pc ->', this.pc);
    console.log('this.s ->', this.s);
    console.log('this.rom ->', this.rom);
  }
}

function debug(param, param_e){
  if(param && !param_e) console.log(param);
  else console.log(param, param_e);
}
