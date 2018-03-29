function NES() {
  this.length16K = 16384;
  this.length8K = 8192;
  this.offset = 0;
  this.constants = new Constants();


  this.run = function(buffer) {
    var header = this.analyzerRom(buffer);
    this.processInstruction(header, buffer);
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

    console.log(PRG_Rom);

    while(this.offset < PRG_Rom.length) {

      switch(this.constants.opcodes[PRG_Rom[this.offset]].instruction){
        case 'ADC':
          console.log('ADC');
          break;
        case 'AND':
          console.log('ADC');
          break;
        case 'ASL':
          console.log('ASL');
          break;

        case 'BCC':
          console.log('BCC');
          break;
        case 'BCS':
          console.log('BCS');
          break;
        case 'BEQ':
          console.log('BEQ');
          break;
        case 'BIT':
          console.log('BIT');
          break;
        case 'BMI':
          console.log('BMI');
          break;
        case 'BNE':
          console.log('BNE');
          break;
        case 'BPL':
          console.log('BPL');
          break;
        case 'BRK':
          // console.log('BRK');
          break;
        case 'BVC':
          console.log('BVC');
          break;
        case 'BVS':
          console.log('BVS');
          break;


        case 'CLC':
          console.log('CLC');
          break;
        case 'CLD':
          console.log('CLD');
          break;
        case 'CLI':
          console.log('CLI');
          break;
        case 'CLV':
          console.log('CLV');
          break;
        case 'CMP':
          console.log('CMP');
          break;
        case 'CPX':
          console.log('CPX');
          break;
        case 'CPY':
          console.log('CPY');
          break;
        case 'DEC':
          console.log('DEC');
          break;
        case 'DEX':
          console.log('DEX');
          break;
        case 'DEY':
          console.log('DEY');
          break;

        case 'EOR':
          console.log('EOR');
          break;

        case 'INC': console.log('INC'); break;
        case 'INX': console.log('INX'); break;
        case 'INY': console.log('INY'); break;
        case 'JMP': console.log('JMP'); break;
        case 'JSR': console.log('JSR'); break;
        case 'LDA': console.log('LDA'); break;
        case 'LDX': console.log('LDX'); break;
        case 'LDX': console.log('LDX'); break;
        case 'LSR': console.log('LSR'); break;
        case 'NOP': console.log('NOP'); break;
        case 'ORA': console.log('ORA'); break;
        case 'PHA': console.log('PHA'); break;
        case 'PHP': console.log('PHP'); break;
        case 'PLA': console.log('PLA'); break;
        case 'PLP': console.log('PLP'); break;
        case 'ROL': console.log('ROL'); break;
        case 'ROR': console.log('ROR'); break;
        case 'RTI': console.log('RTI'); break;
        case 'RTS': console.log('RTS'); break;
        case 'SBC': console.log('SBC'); break;
        case 'SEC': console.log('SEC'); break;
        case 'SED': console.log('SED'); break;
        case 'SEI': console.log('SEI'); break;
        case 'STA': console.log('STA'); break;
        case 'STX': console.log('STX'); break;
        case 'STY': console.log('STY'); break;
        case 'TAX': console.log('TAX'); break;
        case 'TAY': console.log('TAY'); break;
        case 'TSX': console.log('TSX'); break;
        case 'TXA': console.log('TXA'); break;
        case 'TXS': console.log('TXS'); break;
        case 'TYA': console.log('TYA'); break;
        default: break;
      }

      this.offset++;
    };
  }

}
