import { primitiveType, checkType } from './utils.js';

class TypeWriter {
  static MAX_SPEED_TIME = 1000; // ms
  static TAB_TOGGLE_TIME = 500;

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
  #toggleFlag = false;
  #textNodeList = [];
  #toBeTypedText;
  #curTypingIndex;

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
    this.#tabObj.innerHTML = '|';
    this.#elementObj.appendChild(this.#tabObj);

    return this;
  }

  #getAdjustedSpeed(speed) {
    if (speed < 1) {
      return 1;
    } else if (speed > TypeWriter.MAX_SPEED_TIME) {
      return TypeWriter.MAX_SPEED_TIME;
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
    this.#checkTypeForDelayTime(delayTime);
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

  #checkTypeForDelayTime(delayTime) {
    checkType(delayTime, primitiveType.number);

    if (delayTime < 0) {
      throw new Error(
        'This parameter should be a number greater than or equal to 0.'
      );
    }
  }

  #setTypeData(text) {
    this.#toBeTypedText = text;
    this.#curTypingIndex = 0;
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

  #addMsg(msgType, data, delayTime) {
    this.#msgList.push({ case: msgType, data: data });
    delayTime && this.#msgList.push({ type: TypeWriter.DELAY, data: delayTime }); // prettier-ignore
  }
}

export default TypeWriter;
