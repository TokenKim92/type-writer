import { primitiveType, checkType, colorToRGB } from './utils.js';

class TypeWriter {
  static MAX_SPEED = 100;
  static MAX_SPEED_TIME = 4000; // ms
  static CURSOR_TOGGLE_TIME = 500; // ms

  static LEFT = -1;
  static RIGHT = 1;

  static INIT = 0;
  static TYPE = 1;
  static MOVE = 2;
  static DELETE = 3;
  static DELAY = 4;
  static GRADIENT = 5;

  static CURSOR_COLOR = 'rgb(55, 65, 81)';

  #rootObj;
  #cursorObj;
  #cursorWrapperObj;
  #speed;
  #msgList = [];
  #curMsg = { case: TypeWriter.INIT, data: null };
  #msgHandler;
  #stopMsgLoopTimer = undefined;
  #stopCursorToggleTimer = undefined;
  #curCursorIndex = 0;
  #toBeTypedText;
  #movingDirection;
  #msgTargetCount;
  #msgCalledCount;
  #cursorToggleFlag = false;
  #isGradientColorMode = false;
  #orgFontColor;
  #gradientStartColor;
  #gradientEndColor;
  #textNodeList = [];
  #textLengthPerLine = [0];
  #lineCount = 0;

  constructor(elementId, speed) {
    checkType(elementId, primitiveType.string);
    const elementObj = document.querySelector(`#${elementId}`);
    if (!elementObj) {
      throw new Error("This element id doesn't exit.");
    }
    this.#rootObj = elementObj;

    checkType(speed, primitiveType.number);
    this.#speed = TypeWriter.MAX_SPEED_TIME / this.#getAdjustedSpeed(speed);

    const rootStyle = window.getComputedStyle(this.#rootObj);
    const fontSize = rootStyle.fontSize.match(/\d+/)[0];
    this.#orgFontColor = rootStyle.color;

    this.#cursorWrapperObj = document.createElement('div');
    this.#cursorWrapperObj.style.cssText = `
      display: inline-block;
      width: 0px;
      font-size: ${Math.round(fontSize * 1.3)}px;
      font-family: 'Segoe UI', sans-serif;
      font-weight: 100;
      color: ${TypeWriter.CURSOR_COLOR};
      transform: translateX(-.115em);
    `;
    this.#cursorObj = document.createElement('span');
    this.#cursorObj.innerText = '|';
    this.#cursorWrapperObj.appendChild(this.#cursorObj);
    this.#rootObj.appendChild(this.#cursorWrapperObj);

    this.#setCursorToggleTimer();

    return this;
  }

  #getAdjustedSpeed(speed) {
    if (speed < 1) {
      return 1;
    } else if (speed > TypeWriter.MAX_SPEED) {
      return TypeWriter.MAX_SPEED;
    } else {
      return speed;
    }
  }

  start() {
    this.#stopCursorToggleTimer && this.#stopCursorToggleTimer();
    this.#stopCursorToggleTimer = undefined;

    const intervalId = setInterval(() => this.#onMsgLoop(), this.#speed);
    this.#stopMsgLoopTimer = () => clearInterval(intervalId);
  }

  stop() {
    if (this.#isGradientColorMode) {
      this.#isGradientColorMode = false;
      this.#rootObj.style.color = this.#orgFontColor;
    }

    this.#stopMsgLoopTimer && this.#stopMsgLoopTimer();
    this.#stopMsgLoopTimer = undefined;

    this.#stopCursorToggleTimer || this.#setCursorToggleTimer();
  }

  #onMsgLoop() {
    if (this.#curMsg.case === TypeWriter.INIT) {
      const isMsgLoopEmpty = this.#msgList.length === 0;
      if (isMsgLoopEmpty) {
        this.stop();
        return;
      }

      this.#curMsg = this.#msgList.shift();
      this.#msgHandler = this.#getMsgHandle(this.#curMsg);
    }

    this.#msgHandler && this.#msgHandler();
  }

  #getMsgHandle(msg) {
    switch (msg.case) {
      case TypeWriter.TYPE:
        this.#setTypeData(msg.data);
        return this.#typing;
      case TypeWriter.MOVE:
        this.#setMoveData(msg.data);
        return this.#moving;
      case TypeWriter.DELETE:
        this.#setDeleteData(msg.data);
        return this.#deleting;
      case TypeWriter.DELAY:
        this.#setDelayData(msg.data);
        return this.#delaying;
      case TypeWriter.GRADIENT:
        this.#setGradientColorData(msg.data);
      default:
        return undefined;
    }
  }

  #setCursorToggleTimer() {
    const intervalId = setInterval(() => {
      this.#cursorToggleFlag = !this.#cursorToggleFlag;
      this.#cursorObj.style.opacity = `${this.#cursorToggleFlag ? 1 : 0}`;
    }, TypeWriter.CURSOR_TOGGLE_TIME);

    this.#stopCursorToggleTimer = () => {
      clearInterval(intervalId);
      this.#cursorObj.style.opacity = 1;
    };
  }

  type(text, delayTime = 0) {
    checkType(delayTime, primitiveType.number);
    // a text line
    if (!Array.isArray(text)) {
      checkType(text, primitiveType.string);

      this.#addMsg(TypeWriter.TYPE, text, delayTime);
      return this;
    }
    // multiple text line
    text.forEach((lineText, index) => {
      checkType(lineText, primitiveType.string);

      const adjustedLineText = index === text.length - 1 ? lineText : lineText + '\n'; // prettier-ignore
      const adjustedDelayTime = index === 0 ? delayTime : 0;
      this.#addMsg(TypeWriter.TYPE, adjustedLineText, adjustedDelayTime);
    });

    return this;
  }

  newLine(delayTime = 0) {
    checkType(delayTime, primitiveType.number);

    this.#addMsg(TypeWriter.TYPE, '\n', delayTime);
    return this;
  }

  move(index, delayTime = 0) {
    checkType(index, primitiveType.number);
    checkType(delayTime, primitiveType.number);

    this.#addMsg(TypeWriter.MOVE, index, delayTime);
    return this;
  }

  moveToStart(delayTime = 0) {
    checkType(delayTime, primitiveType.number);

    this.#addMsg(TypeWriter.MOVE, Number.MIN_SAFE_INTEGER, delayTime);
    return this;
  }

  moveToEnd(delayTime = 0) {
    checkType(delayTime, primitiveType.number);

    this.#addMsg(TypeWriter.MOVE, Number.MAX_SAFE_INTEGER, delayTime);
    return this;
  }

  delete(index, delayTime = 0) {
    checkType(index, primitiveType.number);
    checkType(delayTime, primitiveType.number);

    this.#addMsg(TypeWriter.DELETE, index, delayTime);
    return this;
  }

  delay(delayTime) {
    checkType(delayTime, primitiveType.number);

    const adjustedDelayTime = delayTime > 0 ? delayTime : 0;
    this.#msgList.push({ case: TypeWriter.DELAY, data: adjustedDelayTime });
    return this;
  }

  gradientColor(startColor, endColor = undefined) {
    const startRGB = colorToRGB(startColor);
    const endRGB =
      endColor === undefined
        ? colorToRGB(this.#orgFontColor)
        : colorToRGB(endColor);

    this.#msgList.push({case: TypeWriter.GRADIENT, data: { startRGB, endRGB }}); // prettier-ignore
    return this;
  }

  #setTypeData(text) {
    this.#msgCalledCount = 0;
    this.#msgTargetCount = text.length;
    this.#toBeTypedText = text;
  }

  #addMsg(msgType, data, delayTime) {
    const adjustedDelayTime = delayTime > 0 ? delayTime : 0;

    this.#msgList.push({ case: msgType, data: data });
    adjustedDelayTime && this.#msgList.push({ case: TypeWriter.DELAY, data: adjustedDelayTime }); // prettier-ignore
  }

  #setMoveData(index) {
    this.#msgCalledCount = 0;

    if (this.#curCursorIndex + index < 0) {
      this.#msgTargetCount = this.#curCursorIndex;
      this.#movingDirection = TypeWriter.LEFT;
    } else if (this.#curCursorIndex + index > this.#textNodeList.length) {
      this.#msgTargetCount = this.#textNodeList.length - this.#curCursorIndex;
      this.#movingDirection = TypeWriter.RIGHT;
    } else {
      this.#msgTargetCount = Math.abs(index);
      this.#movingDirection = index >= 0 ? TypeWriter.RIGHT : TypeWriter.LEFT;
    }
  }

  #setDeleteData(index) {
    this.#msgCalledCount = 0;

    if (this.#curCursorIndex + index < 0) {
      this.#msgTargetCount = this.#curCursorIndex;
      this.#movingDirection = TypeWriter.LEFT;
    } else if (this.#curCursorIndex + index > this.#textNodeList.length) {
      this.#msgTargetCount = this.#textNodeList.length - this.#curCursorIndex;
      this.#movingDirection = TypeWriter.RIGHT;
    } else {
      this.#msgTargetCount = Math.abs(index);
      this.#movingDirection = index >= 0 ? TypeWriter.RIGHT : TypeWriter.LEFT;
    }
  }

  #setDelayData(time) {
    this.#msgTargetCount = Math.round(time / this.#speed);
    this.#msgCalledCount = 0;
  }

  #setGradientColorData(rgb) {
    this.#curMsg = { case: TypeWriter.INIT, data: null };
    this.#gradientStartColor = rgb.startRGB;
    this.#gradientEndColor = rgb.endRGB;
    this.#isGradientColorMode = true;

    this.#textNodeList.forEach((textNode, index) => {
      if (textNode.tagName === undefined) {
        const newTextNode = document.createTextNode(textNode.data);
        const wrapperTextTag = document.createElement('span');
        wrapperTextTag.appendChild(newTextNode);

        this.#rootObj.insertBefore(wrapperTextTag, textNode);
        this.#rootObj.removeChild(textNode);
        this.#textNodeList.splice(index, 1, wrapperTextTag);
      }
    });
  }

  #typing() {
    if (this.#msgCalledCount >= this.#msgTargetCount) {
      this.#curMsg = { case: TypeWriter.INIT, data: null };
      return;
    }

    const character = this.#toBeTypedText[this.#msgCalledCount];
    const textNode =
      character !== '\n'
        ? this.#createTextTag(character)
        : document.createElement('br');

    this.#textNodeList.splice(this.#curCursorIndex++, 0, textNode);
    this.#rootObj.insertBefore(textNode, this.#cursorWrapperObj);

    this.#isGradientColorMode && this.#onGradientMode(character);
    this.#msgCalledCount++;
  }

  #createTextTag(character) {
    const textNode = document.createTextNode(character);
    if (!this.#isGradientColorMode) {
      return textNode;
    }

    const wrapperTextTag = document.createElement('span');
    wrapperTextTag.appendChild(textNode);
    return wrapperTextTag;
  }

  #onGradientMode(character) {
    if (character === '\n') {
      this.#lineCount++;
      this.#textLengthPerLine[this.#lineCount] = 0;
    }

    const lengthUpToPreviousLine =
      this.#textLengthPerLine.reduce((sum, textLength) => sum + textLength, 0) -
      this.#textLengthPerLine[this.#textLengthPerLine.length - 1];

    this.#textLengthPerLine[this.#lineCount] =
      this.#textNodeList.length - lengthUpToPreviousLine;

    for (let i = lengthUpToPreviousLine; i < this.#textNodeList.length; i++) {
      this.#textNodeList[i].style.color = this.#getGradientColor(
        i - lengthUpToPreviousLine,
        this.#textLengthPerLine[this.#lineCount]
      );
    }
  }

  #moving() {
    if (this.#msgCalledCount >= this.#msgTargetCount) {
      this.#curMsg = { case: TypeWriter.INIT, data: null };
      return;
    }

    this.#rootObj.removeChild(this.#cursorWrapperObj);
    this.#curCursorIndex += this.#movingDirection;
    const textNode = this.#textNodeList[this.#curCursorIndex];
    this.#rootObj.insertBefore(this.#cursorWrapperObj, textNode);
    this.#msgCalledCount++;
  }

  #deleting() {
    if (this.#msgCalledCount >= this.#msgTargetCount) {
      this.#curMsg = { case: TypeWriter.INIT, data: null };
      return;
    }

    let textNode;
    if (this.#movingDirection === TypeWriter.LEFT) {
      this.#curCursorIndex--;
      textNode =
        this.#textNodeList[this.#curCursorIndex + this.#movingDirection];
    } else {
      textNode = this.#textNodeList[this.#curCursorIndex];
    }

    this.#textNodeList.splice(this.#curCursorIndex, 1);
    this.#rootObj.removeChild(textNode);
    this.#msgCalledCount++;
  }

  #delaying() {
    if (this.#msgCalledCount >= this.#msgTargetCount) {
      this.#curMsg = { case: TypeWriter.INIT, data: null };
      return;
    }

    this.#msgCalledCount++;
  }

  #getGradientColor(index, length) {
    const ratio = index / length;

    const r = this.#calculateGradientColor(
      this.#gradientStartColor.r,
      this.#gradientEndColor.r,
      ratio
    );
    const g = this.#calculateGradientColor(
      this.#gradientStartColor.g,
      this.#gradientEndColor.g,
      ratio
    );
    const b = this.#calculateGradientColor(
      this.#gradientStartColor.b,
      this.#gradientEndColor.b,
      ratio
    );

    return `rgb(${r}, ${g}, ${b})`;
  }

  #calculateGradientColor(startColor, endColor, ratio) {
    return startColor + ratio * (endColor - startColor);
  }
}

export default TypeWriter;
