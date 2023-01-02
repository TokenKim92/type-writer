# type-writer

A project to show how many animation effects can be shown in HTML5.

It is a typing library to draw text in window. With any combination of function it make to write text as if you were actually typing.

Since this project runs as a message loop, it insert, moves, or deletes characters sequentially, even with many functions you type before `start()`.

This project includes a webpack config file to package this project into a library for easier use.( use `npm run build` or `npm run build-prod` )

## How to use

```html
<h1 id="typewriter"></h1>
```

```js
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
  .delay(500)
  .newLine(500)
  .start();
```

You need to write your text in plain HTML tags with id and insert it as a parameter of your TypeFill class.

You can use any combination of functions: `type(text, delayTime = 0)`, `move(index, delayTime = 0)`, `moveToStart(delayTime = 0)`, `moveToEnd(delayTime = 0)`, `delete(count, delayTime = 0)`, `delay(time)`, `newLine(delayTime = 0)`, `gradientColor(startColor, endColor = undefined)`.

And finally you need to set `start()` to run the command.

## Parameter of class

`TypeWriter(elementId, speed)`

1. `elementId`: the id of html tag ( Any ID can be used )
2. `speed`: typing speed

for example

```js
const typeWriter = new TypeWriter('typewriter', 60);
```

## functions

1. `type(text, delayTime = 0)`: to write text
2. `move(index, delayTime = 0)`: to move cursor
3. `moveToStart(delayTime = 0)`: a override function of `move` for moving cursor to start of text
4. `moveToEnd(delayTime = 0)`: a override function of `move` for moving cursor to end of text
5. `delete(count, delayTime = 0)`: to delete count characters
6. `delay(time)`: to delay
7. `newLine(delayTime = 0)`: to enter a new line
8. `gradientColor(startColor, endColor = undefined)`: to write text with a gradient color

## Used tools

- JavaScript

This is a pure JavaScript library with no other libraries. So you don't need to install any other libraries to use or contribute to this project.

## Overview

Take a look at this site to see how to animate as a example.

https://tokenkim92.github.io/type-writer/
