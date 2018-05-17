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
  this.memory = new Uint8Array(this.length1K * 64); //memory
  this.rom = {}; // cartridge

  this.ppu = new PPU();
  this.ctrl1 = new Controller();
  this.ctrl2 = new Controller();

  this.init = function(buffer, ctx) {
    this.analyzerRom(buffer);
    this.powerOn();
    this.ppu.init(this.rom, this, ctx);
  }

  this.run = function() {
    this.opcObj = this.opcodes[this.readMemory(this.getPC())];
    this.processInstruction(this.opcObj);
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
      'mirroring': (header[6] & 1) === 0 ? 'HORIZONTAL' : 'VERTICAL',
    }

    this.rom.rowData = buffer;
    this.rom.header = header;
    this.rom.prg = new Uint8Array(buffer.slice(16, 16 + (this.length16K * this.rom.header.prg_num))) ;
    this.rom.chr = new Uint8Array(buffer.slice(
      16 + (this.length16K * this.rom.header.prg_num),
      16 + (this.length16K * this.rom.header.prg_num) + (this.length8K * this.rom.header.chr_num)
    )) ;
  }

  this.processInstruction = function(opcObj = {}) {
    this.memAddr = this.processAddressingMode(opcObj.addressing);
    this.memValue = 0;
    this.carry = 0;
    this.result = 0;

    switch(opcObj.instruction){
      case 'ADC':
        debug('ADC');
        this.memValue = this.readMemory(this.memAddr);
        this.carry = this.getStatusRegister('C');
        this.result = this.a + this.memValue + this.carry;
        this.writeA(this.result)
        this.flagC(this.result);
        this.flagZ(this.result);
        this.flagN(this.result);
        if(!((this.a ^ this.memValue) & 0x80) && ((this.memValue ^ this.result) & 0x80))
          this.setStatusRegisterFlag('V', 1);
        else
          this.setStatusRegisterFlag('V', 0);
        break;
      case 'AND':
        debug('AND');
        this.memValue = this.readMemory(this.memAddr);
        this.result = this.a & this.memValue;
        this.writeA(this.result);
        this.flagZ(this.result);
        this.flagN(this.result);
        break;
      case 'ASL':
        // arithemetic shift left
        debug('ASL');
        this.memValue = opcObj.addressing === 'ACCUMULATOR' ?
          this.a : this.readMemory(this.memAddr);
        this.result = this.memValue << 1;
        this.writeA(this.result);
        this.flagZ(this.result);
        this.flagN(this.result);
        this.flagC(this.result);
        break;

      case 'BCC':
        debug('BCC');
        this.memValue = this.unsignedToSignedBy1Byte(this.readMemory(this.memAddr));
        if(this.getStatusRegister('C') === 0) {
          this.writePC(this.pc + this.memValue);
        }
        break;
      case 'BCS':
        debug('BCS');
        this.memValue = this.unsignedToSignedBy1Byte(this.readMemory(this.memAddr));
        if(this.getStatusRegister('C') === 1) {
          this.writePC(this.pc + this.memValue);
        }
        break;
      case 'BEQ':
        debug('BEQ');
        this.memValue = this.unsignedToSignedBy1Byte(this.readMemory(this.memAddr));
        if(this.getStatusRegister('Z') === 1) {
          this.writePC(this.pc + this.memValue);
        }
        break;
      case 'BIT':
        debug('BIT');
        this.memValue = this.readMemory(this.memAddr);
        this.result = this.a & this.memValue;
        this.flagN(this.memValue);
        this.flagZ(this.result);
        this.flagV(this.memValue);
        break;
      case 'BMI':
        debug('BMI');
        this.memValue = this.unsignedToSignedBy1Byte(this.readMemory(this.memAddr));
        if(this.getStatusRegister('N') === 1) {
          this.writePC(this.pc + this.memValue);
        }
        break;
      case 'BNE':
        debug('BNE');
        this.memValue = this.unsignedToSignedBy1Byte(this.readMemory(this.memAddr));
        if(this.getStatusRegister('Z') === 0) {
          this.writePC(this.pc + this.memValue);
        }
        break;
      case 'BPL':
        debug('BPL');
        this.memValue = this.unsignedToSignedBy1Byte(this.readMemory(this.memAddr));
        if(this.getStatusRegister('N') === 0) {
          this.writePC(this.pc + this.memValue);
        }
        break;
      case 'BRK':
        this.setStatusRegisterFlag('B', 1);
        this.increasePC();
        this.interrupt('BRK');
        debug('BRK');
        break;
      case 'BVC':
        debug('BVC');
        this.memValue = this.unsignedToSignedBy1Byte(this.readMemory(this.memAddr));
        if(this.getStatusRegister('V') === 0) {
          this.writePC(this.pc + this.memValue);
        }
        break;
      case 'BVS':
        debug('BVS');
        this.memValue = this.unsignedToSignedBy1Byte(this.readMemory(this.memAddr));
        if(this.getStatusRegister('V') === 1) {
          this.writePC(this.pc + this.memValue);
        }
        break;
      case 'CLC':
        debug('CLC');
        this.setStatusRegisterFlag('C', 0);
        break;
      case 'CLD':
        debug('CLD');
        this.setStatusRegisterFlag('D', 0);
        break;
      case 'CLI':
        debug('CLI');
        this.setStatusRegisterFlag('I', 0);
        break;
      case 'CLV':
        debug('CLV');
        this.setStatusRegisterFlag('V', 0);
        break;

      case 'CMP':
        debug('CMP');
        this.memValue = this.readMemory(this.memAddr);
        this.result = this.a - this.memValue;
        this.flagZ(this.result);
        this.flagN(this.result);
        if(this.result >= 0)
          this.setStatusRegisterFlag('C', 1);
        else
          this.setStatusRegisterFlag('C', 0);
        break;
      case 'CPX':
        debug('CPX');
        this.memValue = this.readMemory(this.memAddr);
        this.result = this.x - this.memValue;
        this.flagZ(this.result);
        this.flagN(this.result);
        if(this.result >= 0)
          this.setStatusRegisterFlag('C', 1);
        else
          this.setStatusRegisterFlag('C', 0);
        break;
      case 'CPY':
        debug('CPY');
        this.memValue = this.readMemory(this.memAddr);
        this.result = this.y - this.memValue;
        this.flagZ(this.result);
        this.flagN(this.result);
        if(this.result >= 0)
          this.setStatusRegisterFlag('C', 1);
        else
          this.setStatusRegisterFlag('C', 0);
        break;
      case 'DEC':
        debug('DEC');
        this.memValue = this.readMemory(this.memAddr);
        this.result = this.memValue - 1;
        this.writeMemory(this.memAddr, this.result);
        this.flagZ(this.result);
        this.flagN(this.result);
        break;

      case 'DEX':
        debug('DEX');
        this.result = this.x - 1;
        this.writeX(this.result);
        this.flagZ(this.result);
        this.flagN(this.result);
        break;
      case 'DEY':
        debug('DEY');
        this.result = this.y - 1;
        this.writeY(this.result);
        this.flagZ(this.result);
        this.flagN(this.result);
        break;

      case 'EOR':
        debug('EOR');
        this.memValue = this.readMemory(this.memAddr);
        this.result = this.a ^ this.memValue;
        this.writeA(this.result);
        this.flagZ(this.result);
        this.flagN(this.result);
        break;

      case 'INC':
        debug('INC');
        this.memValue = this.readMemory(this.memAddr);
        this.result = this.memValue + 1;
        this.writeMemory(this.memAddr, this.result);
        this.flagZ(this.result);
        this.flagN(this.result);
        break;
      case 'INX':
        debug('INX');
        this.result = this.x + 1;
        this.writeX(this.result);
        this.flagZ(this.result);
        this.flagN(this.result);
        this.memAddr
        break;
      case 'INY':
        debug('INY');
        this.result = this.y + 1;
        this.writeY(this.result);
        this.flagZ(this.result);
        this.flagN(this.result);
        this.memAddr
        break;

      case 'JMP':
        debug('JMP');

        this.writePC(this.memAddr);
        break;
      case 'JSR':
        debug('JSR');
        this.pushToStackBy2Bytes(this.pc - 1);

        this.writePC(this.memAddr);
        break;
      case 'LDA':
        debug('LDA');
        this.result = this.readMemory(this.memAddr);
        this.writeA(this.result);
        this.flagN(this.result);
        this.flagZ(this.result);
        break;
      case 'LDY':
        debug('LDY');
        this.result = this.readMemory(this.memAddr);
        this.writeY(this.result)
        this.flagN(this.result);
        this.flagZ(this.result);
        break;
      case 'LDX':
        debug('LDX');
        this.result = this.readMemory(this.memAddr);
        this.writeX(this.result);
        this.flagN(this.result);
        this.flagZ(this.result);
        break;
      case 'LSR':
        debug('LSR');
        if (opcObj.addressing === 'ACCUMULATOR') {
          this.memValue = this.a;
          this.result = this.memValue >> 1;
          this.writeA(this.result);
        } else {
          ;
          this.memValue = this.readMemory(this.memAddr);
          this.result = this.memValue >> 1;
          this.writeMemory(this.memAddr, this.result);
        }
        this.setStatusRegisterFlag('N', 0);
        this.flagZ(this.result);
        if((this.memValue & 1) == 0)
          this.setStatusRegisterFlag('C', 0);
        else
          this.setStatusRegisterFlag('C', 1);
        break;
      case 'NOP':
        // no operation
        debug('NOP');
        break;
      case 'ORA':
        debug('ORA');
        this.memValue = this.readMemory(this.memAddr);
        this.result = this.a | this.memValue;
        this.writeA(this.result);
        this.flagZ(this.result);
        this.flagN(this.result);
        break;
      case 'PHA':
        debug('PHA');
        this.pushToStack(this.a);
        break;
      case 'PHP':
        debug('PHP');
        this.setStatusRegisterFlag('-',1);
        this.setStatusRegisterFlag('B',1);
        this.pushToStack(this.p);
        break;
      case 'PLA':
        debug('PLA');
        this.result = this.pullFromStack();
        this.writeA(this.result);
        this.flagN(this.result);
        this.flagZ(this.result);
        break;
      case 'PLP':
        debug('PLP');
        this.result = this.pullFromStack();
        this.setStatusRegister(this.result);
        break;

      case 'ROL':
        debug('ROL');
        if (opcObj.addressing === 'ACCUMULATOR') {
          this.memValue = this.a;
          this.carry = this.getStatusRegister('C');
          this.result = (this.memValue << 1) | this.carry;
          this.writeA(this.result);
        } else {
          this.memValue = this.readMemory(this.memAddr);
          this.carry = this.getStatusRegister('C');
          this.result = (this.memValue << 1) | this.carry;
          this.writeMemory(this.memAddr, this.result);
        }
        this.flagC(this.result);
        this.flagZ(this.result);
        this.flagN(this.result);
        break;
      case 'ROR':
        debug('ROR');
        if (opcObj.addressing === 'ACCUMULATOR') {
          this.memValue = this.a;
          this.carry = this.getStatusRegister('C') ? 0x80 : 0x00;
          this.result = (this.memValue >> 1) | this.carry;
          this.writeA(this.result);
        } else {
          this.memValue = this.readMemory(this.memAddr);
          this.carry = this.getStatusRegister('C') ? 0x80 : 0x00;
          this.result = (this.memValue >> 1) | this.carry;
          this.writeMemory(this.memAddr, this.result);
        }
        this.flagZ(this.result);
        this.flagN(this.result);
        if((this.memValue & 1) == 0)
          this.setStatusRegisterFlag('C', 0);
        else
          this.setStatusRegisterFlag('C', 1);
        break;

      case 'RTI':
        debug('RTI');
          this.setStatusRegister(this.pullFromStack());
          this.writePC(this.pullFromStackBy2Bytes());
        break;
      case 'RTS':
        debug('RTS');
        this.writePC(this.pullFromStackBy2Bytes() + 1);
        break;

      case 'SBC':
        debug('SBC');
        this.memValue = this.readMemory(this.memAddr);
        this.carry = this.getStatusRegister('C');
        this.result = this.a - this.memValue - this.carry;
        this.writeA(this.result);
        this.flagN(this.memValue);
        this.flagZ(this.result);
        if(this.a >= this.memValue + this.carry)
          this.setStatusRegisterFlag('C', 1);
        else
          this.setStatusRegisterFlag('C', 0);

        if(((this.a ^ this.result) & 0x80) && ((this.a ^ this.memValue) & 0x80))
          this.setStatusRegisterFlag('V', 1);
        else
          this.setStatusRegisterFlag('V', 0);

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
        this.writeMemory(this.memAddr, this.a);
        break;
      case 'STX':
        debug('STX');
        this.writeMemory(this.memAddr, this.x);
        break;
      case 'STY':
        debug('STY');
        this.writeMemory(this.memAddr, this.y);
        break;

      case 'TAX':
        debug('TAX');
        this.writeX(this.a);
        this.flagN(this.a);
        this.flagZ(this.a);
        break;
      case 'TAY':
        debug('TAY');
        this.writeY(this.a);
        this.flagN(this.a);
        this.flagZ(this.a);
        break;
      case 'TSX':
        debug('TSX');
        this.writeX(this.s);
        this.flagN(this.s);
        this.flagZ(this.s);
        break;
      case 'TXA':
        debug('TXA');
        this.writeA(this.x);
        this.flagN(this.x);
        this.flagZ(this.x);
        break;
      case 'TXS':
        debug('TXS');
        this.s = this.x;
        break;
      case 'TYA':
        debug('TYA');
        this.writeA(this.y);
        this.flagN(this.y);
        this.flagZ(this.y);
        break;

      case 'INV': debug('do nothing'); break;

      default: debug('missing') ;break;
    }

  }

  this.processAddressingMode = function(opcObj) {
    this.LOCAL_RESULT = -1;

    switch(opcObj){
      case 'IMPLIED':
        // Bytes 1
        break;
      case 'IMMEDIATE':
        // Bytes 2
        return this.getPC();
        break;

      case 'ACCUMULATOR':
        // Bytes 1
        break;

      case 'ABSOLUTE':
        // Bytes 3
        this.LOCAL_RESULT = this.getPCby2Bytes();
        break;
      case 'INDEXED_ABSOLUTE_X':
        // Bytes 3
        this.LOCAL_RESULT = this.getPCby2Bytes() + this.x;
        break;
      case 'INDEXED_ABSOLUTE_Y':
        // Bytes 3
        this.LOCAL_RESULT = this.getPCby2Bytes() + this.y;
        break;

      case 'RELATIVE':
        // Bytes 2
        // this value is signed, values #00-#7F are positive, and values #FF-#80 are negative.
        this.LOCAL_RESULT = this.getPC();
        break;

      case 'INDIRECT':
        // Bytes 3
        this.LOCAL_ADDR = this.getPCby2Bytes();
        this.LOCAL_FORMATE_ADDR = (this.LOCAL_ADDR & 0xff00) | ((this.LOCAL_ADDR + 1) & 0xff);
        this.LOCAL_RESULT = this.readMemory(this.LOCAL_ADDR) | (this.readMemory(this.LOCAL_FORMATE_ADDR) << 8);
        break;

      case 'INDEXED_INDIRECT_X':
        // Bytes 2
        this.LOCAL_ADDR = (this.readMemory(this.getPC()) + this.x) & 0xff;
        this.LOCAL_RESULT = this.memory[this.LOCAL_ADDR & 0xff] | ((this.memory[this.LOCAL_ADDR + 1] & 0xff) << 8);
        break;
      case 'INDEXED_INDIRECT_Y':
        // Bytes 2
        this.LOCAL_ADDR_PC = this.readMemory(this.getPC());
        this.LOCAL_ZERO_PAGE = this.memory[this.LOCAL_ADDR_PC & 0xff] | ((this.memory[this.LOCAL_ADDR_PC + 1] & 0xff) << 8);
        this.LOCAL_RESULT = (this.LOCAL_ZERO_PAGE + this.y) & 0xffff;
        break;

      case 'ZERO_PAGE':
        // Bytes 2
        this.LOCAL_RESULT = this.readMemory(this.getPC()) & 0xff;
        break;
      case 'INDEXED_ZERO_PAGE_X':
        // Bytes 2
        this.LOCAL_RESULT = (this.readMemory(this.getPC()) + this.x) & 0xff;
        break;
      case 'INDEXED_ZERO_PAGE_Y':
        // Bytes 2
        this.LOCAL_RESULT = (this.readMemory(this.getPC()) + this.y) & 0xff;
        break;
      default: break;
    }

    return this.LOCAL_RESULT;
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
  this.getStatusRegisterValue = function() {
     return parseInt(([].concat(this.p)).reverse().join(''), 2);
  }

  this.writeA = function(val){
    this.a = val & 0xff;
  };
  this.readA = function(){
    return this.a;
  };
  this.writeX = function(val){
    this.x = val & 0xff;
  };
  this.readX = function(){
    return this.x;
  };
  this.writeY = function(val){
    this.y = val & 0xff;
  };
  this.readY = function(){
    return this.y;
  };
  this.writePC = function(val){
    this.pc = val & 0xffff;
  };
  this.readPC = function(){
    return this.pc;
  };

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
    return this.pc++;
  }

  this.getPCby2Bytes = function(address) {
    this.LOCAL_BYTE_1 = this.readMemory(this.getPC());
    this.LOCAL_BYTE_2 = this.readMemory(this.getPC());
    return this.LOCAL_BYTE_1 | (this.LOCAL_BYTE_2 << 8);
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
    this.writeMemory(this.s + 0x100, value);
    this.decreaseS();
  }
  this.pullFromStack = function() {
    this.increaseS();
    return this.readMemory(this.s + 0x100);
  }
  this.pushToStackBy2Bytes = function(value) {
    this.LOCAL_LOW_BYTE = (value >> 8) & 0xff;
    this.writeMemory(this.s + 0x100, this.LOCAL_LOW_BYTE);
    this.decreaseS();
    this.LOCAL_HIGH_BYTE = value & 0xff;
    this.writeMemory(this.s + 0x100, this.LOCAL_HIGH_BYTE);
    this.decreaseS();
  }
  this.pullFromStackBy2Bytes = function() {
    this.increaseS();
    this.LOCAL_HIGH_BYTE = this.readMemory(this.s + 0x100);
    this.increaseS();
    this.LOCAL_LOW_BYTE = this.readMemory(this.s + 0x100);
    return (this.LOCAL_LOW_BYTE << 8) | this.LOCAL_HIGH_BYTE;
  }

  this.unsignedToSignedBy1Byte = function (value) {
    if(value & 0x80) {
      return value - 256;
    } else {
      return value;
    }
  }

  this.readMemory = function (address) {
      // 0x0000 - 0x07FF: 2KB internal RAM
      // 0x0800 - 0x1FFF: Mirrors of 0x0000 - 0x07FF (repeats every 0x800 bytes)

      if(address >= 0 && address < 0x2000){
        return this.memory[address & 0x07FF];
      }

      // 0x2000 - 0x2007: PPU registers
      // 0x2008 - 0x3FFF: Mirrors of 0x2000 - 0x2007 (repeats every 8 bytes)

      if(address >= 0x2000 && address < 0x4000){
        debug('readMemory address >= 0x2000 && address < 0x4000', address.toString(16));
        return this.ppu.readRegisters(address & 0x2007);
      }

      // 0x4000 - 0x4017: APU, PPU and I/O registers
      // 0x4018 - 0x401F: APU and I/O functionality that is normally disabled

      if(address >= 0x4000 && address < 0x4014){
        // debug('readMemory address >= 0x4000 && address < 0x4014');
        return this.memory[address];
      }

      if(address === 0x4014){
        // debug('readMemory address === 0x4014');
        return this.ppu.readRegisters(address);
      }

      if(address === 0x4015){
        // debug('readMemory address === 0x4015');
        return this.memory[address];
      }

      if(address === 0x4016){
        // debug('readMemory address === 0x4016');
        return this.ctrl1.loadRegister();
      }

      if(address >= 0x4017 && address < 0x4020){
        // debug('readMemory address >= 0x4017 && address < 0x4020');
        // apu
      }

      // cartridge space
      if(address >= 0x4020 && address < 0x6000){
        // debug('readMemory address >= 0x4020 && address < 0x6000');
        return this.memory[address];
      }

      // 0x6000 - 0x7FFF: Battery Backed Save or Work RAM
      if(address >= 0x6000 && address < 0x8000){
        // debug('readMemory address >= 0x6000 && address < 0x8000');
        return this.memory[address];
      }

      // 0x8000 - 0xFFFF: ROM
      if(address >= 0x8000 && address < 0x10000) {
        // debug('readMemory address >= 0x8000 && address < 0x10000');
        var mappedAddr = this.mapper.prgMap(address, this.rom.header);

        return this.rom.prg[mappedAddr];
      }
  }

  this.writeMemory = function (address, value) {
      // 0x0000 - 0x07FF: 2KB internal RAM
      // 0x0800 - 0x1FFF: Mirrors of 0x0000 - 0x07FF (repeats every 0x800 bytes)

      if(address >= 0 && address < 0x2000){
        this.memory[address & 0x07FF] = value;
      }

      // 0x2000 - 0x2007: PPU registers
      // 0x2008 - 0x3FFF: Mirrors of 0x2000 - 0x2007 (repeats every 8 bytes)

      if(address >= 0x2000 && address < 0x4000){
        debug('writeMemory address >= 0x2000 && address < 0x4000', address.toString(16));
        this.ppu.writeRegisters((address & 0x2007), value);
      }

      // 0x4000 - 0x4017: APU, PPU and I/O registers
      // 0x4018 - 0x401F: APU and I/O functionality that is normally disabled

      if(address >= 0x4000 && address < 0x4014){
        // debug('writeMemory address >= 0x4000 && address < 0x4014');
        // apu
      }

      if(address === 0x4014){
        // debug('writeMemory address === 0x4014');
        this.ppu.writeRegisters(address, value);
      }

      if(address === 0x4015){
        // debug('writeMemory address === 0x4015');
        //apu
      }

      if(address === 0x4016){
        // debug('writeMemory address === 0x4016');
        this.ctrl1.storeRegister(value);
      }

      if(address >= 0x4017 && address < 0x4020){
        // debug('writeMemory address >= 0x4017 && address < 0x4020');
        // apu
      }

      // cartridge space
      if(address >= 0x4020 && address < 0x6000){
        // debug('writeMemory address >= 0x4020 && address < 0x6000');
        this.memory[address] = value;
      }

      // 0x6000 - 0x7FFF: Battery Backed Save or Work RAM
      if(address >= 0x6000 && address < 0x8000){
        // debug('writeMemory address >= 0x6000 && address < 0x8000');
        this.memory[address] = value;
      }

      // 0x8000 - 0xFFFF: ROM
      if(address >= 0x8000 && address < 0x10000) {
        // debug('writeMemory address >= 0x8000 && address < 0x10000');
        var mappedAddr = this.mapper.prgMap(address, this.rom.header);
        this.rom.prg[mappedAddr] = value;
      }
  }

  this.reset = function() {
    var pc = this.readHighAndLowBytes(this.interupts.RESET.value);
    this.writePC(pc);
  }

  this.readHighAndLowBytes = function(address){
    return this.readMemory(address) | (this.readMemory(address + 1) << 8);
  }


  this.jumpToInterruptHandler = function(type) {
    var value = this.readMemory(this.interupts[type].value) | (this.readMemory(this.interupts[type].value + 1) << 8);
    this.writePC(value);
  }

  this.interrupt = function(type) {
    if(type === this.interupts.IRQ.id && this.getStatusRegister('I') === 1)
      return;

    if(type !== this.interupts.RESET.id) {
      if(type !== this.interupts.BRK.id)
        this.setStatusRegisterFlag('B', 0);


      this.setStatusRegisterFlag('-', 1);

      this.pushToStackBy2Bytes(this.pc);
      this.pushToStack(this.getStatusRegisterValue());

      this.setStatusRegisterFlag('I', 1);
    }

    this.jumpToInterruptHandler(type);
  }

  this.consoleCPU = function(){
    console.log(this.opcObj);
    console.log('this.a ->', this.a);
    console.log('this.x ->', this.x);
    console.log('this.y ->', this.y);
    console.log('this.pc ->', this.pc);
    console.log('this.s ->', this.s);
    console.log('this.status(p) ->', parseInt(([].concat(this.p)).reverse().join(''), 2));
    console.log('this.ppu ->', this.ppu);
    console.log('this.OAMADDR ->', this.ppu.OAMADDR.value);
    console.log('this.OAMDMA ->', this.ppu.OAMDMA.value);
    console.log('this.OAMDATA ->', this.ppu.OAMDATA.value);
    console.log('this.PPUADDR ->', this.ppu.PPUADDR.value);
    console.log('this.PPUCTRL ->', this.ppu.PPUCTRL.value);
    console.log('this.PPUMASK ->', this.ppu.PPUMASK.value);
    console.log('this.PPUSCROLL ->', this.ppu.PPUSCROLL.value);
    console.log('this.PPUSTATUS ->', this.ppu.PPUSTATUS.value);
    console.log('this.dup ->', this.ppu.dup);
  }

}

function debug(param, param_e){
  // if(param && !param_e) console.log(param);
  // else console.log(param, param_e);
}
