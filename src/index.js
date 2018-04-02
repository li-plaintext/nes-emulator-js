// The stack instructions (PHA, PLA, PHP, PLP, JSR, RTS, BRK, RTI)

function NES() {
  this.length16K = 16384;
  this.length8K = 8192;
  this.length1K = 1024;
  this.offset = 0;
  this.constants = new Constants();
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
  this.s = null //Stack Register
  this.p = new Array(8) //Status Register
  this.momery = new Uint8Array(this.length1K * 64) //momery

  this.rom = undefined;

  this.init = function(buffer) {
    this.rom = buffer;
    this.powerOn();
  }

  this.run = function(buffer) {
    this.init(buffer);
    var header = this.analyzerRom(buffer);
    this.processInstruction(header, buffer);
    this.dumpCPU();
    console.log(buffer);
  }

  this.analyzerRom = function(buffer) {
    var header = new Uint8Array(buffer.slice(0, 16));

    var trainer = (header[6] & (1 << 2)) === 4;

    var header = {
      'PRG_ROM_num': header[4],
      'CHR_ROM_num': header[5],
      'FLAG_6': header[6],
      'FLAG_7': header[7],
      'PRG_RAM_num': header[8],
      'FLAG_9': header[9],
      'trainer': trainer,
    }

    return header;
  }

  this.processInstruction = function(header, buffer) {
    var PRG_Rom = new Uint8Array(buffer.slice(16, 16 + (this.length16K * header.PRG_ROM_num))) ;

    while(this.offset < PRG_Rom.length) {
      switch(this.constants.opcodes[PRG_Rom[this.offset]].instruction){
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
        case 'INX': debug('INX'); break;
        case 'INY': debug('INY'); break;

        case 'JMP': debug('JMP'); break;
        case 'JSR': debug('JSR'); break;

        case 'LDA': debug('LDA'); break;
        case 'LDY': debug('LDY'); break;
        case 'LDX': debug('LDX'); break;
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
        case 'SEI': debug('SEI'); break;
        case 'STA': debug('STA'); break;
        case 'STX': debug('STX'); break;
        case 'STY': debug('STY'); break;

        case 'TAX': debug('TAX'); break;
        case 'TAY': debug('TAY'); break;
        case 'TSX': debug('TSX'); break;
        case 'TXA': debug('TXA'); break;
        case 'TXS': debug('TXS'); break;
        case 'TYA': debug('TYA'); break;

        case 'INV': debug('do nothing'); break;
        default: debug('missing', PRG_Rom[this.offset]) ;break;
      }

      this.processAddressingMode(PRG_Rom);

      this.offset++;

      PRG_Rom[this.offset] != 0 && console.log('--------------------');
    };
  }

  this.processAddressingMode = function(PRG_Rom) {
    var addressingMode = this.constants.opcodes[PRG_Rom[this.offset]].addressing,
        cycle = this.constants.opcodes[PRG_Rom[this.offset]].cycle;

    switch(addressingMode){
      case 'IMPLIED':
        // Bytes 1
        break;
      case 'IMMEDIATE':
        // Bytes 2
        debug('IMMEDIATE bytes', PRG_Rom[++this.offset]);
        break;

      case 'ACCUMULATOR':
        // Bytes 1
        break;

      case 'ZERO_PAGE':
        // Bytes 2
        debug('ZERO_PAGE bytes', PRG_Rom[++this.offset]);
      break;

      case 'ABSOLUTE':
        // Bytes 3
        debug('ABSOLUTE bytes', PRG_Rom[++this.offset]);
        debug('ABSOLUTE bytes', PRG_Rom[++this.offset]);

        break;
      case 'INDEXED_ABSOLUTE_X':
        // Bytes 3
        debug('INDEXED_ABSOLUTE_X bytes', PRG_Rom[++this.offset]);
        debug('INDEXED_ABSOLUTE_X bytes', PRG_Rom[++this.offset]);
        break;
      case 'INDEXED_ABSOLUTE_Y':
        // Bytes 3
        debug('INDEXED_ABSOLUTE_Y bytes', PRG_Rom[++this.offset]);
        debug('INDEXED_ABSOLUTE_Y bytes', PRG_Rom[++this.offset]);
        break;

      case 'RELATIVE':
        // Bytes 2
        debug('RELATIVE bytes', PRG_Rom[++this.offset]);
        break;

      case 'INDIRECT':
        // Bytes 3
        debug('INDIRECT bytes', PRG_Rom[++this.offset]);
        debug('INDIRECT bytes', PRG_Rom[++this.offset]);
        break;

      case 'INDEXED_INDIRECT_X':
        // Bytes 2
        debug('INDEXED_INDIRECT_X bytes', PRG_Rom[++this.offset]);

        break;
      case 'INDEXED_INDIRECT_Y':
        // Bytes 2
        debug('INDEXED_INDIRECT_Y bytes', PRG_Rom[++this.offset]);
        break;

      case 'INDEXED_ZERO_PAGE_X':
        // Bytes 2
        debug('INDEXED_ZERO_PAGE_X bytes', PRG_Rom[++this.offset]);
        break;
      case 'INDEXED_ZERO_PAGE_Y':
        // Bytes 2
        debug('INDEXED_ZERO_PAGE_Y bytes', PRG_Rom[++this.offset]);
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

  this.increasePC = function() {
     return ++this.pc;
  }

  this.memoryMapping = function () {
    // Memory
    // ======
    // 0x100 => Zero Page
    // 0x200 => Stack
    // 0x800 => RAM
    // 0x2000 => Mirrors (0-0x7FF)
    // 0x2008 => I/O Registers
    // 0x4000 => Mirrors (0x2000-0x2007)
    // 0x4020 => I/O Registers
    // 0x6000 => Expansion ROM
    // 0x8000 => SRAM
    // 0xC000 => PRG-ROM (Lower Bank)
    // 0x10000 => PRG-ROM (Upper Bank)


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
