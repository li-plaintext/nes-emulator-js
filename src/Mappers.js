function Mappers() {
  this.chrMap = function(address, header) {
    return address;
  }

  this.prgMap = function(address, header) {
    var mappedAddr = address - 0x8000;

    if(header.prg_num === 1 && address >= 0xC000)
      mappedAddr -= 0x4000;

    return mappedAddr;
  }
}
