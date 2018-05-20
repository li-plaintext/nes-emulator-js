function Controller () {
  // bit:   	 7     6     5     4     3     2     1     0
  // button:	 A     B  Select Start  Up   Down  Left  Right

  this.latch = 0;
  this.currentButton = 0;
  this.map = ['a', 'b', 'select', 'start', 'up', 'down', 'left', 'right'];
  this.buttons = {
    'a': false,
    'b': false,
    'select': false,
    'start': false,
    'up': false,
    'down': false,
    'left': false,
    'right': false,
  }

  this.loadRegister = function() {
    var button = this.latch === 1 ? 0 : this.currentButton++;
    var value = (button >= 8 || this.buttons[this.map[button]]) ? 1 : 0;
    return value;
  }

  this.storeRegister = function(value) {
    value = value & 1;

    if (value === 1)
      this.currentButton = 0;

    this.latch = value;
  }

  this.pressButton = function(type) {
    this.buttons[type] = true;
  }

  this.releaseButton = function(type) {
    this.buttons[type] = false;
  }

  this.getType1 = function(type) {

      switch(type) {
      // player 1
      case 'j': return 'a';
      case 'h': return 'b';
      case 'w': return 'up';
      case 's': return 'down';
      case 'a': return 'left';
      case 'd': return 'right';
      case '1': return 'start';
      case '2': return 'select';
      default: break;
    }
  }

  this.getType2 = function(type) {

      switch(type) {
      // player 2
      case 'n': return 'a';
      case 'm': return 'b';
      case 'ArrowUp': return 'up';
      case 'ArrowDown': return 'down';
      case 'ArrowLeft': return 'left';
      case 'ArrowRight': return 'right';
      default: break;
    }
  }

}
