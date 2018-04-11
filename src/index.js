// The stack instructions (PHA, PLA, PHP, PLP, JSR, RTS, BRK, RTI)

function NES() {
  this.length16K = 16384;
  this.length8K = 8192;
  this.length1K = 1024;
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

  this.ppu = new PPU();


  this.init = function(buffer) {
    this.analyzerRom(buffer);
    this.powerOn();
  }

  this.run = function() {
    var currentArr = this.getPC();
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

  this.processInstruction = function(opcObj = {}) {
    console.log(this.dumpP());

    switch(opcObj.instruction){
      case 'ADC':
        debug('ADC');
        var regVal = this.a;
        var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
        var flagC = this.getStatusRegister('C');
        var result = regVal + memValue + flagC;
        this.a = result;
        this.flagC(result);
        this.flagZ(result);
        this.flagN(result);
        if(!((regVal ^ memValue) & 0x80) && ((memValue ^ result) & 0x80))
          this.setStatusRegister('V', 1);
        else
          this.setStatusRegister('V', 1);
        break;
      case 'AND':
        debug('AND');
        var regVal = this.a;
        var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
        var result = regVal & memValue;
        this.a = result;
        this.flagZ(result);
        this.flagN(result);
        break;
      case 'ASL':
        // arithemetic shift left
        debug('ASL');
        var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
        var result = memValue << 1;
        this.a = result;
        this.flagZ(result);
        this.flagN(result);
        this.flagC(result);
        break;

      case 'BCC':
        debug('BCC');
        if(this.getStatusRegister('C') === 0) {
          var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
          this.pc += memValue;
        }
        break;
      case 'BCS':
        debug('BCS');
        if(this.getStatusRegister('C') === 1) {
          var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
          this.pc += memValue;
        }
        break;
      case 'BEQ':
        debug('BEQ');
        if(this.getStatusRegister('Z') === 1) {
          var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
          this.pc += memValue;
        }
        break;
      case 'BIT':
        debug('BIT');
        var regVal = this.a;
        var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
        var result = regVal & memValue;
        this.flagN(memValue);
        this.flagZ(result);
        this.flagV(memValue);
        break;
      case 'BMI':
        debug('BMI');
        if(this.getStatusRegister('N') === 1) {
          var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
          this.pc += memValue;
        }
        break;
      case 'BNE':
        debug('BNE');
        if(this.getStatusRegister('Z') === 0) {
          var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
          this.pc += memValue;
        }
        break;
      case 'BPL':
        debug('BPL');

        if(this.getStatusRegister('N') === 0) {
          var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
          if(memValue & 0x80) memValue |= 0xff00;
          this.pc += memValue;
        }
        break;
      case 'BRK':
        this.setStatusRegisterFlag('B', 1);
        this.increasePC();
        debug('BRK');
        break;
      case 'BVC':
        debug('BVC');
        if(this.getStatusRegister('V') === 0) {
          var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
          this.pc += memValue;
        }
        break;
      case 'BVS':
        debug('BVS');
        if(this.getStatusRegister('V') === 1) {
          var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
          this.pc += memValue;
        }
        break;
      case 'CLC':
        debug('CLC');
        this.setStatusRegister('C', 0);
        break;
      case 'CLD':
        debug('CLD');
        this.setStatusRegister('D', 0);
        break;
      case 'CLI':
        debug('CLI');
        this.setStatusRegister('I', 0);
        break;
      case 'CLV':
        debug('CLV');
        this.setStatusRegister('V', 0);
        break;

      case 'CMP':
        debug('CMP');
        var regVal = this.a;
        var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
        var result = regVal - memValue;
        this.flagZ(result);
        this.flagN(result);
        if(result >= 0)
          this.setStatusRegister('C', 1);
        else
          this.setStatusRegister('C', 0);
        break;
      case 'CPX':
        debug('CPX');
        var regVal = this.x;
        var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
        var result = regVal - memValue;
        this.flagZ(result);
        this.flagN(result);
        if(result >= 0)
          this.setStatusRegister('C', 1);
        else
          this.setStatusRegister('C', 0);
        break;
      case 'CPY':
        debug('CPY');
        var regVal = this.y;
        var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
        var result = regVal - memValue;
        this.flagZ(result);
        this.flagN(result);
        if(result >= 0)
          this.setStatusRegister('C', 1);
        else
          this.setStatusRegister('C', 0);
        break;
      case 'DEC':
        debug('DEC');
        var memAddr = this.processAddressingMode(opcObj.addressing);
        var memValue = this.readMemory(memAddr);
        var result = memValue - 1;
        this.writeMemory(memAddr, result);
        this.flagZ(result);
        this.flagN(result);
        break;

      case 'DEX':
        debug('DEX');
        var regVal = this.x;
        var result = regVal - 1;
        this.x = result;
        this.flagZ(result);
        this.flagN(result);
        break;
      case 'DEY':
        debug('DEY');
        var regVal = this.y;
        var result = regVal - 1;
        this.y = result;
        this.flagZ(result);
        this.flagN(result);
        break;

      case 'EOR':
        debug('EOR');
        var regVal = this.a;
        var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
        var result = regVal ^ memValue;
        this.flagZ(result);
        this.flagN(result);
        break;

      case 'INC':
        debug('INC');
        var memAddr = this.processAddressingMode(opcObj.addressing);
        var memValue = this.readMemory(memAddr);
        var result = memValue + 1;
        this.writeMemory(memAddr, result);
        this.flagZ(result);
        this.flagN(result);
        break;
      case 'INX':
        debug('INX');
        var regVal = this.x;
        var result = regVal + 1;
        this.x = result;
        this.flagZ(result);
        this.flagN(result);
        this.processAddressingMode(opcObj.addressing)
        break;
      case 'INY':
        debug('INY');
        var regVal = this.y;
        var result = regVal + 1;
        this.y = result;
        this.flagZ(result);
        this.flagN(result);
        this.processAddressingMode(opcObj.addressing)
        break;

      case 'JMP':
        debug('JMP');
        var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
        this.pc = memValue;
        break;
      case 'JSR':
        debug('JSR');
        var toStoreAddr = this.pc - 1;
        this.pushToStackBy2Bytes(toStoreAddr);
        var memAddr = this.processAddressingMode(opcObj.addressing);
        this.pc.store(memAddr);
        break;
      case 'LDA':
        debug('LDA');
        var value =  this.readMemory(this.processAddressingMode(opcObj.addressing));
        this.a = value;
        this.flagN(value);
        this.flagZ(value);
        break;
      case 'LDY':
        debug('LDY');
        var value =  this.readMemory(this.processAddressingMode(opcObj.addressing));
        this.y = value;
        this.flagN(value);
        this.flagZ(value);
        break;
      case 'LDX':
        debug('LDX');
        var value =  this.readMemory(this.processAddressingMode(opcObj.addressing));
        this.x = value;
        this.flagN(value);
        this.flagZ(value);
        break;
      case 'LSR':
        debug('LSR');
        var memAddr = this.processAddressingMode(opcObj.addressing);
        var memValue = this.readMemory(memAddr);
        var result = memValue >> 1;
        this.writeMemory(memAddr, result)
        this.getStatusRegister('N', 0);
        this.flagZ(result);
        if((memValue & 1) == 0)
          this.getStatusRegister('C', 0);
        else
          this.getStatusRegister('C', 1);
        break;

      case 'NOP':
        // no operation
        debug('NOP');
        break;

      case 'ORA':
        debug('ORA');
        var regVal = this.a;
        var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
        var result = regVal | memValue;
        this.a = result
        this.flagZ(result);
        this.flagN(result);
        break;

      case 'PHA':
        debug('PHA');
        var regVal = this.a;
        this.pushToStack(regVal);
        break;
      case 'PHP':
        debug('PHP');
        this.setStatusRegister('A',1);
        this.setStatusRegister('B',1);
        var regVal = this.p;
        this.pushToStack(regVal);
        break;

      case 'PLA':
        debug('PLA');
        var result = this.pullFromStack();
        this.a = result;
        this.flagN(result);
        this.flagZ(result);
        break;
      case 'PLP':
        debug('PLP');
        var result = this.pullFromStack();
        this.setStatusRegister(result);
        break;

      case 'ROL':
        debug('ROL');
        var memAddr = this.processAddressingMode(opcObj.addressing);
        var memValue = this.readMemory(memAddr);
        var c = this.getStatusRegister('C');
        var result = (memValue << 1) | c;
        this.writeMemory(memAddr, result);
        this.flagC(result);
        this.flagZ(result);
        this.flagN(result);
        break;
      case 'ROR':
        debug('ROR');
        var memAddr = this.processAddressingMode(opcObj.addressing);
        var memValue = this.readMemory(memAddr);
        var c = this.getStatusRegister('C');
        var result = (memValue >> 1) | c;
        this.writeMemory(memAddr, result);
        this.flagZ(result);
        this.flagN(result);
        if((memValue & 1) == 0)
          this.setStatusRegister('C', 0);
        else
          this.setStatusRegister('C', 1);
        break;

      case 'RTI': debug('RTI'); break;
      case 'RTS': debug('RTS'); break;

      case 'SBC':
        debug('SBC');
        var regVal = this.a;
        var memValue = this.readMemory(this.processAddressingMode(opcObj.addressing));
        var c = this.getStatusRegister('C');
        var result = regVal - memValue - c;
        this.a = result;
        this.flagN(memValue);
        this.flagZ(result);
        if(regVal >= memValue + c)
          this.setStatusRegister('C', 1);
        else
          this.setStatusRegister('C', 0);

        if(((regVal ^ result) & 0x80) && ((regVal ^ memValue) & 0x80))
          this.setStatusRegister('V', 1);
        else
          this.setStatusRegister('V', 0);

        break;
      case 'SEC':
        debug('SEC');
        this.setStatusRegisterFlag('C', 1);
        break;
      case 'SED':
        debug('SED');
        this.setStatusRegisterFlag('D', 1);
        break;
      case 'SEI':
        debug('SEI');
        this.setStatusRegisterFlag('I', 1);
        break;

      case 'STA':
        debug('STA');
        var memAddr = this.processAddressingMode(opcObj.addressing);
        this.writeMemory(memAddr, this.a);
        break;
      case 'STX':
        debug('STX');
        var memAddr = this.processAddressingMode(opcObj.addressing);
        this.writeMemory(memAddr, this.x);
        break;
      case 'STY':
        debug('STY');
        var memAddr = this.processAddressingMode(opcObj.addressing);
        this.writeMemory(memAddr, this.y);
        break;

      case 'TAX':
        debug('TAX');
        this.x = this.a;
        this.updateN(this.a);
        this.updateZ(this.a);
        this.processAddressingMode(opcObj.addressing);
        break;
      case 'TAY':
        debug('TAY');
        this.x = this.y;
        this.updateN(this.y);
        this.updateZ(this.y);
        this.processAddressingMode(opcObj.addressing);
        break;
      case 'TSX':
        debug('TSX');
        this.s = this.x;
        this.updateN(this.x);
        this.updateZ(this.x);
        this.processAddressingMode(opcObj.addressing);
        break;
      case 'TXA':
        debug('TXA');
        this.a = this.x;
        this.updateN(this.x);
        this.updateZ(this.x);
        this.processAddressingMode(opcObj.addressing);
        break;
      case 'TXS':
        debug('TXS');
        this.s = this.x;
        this.processAddressingMode(opcObj.addressing);
        break;
      case 'TYA':
        debug('TYA');
        this.a = this.y;
        this.updateN(this.y);
        this.updateZ(this.y);
        this.processAddressingMode(opcObj.addressing);
        break;

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
        return this.getPC();
        break;

      case 'ACCUMULATOR':
        // Bytes 1
        break;

      case 'ZERO_PAGE':
        // Bytes 2
        return this.getPC() & 0xff;
      break;

      case 'ABSOLUTE':
        // Bytes 3
        return this.getPCby2Bytes();
        break;
      case 'INDEXED_ABSOLUTE_X':
        // Bytes 3
        return this.getPCby2Bytes() + this.x;
        break;
      case 'INDEXED_ABSOLUTE_Y':
        // Bytes 3
        return this.getPCby2Bytes() + this.y;
        break;

      case 'RELATIVE':
        // Bytes 2
        debug('RELATIVE bytes');
        return this.getPC();
        break;

      case 'INDIRECT':
        // Bytes 3
        var addr = this.getPCby2Bytes();
        var formatedAddr = (addr & 0xff00) | ((addr + 1) & 0xff);
        return this.readMemory(addr) | (this.readMemory(formatedAddr) << 8);
        break;

      case 'INDEXED_INDIRECT_X':
        // Bytes 2
        var addr = (this.getPC() + this.x) & 0xff;
        return this.memory[addr & 0xff] | ((this.memory[addr + 1] & 0xff) << 8);
        break;
      case 'INDEXED_INDIRECT_Y':
        // Bytes 2
        var addr = (this.getPC() + this.y) & 0xff;
        return this.memory[addr & 0xff] | ((this.memory[addr + 1] & 0xff) << 8);
        break;

      case 'INDEXED_ZERO_PAGE_X':
        // Bytes 2
        return (this.getPC() + this.x) & 0xff;
        break;
      case 'INDEXED_ZERO_PAGE_Y':
        // Bytes 2
        return (this.getPC() + this.y) & 0xff;
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
     return this.p[this.statusMapping[indicator]];
  }

  this.flagZ = function(value){
    if((value & 0xff) === 0)
      this.setStatusRegisterFlag('Z', 1);
    else
      this.setStatusRegisterFlag('Z', 0);
  }

  this.flagN = function(value) {
    if((value & (1<<7)) === 0)
      this.setStatusRegisterFlag('N', 0);
    else
      this.setStatusRegisterFlag('N', 1);
  }

  this.flagV = function(value) {
    if((value & (1<<6)) === 0)
      this.setStatusRegisterFlag('V', 0);
    else
      this.setStatusRegisterFlag('V', 1);
  }

  this.flagC = function(value) {
    if((value & (1<<8)) === 0)
      this.setStatusRegisterFlag('C', 0);
    else
      this.setStatusRegisterFlag('C', 1);
  }

  this.getPC = function() {
    var addr = this.pc++;
    return addr;
  }

  this.getPCby2Bytes = function(address) {
    var byte1 = this.readMemory(this.getPC());
    var byte2 = this.readMemory(this.getPC());

    return byte1 | (byte2 << 8);
  }

  this.increasePC = function() {
     return ++this.pc;
  }

  this.increaseS = function() {
     return ++this.s;
  }
  this.decreaseS = function() {
     return --this.s;
  }
  this.pushToStack = function(value) {
    var stackAddr = this.s + 0x100;
    this.writeMemory(stackAddr, value);
    this.decreaseS();
  }
  this.pullFromStack = function() {
    this.increaseS();
    var stackAddr = this.s + 0x100;
    return this.readMemory(stackAddr);
  }
  this.pushToStackBy2Bytes = function(value) {
    var hightByte = value & 0xff;
    var lowByte = (value >> 8) & 0xff;
    var stackAddr = this.s + 0x100;
    this.writeMemory(stackAddr, lowByte);
    this.decreaseS();
    stackAddr = this.s + 0x100;
    this.writeMemory(stackAddr, hightByte);
    this.decreaseS();
  }
  this.pullFromStackBy2Bytes = function() {
    this.increaseS();
    var stackAddr = this.s + 0x100;
    var hightByte = this.readMemory(stackAddr);
    this.increaseS();
    stackAddr = this.s + 0x100;
    var lowByte = this.readMemory(stackAddr);
    return (lowByte << 8) | highByte;
  }

  this.readMemory = function (address) {
      // 0x0000 - 0x07FF: 2KB internal RAM
      // 0x0800 - 0x1FFF: Mirrors of 0x0000 - 0x07FF (repeats every 0x800 bytes)

      if(address >= 0 && address < 0x2000){
        debug('readMemory address >= 0 && address < 0x2000');
        return this.momery[address & 0x07FF];
      }

      // 0x2000 - 0x2007: PPU registers
      // 0x2008 - 0x3FFF: Mirrors of 0x2000 - 0x2007 (repeats every 8 bytes)

      if(address >= 0x2000 && address < 0x4000){
        debug('readMemory address >= 0x2000 && address < 0x4000');
        return this.momery[address & 0x2007];
      }

      // 0x4000 - 0x4017: APU, PPU and I/O registers
      // 0x4018 - 0x401F: APU and I/O functionality that is normally disabled

      if(address >= 0x4000 && address < 0x4014){
        debug('readMemory address >= 0x4000 && address < 0x4014');
        return this.momery[address];
      }

      if(address === 0x4014){
        debug('readMemory address === 0x4014');
        return this.momery[address];
      }

      if(address === 0x4015){
        debug('readMemory address === 0x4015');
        return this.momery[address];
      }

      if(address === 0x4016){
        debug('readMemory address === 0x4016');
        return this.momery[address];
      }

      if(address >= 0x4017 && address < 0x4020){
        debug('readMemory address >= 0x4017 && address < 0x4020');
        return this.momery[address];
      }

      // cartridge space
      if(address >= 0x4020 && address < 0x6000){
        debug('readMemory address >= 0x4020 && address < 0x6000');
        return this.momery[address];
      }

      // 0x6000 - 0x7FFF: Battery Backed Save or Work RAM
      if(address >= 0x6000 && address < 0x8000){
        debug('readMemory address >= 0x6000 && address < 0x8000');
        return this.momery[address];
      }

      // 0x8000 - 0xFFFF: ROM
      if(address >= 0x8000 && address < 0x10000) {
        debug('readMemory address >= 0x8000 && address < 0x10000');
        var mappedAddr = this.mapper.map(address, this.rom.header);

        return this.rom.prg[mappedAddr];
      }
  }

  this.writeMemory = function (address, value) {
      // 0x0000 - 0x07FF: 2KB internal RAM
      // 0x0800 - 0x1FFF: Mirrors of 0x0000 - 0x07FF (repeats every 0x800 bytes)

      if(address >= 0 && address < 0x2000){
        debug('writeMemory address >= 0 && address < 0x2000');
        this.momery[address & 0x07FF] = value;
      }

      // 0x2000 - 0x2007: PPU registers
      // 0x2008 - 0x3FFF: Mirrors of 0x2000 - 0x2007 (repeats every 8 bytes)

      if(address >= 0x2000 && address < 0x4000){
        debug('writeMemory address >= 0x2000 && address < 0x4000');
        this.momery[address & 0x2007] = value;
      }

      // 0x4000 - 0x4017: APU, PPU and I/O registers
      // 0x4018 - 0x401F: APU and I/O functionality that is normally disabled

      if(address >= 0x4000 && address < 0x4014){
        debug('writeMemory address >= 0x4000 && address < 0x4014');
        this.momery[address] = value;
      }

      if(address === 0x4014){
        debug('writeMemory address === 0x4014');
        this.momery[address] = value;
      }

      if(address === 0x4015){
        debug('writeMemory address === 0x4015');
        this.momery[address] = value;
      }

      if(address === 0x4016){
        debug('writeMemory address === 0x4016');
        this.momery[address] = value;
      }

      if(address >= 0x4017 && address < 0x4020){
        debug('writeMemory address >= 0x4017 && address < 0x4020');
        this.momery[address] = value;
      }

      // cartridge space
      if(address >= 0x4020 && address < 0x6000){
        debug('writeMemory address >= 0x4020 && address < 0x6000');
        this.momery[address] = value;
      }

      // 0x6000 - 0x7FFF: Battery Backed Save or Work RAM
      if(address >= 0x6000 && address < 0x8000){
        debug('writeMemory address >= 0x6000 && address < 0x8000');
        this.momery[address] = value;
      }

      // 0x8000 - 0xFFFF: ROM
      if(address >= 0x8000 && address < 0x10000) {
        debug('writeMemory address >= 0x8000 && address < 0x10000');
        var mappedAddr = this.mapper.map(address, this.rom.header);
        this.rom.prg[mappedAddr] = value;
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
    console.log('this.p ->', parseInt(([].concat(this.p)).reverse().join(''), 2));
    console.log('this.pc ->', this.pc);
    console.log('this.s ->', this.s);
    console.log('this.rom ->', this.rom);
  }

  this.dumpP = function(){
    console.log('this.p ->', parseInt(([].concat(this.p)).reverse().join(''), 2));
  }
}

function debug(param, param_e){
  if(param && !param_e) console.log(param);
  else console.log(param, param_e);
}
