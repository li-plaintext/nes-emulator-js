# nes-emulator-js in progress

notes:


----
$1122,
$22 is the high byte  
$11 is the low byte

----
----
interupts: https://www.pagetable.com/?p=410
NMI	| $FFFA/$FFFB	yes	no
RESET	$FFFC/$FFFD	no	no
IRQ	$FFFE/$FFFF	yes	no
BRK	$FFFE/$FFFF	yes	yes

----

----
BRK:

store PC(hi),
store PC(lo),
store P,
fetch PC(lo) from $FFFE,
fetch PC(hi) from $FFFF,

----
