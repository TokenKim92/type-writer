import TypeWriter from '../src/typewriter.js';

const typeWriter = new TypeWriter('typewriter', 60);

typeWriter
  .type('wait a minute, ', 100)
  .type('I show you', 100)
  .moveToStart(300)
  .delete(1)
  .type('W', 225)
  .gradientColor('#002B5B')
  .moveToEnd(300)
  .type(' the mot useful', 100)
  .move(-8, 100)
  .type('s', 400)
  .moveToEnd()
  .type(' typing utlity', 150)
  .move(-4, 150)
  .type('i')
  .moveToEnd()
  .type(' on the internet.', 400)
  .newLine()
  .newLine(500)
  .type('Nvver', 300)
  .move(-3)
  .delete(-1)
  .gradientColor('#FF2B5B', '#FFE3CF')
  .type('e')
  .moveToEnd()
  .type(' let yees')
  .delay(300)
  .delete(-2)
  .type('sterday use up to muc')
  .move(-4)
  .type('o')
  .moveToEnd()
  .type('h of today.')
  .delay(500)
  .newLine(500)
  .type('- Will Rogers')
  .start();
