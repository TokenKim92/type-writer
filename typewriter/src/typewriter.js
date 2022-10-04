import { primitiveType, checkType } from './utils.js';

class TypeWriter {
  static MAX_SPEED = 100;
  static MAX_SPEED_TIME = 4000; // ms
  static TAB_TOGGLE_TIME = 500;
  static LEFT = -1;
  static RIGHT = 1;

  static INIT = 0;
  static TYPE = 1;
  static MOVE = 2;
  static DELETE = 3;
  static DELAY = 4;

  #elementObj;
  #tabObj;
  #speed;
  #msgList = [];
  #curMsg = { case: TypeWriter.INIT, data: null };
  #msgHandler;
  #stopMsgLoopTimer = undefined;
  #stopTabToggleTimer = undefined;
  #curTabIndex = 0;
  #targetTabIndex = 0;
  #toggleFlag = false;
  #textNodeList = [];
  #toBeTypedText;
  #curTypingIndex;
  #movingDirection;

  constructor(elementId, speed) {
    checkType(elementId, primitiveType.string);
    const elementObj = document.querySelector(`#${elementId}`);
    if (!elementObj) {
      throw new Error("This element id doesn't exit.");
    }
    this.#elementObj = elementObj;

    checkType(speed, primitiveType.number);
    this.#speed = TypeWriter.MAX_SPEED_TIME / this.#getAdjustedSpeed(speed);

    this.#tabObj = document.createElement('span');
    this.#tabObj.style.width = '0px';
    this.#tabObj.style.display = 'inline-block';
    this.#tabObj.style.transform = 'translateX(-.115em)';
    this.#tabObj.innerHTML = '|';
    this.#elementObj.appendChild(this.#tabObj);

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
        this.#setTabToggleTimer();
        return;
      }

      this.#stopTabToggleTimer && this.#stopTabToggleTimer();
      this.#stopTabToggleTimer = undefined;

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
      default:
        return undefined;
    }
  }

  #setTabToggleTimer() {
    const intervalId = setInterval(() => {
      this.#toggleFlag = !this.#toggleFlag;
      this.#tabObj.style.opacity = `${this.#toggleFlag ? 1 : 0}`;
    }, TypeWriter.TAB_TOGGLE_TIME);

    this.#stopTabToggleTimer = () => {
      clearInterval(intervalId);
      this.#tabObj.style.opacity = 1;
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

  #setTypeData(text) {
    this.#toBeTypedText = text;
    this.#curTypingIndex = 0;
  }

  #setMoveData(index) {
    if (this.#curTabIndex + index < 0) {
      this.#targetTabIndex = 0;
      this.#movingDirection = TypeWriter.LEFT;
    } else if (this.#curTabIndex + index > this.#textNodeList.length) {
      this.#targetTabIndex = this.#textNodeList.length;
      this.#movingDirection = TypeWriter.RIGHT;
    } else {
      this.#targetTabIndex = this.#curTabIndex + index;
      this.#movingDirection = index >= 0 ? TypeWriter.RIGHT : TypeWriter.LEFT;
    }
  }

  #setDeleteData(index) {
    if (this.#curTabIndex + index < 0) {
      this.#targetTabIndex = 0;
      this.#movingDirection = TypeWriter.LEFT;
    } else if (this.#curTabIndex + index > this.#textNodeList.length) {
      this.#targetTabIndex = this.#textNodeList.length;
      this.#movingDirection = TypeWriter.RIGHT;
    } else {
      this.#targetTabIndex = this.#curTabIndex + index;
      this.#movingDirection = index >= 0 ? TypeWriter.RIGHT : TypeWriter.LEFT;
    }
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
    this.#textNodeList.splice(this.#curTabIndex++, 0, textNode);
    this.#elementObj.insertBefore(textNode, this.#tabObj);
  }

  #moving() {
    if (this.#curTabIndex === this.#targetTabIndex) {
      this.#curMsg = { case: TypeWriter.INIT, data: null };
      return;
    }

    this.#elementObj.removeChild(this.#tabObj);
    this.#curTabIndex += this.#movingDirection;
    const textNode = this.#textNodeList[this.#curTabIndex];
    this.#elementObj.insertBefore(this.#tabObj, textNode);
  }

  #deleting() {
    if (this.#curTabIndex === this.#targetTabIndex) {
      this.#curMsg = { case: TypeWriter.INIT, data: null };
      return;
    }

    const textNode =
      this.#movingDirection === TypeWriter.LEFT
        ? this.#textNodeList[this.#curTabIndex + this.#movingDirection]
        : this.#textNodeList[this.#curTabIndex];

    this.#curTabIndex += this.#movingDirection;
    this.#textNodeList.splice(this.#curTabIndex, 1);
    this.#elementObj.removeChild(textNode);
  }

  #addMsg(msgType, data, delayTime) {
    const adjustedDelayTime = delayTime > 0 ? delayTime : 0;

    this.#msgList.push({ case: msgType, data: data });
    adjustedDelayTime && this.#msgList.push({ type: TypeWriter.DELAY, data: adjustedDelayTime }); // prettier-ignore
  }
}

export default TypeWriter;
