import { primitiveType, checkType } from './utils.js';

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
  #targetCursorIndex = 0;
  #cursorToggleFlag = false;
  #textNodeList = [];
  #toBeTypedText;
  #curTypingIndex;
  #movingDirection;
  #targetDelayCount;
  #curDelayCount;

  constructor(elementId, speed) {
    checkType(elementId, primitiveType.string);
    const elementObj = document.querySelector(`#${elementId}`);
    if (!elementObj) {
      throw new Error("This element id doesn't exit.");
    }
    this.#rootObj = elementObj;

    checkType(speed, primitiveType.number);
    this.#speed = TypeWriter.MAX_SPEED_TIME / this.#getAdjustedSpeed(speed);

    const fontSize = window
      .getComputedStyle(this.#rootObj)
      .fontSize.match(/\d+/)[0];

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
    const intervalId = setInterval(() => this.#onMsgLoop(), this.#speed);
    this.#stopMsgLoopTimer = () => clearInterval(intervalId);
  }

  stop() {
    this.#stopMsgLoopTimer && this.#stopMsgLoopTimer();
    this.#stopMsgLoopTimer = undefined;
  }

  #onMsgLoop() {
    if (this.#curMsg.case === TypeWriter.INIT) {
      const isMsgLoopEmpty = this.#msgList.length === 0;
      if (isMsgLoopEmpty) {
        this.stop();
        this.#setCursorToggleTimer();
        return;
      }

      this.#stopCursorToggleTimer && this.#stopCursorToggleTimer();
      this.#stopCursorToggleTimer = undefined;

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

  #setTypeData(text) {
    this.#toBeTypedText = text;
    this.#curTypingIndex = 0;
  }

  #addMsg(msgType, data, delayTime) {
    const adjustedDelayTime = delayTime > 0 ? delayTime : 0;

    this.#msgList.push({ case: msgType, data: data });
    adjustedDelayTime && this.#msgList.push({ case: TypeWriter.DELAY, data: adjustedDelayTime }); // prettier-ignore
  }

  #setMoveData(index) {
    if (this.#curCursorIndex + index < 0) {
      this.#targetCursorIndex = 0;
      this.#movingDirection = TypeWriter.LEFT;
    } else if (this.#curCursorIndex + index > this.#textNodeList.length) {
      this.#targetCursorIndex = this.#textNodeList.length;
      this.#movingDirection = TypeWriter.RIGHT;
    } else {
      this.#targetCursorIndex = this.#curCursorIndex + index;
      this.#movingDirection = index >= 0 ? TypeWriter.RIGHT : TypeWriter.LEFT;
    }
  }

  #setDeleteData(index) {
    if (this.#curCursorIndex + index < 0) {
      this.#targetCursorIndex = 0;
      this.#movingDirection = TypeWriter.LEFT;
    } else if (this.#curCursorIndex + index > this.#textNodeList.length) {
      this.#targetCursorIndex = this.#textNodeList.length;
      this.#movingDirection = TypeWriter.RIGHT;
    } else {
      this.#targetCursorIndex = this.#curCursorIndex + index;
      this.#movingDirection = index >= 0 ? TypeWriter.RIGHT : TypeWriter.LEFT;
    }
  }

  #setDelayData(time) {
    this.#targetDelayCount = Math.round(time / this.#speed);
    this.#curDelayCount = 0;
  }

  #typing() {
    if (this.#curTypingIndex >= this.#toBeTypedText.length) {
      this.#curMsg = { case: TypeWriter.INIT, data: null };
      return;
    }

    const character = this.#toBeTypedText[this.#curTypingIndex++];
    const textNode =
      character !== '\n'
        ? document.createTextNode(character)
        : document.createElement('br');
    this.#textNodeList.splice(this.#curCursorIndex++, 0, textNode);
    this.#rootObj.insertBefore(textNode, this.#cursorWrapperObj);
  }

  #moving() {
    if (this.#curCursorIndex === this.#targetCursorIndex) {
      this.#curMsg = { case: TypeWriter.INIT, data: null };
      return;
    }

    this.#rootObj.removeChild(this.#cursorWrapperObj);
    this.#curCursorIndex += this.#movingDirection;
    const textNode = this.#textNodeList[this.#curCursorIndex];
    this.#rootObj.insertBefore(this.#cursorWrapperObj, textNode);
  }

  #deleting() {
    if (this.#curCursorIndex === this.#targetCursorIndex) {
      this.#curMsg = { case: TypeWriter.INIT, data: null };
      return;
    }

    const textNode =
      this.#movingDirection === TypeWriter.LEFT
        ? this.#textNodeList[this.#curCursorIndex + this.#movingDirection]
        : this.#textNodeList[this.#curCursorIndex];

    this.#curCursorIndex += this.#movingDirection;
    this.#textNodeList.splice(this.#curCursorIndex, 1);
    this.#rootObj.removeChild(textNode);
  }

  #delaying() {
    if (this.#curDelayCount === this.#targetDelayCount) {
      this.#curMsg = { case: TypeWriter.INIT, data: null };
      return;
    }

    this.#curDelayCount++;
  }
}

export default TypeWriter;